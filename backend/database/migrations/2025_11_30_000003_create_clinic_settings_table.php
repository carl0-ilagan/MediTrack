<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('clinic_settings', function (Blueprint $table) {
            $table->id();
            $table->time('open_time')->nullable()->default('08:00:00');
            $table->time('close_time')->nullable()->default('17:00:00');
            $table->json('working_days')->nullable()->comment('Array of weekdays e.g. ["mon","tue"]');
            $table->integer('appointment_interval')->nullable()->default(15);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinic_settings');
    }
};
