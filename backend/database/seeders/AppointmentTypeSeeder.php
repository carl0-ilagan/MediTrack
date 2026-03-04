<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AppointmentType;

class AppointmentTypeSeeder extends Seeder
{
    private function inferCategory(string $name): string
    {
        $hematology = [
            'CBC with Platelet',
            'ABO Blood Typing',
            'Prothrombin Time',
            'aPPT',
        ];

        $microscopy = [
            'Urinalysis',
            'Fecalysis',
            'Fecal Occult Blood Test',
            'Pregnancy Test',
            'Gram Stain',
            'KOH',
        ];

        $serology = [
            'Hepa B Screening',
            'Syphilis',
            'Typhi Dot',
            'COVID-19 ANTIGEN',
            'HIV',
            'NS1',
            'Dengue Duo',
        ];

        if (in_array($name, $hematology, true)) {
            return 'Hematology';
        }

        if (in_array($name, $microscopy, true)) {
            return 'Microscopy';
        }

        if (in_array($name, $serology, true)) {
            return 'Serology';
        }

        return 'Chemistry';
    }

    public function run(): void
    {
        // Based on provided hospital laboratory price list.
        $types = [
            [
                'name' => 'CBC with Platelet',
                'description' => 'Laboratory service',
                'estimated_minutes' => 30,
                'price' => 550.00,
                'is_active' => true,
            ],
            [
                'name' => 'Urinalysis',
                'description' => 'Laboratory service',
                'estimated_minutes' => 30,
                'price' => 150.00,
                'is_active' => true,
            ],
            [
                'name' => 'Pregnancy Test',
                'description' => 'Laboratory service',
                'estimated_minutes' => 30,
                'price' => 100.00,
                'is_active' => true,
            ],
            [
                'name' => 'Fecalysis',
                'description' => 'Laboratory service',
                'estimated_minutes' => 30,
                'price' => 150.00,
                'is_active' => true,
            ],
            [
                'name' => 'Fecal Occult Blood Test',
                'description' => 'Laboratory service',
                'estimated_minutes' => 30,
                'price' => 250.00,
                'is_active' => true,
            ],
            [
                'name' => 'Hepa B Screening',
                'description' => 'Laboratory service',
                'estimated_minutes' => 30,
                'price' => 250.00,
                'is_active' => true,
            ],
            [
                'name' => 'Syphilis',
                'description' => 'Laboratory service',
                'estimated_minutes' => 30,
                'price' => 250.00,
                'is_active' => true,
            ],
            [
                'name' => 'Typhi Dot',
                'description' => 'Laboratory service',
                'estimated_minutes' => 30,
                'price' => 700.00,
                'is_active' => true,
            ],
            [
                'name' => 'FBS/RBS',
                'description' => 'Laboratory service',
                'estimated_minutes' => 30,
                'price' => 150.00,
                'is_active' => true,
            ],
            [
                'name' => 'Triglycerides',
                'description' => 'Laboratory service',
                'estimated_minutes' => 30,
                'price' => 160.00,
                'is_active' => true,
            ],
            [
                'name' => 'Cholesterol',
                'description' => 'Laboratory service',
                'estimated_minutes' => 30,
                'price' => 300.00,
                'is_active' => true,
            ],
            [
                'name' => 'BUN',
                'description' => 'Laboratory service',
                'estimated_minutes' => 30,
                'price' => 200.00,
                'is_active' => true,
            ],
            [
                'name' => 'Uric Acid',
                'description' => 'Laboratory service',
                'estimated_minutes' => 30,
                'price' => 160.00,
                'is_active' => true,
            ],
            [
                'name' => 'Serum Creatinine',
                'description' => 'Laboratory service',
                'estimated_minutes' => 30,
                'price' => 300.00,
                'is_active' => true,
            ],
            [
                'name' => 'SGPT',
                'description' => 'Laboratory service',
                'estimated_minutes' => 30,
                'price' => 160.00,
                'is_active' => true,
            ],
            [
                'name' => 'SGOT',
                'description' => 'Laboratory service',
                'estimated_minutes' => 30,
                'price' => 160.00,
                'is_active' => true,
            ],
            [
                'name' => 'ABO Blood Typing',
                'description' => 'Laboratory service',
                'estimated_minutes' => 30,
                'price' => 160.00,
                'is_active' => true,
            ],
            [
                'name' => 'HDL',
                'description' => 'Laboratory service',
                'estimated_minutes' => 30,
                'price' => 150.00,
                'is_active' => true,
            ],
            [
                'name' => 'COVID-19 ANTIGEN',
                'description' => 'Laboratory service',
                'estimated_minutes' => 30,
                'price' => 160.00,
                'is_active' => true,
            ],
            [
                'name' => 'LIPID PROFILE',
                'description' => 'Laboratory service',
                'estimated_minutes' => 30,
                'price' => 700.00,
                'is_active' => true,
            ],
            [
                'name' => 'CHEM10',
                'description' => 'Laboratory service',
                'estimated_minutes' => 30,
                'price' => 600.00,
                'is_active' => true,
            ],
            [
                'name' => 'Serum Electrolytes',
                'description' => 'Laboratory service',
                'estimated_minutes' => 30,
                'price' => 1910.00,
                'is_active' => true,
            ],
            [
                'name' => 'Gram Stain',
                'description' => 'Laboratory service',
                'estimated_minutes' => 30,
                'price' => 1000.00,
                'is_active' => true,
            ],
            [
                'name' => 'HIV',
                'description' => 'Laboratory service',
                'estimated_minutes' => 30,
                'price' => 500.00,
                'is_active' => true,
            ],
            [
                'name' => 'KOH',
                'description' => 'Laboratory service',
                'estimated_minutes' => 30,
                'price' => 500.00,
                'is_active' => true,
            ],
            [
                'name' => 'Prothrombin Time',
                'description' => 'Laboratory service',
                'estimated_minutes' => 30,
                'price' => 150.00,
                'is_active' => true,
            ],
            [
                'name' => 'aPPT',
                'description' => 'Laboratory service',
                'estimated_minutes' => 30,
                'price' => 700.00,
                'is_active' => true,
            ],
            [
                'name' => 'NS1',
                'description' => 'Laboratory service',
                'estimated_minutes' => 30,
                'price' => 700.00,
                'is_active' => true,
            ],
            [
                'name' => 'Dengue Duo',
                'description' => 'Laboratory service',
                'estimated_minutes' => 30,
                'price' => 1500.00,
                'is_active' => true,
            ],
        ];

        foreach ($types as $type) {
            if (empty($type['category'])) {
                $type['category'] = $this->inferCategory($type['name']);
            }

            AppointmentType::updateOrCreate(
                ['name' => $type['name']],
                $type
            );
        }

        $this->command->info('Appointment types seeded successfully!');
    }
}
