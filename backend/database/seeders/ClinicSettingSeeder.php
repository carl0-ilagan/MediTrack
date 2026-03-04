<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ClinicSetting;

class ClinicSettingSeeder extends Seeder
{
    public function run(): void
    {
        ClinicSetting::firstOrCreate(
            ['id' => 1],
            [
                'open_time' => '08:00:00',
                'close_time' => '17:00:00',
                'working_days' => ['mon', 'tue', 'wed', 'thu', 'fri'],
                'appointment_interval' => 30,
            ]
        );

        $this->command->info('Clinic settings initialized successfully!');
    }
}
