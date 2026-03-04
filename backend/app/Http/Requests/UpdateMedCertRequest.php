<?php
// app/Http/Requests/UpdateMedCertRequest.php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMedCertRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled by policy
    }

    public function rules(): array
    {
        return [
            'type' => 'sometimes|in:sick_leave,fitness_clearance,medical_excuse,vaccination,other',
            'start_date' => 'sometimes|date',
            'end_date' => 'sometimes|date|after_or_equal:start_date',
            'medical_reason' => 'sometimes|string|max:1000',
            'recommendations' => 'nullable|string|max:1000',
            'status' => 'sometimes|in:pending,approved,rejected,revoked',
            'rejection_reason' => 'required_if:status,rejected|string|max:500',
        ];
    }
}