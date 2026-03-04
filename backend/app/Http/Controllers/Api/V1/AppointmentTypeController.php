<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AppointmentType;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class AppointmentTypeController extends Controller
{
    use ApiResponses;

    public function index(Request $request)
    {
        try {
            $query = AppointmentType::orderBy('name');

            if ($request->boolean('active_only')) {
                $query->where('is_active', true);
            }

            $types = $query->get();

            // Optional availability filter for a specific date/time.
            if ($request->filled('date')) {
                $date = (string) $request->input('date');
                $time = (string) ($request->input('time') ?: '09:00');
                $start = Carbon::parse($date.' '.$time);
                $types = $types->filter(function (AppointmentType $type) use ($start) {
                    return $type->isAvailableAt($start);
                })->values();
            }

            return $this->ok('Appointment types retrieved', ['appointment_types' => $types]);
        } catch (\Exception $e) {
            Log::error('Failed to list appointment types: '.$e->getMessage());
            return $this->error('Failed to list appointment types', 500);
        }
    }

    public function store(Request $request)
    {
        $data = $request->only([
            'name',
            'category',
            'estimated_minutes',
            'price',
            'description',
            'is_active',
            'available_from',
            'available_until',
            'available_days',
            'available_start_time',
            'available_end_time',
        ]);

        $validator = Validator::make($data, [
            'name' => 'required|string|max:191',
            'category' => 'nullable|string|max:100',
            'estimated_minutes' => 'required|integer|min:5',
            'price' => 'nullable|numeric|min:0|max:999999.99',
            'description' => 'nullable|string|max:255',
            'is_active' => 'nullable|boolean',
            'available_from' => 'nullable|date',
            'available_until' => 'nullable|date|after_or_equal:available_from',
            'available_days' => 'nullable|array',
            'available_days.*' => 'in:mon,tue,wed,thu,fri,sat,sun',
            'available_start_time' => 'nullable|date_format:H:i',
            'available_end_time' => 'nullable|date_format:H:i|after:available_start_time',
        ]);

        if ($validator->fails()) {
            return $this->error('Invalid input', 422, $validator->errors()->toArray());
        }

        try {
            $type = AppointmentType::create([
                'name' => $data['name'],
                'category' => $data['category'] ?? null,
                'estimated_minutes' => $data['estimated_minutes'],
                'price' => $data['price'] ?? null,
                'description' => $data['description'] ?? null,
                'is_active' => $data['is_active'] ?? true,
                'available_from' => $data['available_from'] ?? null,
                'available_until' => $data['available_until'] ?? null,
                'available_days' => $data['available_days'] ?? null,
                'available_start_time' => $data['available_start_time'] ?? null,
                'available_end_time' => $data['available_end_time'] ?? null,
            ]);

            return $this->ok('Appointment type created', ['appointment_type' => $type]);
        } catch (\Exception $e) {
            Log::error('Failed to create appointment type: '.$e->getMessage());
            return $this->error('Failed to create appointment type', 500);
        }
    }

    public function update(Request $request, $id)
    {
        $data = $request->only([
            'name',
            'category',
            'estimated_minutes',
            'price',
            'description',
            'is_active',
            'available_from',
            'available_until',
            'available_days',
            'available_start_time',
            'available_end_time',
        ]);

        $validator = Validator::make($data, [
            'name' => 'sometimes|required|string|max:191',
            'category' => 'nullable|string|max:100',
            'estimated_minutes' => 'sometimes|required|integer|min:5',
            'price' => 'nullable|numeric|min:0|max:999999.99',
            'description' => 'nullable|string|max:255',
            'is_active' => 'nullable|boolean',
            'available_from' => 'nullable|date',
            'available_until' => 'nullable|date|after_or_equal:available_from',
            'available_days' => 'nullable|array',
            'available_days.*' => 'in:mon,tue,wed,thu,fri,sat,sun',
            'available_start_time' => 'nullable|date_format:H:i',
            'available_end_time' => 'nullable|date_format:H:i|after:available_start_time',
        ]);

        if ($validator->fails()) {
            return $this->error('Invalid input', 422, $validator->errors()->toArray());
        }

        try {
            $type = AppointmentType::findOrFail($id);
            $type->fill($data);
            $type->save();

            return $this->ok('Appointment type updated', ['appointment_type' => $type]);
        } catch (\Exception $e) {
            Log::error('Failed to update appointment type: '.$e->getMessage());
            return $this->error('Failed to update appointment type', 500);
        }
    }

    public function destroy($id)
    {
        try {
            $type = AppointmentType::findOrFail($id);
            $type->delete();

            return $this->ok('Appointment type removed');
        } catch (\Exception $e) {
            Log::error('Failed to delete appointment type: '.$e->getMessage());
            return $this->error('Failed to delete appointment type', 500);
        }
    }
}
