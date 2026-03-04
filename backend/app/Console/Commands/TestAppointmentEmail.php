<?php

namespace App\Console\Commands;

use App\Events\AppointmentConfirmed;
use App\Events\AppointmentRejected;
use App\Models\Appointment;
use Illuminate\Console\Command;

class TestAppointmentEmail extends Command
{
    protected $signature = 'test:appointment-email {type : confirmed or rejected}';
    protected $description = 'Test appointment confirmation/rejection email';

    public function handle()
    {
        $type = $this->argument('type');

        // Get a recent appointment with a patient
        $appointment = Appointment::with(['patient.user'])->latest()->first();

        if (!$appointment) {
            $this->error('No appointments found in database');
            return 1;
        }

        $patientEmail = $appointment->patient?->user?->email;
        if (!$patientEmail) {
            $this->error('No patient email found for this appointment');
            return 1;
        }

        $this->info("Testing appointment $type email");
        $this->info("Appointment ID: {$appointment->id}");
        $this->info("Patient Email: {$patientEmail}");
        $this->info("Appointment Type: {$appointment->appointmentType?->name}");
        $this->info("Date: " . $appointment->start_time);

        try {
            if ($type === 'confirmed') {
                $this->info("\nDispatching AppointmentConfirmed event...");
                AppointmentConfirmed::dispatch($appointment);
                $this->info("✓ Event dispatched successfully!");
            } elseif ($type === 'rejected') {
                // Simulate a rejection reason
                if (!$appointment->cancellation_reason) {
                    $appointment->update(['cancellation_reason' => 'Time slot no longer available']);
                }
                $this->info("\nDispatching AppointmentRejected event...");
                AppointmentRejected::dispatch($appointment);
                $this->info("✓ Event dispatched successfully!");
            } else {
                $this->error("Invalid type. Use 'confirmed' or 'rejected'");
                return 1;
            }

            $this->info("\nEmail should be sent to: {$patientEmail}");
            return 0;
        } catch (\Exception $e) {
            $this->error('Error: ' . $e->getMessage());
            return 1;
        }
    }
}
