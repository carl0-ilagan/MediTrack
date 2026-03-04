<?php
// app/Models/Appointment.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Appointment extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'clinician_id',
        'title',
        'description',
        'start_time',
        'end_time',
        'status',
        'type',
        'location',
        'notes',
        'cancellation_reason',
        'reminder_sent_24h',
        'reminder_sent_1h',
        'appointment_type_id',
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'reminder_sent_24h' => 'boolean',
        'reminder_sent_1h' => 'boolean',
        'appointment_type_id' => 'integer',
    ];

    // Relationships
    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function clinician()
    {
        return $this->belongsTo(User::class, 'clinician_id');
    }

    public function appointmentType()
    {
        return $this->belongsTo(AppointmentType::class);
    }

    // Accessors
    public function getDurationAttribute()
    {
        return $this->start_time->diffInMinutes($this->end_time);
    }

    public function getIsUpcomingAttribute()
    {
        return $this->start_time->isFuture() && in_array($this->status, ['scheduled', 'confirmed']);
    }

    public function getIsPastAttribute()
    {
        return $this->end_time->isPast();
    }

    public function getIsCancellableAttribute()
    {
        return $this->is_upcoming && $this->start_time->diffInHours(now()) > 2;
    }

    // Methods
    public function conflictsWith($startTime, $endTime, $clinicianId = null, $ignoreId = null)
    {
        $query = self::where(function ($q) use ($startTime, $endTime) {
            $q->whereBetween('start_time', [$startTime, $endTime])
              ->orWhereBetween('end_time', [$startTime, $endTime])
              ->orWhere(function ($q) use ($startTime, $endTime) {
                  $q->where('start_time', '<=', $startTime)
                    ->where('end_time', '>=', $endTime);
              });
        })->whereIn('status', ['scheduled', 'confirmed']);

        if ($clinicianId) {
            $query->where('clinician_id', $clinicianId);
        }

        if ($ignoreId) {
            $query->where('id', '!=', $ignoreId);
        }

        return $query->exists();
    }

    // Scopes
    public function scopeUpcoming($query)
    {
        return $query->where('start_time', '>', now())
                    ->whereIn('status', ['scheduled', 'confirmed']);
    }

    public function scopeToday($query)
    {
        return $query->whereDate('start_time', today());
    }

    public function scopeForClinician($query, $clinicianId)
    {
        return $query->where('clinician_id', $clinicianId);
    }

    public function scopeForPatient($query, $patientId)
    {
        return $query->where('patient_id', $patientId);
    }

    public function scopeInRange($query, $start, $end)
    {
        return $query->whereBetween('start_time', [$start, $end]);
    }
}