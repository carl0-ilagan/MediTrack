<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Spatie\Permission\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use App\Traits\ApiResponses;

class AdminController extends Controller
{
    use ApiResponses;

    /**
     * Get all users
     */
    public function getUsers(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            // Eager-load patient relationship so we can return patient-specific fields
            $users = User::with('patient', 'roles')
                ->select('id', 'name', 'email', 'phone', 'date_of_birth', 'is_active', 'created_at', 'updated_at')
                ->get()
                ->map(function ($user) {
                    $roleName = 'patient'; // default role

                    if ($user->roles && $user->roles->count() > 0) {
                        $roleName = $user->roles->first()->name;
                    }

                    // Build a nested patient object so frontend can read patient.* fields
                    $patientObj = null;
                    if ($user->patient) {
                        $patientDob = $user->patient->date_of_birth ?? null;
                        $patientObj = [
                            'phone' => $user->patient->phone ?? null,
                            'program' => $user->patient->program ?? null,
                            'student_number' => $user->patient->student_number ?? null,
                            'date_of_birth' => $patientDob ? $patientDob->toDateString() : null,
                        ];
                    }

                    // Prefer phone on the user model, fallback to patient.phone
                    $phone = $user->phone ?? ($patientObj['phone'] ?? null);

                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'phone' => $phone,
                        'role' => $roleName,
                        'is_active' => $user->is_active,
                        'patient' => $patientObj,
                        'created_at' => $user->created_at->toISOString(),
                        'updated_at' => $user->updated_at->toISOString(),
                    ];
                });

            return $this->success('Users retrieved successfully', $users);
        } catch (\Exception $e) {
            Log::error('Failed to retrieve users: ' . $e->getMessage());
            return $this->error('Failed to retrieve users: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update user
     */
    public function updateUser(Request $request, $id): \Illuminate\Http\JsonResponse
    {
        try {
            $user = User::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'email' => 'sometimes|required|email|unique:users,email,' . $id,
                'role' => 'sometimes|required|in:patient,clinician,admin',
                'is_active' => 'sometimes|boolean',
            ]);

            if ($validator->fails()) {
                return $this->error('Validation failed', 422, $validator->errors());
            }

            // Update user basic info
            if ($request->has('name')) {
                $user->name = $request->name;
            }
            if ($request->has('email')) {
                $user->email = $request->email;
            }
            if ($request->has('is_active')) {
                $user->is_active = $request->is_active;
            }

            $user->save();

            // Update role if provided
            if ($request->has('role')) {
                $roleName = $request->role;

                // Ensure role exists in roles table; create if missing
                try {
                    Role::firstOrCreate(['name' => $roleName]);
                } catch (\Exception $e) {
                    Log::error('Failed to create/find role: ' . $e->getMessage());
                    return $this->error('Role assignment failed', 500);
                }

                // Assign role using Spatie Permission
                try {
                    $user->syncRoles([$roleName]);
                } catch (\Exception $e) {
                    Log::error('Failed to sync roles: ' . $e->getMessage());
                    return $this->error('Role assignment failed', 500);
                }
            }

            // Reload user with roles for the response
            $user->load('roles:id,name');

            return $this->success('User updated successfully', $user);
        } catch (\Exception $e) {
            return $this->error('Failed to update user: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Toggle user active status (activate/deactivate)
     */
    public function toggleUserStatus($id): \Illuminate\Http\JsonResponse
    {
        try {
            $user = User::findOrFail($id);

            // Prevent deactivating yourself
            /** @var \App\Models\User $authUser */
            $authUser = Auth::user();
            if ($user->id === $authUser->id) {
                return $this->error('You cannot deactivate your own account', 403);
            }

            $user->is_active = !$user->is_active;
            $user->save();

            $status = $user->is_active ? 'activated' : 'deactivated';

            return $this->success("User {$status} successfully", [
                'id' => $user->id,
                'is_active' => $user->is_active
            ]);
        } catch (\Exception $e) {
            return $this->error('Failed to toggle user status: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get user by ID
     */
    public function getUser($id): \Illuminate\Http\JsonResponse
    {
        try {
            // Load roles and patient relationship
            $user = User::with('roles', 'patient')->findOrFail($id);

            $roleName = 'patient'; // default role
            if ($user->roles && $user->roles->count() > 0) {
                $roleName = $user->roles->first()->name;
            }

            $patientObj = null;
            if ($user->patient) {
                $patientDob = $user->patient->date_of_birth ?? null;
                $patientObj = [
                    'phone' => $user->patient->phone ?? null,
                    'program' => $user->patient->program ?? null,
                    'student_number' => $user->patient->student_number ?? null,
                    'date_of_birth' => $patientDob ? $patientDob->toDateString() : null,
                ];
            }

            $phone = $user->phone ?? ($patientObj['phone'] ?? null);

            return $this->success('User retrieved successfully', [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $phone,
                'role' => $roleName,
                'patient' => $patientObj,
                'created_at' => $user->created_at->toISOString(),
                'updated_at' => $user->updated_at->toISOString(),
            ]);
        } catch (\Exception $e) {
            Log::error('User not found: ' . $e->getMessage());
            return $this->error('User not found', 404);
        }
    }
}
