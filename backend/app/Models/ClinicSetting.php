<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClinicSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'open_time',
        'close_time',
        'working_days',
        'appointment_interval',
    ];

    protected $casts = [
        'working_days' => 'array',
    ];
}
