<?php

namespace App\Mail;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AppointmentRejectedMail extends Mailable
{
    use Queueable, SerializesModels;

    public Appointment $appointment;

    public function __construct(Appointment $appointment)
    {
        $this->appointment = $appointment;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Appointment Request has been Rejected',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.appointment-rejected',
            with: [
                'appointment' => $this->appointment,
                'patientName' => $this->appointment->patient?->user?->name ?? 'Patient',
                'appointmentType' => $this->appointment->appointmentType?->name ?? $this->appointment->type ?? 'Appointment',
                'appointmentDate' => \Carbon\Carbon::parse($this->appointment->start_time)->format('l, F j, Y'),
                'appointmentTime' => \Carbon\Carbon::parse($this->appointment->start_time)->format('h:i A'),
                'rejectionReason' => $this->appointment->cancellation_reason ?? 'No reason provided',
            ]
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
