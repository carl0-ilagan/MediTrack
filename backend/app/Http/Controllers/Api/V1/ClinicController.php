<?php
namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ClinicSetting;
use App\Models\ClinicClosure;
use App\Models\AppointmentType;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class ClinicController extends Controller
{
    use ApiResponses;

    public function getSettings()
    {
        try {
            $settings = ClinicSetting::first();
            return $this->ok('Clinic settings retrieved', ['settings' => $settings]);
        } catch (\Exception $e) {
            Log::error('Failed to get clinic settings: ' . $e->getMessage());
            return $this->error('Failed to get clinic settings', 500);
        }
    }

    public function meta()
    {
        try {
            Log::info('Clinic meta: starting request');
            
            $settings = ClinicSetting::first();
            Log::info('Clinic meta: settings loaded');
            
            $closures = ClinicClosure::whereDate('date', '>=', now()->subDay())
                ->orderBy('date')
                ->get();
            Log::info('Clinic meta: closures loaded', ['count' => count($closures)]);
            
            $appointmentTypes = AppointmentType::where('is_active', true)->orderBy('name')->get();
            Log::info('Clinic meta: appointment types loaded', ['count' => count($appointmentTypes)]);

            return $this->ok('Clinic meta retrieved', [
                'settings' => $settings,
                'closures' => $closures,
                'appointment_types' => $appointmentTypes,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to load clinic meta: ' . $e->getMessage());
            return $this->error('Failed to load clinic data', 500);
        }
    }

    public function saveSettings(Request $request)
    {
        $data = $request->only(['open_time', 'close_time', 'working_days', 'appointment_interval']);

        $validator = Validator::make($data, [
            'open_time' => 'nullable|date_format:H:i',
            'close_time' => 'nullable|date_format:H:i',
            'working_days' => 'nullable|array',
            'appointment_interval' => 'nullable|integer|min:1',
        ]);

        if ($validator->fails()) {
            return $this->error('Invalid input', 422, $validator->errors()->toArray());
        }

        try {
            $settings = ClinicSetting::first();
            if (!$settings) {
                $settings = ClinicSetting::create([
                    'open_time' => $data['open_time'] ?? null,
                    'close_time' => $data['close_time'] ?? null,
                    'working_days' => $data['working_days'] ?? [],
                    'appointment_interval' => $data['appointment_interval'] ?? 15,
                ]);
            } else {
                $settings->update([
                    'open_time' => $data['open_time'] ?? $settings->open_time,
                    'close_time' => $data['close_time'] ?? $settings->close_time,
                    'working_days' => $data['working_days'] ?? $settings->working_days,
                    'appointment_interval' => $data['appointment_interval'] ?? $settings->appointment_interval,
                ]);
            }

            return $this->ok('Clinic settings saved', ['settings' => $settings]);
        } catch (\Exception $e) {
            Log::error('Failed to save clinic settings: ' . $e->getMessage());
            return $this->error('Failed to save clinic settings', 500);
        }
    }

    public function listClosures()
    {
        try {
            $closures = ClinicClosure::orderBy('date', 'desc')->get();
            return $this->ok('Closures retrieved', ['closures' => $closures]);
        } catch (\Exception $e) {
            Log::error('Failed to list closures: ' . $e->getMessage());
            return $this->error('Failed to list closures', 500);
        }
    }

    public function addClosure(Request $request)
    {
        $data = $request->only(['date', 'start_time', 'end_time', 'reason']);

        $validator = Validator::make($data, [
            'date' => 'required|date',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
            'reason' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return $this->error('Invalid input', 422, $validator->errors()->toArray());
        }

        try {
            $closure = ClinicClosure::create($data);
            return $this->ok('Closure added', ['closure' => $closure]);
        } catch (\Exception $e) {
            Log::error('Failed to add closure: ' . $e->getMessage());
            return $this->error('Failed to add closure', 500);
        }
    }

    public function deleteClosure($id)
    {
        try {
            $closure = ClinicClosure::findOrFail($id);
            $closure->delete();
            return $this->ok('Closure removed');
        } catch (\Exception $e) {
            Log::error('Failed to delete closure: ' . $e->getMessage());
            return $this->error('Failed to delete closure', 500);
        }
    }
}
