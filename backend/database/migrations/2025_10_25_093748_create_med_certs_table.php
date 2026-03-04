<?php
// database/migrations/2024_01_01_000004_create_med_certs_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('med_certs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->onDelete('cascade');
            $table->foreignId('requested_by')->constrained('users');
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->string('certificate_number')->unique();
            $table->enum('type', ['sick_leave', 'fitness_clearance', 'medical_excuse', 'vaccination', 'other']);
            $table->date('start_date');
            $table->date('end_date');
            $table->integer('duration_days');
            $table->text('medical_reason');
            $table->text('recommendations')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected', 'revoked'])->default('pending');
            $table->text('rejection_reason')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->string('pdf_path')->nullable();
            $table->string('verification_hash')->unique()->nullable();
            $table->string('qr_code_path')->nullable();
            $table->boolean('is_verified')->default(false);
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();

            $table->index(['patient_id', 'status']);
            $table->index('certificate_number');
            $table->index('verification_hash');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('med_certs');
    }
};