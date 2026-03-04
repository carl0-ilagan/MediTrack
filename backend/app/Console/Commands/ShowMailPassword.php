<?php

namespace App\Console\Commands;

use App\Models\MailSetting;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Crypt;

class ShowMailPassword extends Command
{
    protected $signature = 'mail:show-password';
    protected $description = 'Decrypt and display the current mail password';

    public function handle()
    {
        $this->info('📧 Mail Password Decryption');
        $this->info('============================' . "\n");

        $mailSettings = MailSetting::first();

        if (!$mailSettings) {
            $this->error('❌ No mail settings found in database!');
            return 1;
        }

        $this->info('Email: ' . $mailSettings->email);
        $this->info('Host: ' . $mailSettings->host);
        $this->info('Port: ' . $mailSettings->port);
        $this->info('Encryption: ' . $mailSettings->encryption . "\n");

        try {
            $decryptedPassword = Crypt::decryptString($mailSettings->encrypted_password);
            
            $this->info('✓ Decrypted Password:');
            $this->line('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            $this->line($decryptedPassword);
            $this->line('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' . "\n");
            
            $this->info('ℹ️  You can now use this password to update your mail settings.');
            $this->info('If you need to save a new password, use: php artisan mail:update-password');
            
            return 0;
        } catch (\Exception $e) {
            $this->error('❌ Failed to decrypt password!');
            $this->error('Error: ' . $e->getMessage());
            $this->warn('\n⚠️  This usually means the password was encrypted with a different APP_KEY.');
            $this->warn('Solution: Update the password using: php artisan mail:update-password');
            return 1;
        }
    }
}
