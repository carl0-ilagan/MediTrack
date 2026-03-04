<?php
namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class PatientController extends Controller {
    public function index(Request $request) {
        $query = Patient::with(['user', 'appointments']);

        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $patients = $query->latest()->paginate(15);
        return response()->json($patients);
    }

    public function show(Patient $patient) {
        return response()->json($patient->load(['user', 'appointments', 'documents']));
    }

    public function store(Request $request) {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'student_number' => 'required|string|unique:patients,student_number',
            'date_of_birth' => 'required|date',
            'phone' => 'required|string|max:20',
            'address' => 'required|string|max:500',
        ]);

        $patient = Patient::create($validated);
        return response()->json($patient->load('user'), Response::HTTP_CREATED);
    }

    public function update(Request $request, Patient $patient) {
        $validated = $request->validate([
            'student_number' => 'sometimes|string|unique:patients,student_number,' . $patient->id,
            'phone' => 'sometimes|string|max:20',
            'address' => 'sometimes|string|max:500',
        ]);

        $patient->update($validated);
        return response()->json($patient->load('user'));
    }

    public function destroy(Patient $patient) {
        $patient->delete();
        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}