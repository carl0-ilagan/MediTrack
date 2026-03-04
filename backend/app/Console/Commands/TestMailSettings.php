<?php

namespace App\Console\Commands;

use App\Models\MailSetting;
use Illuminate\Console\Command;

class TestMailSettings extends Command
{
    protected $signature = 'mail:test';
    protected $description = 'Test mail settings configuration';

    public function handle()
    {
        $this->info('Checking mail settings...');

        $mailSettings = MailSetting::first();

        if (!$mailSettings) {
            $this->error('❌ No mail settings found in database!');
            $this->info('Please configure mail settings in the admin panel.');
            return 1;
        }

        $this->info('✓ Mail settings found:');
        $this->table(['Field', 'Value'], [
            ['Email', $mailSettings->email],
            ['Host', $mailSettings->host],
            ['Port', $mailSettings->port],
            ['Encryption', $mailSettings->encryption],
            ['Password', '***encrypted***'],
        ]);

        $this->info('');
        $this->info('Mail configuration (from .env):');
        $this->table(['Field', 'Value'], [
            ['MAIL_MAILER', env('MAIL_MAILER', 'log')],
            ['MAIL_HOST', env('MAIL_HOST', 'N/A')],
            ['MAIL_PORT', env('MAIL_PORT', 'N/A')],
            ['MAIL_USERNAME', env('MAIL_USERNAME', 'N/A')],
        ]);

        return 0;
    }
}
