<?php

namespace App\Console\Commands;

use App\Models\MailSetting;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Crypt;

class UpdateMailCredentials extends Command
{
    protected $signature = 'mail:update-credentials';
    protected $description = 'Update mail credentials with proper encryption';

    public function handle()
    {
        $this->info('📧 Update Mail Credentials');
        $this->info('=========================' . "\n");

        // Get current settings
        $mailSettings = MailSetting::first();

        if (!$mailSettings) {
            $this->error('❌ No mail settings found. Creating new ones...');
            $mailSettings = new MailSetting();
        }

        // Prompt for email
        $email = $this->ask('Email address', $mailSettings->email ?? '');
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error('❌ Invalid email address!');
            return 1;
        }

        // Prompt for app password
        $this->warn('⚠️  For Gmail, you need an App Password (not your regular password)');
        $this->info('Generate one at: https://myaccount.google.com/apppasswords');
        $appPassword = $this->secret('App Password (will be encrypted)');

        if (empty($appPassword)) {
            $this->error('❌ App password cannot be empty!');
            return 1;
        }

        // Prompt for other settings
        $host = $this->ask('SMTP Host', $mailSettings->host ?? 'smtp.gmail.com');
        $port = $this->ask('SMTP Port', $mailSettings->port ?? '587');
        $encryption = $this->ask('Encryption (tls/ssl)', $mailSettings->encryption ?? 'tls');

        // Validate
        if (!in_array($encryption, ['tls', 'ssl', 'none'])) {
            $this->error('❌ Invalid encryption type!');
            return 1;
        }

        try {
            // Update or create
            $mailSettings->email = $email;
            $mailSettings->host = $host;
            $mailSettings->port = (int)$port;
            $mailSettings->encryption = $encryption;
            $mailSettings->encrypted_password = Crypt::encryptString($appPassword);
            $mailSettings->save();

            $this->info("\n✓ Mail credentials updated successfully!");
            $this->table(['Setting', 'Value'], [
                ['Email', $email],
                ['Host', $host],
                ['Port', $port],
                ['Encryption', $encryption],
                ['Password', '***encrypted***'],
            ]);

            $this->info("\n💡 Tip: Test with: php artisan mail:send-test your-email@example.com");
            return 0;

        } catch (\Exception $e) {
            $this->error('❌ Failed to update credentials: ' . $e->getMessage());
            return 1;
        }
    }
}
