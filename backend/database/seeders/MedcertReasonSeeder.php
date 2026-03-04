<?php

namespace Database\Seeders;

use App\Models\MedcertReason;
use Illuminate\Database\Seeder;

class MedcertReasonSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $reasons = [
            ['reason' => 'Work Absence', 'type' => 'work_absence'],
            ['reason' => 'Medical Leave', 'type' => 'medical_leave'],
            ['reason' => 'Sick Leave', 'type' => 'sick_leave'],
            ['reason' => 'Surgery Recovery', 'type' => 'surgery_recovery'],
            ['reason' => 'Hospitalization', 'type' => 'hospitalization'],
            ['reason' => 'Physical Therapy', 'type' => 'physical_therapy'],
            ['reason' => 'Mental Health Treatment', 'type' => 'mental_health'],
            ['reason' => 'Dental Procedure', 'type' => 'dental_procedure'],
            ['reason' => 'Injury Recovery', 'type' => 'injury_recovery'],
            ['reason' => 'Post-Operative Care', 'type' => 'post_operative'],
        ];

        foreach ($reasons as $data) {
            MedcertReason::firstOrCreate(
                ['reason' => $data['reason']],
                ['type' => $data['type']]
            );
        }

        $this->command->info('Medical certificate reasons seeded successfully!');
    }
}
