<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('appointment_types')) {
            return;
        }

        Schema::table('appointment_types', function (Blueprint $table) {
            if (!Schema::hasColumn('appointment_types', 'available_from')) {
                $table->date('available_from')->nullable()->after('is_active');
            }
            if (!Schema::hasColumn('appointment_types', 'available_until')) {
                $table->date('available_until')->nullable()->after('available_from');
            }
            if (!Schema::hasColumn('appointment_types', 'available_days')) {
                $table->json('available_days')->nullable()->after('available_until');
            }
            if (!Schema::hasColumn('appointment_types', 'available_start_time')) {
                $table->time('available_start_time')->nullable()->after('available_days');
            }
            if (!Schema::hasColumn('appointment_types', 'available_end_time')) {
                $table->time('available_end_time')->nullable()->after('available_start_time');
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('appointment_types')) {
            return;
        }

        Schema::table('appointment_types', function (Blueprint $table) {
            if (Schema::hasColumn('appointment_types', 'available_end_time')) {
                $table->dropColumn('available_end_time');
            }
            if (Schema::hasColumn('appointment_types', 'available_start_time')) {
                $table->dropColumn('available_start_time');
            }
            if (Schema::hasColumn('appointment_types', 'available_days')) {
                $table->dropColumn('available_days');
            }
            if (Schema::hasColumn('appointment_types', 'available_until')) {
                $table->dropColumn('available_until');
            }
            if (Schema::hasColumn('appointment_types', 'available_from')) {
                $table->dropColumn('available_from');
            }
        });
    }
};
