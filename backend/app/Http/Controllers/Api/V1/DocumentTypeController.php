<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\DocumentType;
use App\Http\Controllers\Controller;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;

class DocumentTypeController extends Controller
{
    use ApiResponses;

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $documentTypes = DocumentType::where('is_active', true)
            ->orderBy('name')
            ->get();
        
        return $this->ok('Document types retrieved successfully', $documentTypes);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:document_types,name',
            'is_active' => 'boolean',
        ]);

        $documentType = DocumentType::create($validated);

        return $this->success('Document type created successfully', $documentType, 201);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, DocumentType $documentType)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:document_types,name,' . $documentType->id,
            'is_active' => 'boolean',
        ]);

        $documentType->update($validated);

        return $this->ok('Document type updated successfully', $documentType);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(DocumentType $documentType)
    {
        $documentType->delete();

        return $this->ok('Document type deleted successfully', null);
    }
}

