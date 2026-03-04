<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('appointment_types')) {
            return;
        }

        Schema::table('appointment_types', function (Blueprint $table) {
            if (!Schema::hasColumn('appointment_types', 'category')) {
                $table->string('category', 100)->nullable()->after('name');
            }
        });

        $categoryMap = [
            'Hematology' => [
                'CBC with Platelet',
                'ABO Blood Typing',
                'Prothrombin Time',
                'aPPT',
            ],
            'Microscopy' => [
                'Urinalysis',
                'Fecalysis',
                'Fecal Occult Blood Test',
                'Pregnancy Test',
                'Gram Stain',
                'KOH',
            ],
            'Serology' => [
                'Hepa B Screening',
                'Syphilis',
                'Typhi Dot',
                'COVID-19 ANTIGEN',
                'HIV',
                'NS1',
                'Dengue Duo',
            ],
        ];

        foreach ($categoryMap as $category => $names) {
            DB::table('appointment_types')
                ->whereIn('name', $names)
                ->update(['category' => $category]);
        }

        DB::table('appointment_types')
            ->whereNull('category')
            ->update(['category' => 'Chemistry']);
    }

    public function down(): void
    {
        if (!Schema::hasTable('appointment_types')) {
            return;
        }

        Schema::table('appointment_types', function (Blueprint $table) {
            if (Schema::hasColumn('appointment_types', 'category')) {
                $table->dropColumn('category');
            }
        });
    }
};
