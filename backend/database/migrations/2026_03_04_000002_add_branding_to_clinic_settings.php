<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('clinic_settings')) {
            return;
        }

        Schema::table('clinic_settings', function (Blueprint $table) {
            if (!Schema::hasColumn('clinic_settings', 'brand_name')) {
                $table->string('brand_name', 191)->nullable()->after('appointment_interval');
            }
            if (!Schema::hasColumn('clinic_settings', 'brand_short_name')) {
                $table->string('brand_short_name', 100)->nullable()->after('brand_name');
            }
            if (!Schema::hasColumn('clinic_settings', 'system_title')) {
                $table->string('system_title', 191)->nullable()->after('brand_short_name');
            }
            if (!Schema::hasColumn('clinic_settings', 'system_subtitle')) {
                $table->string('system_subtitle', 191)->nullable()->after('system_title');
            }
            if (!Schema::hasColumn('clinic_settings', 'brand_logo_path')) {
                $table->string('brand_logo_path', 255)->nullable()->after('system_subtitle');
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('clinic_settings')) {
            return;
        }

        Schema::table('clinic_settings', function (Blueprint $table) {
            if (Schema::hasColumn('clinic_settings', 'brand_logo_path')) {
                $table->dropColumn('brand_logo_path');
            }
            if (Schema::hasColumn('clinic_settings', 'system_subtitle')) {
                $table->dropColumn('system_subtitle');
            }
            if (Schema::hasColumn('clinic_settings', 'system_title')) {
                $table->dropColumn('system_title');
            }
            if (Schema::hasColumn('clinic_settings', 'brand_short_name')) {
                $table->dropColumn('brand_short_name');
            }
            if (Schema::hasColumn('clinic_settings', 'brand_name')) {
                $table->dropColumn('brand_name');
            }
        });
    }
};
