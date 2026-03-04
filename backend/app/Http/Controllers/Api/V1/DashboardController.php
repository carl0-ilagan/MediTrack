<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Patient;
use App\Models\Appointment;
use App\Models\MedCert;
use App\Models\Document;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

/**
 * DashboardController provides statistics and analytics for admin dashboard
 * 
 * @package App\Http\Controllers\Api\V1
 */
class DashboardController extends Controller
{
    use ApiResponses;

    /**
     * Get admin dashboard statistics
     */
    public function adminStats(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            // Total users by role
            $totalUsers = User::where('is_active', true)->count();
            $totalPatients = User::role('patient')->where('is_active', true)->count();
            $totalClinicians = User::role('clinician')->where('is_active', true)->count();
            $totalAdmins = User::role('admin')->where('is_active', true)->count();

            // Previous month for comparison
            $lastMonth = Carbon::now()->subMonth();
            $previousUsers = User::where('is_active', true)
                ->where('created_at', '<', $lastMonth)
                ->count();

            // User growth percentage
            $userGrowth = $previousUsers > 0 
                ? round((($totalUsers - $previousUsers) / $previousUsers) * 100, 1)
                : 0;

            // Appointment statistics
            $totalAppointments = Appointment::count();
            $pendingAppointments = Appointment::where('status', 'scheduled')->count();
            $completedAppointments = Appointment::where('status', 'completed')->count();
            $todayAppointments = Appointment::whereDate('start_time', Carbon::today())->count();

            // MedCert statistics
            $totalMedCerts = MedCert::count();
            $pendingMedCerts = MedCert::where('status', 'pending')->count();
            $approvedMedCerts = MedCert::where('status', 'approved')->count();

            // Document statistics
            $totalDocuments = Document::count();
            $recentDocuments = Document::where('created_at', '>=', Carbon::now()->subDays(7))->count();

            // Recent activity (last 5 actions)
            $recentUsers = User::where('is_active', true)
                ->orderBy('created_at', 'desc')
                ->take(5)
                ->get(['id', 'name', 'email', 'created_at'])
                ->map(function ($user) {
                    return [
                        'type' => 'user',
                        'message' => "New user registered: {$user->name}",
                        'time' => $user->created_at->diffForHumans(),
                        'status' => 'success'
                    ];
                });

            $recentAppointments = Appointment::with('patient.user')
                ->orderBy('created_at', 'desc')
                ->take(3)
                ->get()
                ->map(function ($apt) {
                    $patientName = $apt->patient->user->name ?? 'Unknown';
                    return [
                        'type' => 'appointment',
                        'message' => "New appointment booked by {$patientName}",
                        'time' => $apt->created_at->diffForHumans(),
                        'status' => 'info'
                    ];
                });

            $recentActivity = $recentUsers->concat($recentAppointments)
                ->sortByDesc('time')
                ->take(5)
                ->values();

            // User distribution for pie chart
            $userDistribution = [
                'patients' => $totalPatients,
                'clinicians' => $totalClinicians,
                'admins' => $totalAdmins,
            ];

            // Monthly user growth (last 6 months)
            $monthlyGrowth = [];
            for ($i = 5; $i >= 0; $i--) {
                $date = Carbon::now()->subMonths($i);
                $monthStart = $date->copy()->startOfMonth();
                $monthEnd = $date->copy()->endOfMonth();

                $patients = User::role('patient')
                    ->whereBetween('created_at', [$monthStart, $monthEnd])
                    ->count();
                
                $clinicians = User::role('clinician')
                    ->whereBetween('created_at', [$monthStart, $monthEnd])
                    ->count();
                
                $admins = User::role('admin')
                    ->whereBetween('created_at', [$monthStart, $monthEnd])
                    ->count();

                $monthlyGrowth[] = [
                    'month' => $date->format('M'),
                    'patients' => $patients,
                    'clinicians' => $clinicians,
                    'admins' => $admins,
                ];
            }

            return $this->success('Dashboard statistics retrieved successfully', [
                'stats' => [
                    'totalUsers' => $totalUsers,
                    'userGrowth' => $userGrowth,
                    'totalAppointments' => $totalAppointments,
                    'todayAppointments' => $todayAppointments,
                    'pendingMedCerts' => $pendingMedCerts,
                    'completedAppointments' => $completedAppointments,
                ],
                'userDistribution' => $userDistribution,
                'monthlyGrowth' => $monthlyGrowth,
                'recentActivity' => $recentActivity,
            ]);

        } catch (\Exception $e) {
            return $this->error('Failed to retrieve dashboard statistics: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get appointment statistics for reports
     */
    public function appointmentStats(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            $months = $request->input('months', 6);

            $data = [];
            for ($i = $months - 1; $i >= 0; $i--) {
                $date = Carbon::now()->subMonths($i);
                $monthStart = $date->copy()->startOfMonth();
                $monthEnd = $date->copy()->endOfMonth();

                $completed = Appointment::where('status', 'completed')
                    ->whereBetween('created_at', [$monthStart, $monthEnd])
                    ->count();

                $cancelled = Appointment::where('status', 'cancelled')
                    ->whereBetween('created_at', [$monthStart, $monthEnd])
                    ->count();

                $pending = Appointment::whereIn('status', ['scheduled', 'confirmed'])
                    ->whereBetween('created_at', [$monthStart, $monthEnd])
                    ->count();

                $data[] = [
                    'month' => $date->format('M'),
                    'completed' => $completed,
                    'cancelled' => $cancelled,
                    'pending' => $pending,
                ];
            }

            return $this->success('Appointment statistics retrieved successfully', $data);

        } catch (\Exception $e) {
            return $this->error('Failed to retrieve appointment statistics: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get clinician dashboard statistics
     */
    public function clinicianStats(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            /** @var \App\Models\User $authUser */
            $authUser = Auth::user();
            $clinicianId = $authUser->id;

            // Today's appointments
            $todayAppointments = Appointment::with(['patient.user'])
                ->whereDate('start_time', Carbon::today())
                ->count();

            // Upcoming appointments (next 7 days)
            $upcomingAppointments = Appointment::with(['patient.user'])
                ->whereBetween('start_time', [Carbon::now(), Carbon::now()->addDays(7)])
                ->where('status', 'scheduled')
                ->count();

            // Total patients (unique patients who had appointments)
            $totalPatients = Appointment::distinct('patient_id')->count('patient_id');

            // Pending med certs awaiting approval
            $pendingMedCerts = MedCert::where('status', 'pending')->count();

            // Today's schedule details
            $todaySchedule = Appointment::with(['patient.user', 'appointmentType'])
                ->whereDate('start_time', Carbon::today())
                ->orderBy('start_time', 'asc')
                ->get()
                ->map(function ($apt) {
                    return [
                        'id' => $apt->id,
                        'time' => Carbon::parse($apt->start_time)->format('h:i A'),
                        'patient' => $apt->patient->user->name ?? 'Unknown',
                        'type' => optional($apt->appointmentType)->name ?? $apt->type ?? 'Consultation',
                        'status' => $apt->status,
                    ];
                });

            // Pending med cert requests
            $pendingCerts = MedCert::with(['patient.user'])
                ->where('status', 'pending')
                ->orderBy('created_at', 'desc')
                ->take(5)
                ->get()
                ->map(function ($cert) {
                    return [
                        'id' => $cert->id,
                        'patient' => $cert->patient->user->name ?? 'Unknown',
                        'diagnosis' => $cert->diagnosis,
                        'submitted' => $cert->created_at->diffForHumans(),
                    ];
                });

            // Weekly appointment trends
            $weeklyTrends = [];
            for ($i = 6; $i >= 0; $i--) {
                $date = Carbon::now()->subDays($i);
                $count = Appointment::whereDate('start_time', $date)->count();
                $weeklyTrends[] = [
                    'day' => $date->format('D'),
                    'appointments' => $count,
                ];
            }

            return $this->success('Clinician statistics retrieved successfully', [
                'stats' => [
                    'todayAppointments' => $todayAppointments,
                    'upcomingAppointments' => $upcomingAppointments,
                    'totalPatients' => $totalPatients,
                    'pendingMedCerts' => $pendingMedCerts,
                ],
                'todaySchedule' => $todaySchedule,
                'pendingCerts' => $pendingCerts,
                'weeklyTrends' => $weeklyTrends,
            ]);

        } catch (\Exception $e) {
            return $this->error('Failed to retrieve clinician statistics: ' . $e->getMessage(), 500);
        }
    }
}
