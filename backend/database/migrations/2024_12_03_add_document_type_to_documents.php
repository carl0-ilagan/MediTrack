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
        // Guard against out-of-order migrations in existing environments.
        if (!Schema::hasTable('documents') || !Schema::hasTable('document_types')) {
            return;
        }

        if (!Schema::hasColumn('documents', 'document_type_id')) {
            Schema::table('documents', function (Blueprint $table) {
                $table->foreignId('document_type_id')->nullable()->constrained('document_types')->onDelete('set null');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('documents') || !Schema::hasColumn('documents', 'document_type_id')) {
            return;
        }

        Schema::table('documents', function (Blueprint $table) {
            $table->dropConstrainedForeignId('document_type_id');
        });
    }
};
