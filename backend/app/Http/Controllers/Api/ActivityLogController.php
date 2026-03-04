<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponses;
use Spatie\Activitylog\Models\Activity;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    use ApiResponses;

    /**
     * Display a listing of activity logs
     */
    public function index(Request $request)
    {
        $query = Activity::query();

        // Filter by event if provided - map to description field since event is null
        if ($request->has('event') && $request->event !== 'all') {
            $query->where('description', 'like', '%' . $request->event . '%');
        }

        // Filter by subject type if provided
        if ($request->has('subject_type') && $request->subject_type !== 'all') {
            $query->where('subject_type', $request->subject_type);
        }

        // Search in causer name, email, or description
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('causer', function ($subQ) use ($search) {
                    $subQ->where('name', 'like', "%$search%")
                        ->orWhere('email', 'like', "%$search%");
                })
                ->orWhere('description', 'like', "%$search%")
                ->orWhere('subject_type', 'like', "%$search%");
            });
        }

        // Paginate and eager load relationships
        $logs = $query
            ->with('causer')
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 50);

        return $this->success(
            'Activity logs retrieved successfully',
            $logs
        );
    }
}

