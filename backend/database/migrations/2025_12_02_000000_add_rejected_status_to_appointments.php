<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // For MySQL, we need to modify the enum column
        DB::statement("ALTER TABLE appointments MODIFY status ENUM('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rejected', 'no_show') DEFAULT 'scheduled'");
    }

    public function down(): void
    {
        // Revert back to original enum without rejected
        DB::statement("ALTER TABLE appointments MODIFY status ENUM('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show') DEFAULT 'scheduled'");
    }
};
