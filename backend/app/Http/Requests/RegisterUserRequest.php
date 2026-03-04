<?php
// app/Http/Requests/RegisterUserRequest.php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules;

class RegisterUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Anyone can register
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // User data
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'phone' => 'required|string|max:20',
            'date_of_birth' => 'required|date|before:today',
            
            // Patient data
            'student_number' => 'required|string|unique:patients,student_number',
            'program' => 'required|string|max:255',
            
            // (emergency contact removed from signup; collect later)
        ];
    }

    /**
     * Get custom error messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Full name is required',
            'name.max' => 'Full name must not exceed 255 characters',
            
            'email.required' => 'Email address is required',
            'email.email' => 'Please provide a valid email address',
            'email.unique' => 'This email address is already registered',
            
            'password.required' => 'Password is required',
            'password.confirmed' => 'Password confirmation does not match',
            
            'phone.required' => 'Phone number is required',
            'phone.max' => 'Phone number must not exceed 20 characters',

            'date_of_birth.required' => 'Date of birth is required',
            'date_of_birth.date' => 'Please provide a valid date of birth',
            'date_of_birth.before' => 'Date of birth must be in the past',

            'student_number.required' => 'Student number is required',
            'student_number.unique' => 'This student number is already registered',
            'program.required' => 'Program is required',
            'program.max' => 'Program must not exceed 255 characters',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'name' => 'full name',
            'email' => 'email address',
            'password' => 'password',
            'phone' => 'phone number',
            'date_of_birth' => 'date of birth',
            'student_number' => 'student number',
            'program' => 'program',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    // No prepareForValidation needed for removed emergency contact fields
}