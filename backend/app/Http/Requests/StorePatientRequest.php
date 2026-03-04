<?php
// app/Http/Requests/StorePatientRequest.php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePatientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('admin');
    }

    public function rules(): array
    {
        return [
            'user_id' => 'required|exists:users,id',
            'student_number' => 'required|string|unique:patients,student_number',
            'date_of_birth' => 'required|date|before:today',
            'phone' => 'required|string|max:20',
            'address' => 'required|string|max:500',
            'emergency_contact.name' => 'required|string',
            'emergency_contact.relationship' => 'required|string',
            'emergency_contact.phone' => 'required|string',
            'allergies' => 'sometimes|array',
            'allergies.*' => 'string',
            'medical_notes' => 'nullable|string',
            'blood_type' => 'nullable|string|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
            'insurance_provider' => 'nullable|string',
            'insurance_number' => 'nullable|string',
        ];
    }
}