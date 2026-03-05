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
                'brand_name' => 'Clinic and Laboratory',
                'brand_short_name' => 'Clinic Lab',
                'system_title' => 'Clinic and Laboratory System',
                'system_subtitle' => 'University Health Services',
                'brand_logo_path' => null,
                'footer_description' => 'Modern healthcare management for better care and operations.',
                'contact_email' => 'clinic@university.edu',
                'contact_phone' => '(123) 456-7890',
            ]
        );

        $this->command->info('Clinic settings initialized successfully!');
    }
}
