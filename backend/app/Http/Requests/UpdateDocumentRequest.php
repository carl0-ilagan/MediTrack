<?php
// app/Http/Requests/UpdateDocumentRequest.php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Handled by controller policy
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:1000',
            'tags' => 'sometimes|array',
            'tags.*' => 'string|max:50',
            'is_public' => 'sometimes|boolean',
        ];
    }
}