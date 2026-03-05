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
        'brand_name',
        'brand_short_name',
        'system_title',
        'system_subtitle',
        'brand_logo_path',
        'footer_description',
        'contact_email',
        'contact_phone',
    ];

    protected $casts = [
        'working_days' => 'array',
    ];
}
