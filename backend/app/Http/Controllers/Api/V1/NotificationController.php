<?php
// app/Http/Controllers/Api/V1/NotificationController.php
namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;


class NotificationController extends Controller
{
    use AuthorizesRequests;

    // public function __construct()
    // {
    //     $this->authorizeResource(Notification::class, 'notification');
    // }

    public function index(Request $request)
    {
        $query = $request->user()->notifications()->with('user');

        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // Filter by channel
        if ($request->has('channel')) {
            $query->where('channel', $request->channel);
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Show unread only
        if ($request->boolean('unread_only')) {
            $query->unread();
        }

        $notifications = $query->latest()->paginate($request->get('per_page', 20));

        return response()->json($notifications);
    }

    public function show(Notification $notification)
    {
        return response()->json($notification->load('user'));
    }

    public function markAsRead(Request $request, Notification $notification)
    {
        $this->authorize('update', $notification);

        $notification->markAsRead();

        return response()->json($notification->load('user'));
    }

    public function markAllAsRead(Request $request)
    {
        $request->user()->notifications()->unread()->update(['read_at' => now()]);

        return response()->json([
            'message' => 'All notifications marked as read.'
        ]);
    }

    public function stats(Request $request)
    {
        $stats = [
            'total' => $request->user()->notifications()->count(),
            'unread' => $request->user()->notifications()->unread()->count(),
            'by_type' => $request->user()->notifications()
                ->selectRaw('type, count(*) as count')
                ->groupBy('type')
                ->pluck('count', 'type')
                ->toArray(),
            'by_channel' => $request->user()->notifications()
                ->selectRaw('channel, count(*) as count')
                ->groupBy('channel')
                ->pluck('count', 'channel')
                ->toArray(),
        ];

        return response()->json($stats);
    }

    // We might not use store, update, destroy for notifications from API
    public function store(Request $request)
    {
        return response()->json([
            'message' => 'Notifications are created by the system only.'
        ], Response::HTTP_METHOD_NOT_ALLOWED);
    }

    public function update(Request $request, Notification $notification)
    {
        // Only allow marking as read, not general updates
        if ($request->has('read_at')) {
            $notification->markAsRead();
            return response()->json($notification->load('user'));
        }

        return response()->json([
            'message' => 'Notifications can only be marked as read.'
        ], Response::HTTP_BAD_REQUEST);
    }

    public function destroy(Notification $notification)
    {
        $notification->delete();

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}