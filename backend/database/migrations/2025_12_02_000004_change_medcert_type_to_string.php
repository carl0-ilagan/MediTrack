<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('med_certs', function (Blueprint $table) {
            // Change type column from enum to string to allow any certificate type
            $table->string('type')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('med_certs', function (Blueprint $table) {
            // Revert to enum
            $table->enum('type', ['sick_leave', 'fitness_clearance', 'medical_excuse', 'vaccination', 'other'])->change();
        });
    }
};
