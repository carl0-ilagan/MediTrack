<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropForeign(['clinician_id']);
        });

        DB::statement('ALTER TABLE appointments MODIFY clinician_id BIGINT UNSIGNED NULL');

        Schema::table('appointments', function (Blueprint $table) {
            $table->foreign('clinician_id')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropForeign(['clinician_id']);
        });

        DB::statement('ALTER TABLE appointments MODIFY clinician_id BIGINT UNSIGNED NOT NULL');

        Schema::table('appointments', function (Blueprint $table) {
            $table->foreign('clinician_id')
                ->references('id')
                ->on('users');
        });
    }
};
