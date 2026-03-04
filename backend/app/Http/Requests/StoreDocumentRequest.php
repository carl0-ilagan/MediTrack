<?php
// app/Http/Requests/StoreDocumentRequest.php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Handled by controller policy
    }

    public function rules(): array
    {
        return [
            'file' => 'required|file|max:10240|mimes:pdf,doc,docx,jpg,jpeg,png,txt',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'tags' => 'sometimes|array',
            'tags.*' => 'string|max:50',
            'is_public' => 'boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'file.max' => 'The file size must not exceed 10MB.',
            'file.mimes' => 'The file must be a valid document type (PDF, Word, Image, Text).',
        ];
    }
}