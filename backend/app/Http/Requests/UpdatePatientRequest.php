<?php
// app/Http/Requests/UpdatePatientRequest.php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePatientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole(['admin', 'clinician']) || 
               $this->user()->patient?->id === $this->route('patient')->id;
    }

    public function rules(): array
    {
        $patientId = $this->route('patient')->id;
        
        return [
            'student_number' => "sometimes|string|unique:patients,student_number,{$patientId}",
            'date_of_birth' => 'sometimes|date|before:today',
            'phone' => 'sometimes|string|max:20',
            'address' => 'sometimes|string|max:500',
            'emergency_contact.name' => 'sometimes|string',
            'emergency_contact.relationship' => 'sometimes|string',
            'emergency_contact.phone' => 'sometimes|string',
            'allergies' => 'sometimes|array',
            'allergies.*' => 'string',
            'medical_notes' => 'nullable|string',
            'blood_type' => 'nullable|string|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
            'insurance_provider' => 'nullable|string',
            'insurance_number' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
        ];
    }
}