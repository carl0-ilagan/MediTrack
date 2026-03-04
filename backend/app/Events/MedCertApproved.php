<?php
// app/Events/MedCertApproved.php
namespace App\Events;

use App\Models\MedCert;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MedCertApproved
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $medCert;

    public function __construct(MedCert $medCert)
    {
        $this->medCert = $medCert;
    }
}