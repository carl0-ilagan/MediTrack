<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // For MySQL, we need to modify the enum
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE med_certs MODIFY status ENUM('pending', 'approved', 'rejected', 'completed', 'no-show') DEFAULT 'pending'");
        } else {
            // For other databases, handle accordingly
            Schema::table('med_certs', function (Blueprint $table) {
                // PostgreSQL and others would need different handling
            });
        }
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE med_certs MODIFY status ENUM('pending', 'approved', 'rejected', 'revoked') DEFAULT 'pending'");
        }
    }
};
