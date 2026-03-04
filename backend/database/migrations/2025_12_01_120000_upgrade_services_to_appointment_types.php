<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('services') && !Schema::hasTable('appointment_types')) {
            Schema::rename('services', 'appointment_types');
        }

        if (Schema::hasTable('appointment_types')) {
            Schema::table('appointment_types', function (Blueprint $table) {
                if (!Schema::hasColumn('appointment_types', 'slug')) {
                    $table->string('slug')->nullable()->after('name');
                }
                if (!Schema::hasColumn('appointment_types', 'description')) {
                    $table->string('description')->nullable()->after('slug');
                }
                if (!Schema::hasColumn('appointment_types', 'is_active')) {
                    $table->boolean('is_active')->default(true)->after('estimated_minutes');
                }
            });
        }

        if (Schema::hasTable('appointments') && !Schema::hasColumn('appointments', 'appointment_type_id')) {
            Schema::table('appointments', function (Blueprint $table) {
                $table->foreignId('appointment_type_id')
                    ->nullable()
                    ->after('type')
                    ->constrained('appointment_types')
                    ->nullOnDelete();
            });
        }

        if (Schema::hasTable('appointments')) {
            DB::statement("ALTER TABLE appointments MODIFY COLUMN type VARCHAR(191) NOT NULL");
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('appointments') && Schema::hasColumn('appointments', 'appointment_type_id')) {
            Schema::table('appointments', function (Blueprint $table) {
                $table->dropForeign(['appointment_type_id']);
                $table->dropColumn('appointment_type_id');
            });
        }

        if (Schema::hasTable('appointment_types')) {
            Schema::table('appointment_types', function (Blueprint $table) {
                if (Schema::hasColumn('appointment_types', 'is_active')) {
                    $table->dropColumn('is_active');
                }
                if (Schema::hasColumn('appointment_types', 'description')) {
                    $table->dropColumn('description');
                }
                if (Schema::hasColumn('appointment_types', 'slug')) {
                    $table->dropColumn('slug');
                }
            });
        }

        if (Schema::hasTable('appointment_types') && !Schema::hasTable('services')) {
            Schema::rename('appointment_types', 'services');
        }
    }
};
