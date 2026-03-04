<?php
// app/Http/Controllers/Api/V1/MedCertController.php
namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\MedCert;
use App\Http\Requests\StoreMedCertRequest;
use App\Http\Requests\UpdateMedCertRequest;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Carbon\Carbon;
use Spatie\Activitylog\Facades\LogActivity;
use App\Events\MedCertApproved;
use App\Events\MedCertRejected;


class MedCertController extends Controller
{
    use AuthorizesRequests;
    // public function __construct()
    // {
    //     $this->authorizeResource(MedCert::class, 'med_cert');
    // }

    public function index(Request $request)
    {
        $query = MedCert::with(['patient.user', 'requester', 'approver']);

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
            // Clinicians can see all medcerts (to manage the full workflow: pending, approved, rejected, completed, no-show)
            // No additional filtering needed - they have access to all
        }

        // Status filter
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Type filter
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // Date range filter
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('start_date', [
                $request->start_date,
                $request->end_date
            ]);
        }

        $medCerts = $query->latest()->paginate($request->get('per_page', 15));

        return response()->json($medCerts);
    }

    public function store(StoreMedCertRequest $request)
    {
        return DB::transaction(function () use ($request) {
            $validated = $request->validated();

            // Set patient_id and requested_by for patient users
            if ($request->user()->isPatient()) {
                $patient = $request->user()->patient;
                if (!$patient) {
                    return response()->json(['message' => 'Patient profile not found'], Response::HTTP_UNPROCESSABLE_ENTITY);
                }
                $validated['patient_id'] = $patient->id;
                $validated['requested_by'] = $request->user()->id;
            }

            // Calculate duration
            $startDate = \Carbon\Carbon::parse($validated['start_date']);
            $endDate = \Carbon\Carbon::parse($validated['end_date']);
            $validated['duration_days'] = $startDate->diffInDays($endDate) + 1;

            // Generate certificate number
            $validated['certificate_number'] = (new MedCert())->generateCertificateNumber();

            $medCert = MedCert::create($validated);

            // Audit log
            activity()
                ->causedBy($request->user())
                ->performedOn($medCert)
                ->withProperties(['ip' => $request->ip()])
                ->log('medcert_requested');

            return response()->json($medCert->load(['patient.user', 'requester']), Response::HTTP_CREATED);
        });
    }

    public function show(MedCert $medCert)
    {
        return response()->json($medCert->load(['patient.user', 'requester', 'approver']));
    }

    public function update(UpdateMedCertRequest $request, MedCert $medCert)
    {
        $validated = $request->validated();

        // Recalculate duration if dates changed
        if (isset($validated['start_date']) || isset($validated['end_date'])) {
            $startDate = \Carbon\Carbon::parse($validated['start_date'] ?? $medCert->start_date);
            $endDate = \Carbon\Carbon::parse($validated['end_date'] ?? $medCert->end_date);
            $validated['duration_days'] = $startDate->diffInDays($endDate) + 1;
        }

        $medCert->update($validated);

        // Audit log
        activity()
            ->causedBy($request->user())
            ->performedOn($medCert)
            ->withProperties(['ip' => $request->ip()])
            ->log('medcert_updated');

        return response()->json($medCert->load(['patient.user', 'requester', 'approver']));
    }

    public function destroy(MedCert $medCert)
    {
        DB::transaction(function () use ($medCert) {
            // Audit log before deletion
            activity()
                ->causedBy(request()->user())
                ->performedOn($medCert)
                ->withProperties(['ip' => request()->ip()])
                ->log('medcert_deleted');

            $medCert->delete();
        });

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    public function approve(Request $request, MedCert $medCert)
    {
        $this->authorize('approve', $medCert);

        $request->validate([
            'recommendations' => 'nullable|string|max:1000',
            'pickup_date' => 'nullable|date|after_or_equal:today',
        ]);

        DB::transaction(function () use ($request, $medCert) {
            $medCert->approve($request->user(), [
                'recommendations' => $request->recommendations,
                'pickup_date' => $request->pickup_date,
            ]);

            // Dispatch the approved event
            event(new MedCertApproved($medCert));

            // Audit log
            activity()
                ->causedBy($request->user())
                ->performedOn($medCert)
                ->withProperties(['ip' => $request->ip()])
                ->log('medcert_approved');
        });

        return response()->json($medCert->load(['patient.user', 'requester', 'approver']));
    }

    public function reject(Request $request, MedCert $medCert)
    {
        $this->authorize('reject', $medCert);

        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        DB::transaction(function () use ($request, $medCert) {
            $medCert->reject($request->reason);

            // Dispatch the rejected event
            event(new MedCertRejected($medCert));

            // Audit log
            activity()
                ->causedBy($request->user())
                ->performedOn($medCert)
                ->withProperties([
                    'ip' => $request->ip(),
                    'reason' => $request->reason
                ])
                ->log('medcert_rejected');
        });

        return response()->json($medCert->load(['patient.user', 'requester', 'approver']));
    }

    public function markNoShow(Request $request, MedCert $medCert)
    {
        $this->authorize('markNoShow', $medCert);

        if ($medCert->status !== 'approved') {
            return response()->json(['message' => 'Only approved certificates can be marked as no-show'], 422);
        }

        DB::transaction(function () use ($request, $medCert) {
            $medCert->update([
                'status' => 'no-show',
            ]);

            // Audit log
            activity()
                ->causedBy($request->user())
                ->performedOn($medCert)
                ->withProperties(['ip' => $request->ip()])
                ->log('medcert_marked_no_show');
        });

        return response()->json($medCert->load(['patient.user', 'requester', 'approver']));
    }

    public function markCompleted(Request $request, MedCert $medCert)
    {
        $this->authorize('markCompleted', $medCert);

        if ($medCert->status !== 'approved') {
            return response()->json(['message' => 'Only approved certificates can be marked as completed'], 422);
        }

        DB::transaction(function () use ($request, $medCert) {
            $medCert->update([
                'status' => 'completed',
            ]);

            // Audit log
            activity()
                ->causedBy($request->user())
                ->performedOn($medCert)
                ->withProperties(['ip' => $request->ip()])
                ->log('medcert_marked_completed');
        });

        return response()->json($medCert->load(['patient.user', 'requester', 'approver']));
    }

    public function downloadPdf(MedCert $medCert)
    {
        $this->authorize('downloadPdf', $medCert);

        if (!$medCert->pdf_path || !Storage::exists($medCert->pdf_path)) {
            return response()->json([
                'message' => 'PDF certificate not available'
            ], Response::HTTP_NOT_FOUND);
        }

        // Audit download
        activity()
            ->causedBy(request()->user())
            ->performedOn($medCert)
            ->withProperties(['ip' => request()->ip()])
            ->log('medcert_downloaded');

        return Storage::download($medCert->pdf_path, "medcert-{$medCert->certificate_number}.pdf");
    }

    public function publicVerify($hash)
    {
        $medCert = MedCert::where('verification_hash', $hash)
            ->where('status', 'approved')
            ->firstOrFail();

        // Mark as verified if not already
        if (!$medCert->is_verified) {
            $medCert->update([
                'is_verified' => true,
                'verified_at' => now(),
            ]);
        }

        return response()->json([
            'valid' => true,
            'certificate' => [
                'certificate_number' => $medCert->certificate_number,
                'patient_name' => $medCert->patient->user->name,
                'type' => $medCert->type,
                'start_date' => $medCert->start_date->format('Y-m-d'),
                'end_date' => $medCert->end_date->format('Y-m-d'),
                'duration_days' => $medCert->duration_days,
                'approved_by' => $medCert->approver->name,
                'approved_at' => $medCert->approved_at->format('Y-m-d H:i:s'),
                'is_active' => $medCert->is_active,
            ]
        ]);
    }

    public function stats(Request $request)
    {
        $this->authorize('viewStats', MedCert::class);

        $query = MedCert::query();

        // Date range filter
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('created_at', [
                $request->start_date,
                $request->end_date
            ]);
        }

        $stats = [
            'total' => $query->count(),
            'pending' => $query->clone()->where('status', 'pending')->count(),
            'approved' => $query->clone()->where('status', 'approved')->count(),
            'rejected' => $query->clone()->where('status', 'rejected')->count(),
            'by_type' => $query->clone()
                ->selectRaw('type, count(*) as count')
                ->groupBy('type')
                ->pluck('count', 'type')
                ->toArray(),
        ];

        return response()->json($stats);
    }
}