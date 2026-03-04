<?php

namespace App\Console\Commands;

use App\Models\MailSetting;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Crypt;

class UpdateMailPassword extends Command
{
    protected $signature = 'mail:update-password';
    protected $description = 'Update the mail password (encrypted storage)';

    public function handle()
    {
        $this->info('📧 Update Mail Password');
        $this->info('======================' . "\n");

        $mailSettings = MailSetting::first();

        if (!$mailSettings) {
            $this->error('❌ No mail settings found in database!');
            $this->info('Please configure mail settings in the admin panel first.');
            return 1;
        }

        $this->info('Current Email: ' . $mailSettings->email . "\n");

        $newPassword = $this->secret('Enter the new app password (input will be hidden)');

        if (empty($newPassword)) {
            $this->error('❌ Password cannot be empty!');
            return 1;
        }

        $confirmPassword = $this->secret('Confirm the password (input will be hidden)');

        if ($newPassword !== $confirmPassword) {
            $this->error('❌ Passwords do not match!');
            return 1;
        }

        try {
            // Encrypt the new password
            $encryptedPassword = Crypt::encryptString($newPassword);

            // Update in database
            $mailSettings->update([
                'encrypted_password' => $encryptedPassword,
            ]);

            $this->info("\n✓ Password updated successfully!");
            $this->info('✓ Password has been encrypted and saved to the database.');
            
            return 0;
        } catch (\Exception $e) {
            $this->error('❌ Failed to update password!');
            $this->error('Error: ' . $e->getMessage());
            return 1;
        }
    }
}
