<?php
namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class ClinicianDirectoryController extends Controller
{
    /**
     * Return a lightweight list of active clinicians for patient booking flows.
     */
    public function index(Request $request)
    {
        $limit = (int) $request->input('limit', 50);
        $limit = min(max($limit, 1), 100);

        $query = User::role('clinician')
            ->where('is_active', true)
            ->withCount([
                'appointmentsAsClinician as upcoming_appointments_count' => function ($q) {
                    $q->where('start_time', '>=', now())
                        ->whereIn('status', ['scheduled', 'confirmed']);
                }
            ]);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $clinicians = $query
            ->orderBy('name')
            ->limit($limit)
            ->get(['id', 'name', 'email', 'phone', 'profile_photo_path']);

        $payload = $clinicians->map(function (User $clinician) {
            return [
                'id' => $clinician->id,
                'name' => $clinician->name,
                'email' => $clinician->email,
                'phone' => $clinician->phone,
                'photo_url' => $clinician->profile_photo_url,
                'specialty' => $clinician->specialty ?? 'General Practice',
                'upcoming_appointments' => $clinician->upcoming_appointments_count ?? 0,
            ];
        })->values();

        return response()->json($payload);
    }
}
