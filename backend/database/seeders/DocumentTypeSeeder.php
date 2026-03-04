<?php

namespace Database\Seeders;

use App\Models\DocumentType;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DocumentTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $types = [
            ['name' => 'Lab Results', 'is_active' => true],
            ['name' => 'Prescription', 'is_active' => true],
            ['name' => 'Insurance Card', 'is_active' => true],
            ['name' => 'Medical Report', 'is_active' => true],
            ['name' => 'X-Ray/Imaging', 'is_active' => true],
            ['name' => 'Vaccination Records', 'is_active' => true],
        ];

        foreach ($types as $type) {
            DocumentType::firstOrCreate(
                ['name' => $type['name']],
                $type
            );
        }
    }
}
