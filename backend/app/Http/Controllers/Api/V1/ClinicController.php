<?php
namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ClinicSetting;
use App\Models\ClinicClosure;
use App\Models\AppointmentType;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ClinicController extends Controller
{
    use ApiResponses;

    private function formatSettings(?ClinicSetting $settings): ?array
    {
        if (!$settings) {
            return null;
        }

        $payload = $settings->toArray();
        if ($settings->brand_logo_path) {
            $rawUrl = Storage::disk('public')->url($settings->brand_logo_path);
            $relativePath = parse_url($rawUrl, PHP_URL_PATH) ?: $rawUrl;
            $baseUrl = request()->getSchemeAndHttpHost();
            $version = $settings->updated_at ? $settings->updated_at->timestamp : time();
            $payload['brand_logo_url'] = $baseUrl.$relativePath.'?v='.$version;
        } else {
            $payload['brand_logo_url'] = null;
        }

        return $payload;
    }

    public function getSettings()
    {
        try {
            $settings = ClinicSetting::first();
            return $this->ok('Clinic settings retrieved', ['settings' => $this->formatSettings($settings)]);
        } catch (\Exception $e) {
            Log::error('Failed to get clinic settings: ' . $e->getMessage());
            return $this->error('Failed to get clinic settings', 500);
        }
    }

    public function branding()
    {
        try {
            $settings = ClinicSetting::first();
            return $this->ok('Clinic branding retrieved', ['settings' => $this->formatSettings($settings)]);
        } catch (\Exception $e) {
            Log::error('Failed to get clinic branding: ' . $e->getMessage());
            return $this->error('Failed to get clinic branding', 500);
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
                'settings' => $this->formatSettings($settings),
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
        $data = $request->only([
            'open_time',
            'close_time',
            'working_days',
            'appointment_interval',
            'brand_name',
            'brand_short_name',
            'system_title',
            'system_subtitle',
            'footer_description',
            'contact_email',
            'contact_phone',
            'remove_brand_logo',
        ]);

        $validator = Validator::make($data, [
            'open_time' => 'nullable|date_format:H:i',
            'close_time' => 'nullable|date_format:H:i',
            'working_days' => 'nullable|array',
            'appointment_interval' => 'nullable|integer|min:1',
            'brand_name' => 'nullable|string|max:191',
            'brand_short_name' => 'nullable|string|max:100',
            'system_title' => 'nullable|string|max:191',
            'system_subtitle' => 'nullable|string|max:191',
            'footer_description' => 'nullable|string|max:255',
            'contact_email' => 'nullable|string|max:191',
            'contact_phone' => 'nullable|string|max:50',
            'remove_brand_logo' => 'nullable|boolean',
            'brand_logo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:4096',
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
                    'brand_name' => $data['brand_name'] ?? 'Clinic and Laboratory',
                    'brand_short_name' => $data['brand_short_name'] ?? 'Clinic Lab',
                    'system_title' => $data['system_title'] ?? 'Clinic and Laboratory System',
                    'system_subtitle' => $data['system_subtitle'] ?? 'University Health Services',
                    'footer_description' => $data['footer_description'] ?? 'Modern healthcare management for better care and operations.',
                    'contact_email' => $data['contact_email'] ?? 'clinic@university.edu',
                    'contact_phone' => $data['contact_phone'] ?? '(123) 456-7890',
                ]);
            } else {
                $settings->update([
                    'open_time' => $data['open_time'] ?? $settings->open_time,
                    'close_time' => $data['close_time'] ?? $settings->close_time,
                    'working_days' => $data['working_days'] ?? $settings->working_days,
                    'appointment_interval' => $data['appointment_interval'] ?? $settings->appointment_interval,
                    'brand_name' => $data['brand_name'] ?? $settings->brand_name,
                    'brand_short_name' => $data['brand_short_name'] ?? $settings->brand_short_name,
                    'system_title' => $data['system_title'] ?? $settings->system_title,
                    'system_subtitle' => $data['system_subtitle'] ?? $settings->system_subtitle,
                    'footer_description' => $data['footer_description'] ?? $settings->footer_description,
                    'contact_email' => $data['contact_email'] ?? $settings->contact_email,
                    'contact_phone' => $data['contact_phone'] ?? $settings->contact_phone,
                ]);
            }

            if ($request->boolean('remove_brand_logo') && $settings->brand_logo_path) {
                Storage::disk('public')->delete($settings->brand_logo_path);
                $settings->brand_logo_path = null;
            }

            if ($request->hasFile('brand_logo')) {
                if ($settings->brand_logo_path) {
                    Storage::disk('public')->delete($settings->brand_logo_path);
                }
                $settings->brand_logo_path = $request->file('brand_logo')->store('clinic-branding', 'public');
            }

            $settings->save();
            $settings->refresh();

            return $this->ok('Clinic settings saved', ['settings' => $this->formatSettings($settings)]);
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
