<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        if (!Schema::hasTable('clinic_settings') || Schema::hasColumn('clinic_settings', 'appointment_interval')) {
            return;
        }

        Schema::table('clinic_settings', function (Blueprint $table) {
            $table->integer('appointment_interval')->nullable()->default(15)->after('working_days');
        });
    }

    public function down()
    {
        if (!Schema::hasTable('clinic_settings') || !Schema::hasColumn('clinic_settings', 'appointment_interval')) {
            return;
        }

        Schema::table('clinic_settings', function (Blueprint $table) {
            $table->dropColumn('appointment_interval');
        });
    }
};
