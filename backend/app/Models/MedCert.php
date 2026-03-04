<?php
// app/Models/MedCert.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use App\Events\MedCertApproved;
use App\Events\MedCertRejected;

class MedCert extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'requested_by',
        'approved_by',
        'certificate_number',
        'type',
        'start_date',
        'end_date',
        'duration_days',
        'purpose',
        'recommendations',
        'status',
        'rejection_reason',
        'approved_at',
        'pickup_date',
        'revoked_at',
        'pdf_path',
        'verification_hash',
        'qr_code_path',
        'is_verified',
        'verified_at',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'approved_at' => 'datetime',
        'pickup_date' => 'date',
        'revoked_at' => 'datetime',
        'verified_at' => 'datetime',
        'is_verified' => 'boolean',
    ];

    // Relationships
    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    // Append calculated attributes (but don't auto-evaluate them)
    protected $appends = [];

    // Accessors
    public function getIsActiveAttribute()
    {
        return $this->status === 'approved' && 
               $this->start_date && 
               $this->end_date &&
               $this->start_date <= today() && 
               $this->end_date >= today();
    }

    public function getIsExpiredAttribute()
    {
        return $this->end_date && $this->end_date->isPast();
    }

    public function getVerificationUrlAttribute()
    {
        return url("/api/v1/med-certs/{$this->verification_hash}/verify");
    }

    // Methods
    public function generateCertificateNumber()
    {
        $year = now()->year;
        $sequence = self::whereYear('created_at', $year)->count() + 1;
        return "MC-{$year}-" . str_pad($sequence, 6, '0', STR_PAD_LEFT);
    }

    public function generateVerificationHash()
    {
        return Str::uuid()->toString();
    }

    public function approve(User $approver, array $data = [])
    {
        $this->update([
            'status' => 'approved',
            'approved_by' => $approver->id,
            'approved_at' => now(),
            'pickup_date' => $data['pickup_date'] ?? null,
            'recommendations' => $data['recommendations'] ?? $this->recommendations,
            'verification_hash' => $this->generateVerificationHash(),
        ]);

        // Trigger approval notification
        event(new MedCertApproved($this));
    }

    public function reject($reason)
    {
        $this->update([
            'status' => 'rejected',
            'rejection_reason' => $reason,
        ]);

        // Trigger rejection notification
        event(new MedCertRejected($this));
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeActive($query)
    {
        return $query->approved()
                    ->where('start_date', '<=', today())
                    ->where('end_date', '>=', today());
    }
}