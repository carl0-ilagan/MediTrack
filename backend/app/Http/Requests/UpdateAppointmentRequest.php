<?php
// app/Http/Requests/UpdateAppointmentRequest.php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Carbon\Carbon;
use App\Models\ClinicSetting;
use App\Models\ClinicClosure;
use App\Models\AppointmentType;
use Illuminate\Support\Facades\Log;

class UpdateAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Access control is handled within the controller
    }

    public function rules(): array
    {
        return [
            'clinician_id' => 'sometimes|nullable|exists:users,id',
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:1000',
            'start_time' => 'sometimes|date',
            'end_time' => 'sometimes|date|after:start_time',
            'status' => 'sometimes|in:scheduled,confirmed,in_progress,completed,cancelled,no_show',
            'appointment_type_id' => 'sometimes|exists:appointment_types,id,is_active,1',
            'type' => 'sometimes|string|max:191',
            'location' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:1000',
            'cancellation_reason' => 'required_if:status,cancelled|string|max:500',
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if ($this->has(['start_time', 'end_time'])) {
                $start = Carbon::parse($this->start_time);
                $end = Carbon::parse($this->end_time);

                $settings = ClinicSetting::first();
                $openTime = $settings?->open_time ?? '08:00';
                $closeTime = $settings?->close_time ?? '18:00';
                $interval = (int) ($settings?->appointment_interval ?? 30);
                
                // Get appointment type duration - this is the authoritative duration
                $typeId = $this->appointment_type_id ?? $this->route('appointment')?->appointment_type_id;
                $appointmentType = AppointmentType::find($typeId);
                $minDuration = $appointmentType?->estimated_minutes ?? $interval;
                
                if ($minDuration <= 0) {
                    $minDuration = 30; // fallback
                }

                if ($appointmentType && !$appointmentType->isAvailableAt($start, $end)) {
                    $validator->errors()->add('appointment_type_id', 'Selected service is not available for the chosen date/time.');
                }

                $businessStart = Carbon::parse($start->toDateString().' '.$openTime);
                $businessEnd = Carbon::parse($start->toDateString().' '.$closeTime);

                $actualDuration = $start->diffInMinutes($end);
                if ($actualDuration < $minDuration) {
                    Log::warning('Appointment too short (update)', [
                        'start_time' => $start->toDateTimeString(),
                        'end_time' => $end->toDateTimeString(),
                        'actual_duration' => $actualDuration,
                        'required_duration' => $minDuration,
                        'appointment_type_id' => $typeId,
                        'appointment_id' => $this->route('appointment')?->id,
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
}