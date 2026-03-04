<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Seed default medical certificate types if table is empty
        $count = DB::table('medcert_reasons')->count();
        if ($count === 0) {
            $types = [
                ['reason' => 'Sick Leave Certificate', 'type' => 'Sick Leave Certificate'],
                ['reason' => 'Fitness Certificate', 'type' => 'Fitness Certificate'],
                ['reason' => 'General Medical Certificate', 'type' => 'General Medical Certificate'],
                ['reason' => 'Vaccination Certificate', 'type' => 'Vaccination Certificate'],
                ['reason' => 'Medical Clearance', 'type' => 'Medical Clearance'],
            ];

            foreach ($types as $data) {
                DB::table('medcert_reasons')->insert(array_merge($data, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ]));
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Optional: Remove seeded types on rollback
        DB::table('medcert_reasons')->truncate();
    }
};

