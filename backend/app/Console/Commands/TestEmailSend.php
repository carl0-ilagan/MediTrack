<?php

namespace App\Console\Commands;

use App\Models\MailSetting;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Mail;

class TestEmailSend extends Command
{
    protected $signature = 'mail:send-test {email?}';
    protected $description = 'Send a test email using configured mail settings';

    public function handle()
    {
        $testEmail = $this->argument('email') ?? 'test@example.com';
        
        $this->info('📧 Test Email Sender');
        $this->info('===================' . "\n");

        $mailSettings = MailSetting::first();

        if (!$mailSettings) {
            $this->error('❌ No mail settings found in database!');
            return 1;
        }

        $this->info('Sending test email to: ' . $testEmail);
        $this->info('From: ' . $mailSettings->email . "\n");

        try {
            $decryptedPassword = Crypt::decryptString($mailSettings->encrypted_password);
            
            // Configure Mail with database settings
            config([
                'mail.mailers.smtp.host' => $mailSettings->host,
                'mail.mailers.smtp.port' => $mailSettings->port,
                'mail.mailers.smtp.username' => $mailSettings->email,
                'mail.mailers.smtp.password' => $decryptedPassword,
                'mail.mailers.smtp.encryption' => $mailSettings->encryption,
                'mail.from.address' => $mailSettings->email,
                'mail.from.name' => 'MediTrack',
                'mail.mailer' => 'smtp',
            ]);

            $this->info('Attempting to send email...');

            Mail::raw('This is a test email from MediTrack.', function ($message) use ($testEmail, $mailSettings) {
                $message->to($testEmail)
                    ->from($mailSettings->email, 'MediTrack')
                    ->subject('Test Email from MediTrack');
            });

            $this->info("✓ Email sent successfully!");
            return 0;

        } catch (\Exception $e) {
            $this->error('❌ Failed to send email');
            $this->error('Error: ' . $e->getMessage());
            $this->error('File: ' . $e->getFile() . ':' . $e->getLine());
            return 1;
        }
    }
}
