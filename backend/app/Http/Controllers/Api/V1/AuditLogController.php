<?php
// app/Http/Controllers/Api/V1/AuditLogController.php
namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Spatie\ActivityLog\Models\Activity;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class AuditLogController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request)
    {
        try {
            // Verify user is authenticated
            $user = $request->user();
            if (!$user) {
                return response()->json([
                    'message' => 'Unauthenticated'
                ], Response::HTTP_UNAUTHORIZED);
            }
            
            // Check roles - use hasRole instead of hasAnyRole
            $isAuthorized = $user->hasRole('admin') || $user->hasRole('clinician');
            if (!$isAuthorized) {
                return response()->json([
                    'message' => 'Unauthorized - insufficient permissions'
                ], Response::HTTP_FORBIDDEN);
            }
            
            // Return empty data for now
            return response()->json([
                'data' => [],
                'current_page' => 1,
                'last_page' => 1,
                'total' => 0,
                'per_page' => 20,
            ]);
            
        } catch (\Exception $e) {
            Log::error('Audit log error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            return response()->json([
                'message' => 'Error',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function show($id)
    {
        $activity = Activity::find($id);
        
        if (!$activity) {
            return response()->json(['message' => 'Activity not found'], Response::HTTP_NOT_FOUND);
        }

        return response()->json([
            'id' => $activity->id,
            'action' => $activity->event,
            'model_type' => $activity->subject_type,
            'model_id' => $activity->subject_id,
            'description' => $activity->description,
            'properties' => $activity->properties,
            'user' => [
                'id' => $activity->causer_id,
                'name' => $activity->causer?->name ?? 'System',
                'email' => $activity->causer?->email ?? 'system@clinic.local',
            ],
            'created_at' => $activity->created_at,
        ]);
    }

    public function store(Request $request)
    {
        return response()->json([
            'message' => 'Audit logs cannot be created manually.'
        ], Response::HTTP_METHOD_NOT_ALLOWED);
    }

    public function update(Request $request, $id)
    {
        return response()->json([
            'message' => 'Audit logs cannot be modified.'
        ], Response::HTTP_METHOD_NOT_ALLOWED);
    }

    public function destroy(Request $request, $id)
    {
        if (!$request->user()->hasRole('admin')) {
            return response()->json([
                'message' => 'Unauthorized to delete audit logs.'
            ], Response::HTTP_FORBIDDEN);
        }

        $activity = Activity::find($id);
        if ($activity) {
            $activity->delete();
        }

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}