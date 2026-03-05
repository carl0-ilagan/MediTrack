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
            if (!Schema::hasColumn('clinic_settings', 'footer_description')) {
                $table->string('footer_description', 255)->nullable()->after('brand_logo_path');
            }
            if (!Schema::hasColumn('clinic_settings', 'contact_email')) {
                $table->string('contact_email', 191)->nullable()->after('footer_description');
            }
            if (!Schema::hasColumn('clinic_settings', 'contact_phone')) {
                $table->string('contact_phone', 50)->nullable()->after('contact_email');
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('clinic_settings')) {
            return;
        }

        Schema::table('clinic_settings', function (Blueprint $table) {
            if (Schema::hasColumn('clinic_settings', 'contact_phone')) {
                $table->dropColumn('contact_phone');
            }
            if (Schema::hasColumn('clinic_settings', 'contact_email')) {
                $table->dropColumn('contact_email');
            }
            if (Schema::hasColumn('clinic_settings', 'footer_description')) {
                $table->dropColumn('footer_description');
            }
        });
    }
};
