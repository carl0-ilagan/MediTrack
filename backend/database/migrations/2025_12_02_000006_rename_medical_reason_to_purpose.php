<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('med_certs', function (Blueprint $table) {
            $table->renameColumn('medical_reason', 'purpose');
        });
    }

    public function down(): void
    {
        Schema::table('med_certs', function (Blueprint $table) {
            $table->renameColumn('purpose', 'medical_reason');
        });
    }
};
