<?php
namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\Patient;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller {
    public function index(Request $request, $patientId) {
        $patient = Patient::with('user')->findOrFail($patientId);
        $this->ensurePatientAccess($request, $patient);

        $query = $patient->documents()->with(['uploader', 'patient.user', 'documentType']);

        if ($request->has('search')) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        if ($request->filled('document_type_id')) {
            $query->where('document_type_id', (int) $request->input('document_type_id'));
        }

        if ($request->filled('document_type')) {
            $documentType = (string) $request->input('document_type');
            $query->whereHas('documentType', function ($typeQuery) use ($documentType) {
                $typeQuery->where('name', 'like', "%{$documentType}%");
            });
        }

        if ($request->boolean('laboratory_only')) {
            $query->whereHas('documentType', function ($typeQuery) {
                $typeQuery->where('name', 'like', '%lab%');
            });
        }

        if ($request->filled('tags')) {
            $tags = array_filter(array_map('trim', explode(',', (string) $request->input('tags'))));
            foreach ($tags as $tag) {
                $query->whereJsonContains('tags', $tag);
            }
        }

        $perPage = min(max((int) $request->input('per_page', 20), 5), 100);
        $documents = $query->latest()->paginate($perPage);
        return response()->json($documents);
    }

    public function store(Request $request, $patientId) {
        $patient = Patient::findOrFail($patientId);
        $this->ensurePatientAccess($request, $patient);
        
        $request->validate([
            'file' => 'required|file|max:10240',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'tags' => 'nullable|array|max:5',
            'tags.*' => 'string|max:30',
        ]);

        $file = $request->file('file');
        $path = $file->store("patients/{$patient->id}/documents");

        $document = $patient->documents()->create([
            'name' => $request->name,
            'file_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
            'description' => $request->input('description'),
            'tags' => $request->input('tags'),
            'disk' => config('filesystems.default', 'local'),
            'path' => $path,
            'uploaded_by' => $request->user()->id,
            'checksum' => md5_file($file->getRealPath()),
        ]);

        return response()->json($document->load('uploader'), Response::HTTP_CREATED);
    }

    public function download(Request $request, Document $document) {
        $this->ensureDocumentAccess($request, $document);

        if (!Storage::exists($document->path)) {
            return response()->json(['message' => 'File not found'], 404);
        }

        $document->recordAccess();

        return Storage::download($document->path, $document->file_name);
    }

    public function destroy(Request $request, Document $document) {
        $this->ensureDocumentAccess($request, $document);

        if (Storage::exists($document->path)) {
            Storage::delete($document->path);
        }

        $document->delete();
        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    // Get documents for authenticated user (patient)
    public function getUserDocuments(Request $request) {
        $user = $request->user();
        
        // Only patients can get their own documents
        abort_if(!$user->isPatient(), Response::HTTP_FORBIDDEN, 'Only patients can access this endpoint');
        
        $patient = $user->patient;
        abort_if(!$patient, Response::HTTP_NOT_FOUND, 'Patient record not found');

        $query = $patient->documents()->with(['uploader', 'documentType']);

        if ($request->has('search')) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        if ($request->filled('document_type_id')) {
            $query->where('document_type_id', (int) $request->input('document_type_id'));
        }

        if ($request->filled('document_type')) {
            $documentType = (string) $request->input('document_type');
            $query->whereHas('documentType', function ($typeQuery) use ($documentType) {
                $typeQuery->where('name', 'like', "%{$documentType}%");
            });
        }

        if ($request->boolean('laboratory_only')) {
            $query->whereHas('documentType', function ($typeQuery) {
                $typeQuery->where('name', 'like', '%lab%');
            });
        }

        $perPage = min(max((int) $request->input('per_page', 20), 5), 100);
        $documents = $query->latest()->paginate($perPage);
        return response()->json($documents);
    }

    // Upload document for authenticated user (patient)
    public function uploadDocument(Request $request) {
        $user = $request->user();
        
        // Only patients can upload documents
        abort_if(!$user->isPatient(), Response::HTTP_FORBIDDEN, 'Only patients can upload documents');
        
        $patient = $user->patient;
        abort_if(!$patient, Response::HTTP_NOT_FOUND, 'Patient record not found');

        $request->validate([
            'file' => 'required|file|max:10240',
            'document_type_id' => 'required|exists:document_types,id',
            'description' => 'nullable|string|max:500',
        ]);

        $file = $request->file('file');
        $path = $file->store("patients/{$patient->id}/documents");

        try {
            $document = $patient->documents()->create([
                'name' => $file->getClientOriginalName(),
                'file_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType(),
                'size' => $file->getSize(),
                'description' => $request->input('description'),
                'document_type_id' => $request->input('document_type_id'),
                'disk' => config('filesystems.default', 'local'),
                'path' => $path,
                'uploaded_by' => $user->id,
                'checksum' => md5_file($file->getRealPath()),
            ]);

            return response()->json(
                $document->load('uploader', 'documentType'),
                Response::HTTP_CREATED
            );
        } catch (\Exception $e) {
            // Clean up uploaded file on error
            if (Storage::exists($path)) {
                Storage::delete($path);
            }
            throw $e;
        }
    }

    // Get all patient documents (for clinicians)
    public function getAllPatientDocuments(Request $request) {
        $user = $request->user();
        
        // Only clinicians and admins can view all patient documents
        $isAuthorized = $user->hasRole('clinician') || $user->hasRole('admin') || $user->isAdmin();
        abort_if(!$isAuthorized, Response::HTTP_FORBIDDEN, 'Only clinicians can access this endpoint');

        $query = Document::with(['uploader', 'patient.user', 'documentType']);

        if ($request->has('search')) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        if ($request->filled('patient_id')) {
            $query->where('patient_id', $request->input('patient_id'));
        }

        if ($request->filled('document_type_id')) {
            $query->where('document_type_id', (int) $request->input('document_type_id'));
        }

        if ($request->filled('document_type')) {
            $documentType = (string) $request->input('document_type');
            $query->whereHas('documentType', function ($typeQuery) use ($documentType) {
                $typeQuery->where('name', 'like', "%{$documentType}%");
            });
        }

        if ($request->boolean('laboratory_only')) {
            $query->whereHas('documentType', function ($typeQuery) {
                $typeQuery->where('name', 'like', '%lab%');
            });
        }

        $perPage = min(max((int) $request->input('per_page', 20), 5), 100);
        $documents = $query->latest()->paginate($perPage);
        return response()->json($documents);
    }

    protected function ensurePatientAccess(Request $request, Patient $patient): void
    {
        $user = $request->user();

        if ($user->isPatient()) {
            $authPatientId = optional($user->patient)->id;
            abort_if(
                $authPatientId !== $patient->id,
                Response::HTTP_FORBIDDEN,
                'You are not allowed to access this patient record.'
            );
            return;
        }

        abort_if(
            !$user->isClinician(),
            Response::HTTP_FORBIDDEN,
            'Only clinicians or administrators can view other patient records.'
        );
    }

    protected function ensureDocumentAccess(Request $request, Document $document): void
    {
        $user = $request->user();

        if ($user->isPatient()) {
            $authPatientId = optional($user->patient)->id;
            abort_if(
                $authPatientId !== $document->patient_id,
                Response::HTTP_FORBIDDEN,
                'You are not allowed to access this document.'
            );
            return;
        }

        abort_if(
            !$user->isClinician(),
            Response::HTTP_FORBIDDEN,
            'Only clinicians or administrators can manage other patients\' documents.'
        );
    }
}