<?php
// app/Models/Patient.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Patient extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'student_number',
        'program',
        'program_end_year',
        'date_of_birth',
        'phone',
        'address',
        'emergency_contact',
        'allergies',
        'medical_notes',
        'blood_type',
        'insurance_provider',
        'insurance_number',
        'is_active',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'emergency_contact' => 'array',
        'allergies' => 'array',
        'program_end_year' => 'integer',
        'is_active' => 'boolean',
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function documents()
    {
        return $this->hasMany(Document::class);
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }

    public function medCerts()
    {
        return $this->hasMany(MedCert::class);
    }

    // Accessors
    public function getAgeAttribute()
    {
        return $this->date_of_birth?->age;
    }

    public function getFullNameAttribute()
    {
        return $this->user->name;
    }

    public function getEmailAttribute()
    {
        return $this->user->email;
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeWithUpcomingAppointments($query)
    {
        return $query->whereHas('appointments', function ($q) {
            $q->where('start_time', '>', now())
              ->whereIn('status', ['scheduled', 'confirmed']);
        });
    }
}