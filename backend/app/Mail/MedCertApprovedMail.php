<?php

namespace App\Mail;

use App\Models\MedCert;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class MedCertApprovedMail extends Mailable
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
            subject: 'Your Medical Certificate Request Has Been Approved',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.medcert-approved',
            with: [
                'medCert' => $this->medCert,
                'patientName' => $this->medCert->patient?->user?->name ?? 'Patient',
                'pickupDate' => $this->medCert->pickup_date ? \Carbon\Carbon::parse($this->medCert->pickup_date)->format('F j, Y') : 'TBD',
            ],
        );
    }
}
