<?php
// app/Http/Controllers/Api/V1/AppointmentController.php
namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Http\Requests\StoreAppointmentRequest;
use App\Http\Requests\UpdateAppointmentRequest;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\AppointmentType;
use App\Models\User;

class AppointmentController extends Controller
{
    public function index(Request $request)
    {
        $query = Appointment::with(['patient.user', 'clinician', 'appointmentType']);

        // Filter by patient_id if provided
        if ($request->has('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }

        // Apply filters based on user role
        if ($request->user()->isPatient()) {
            $patient = $request->user()->patient;
            if (!$patient) {
                // Patient user has no linked patient record
                return response()->json(['data' => []]);
            }
            $query->where('patient_id', $patient->id);
        } elseif ($request->user()->isClinician() && !$request->user()->isAdmin()) {
            // Clinicians see all appointments (assignment not required)
            // No additional filtering needed
        }

        // Date range filter
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('start_time', [
                Carbon::parse($request->start_date),
                Carbon::parse($request->end_date)
            ]);
        }

        // Status filter
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Type filter
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        $appointments = $query->latest()->paginate($request->get('per_page', 15));

        return response()->json($appointments);
    }

    public function store(StoreAppointmentRequest $request)
    {
        if (! $this->canCreate($request->user())) {
            return $this->forbiddenResponse();
        }

        return DB::transaction(function () use ($request) {
            $validated = $request->validated();

            // Set patient_id for patient users
            if ($request->user()->isPatient()) {
                $patient = $request->user()->patient;
                if (!$patient) {
                    return response()->json(['message' => 'Patient profile not found'], Response::HTTP_UNPROCESSABLE_ENTITY);
                }
                $validated['patient_id'] = $patient->id;
            }

            // Map appointment type name
            if (!empty($validated['appointment_type_id'])) {
                $type = AppointmentType::find($validated['appointment_type_id']);
                if ($type) {
                    $validated['type'] = $type->name;
                }
            }

            // Check for scheduling conflicts
            if ($this->hasSchedulingConflict($validated)) {
                return response()->json([
                    'message' => 'Scheduling conflict detected. Please choose a different time.'
                ], Response::HTTP_CONFLICT);
            }

            $appointment = Appointment::create($validated);

            // Audit log
            activity()
                ->causedBy($request->user())
                ->performedOn($appointment)
                ->withProperties(['ip' => $request->ip()])
                ->log('appointment_created');

            // Send notification (queued)
            // event(new AppointmentCreated($appointment));

            return response()->json($appointment->load(['patient.user', 'clinician', 'appointmentType']), Response::HTTP_CREATED);
        });
    }

    public function show(Request $request, Appointment $appointment)
    {
        if (! $this->canView($request->user(), $appointment)) {
            return $this->forbiddenResponse();
        }

        return response()->json($appointment->load(['patient.user', 'clinician', 'appointmentType']));
    }

    public function update(UpdateAppointmentRequest $request, Appointment $appointment)
    {
        if (! $this->canUpdate($request->user(), $appointment)) {
            return $this->forbiddenResponse();
        }

        $validated = $request->validated();

        // Check for scheduling conflicts (excluding current appointment)
        if (isset($validated['start_time']) || isset($validated['end_time'])) {
            $startTime = $validated['start_time'] ?? $appointment->start_time;
            $endTime = $validated['end_time'] ?? $appointment->end_time;
            $clinicianId = $validated['clinician_id'] ?? $appointment->clinician_id;

            if ($this->hasSchedulingConflict([
                'start_time' => $startTime,
                'end_time' => $endTime,
                'clinician_id' => $clinicianId
            ], $appointment->id)) {
                return response()->json([
                    'message' => 'Scheduling conflict detected. Please choose a different time.'
                ], Response::HTTP_CONFLICT);
            }
        }

        if (!empty($validated['appointment_type_id'])) {
            $type = AppointmentType::find($validated['appointment_type_id']);
            if ($type) {
                $validated['type'] = $type->name;
            }
        }

        $appointment->update($validated);

        // Audit log
        activity()
            ->causedBy($request->user())
            ->performedOn($appointment)
            ->withProperties(['ip' => $request->ip()])
            ->log('appointment_updated');

        return response()->json($appointment->load(['patient.user', 'clinician', 'appointmentType']));
    }

    public function destroy(Request $request, Appointment $appointment)
    {
        if (! $this->canDelete($request->user(), $appointment)) {
            return $this->forbiddenResponse();
        }

        DB::transaction(function () use ($appointment, $request) {
            // Audit log before deletion
            activity()
                ->causedBy($request->user())
                ->performedOn($appointment)
                ->withProperties(['ip' => $request->ip()])
                ->log('appointment_deleted');

            $appointment->delete();
        });

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    public function calendar(Request $request)
    {
        if (! $request->user()->isClinician()) {
            return $this->forbiddenResponse();
        }

        $request->validate([
            'start' => 'required|date',
            'end' => 'required|date',
            'clinician_id' => 'sometimes|exists:users,id',
        ]);

        $query = Appointment::with(['patient.user', 'clinician', 'appointmentType'])
            ->whereBetween('start_time', [
                Carbon::parse($request->start),
                Carbon::parse($request->end)
            ]);

        // Filter by clinician if specified
        if ($request->has('clinician_id')) {
            $query->where('clinician_id', $request->clinician_id);
        }

        // Apply role-based filters
        if ($request->user()->isPatient()) {
            $patient = $request->user()->patient;
            if (!$patient) {
                // Patient has no linked record, return empty
                return response()->json(['data' => []]);
            }
            $query->where('patient_id', $patient->id);
        } elseif ($request->user()->isClinician() && !$request->user()->isAdmin()) {
            $query->where('clinician_id', $request->user()->id);
        }

        $appointments = $query->get();

        $calendarEvents = $appointments->map(function ($appointment) {
            return [
                'id' => $appointment->id,
                'title' => $appointment->title,
                'start' => $appointment->start_time->toISOString(),
                'end' => $appointment->end_time->toISOString(),
                'status' => $appointment->status,
                'type' => $appointment->type,
                'patient' => $appointment->patient->user->name,
                'clinician' => $appointment->clinician->name,
                'backgroundColor' => $this->getStatusColor($appointment->status),
                'borderColor' => $this->getStatusColor($appointment->status),
                'extendedProps' => [
                    'description' => $appointment->description,
                    'location' => $appointment->location,
                ]
            ];
        });

        return response()->json($calendarEvents);
    }

    public function cancel(Request $request, Appointment $appointment)
    {
        if (! $this->canCancel($request->user(), $appointment)) {
            return $this->forbiddenResponse();
        }

        $request->validate([
            'cancellation_reason' => 'required|string|max:500',
        ]);

        $appointment->update([
            'status' => 'cancelled',
            'cancellation_reason' => $request->cancellation_reason,
        ]);

        // Audit log
        activity()
            ->causedBy($request->user())
            ->performedOn($appointment)
            ->withProperties([
                'ip' => $request->ip(),
                'reason' => $request->cancellation_reason
            ])
            ->log('appointment_cancelled');

        // Send cancellation notification (queued)
        // event(new AppointmentCancelled($appointment));

        return response()->json($appointment->load(['patient.user', 'clinician', 'appointmentType']));
    }

    public function confirm(Request $request, Appointment $appointment)
    {
        if (! $this->canConfirm($request->user(), $appointment)) {
            return $this->forbiddenResponse();
        }

        $appointment->update([
            'status' => 'confirmed',
        ]);

        // Audit log
        activity()
            ->causedBy($request->user())
            ->performedOn($appointment)
            ->withProperties(['ip' => $request->ip()])
            ->log('appointment_confirmed');

        // Dispatch event to send confirmation email to patient
        \App\Events\AppointmentConfirmed::dispatch($appointment);

        return response()->json($appointment->load(['patient.user', 'clinician', 'appointmentType']));
    }

    public function reject(Request $request, Appointment $appointment)
    {
        if (! $this->canReject($request->user(), $appointment)) {
            return $this->forbiddenResponse();
        }

        $validated = $request->validate([
            'rejection_reason' => 'required|string|max:500',
        ]);

        $appointment->update([
            'status' => 'rejected',
            'cancellation_reason' => $validated['rejection_reason'],
        ]);

        // Audit log
        activity()
            ->causedBy($request->user())
            ->performedOn($appointment)
            ->withProperties(['ip' => $request->ip()])
            ->log('appointment_rejected');

        // Dispatch event to send rejection email to patient
        \App\Events\AppointmentRejected::dispatch($appointment);

        return response()->json($appointment->load(['patient.user', 'clinician', 'appointmentType']));
    }

    public function markNoShow(Request $request, Appointment $appointment)
    {
        if (! $this->canUpdate($request->user(), $appointment)) {
            return $this->forbiddenResponse('You are not authorized to mark this appointment as no-show.');
        }

        $appointment->update([
            'status' => 'no_show',
        ]);

        activity()
            ->causedBy($request->user())
            ->performedOn($appointment)
            ->withProperties(['ip' => $request->ip()])
            ->log('appointment_marked_no_show');

        return response()->json($appointment->load(['patient.user', 'clinician', 'appointmentType']));
    }

    public function startAppointment(Request $request, Appointment $appointment)
    {
        if (! $this->canUpdate($request->user(), $appointment)) {
            return $this->forbiddenResponse('You are not authorized to start this appointment.');
        }

        $appointment->update([
            'status' => 'in_progress',
        ]);

        activity()
            ->causedBy($request->user())
            ->performedOn($appointment)
            ->withProperties(['ip' => $request->ip()])
            ->log('appointment_started');

        return response()->json($appointment->load(['patient.user', 'clinician', 'appointmentType']));
    }

    public function completeAppointment(Request $request, Appointment $appointment)
    {
        if (! $this->canUpdate($request->user(), $appointment)) {
            return $this->forbiddenResponse('You are not authorized to complete this appointment.');
        }

        $appointment->update([
            'status' => 'completed',
        ]);

        activity()
            ->causedBy($request->user())
            ->performedOn($appointment)
            ->withProperties(['ip' => $request->ip()])
            ->log('appointment_completed');

        return response()->json($appointment->load(['patient.user', 'clinician', 'appointmentType']));
    }

    /**
     * Check for scheduling conflicts
     */
    private function hasSchedulingConflict(array $data, $ignoreId = null): bool
    {
        // Check for any overlapping appointments (not just specific clinician)
        // This prevents double-booking the same time slot
        return Appointment::where('id', '!=', $ignoreId)
            ->where(function ($query) use ($data) {
                $query->whereBetween('start_time', [$data['start_time'], $data['end_time']])
                    ->orWhereBetween('end_time', [$data['start_time'], $data['end_time']])
                    ->orWhere(function ($q) use ($data) {
                        $q->where('start_time', '<=', $data['start_time'])
                            ->where('end_time', '>=', $data['end_time']);
                    });
            })
            ->whereIn('status', ['scheduled', 'confirmed', 'in_progress'])
            ->exists();
    }

    /**
     * Get color for appointment status
     */
    private function getStatusColor($status): string
    {
        return match($status) {
            'scheduled' => '#3B82F6', // blue
            'confirmed' => '#10B981', // green
            'in_progress' => '#F59E0B', // amber
            'completed' => '#6B7280', // gray
            'cancelled' => '#EF4444', // red
            'no_show' => '#8B5CF6', // purple
            default => '#6B7280',
        };
    }

    private function forbiddenResponse(string $message = 'This action is unauthorized.')
    {
        return response()->json(['message' => $message], Response::HTTP_FORBIDDEN);
    }

    private function canCreate(User $user): bool
    {
        return $user->isPatient() || $user->isClinician();
    }

    private function canView(User $user, Appointment $appointment): bool
    {
        return $this->isParticipant($user, $appointment);
    }

    private function canUpdate(User $user, Appointment $appointment): bool
    {
        // Allow any clinician to update (assignment not required)
        if ($user->isAdmin() || $user->hasRole('clinician')) {
            return true;
        }
        
        // Patients can update their own appointments
        $patient = $user->patient;
        return $user->isPatient() && $patient && (int) $patient->id === (int) $appointment->patient_id;
    }

    private function canDelete(User $user, Appointment $appointment): bool
    {
        return $user->isAdmin() || $this->isAssignedClinician($user, $appointment);
    }

    private function canCancel(User $user, Appointment $appointment): bool
    {
        // Allow any clinician to cancel (assignment not required)
        if ($user->isAdmin() || $user->hasRole('clinician')) {
            return true;
        }
        
        // Patients can cancel their own appointments
        $patient = $user->patient;
        return $user->isPatient() && $patient && (int) $patient->id === (int) $appointment->patient_id;
    }

    private function canConfirm(User $user, Appointment $appointment): bool
    {
        // Admins can confirm any appointment
        if ($user->isAdmin()) {
            return true;
        }
        
        // Any clinician can confirm appointments (not just assigned ones)
        if ($user->hasRole('clinician')) {
            return true;
        }
        
        return false;
    }

    private function canReject(User $user, Appointment $appointment): bool
    {
        // Admins can reject any appointment
        if ($user->isAdmin()) {
            return true;
        }
        
        // Clinicians can reject appointments (assigned or unassigned pending ones)
        if ($user->hasRole('clinician')) {
            return true;
        }
        
        return false;
    }

    private function isParticipant(User $user, Appointment $appointment): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        if ($this->isAssignedClinician($user, $appointment)) {
            return true;
        }

        $patient = $user->patient;

        return $user->isPatient() && $patient && (int) $patient->id === (int) $appointment->patient_id;
    }

    private function isAssignedClinician(User $user, Appointment $appointment): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $user->hasRole('clinician') && (int) $appointment->clinician_id === (int) $user->id;
    }
}