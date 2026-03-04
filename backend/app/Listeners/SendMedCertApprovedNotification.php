<?php

namespace App\Listeners;

use App\Events\MedCertApproved;
use App\Mail\MedCertApprovedMail;
use App\Models\MailSetting;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Crypt;

class SendMedCertApprovedNotification
{
    public function handle(MedCertApproved $event): void
    {
        Log::info('MedCertApproved event triggered', ['medcert_id' => $event->medCert->id]);
        
        try {
            $medCert = $event->medCert->load(['patient.user']);
            $patientEmail = $medCert->patient?->user?->email;

            Log::info('Processing medical certificate approval', [
                'medcert_id' => $medCert->id,
                'patient_email' => $patientEmail,
            ]);

            if (!$patientEmail) {
                Log::warning('MedCert approved but patient email not found', ['medcert_id' => $medCert->id]);
                return;
            }

            // Get mail settings from database
            $mailSettings = MailSetting::first();

            if (!$mailSettings) {
                Log::warning('Mail settings not configured in database');
                return;
            }

            Log::info('Mail settings found', ['email' => $mailSettings->email]);

            // Configure Mail with saved settings
            config([
                'mail.mailers.smtp.host' => $mailSettings->host ?? 'smtp.gmail.com',
                'mail.mailers.smtp.port' => $mailSettings->port ?? 587,
                'mail.mailers.smtp.username' => $mailSettings->email,
                'mail.mailers.smtp.password' => Crypt::decryptString($mailSettings->encrypted_password),
                'mail.mailers.smtp.encryption' => $mailSettings->encryption ?? 'tls',
                'mail.from.address' => $mailSettings->email,
                'mail.from.name' => 'Clinic and Laboratory',
                'mail.mailer' => 'smtp', // Force SMTP mailer
            ]);

            Log::info('Mail config updated', [
                'from' => config('mail.from.address'),
                'host' => config('mail.mailers.smtp.host'),
            ]);

            // Send the email
            Mail::to($patientEmail)->send(new MedCertApprovedMail($medCert));

            Log::info('Medical certificate approved email sent successfully', [
                'medcert_id' => $medCert->id,
                'patient_email' => $patientEmail,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send medical certificate approved email', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'medcert_id' => $event->medCert->id ?? null,
            ]);
        }
    }
}
