<?php
// routes/api.php
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\PatientController;
use App\Http\Controllers\Api\V1\DocumentController;
use App\Http\Controllers\Api\V1\AppointmentController;
use App\Http\Controllers\Api\V1\MedCertController;
use App\Http\Controllers\Api\V1\AuditLogController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\ClinicianDirectoryController;
use App\Http\Controllers\Api\V1\ClinicController;
use App\Http\Controllers\Api\V1\AppointmentTypeController;
use App\Http\Controllers\Api\V1\DocumentTypeController;
use App\Http\Controllers\Api\V1\MedcertReasonController;
use App\Http\Controllers\Api\ActivityLogController;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;


// Public routes that need session/CSRF (Sanctum SPA)
Route::middleware(['web'])->group(function () {
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);
    Route::get('/med-certs/{hash}/verify', [MedCertController::class, 'publicVerify']);
    Route::get('/clinic/branding', [ClinicController::class, 'branding']);
    
    // Public medical certificate types endpoint (for dropdown - no auth required)
    Route::get('/medcert/types', [MedcertReasonController::class, 'index']);

    // Debug route: returns request headers and cookies (local-dev only)
    Route::get('/debug/request', function (Illuminate\Http\Request $request) {
        return response()->json([
            'cookies' => $request->cookies->all(),
            'headers' => $request->headers->all(),
        ]);
    });
});

// Protected routes (must include web to start session for Sanctum)
Route::middleware(['web', 'auth:sanctum'])->group(function () {
    Route::get('/auth/user', [AuthController::class, 'user']);
    Route::put('/auth/user', [AuthController::class, 'updateProfile']);
    Route::post('/auth/user/change-password', [AuthController::class, 'changePassword']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Directory lookups
    Route::get('/clinicians', [ClinicianDirectoryController::class, 'index']);
    Route::get('/clinic/meta', [ClinicController::class, 'meta']);
    Route::get('/appointment-types', [AppointmentTypeController::class, 'index']);
    Route::get('/services', [AppointmentTypeController::class, 'index']);
    
    // Patients
    Route::apiResource('patients', PatientController::class);
    
    // Appointments
    Route::apiResource('appointments', AppointmentController::class);
    Route::get('/appointments/calendar', [AppointmentController::class, 'calendar']);
    Route::post('/appointments/{appointment}/cancel', [AppointmentController::class, 'cancel']);
    Route::post('/appointments/{appointment}/confirm', [AppointmentController::class, 'confirm']);
    Route::post('/appointments/{appointment}/reject', [AppointmentController::class, 'reject']);
    Route::post('/appointments/{appointment}/no_show', [AppointmentController::class, 'markNoShow']);
    Route::post('/appointments/{appointment}/start', [AppointmentController::class, 'startAppointment']);
    Route::post('/appointments/{appointment}/complete', [AppointmentController::class, 'completeAppointment']);
    
    // Medical Certificates
    Route::apiResource('med-certs', MedCertController::class);
    Route::post('/med-certs/{med_cert}/approve', [MedCertController::class, 'approve']);
    Route::post('/med-certs/{med_cert}/reject', [MedCertController::class, 'reject']);
    Route::post('/med-certs/{med_cert}/no-show', [MedCertController::class, 'markNoShow']);
    Route::post('/med-certs/{med_cert}/completed', [MedCertController::class, 'markCompleted']);
    Route::get('/med-certs/{med_cert}/download', [MedCertController::class, 'downloadPdf']);
    
    // Documents
    Route::get('/documents', [DocumentController::class, 'getUserDocuments']); // Get user's own documents
    Route::post('/documents', [DocumentController::class, 'uploadDocument']); // Upload document as current user
    Route::get('/patients/{patient}/documents', [DocumentController::class, 'index']);
    Route::post('/patients/{patient}/documents', [DocumentController::class, 'store']);
    Route::get('/documents/{document}/download', [DocumentController::class, 'download']);
    Route::delete('/documents/{document}', [DocumentController::class, 'destroy']);
    Route::get('/clinician/documents', [DocumentController::class, 'getAllPatientDocuments']); // All patient documents for clinician
    
    // Role-based routes
    Route::middleware(['role:admin'])->group(function () {
        // Appointment Types
        Route::get('/admin/appointment-types', [AppointmentTypeController::class, 'index']);
        Route::post('/admin/appointment-types', [AppointmentTypeController::class, 'store']);
        Route::patch('/admin/appointment-types/{id}', [AppointmentTypeController::class, 'update']);
        Route::delete('/admin/appointment-types/{id}', [AppointmentTypeController::class, 'destroy']);
        // Legacy service endpoints (backwards compatibility)
        Route::get('/admin/services', [AppointmentTypeController::class, 'index']);
        Route::post('/admin/services', [AppointmentTypeController::class, 'store']);
        Route::patch('/admin/services/{id}', [AppointmentTypeController::class, 'update']);
        Route::delete('/admin/services/{id}', [AppointmentTypeController::class, 'destroy']);

        // Medical Certificate reasons/types (support both endpoints for flexibility)
        Route::get('/admin/medcert/reasons', [\App\Http\Controllers\Api\V1\MedcertReasonController::class, 'index']);
        Route::post('/admin/medcert/reasons', [\App\Http\Controllers\Api\V1\MedcertReasonController::class, 'store']);
        Route::delete('/admin/medcert/reasons/{id}', [\App\Http\Controllers\Api\V1\MedcertReasonController::class, 'destroy']);
        Route::patch('/admin/medcert/reasons/{id}', [\App\Http\Controllers\Api\V1\MedcertReasonController::class, 'update']);
        
        Route::get('/admin/medcert/types', [\App\Http\Controllers\Api\V1\MedcertReasonController::class, 'index']);
        Route::post('/admin/medcert/types', [\App\Http\Controllers\Api\V1\MedcertReasonController::class, 'store']);
        Route::delete('/admin/medcert/types/{id}', [\App\Http\Controllers\Api\V1\MedcertReasonController::class, 'destroy']);
        Route::patch('/admin/medcert/types/{id}', [\App\Http\Controllers\Api\V1\MedcertReasonController::class, 'update']);
        // Clinic management (admin)
        Route::get('/admin/clinic/settings', [\App\Http\Controllers\Api\V1\ClinicController::class, 'getSettings']);
        Route::post('/admin/clinic/settings', [\App\Http\Controllers\Api\V1\ClinicController::class, 'saveSettings']);
        Route::get('/admin/clinic/closures', [\App\Http\Controllers\Api\V1\ClinicController::class, 'listClosures']);
        Route::post('/admin/clinic/closures', [\App\Http\Controllers\Api\V1\ClinicController::class, 'addClosure']);
        Route::delete('/admin/clinic/closures/{id}', [\App\Http\Controllers\Api\V1\ClinicController::class, 'deleteClosure']);
        // Mail (SMTP) settings
        Route::get('/admin/mail/settings', [\App\Http\Controllers\Api\V1\MailSettingController::class, 'index']);
        Route::post('/admin/mail/settings', [\App\Http\Controllers\Api\V1\MailSettingController::class, 'store']);
        
        // Dashboard statistics
        Route::get('/admin/dashboard/stats', [DashboardController::class, 'adminStats']);
        Route::get('/admin/dashboard/appointments', [DashboardController::class, 'appointmentStats']);
    });
    
    Route::middleware(['role:clinician'])->group(function () {
        Route::get('/clinician/dashboard/stats', [DashboardController::class, 'clinicianStats']);
    });

    // Document Types - GET is public (for dropdowns), others are admin only
    Route::get('/document-types', [DocumentTypeController::class, 'index']); // Public for loading document types
    
    Route::middleware(['role:admin'])->group(function () {
        Route::post('/document-types', [DocumentTypeController::class, 'store']);
        Route::put('/document-types/{documentType}', [DocumentTypeController::class, 'update']);
        Route::delete('/document-types/{documentType}', [DocumentTypeController::class, 'destroy']);
        
        // Activity Logs (admin only)
        Route::get('/activity-logs', [ActivityLogController::class, 'index']);
    });
});