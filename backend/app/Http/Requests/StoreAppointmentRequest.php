<?php
// app/Http/Requests/StoreAppointmentRequest.php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Carbon\Carbon;
use App\Models\ClinicSetting;
use App\Models\ClinicClosure;
use App\Models\AppointmentType;
use Illuminate\Support\Facades\Log;

class StoreAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Access control enforced inside the controller guards
    }

    public function rules(): array
    {
        return [
            'patient_id' => 'required_if:user_role,admin|exists:patients,id',
            'clinician_id' => 'nullable|exists:users,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'start_time' => 'required|date|after:now',
            'end_time' => 'required|date|after:start_time',
            'appointment_type_id' => 'required|exists:appointment_types,id,is_active,1',
            'type' => 'nullable|string|max:191',
            'location' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:1000',
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if ($this->start_time && $this->end_time) {
                $start = Carbon::parse($this->start_time);
                $end = Carbon::parse($this->end_time);

                Log::info('Parsing appointment times', [
                    'raw_start' => $this->start_time,
                    'raw_end' => $this->end_time,
                    'parsed_start' => $start->toDateTimeString(),
                    'parsed_end' => $end->toDateTimeString(),
                    'start_timezone' => $start->timezone->getName(),
                    'end_timezone' => $end->timezone->getName(),
                ]);

                $settings = ClinicSetting::first();
                $openTime = $settings?->open_time ?? '08:00';
                $closeTime = $settings?->close_time ?? '18:00';
                $interval = (int) ($settings?->appointment_interval ?? 30);
                
                // Get appointment type duration - this is the authoritative duration
                $appointmentType = AppointmentType::find($this->appointment_type_id);
                $minDuration = $appointmentType?->estimated_minutes ?? $interval;
                
                if ($minDuration <= 0) {
                    $minDuration = 30; // fallback
                }

                if ($appointmentType && !$appointmentType->isAvailableAt($start, $end)) {
                    $validator->errors()->add('appointment_type_id', 'Selected service is not available for the chosen date/time.');
                }

                $businessStart = Carbon::parse($start->toDateString().' '.$openTime);
                $businessEnd = Carbon::parse($start->toDateString().' '.$closeTime);

                // Enforce appointment duration matches the appointment type
                $actualDuration = $start->diffInMinutes($end);
                if ($actualDuration < $minDuration) {
                    Log::warning('Appointment too short (store)', [
                        'start_time' => $start->toDateTimeString(),
                        'end_time' => $end->toDateTimeString(),
                        'actual_duration' => $actualDuration,
                        'required_duration' => $minDuration,
                        'appointment_type_id' => $this->appointment_type_id,
                    ]);
                    $validator->errors()->add('end_time', 'Appointment must be at least '.$minDuration.' minutes.');
                }

                // Start time should align with clinic interval boundaries
                if ($interval > 0) {
                    $minutesFromOpen = $businessStart->diffInMinutes($start, false);
                    if ($minutesFromOpen < 0 || $minutesFromOpen % $interval !== 0) {
                        $validator->errors()->add('start_time', 'Start time must align with clinic scheduling intervals.');
                    }
                }

                if ($start->lt($businessStart) || $end->gt($businessEnd)) {
                    $validator->errors()->add('start_time', 'Selected time is outside clinic hours.');
                }

                $workingDays = collect($settings?->working_days ?? []);
                if ($workingDays->isNotEmpty()) {
                    $dayKey = strtolower($start->format('D'));
                    $dayKey = substr($dayKey, 0, 3);
                    if (!$workingDays->contains($dayKey)) {
                        $validator->errors()->add('start_time', 'Clinic is not open on the selected day.');
                    }
                }

                $closures = ClinicClosure::whereDate('date', $start->toDateString())->get();
                foreach ($closures as $closure) {
                    $closureStart = $closure->start_time
                        ? Carbon::parse($closure->date->format('Y-m-d').' '.$closure->start_time)
                        : $businessStart->copy()->startOfDay();
                    $closureEnd = $closure->end_time
                        ? Carbon::parse($closure->date->format('Y-m-d').' '.$closure->end_time)
                        : $businessEnd->copy()->endOfDay();

                    if ($start->lt($closureEnd) && $end->gt($closureStart)) {
                        $validator->errors()->add('start_time', 'Clinic is closed during the selected time.');
                        break;
                    }
                }
            }
        });
    }

    public function messages(): array
    {
        return [
            'start_time.after' => 'Appointment must be scheduled for a future time.',
            'end_time.after' => 'End time must be after start time.',
        ];
    }
}