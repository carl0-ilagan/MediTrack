<?php

namespace App\Console\Commands;

use App\Models\MailSetting;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Crypt;

class DiagnosticMailSettings extends Command
{
    protected $signature = 'mail:diagnostic';
    protected $description = 'Diagnose mail settings and test SMTP connection';

    public function handle()
    {
        $this->info('📧 Mail Settings Diagnostic Tool');
        $this->info('=================================' . "\n");

        $mailSettings = MailSetting::first();

        if (!$mailSettings) {
            $this->error('❌ No mail settings found in database!');
            return 1;
        }

        // Display settings
        $this->info('✓ Settings in Database:');
        $this->table(['Field', 'Value'], [
            ['Email', $mailSettings->email],
            ['Host', $mailSettings->host],
            ['Port', $mailSettings->port],
            ['Encryption', $mailSettings->encryption],
        ]);

        // Try to decrypt password
        try {
            $decryptedPassword = Crypt::decryptString($mailSettings->encrypted_password);
            $this->info("\n✓ Password decrypted successfully");
            $this->info('  Password length: ' . strlen($decryptedPassword) . ' characters');
            
            if (strlen($decryptedPassword) < 5) {
                $this->warn('⚠️  WARNING: Password seems too short!');
            }
        } catch (\Exception $e) {
            $this->error('❌ Failed to decrypt password: ' . $e->getMessage());
            return 1;
        }

        // Check environment variables
        $this->info("\n✓ .env Mail Configuration:");
        $this->table(['Variable', 'Value'], [
            ['MAIL_MAILER', env('MAIL_MAILER')],
            ['MAIL_HOST', env('MAIL_HOST')],
            ['MAIL_PORT', env('MAIL_PORT')],
            ['MAIL_USERNAME', env('MAIL_USERNAME')],
            ['MAIL_ENCRYPTION', env('MAIL_ENCRYPTION')],
        ]);

        // Test SMTP connection
        $this->info("\n🔌 Testing SMTP Connection...");
        
        try {
            $transport = (new \Swift_SmtpTransport(
                $mailSettings->host,
                $mailSettings->port,
                $mailSettings->encryption
            ))
                ->setUsername($mailSettings->email)
                ->setPassword($decryptedPassword);

            $mailer = new \Swift_Mailer($transport);
            $transport->start();
            
            $this->info("✓ SMTP connection successful!");
            
            // Try to send test email
            $message = (new \Swift_Message('Test Email from MediTrack'))
                ->setFrom([$mailSettings->email => 'MediTrack Clinic'])
                ->setTo($mailSettings->email)
                ->setBody('This is a test email from the MediTrack diagnostic tool.');

            $result = $mailer->send($message);
            
            if ($result) {
                $this->info("✓ Test email sent successfully!");
            } else {
                $this->warn("⚠️  Email preparation failed");
            }
            
            $transport->stop();
        } catch (\Exception $e) {
            $this->error('❌ SMTP connection failed: ' . $e->getMessage());
            return 1;
        }

        $this->info("\n✓ All diagnostics completed!");
        return 0;
    }
}
