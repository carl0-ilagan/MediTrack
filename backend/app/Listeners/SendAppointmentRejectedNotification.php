<?php

namespace App\Listeners;

use App\Events\AppointmentRejected;
use App\Mail\AppointmentRejectedMail;
use App\Models\MailSetting;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Crypt;

class SendAppointmentRejectedNotification
{
    public function handle(AppointmentRejected $event): void
    {
        $appointment = $event->appointment->load(['patient.user', 'appointmentType']);
        $patientEmail = $appointment->patient?->user?->email;

        if (!$patientEmail) {
            Log::warning('Cannot send appointment rejection email: patient email not found', [
                'appointment_id' => $appointment->id,
            ]);
            return;
        }

        try {
            // Get mail settings from database
            $mailSettings = MailSetting::first();

            if (!$mailSettings) {
                Log::warning('Mail settings not configured in database for appointment rejection');
                return;
            }

            // Configure Mail with saved settings
            config([
                'mail.mailers.smtp.host' => $mailSettings->host ?? 'smtp.gmail.com',
                'mail.mailers.smtp.port' => $mailSettings->port ?? 587,
                'mail.mailers.smtp.username' => $mailSettings->email,
                'mail.mailers.smtp.password' => Crypt::decryptString($mailSettings->encrypted_password),
                'mail.mailers.smtp.encryption' => $mailSettings->encryption ?? 'tls',
                'mail.from.address' => $mailSettings->email,
                'mail.from.name' => 'Clinic and Laboratory',
            ]);

            Log::info('Sending appointment rejected email', [
                'appointment_id' => $appointment->id,
                'patient_email' => $patientEmail,
                'rejection_reason' => $appointment->cancellation_reason,
                'mail_from' => $mailSettings->email,
            ]);

            Mail::to($patientEmail)->send(new AppointmentRejectedMail($appointment));

            Log::info('Appointment rejected email sent successfully', [
                'appointment_id' => $appointment->id,
                'patient_email' => $patientEmail,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send appointment rejected email', [
                'appointment_id' => $appointment->id,
                'patient_email' => $patientEmail,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }
}
