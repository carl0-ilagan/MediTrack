<?php
// app/Http/Requests/StoreMedCertRequest.php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Carbon\Carbon;

class StoreMedCertRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled by policy
    }

    public function rules(): array
    {
        return [
            'patient_id' => 'required_if:user_role,admin|exists:patients,id',
            'type' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'purpose' => 'required|string|max:1000',
            'recommendations' => 'nullable|string|max:1000',
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if ($this->start_date && $this->end_date) {
                $start = Carbon::parse($this->start_date);
                $end = Carbon::parse($this->end_date);
                
                // Check if duration is reasonable (max 30 days)
                if ($end->diffInDays($start) > 30) {
                    $validator->errors()->add(
                        'end_date', 
                        'Medical certificate cannot exceed 30 days.'
                    );
                }
            }
        });
    }
}