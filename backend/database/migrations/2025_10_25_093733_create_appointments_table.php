<?php
// database/migrations/2024_01_01_000003_create_appointments_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->onDelete('cascade');
            $table->foreignId('clinician_id')->constrained('users');
            $table->string('title');
            $table->text('description')->nullable();
            // Nullable avoids invalid TIMESTAMP defaults on older MySQL/MariaDB.
            $table->timestamp('start_time')->nullable();
            $table->timestamp('end_time')->nullable();
            $table->enum('status', ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'])->default('scheduled');
            $table->enum('type', ['checkup', 'consultation', 'emergency', 'follow_up', 'vaccination', 'other']);
            $table->string('location')->nullable();
            $table->text('notes')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->boolean('reminder_sent_24h')->default(false);
            $table->boolean('reminder_sent_1h')->default(false);
            $table->timestamps();

            $table->index(['clinician_id', 'start_time']);
            $table->index(['patient_id', 'start_time']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};