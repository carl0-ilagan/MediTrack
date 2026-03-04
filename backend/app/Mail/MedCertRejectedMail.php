<?php

namespace App\Mail;

use App\Models\MedCert;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class MedCertRejectedMail extends Mailable
{
    use Queueable, SerializesModels;

    public MedCert $medCert;

    public function __construct(MedCert $medCert)
    {
        $this->medCert = $medCert;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Medical Certificate Request Has Been Rejected',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.medcert-rejected',
            with: [
                'medCert' => $this->medCert,
                'patientName' => $this->medCert->patient?->user?->name ?? 'Patient',
                'reason' => $this->medCert->rejection_reason ?? 'No specific reason provided.',
            ],
        );
    }
}
