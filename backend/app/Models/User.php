<?php
// app/Models/User.php
namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string|null $phone
 * @property \Illuminate\Support\Carbon|null $date_of_birth
 * @property bool $is_active
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read Patient|null $patient
 * @property-read \Illuminate\Database\Eloquent\Collection|\Spatie\Permission\Models\Role[] $roles
 * @method \Illuminate\Database\Eloquent\Builder load($relations)
 * @method \Illuminate\Database\Eloquent\Builder with($relations)
 * @method bool save(array $options = [])
 * @method static \Illuminate\Database\Eloquent\Builder create(array $attributes = [])
 * @method \Illuminate\Database\Eloquent\Relations\HasOne patient()
 * @method \Illuminate\Database\Eloquent\Relations\BelongsToMany roles()
 */
class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles;

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'date_of_birth',
        'address',
        'emergency_contact',
        'profile_photo_path',
        'email_verified_at',
        'last_login_at',
        'last_login_ip',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_recovery_codes',
        'two_factor_secret',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'last_login_at' => 'datetime',
        'date_of_birth' => 'date',
        'emergency_contact' => 'array',
        'is_active' => 'boolean',
    ];

    protected $appends = [
        'profile_photo_url',
    ];

    // Relationships
    public function patient()
    {
        return $this->hasOne(Patient::class);
    }

    public function appointmentsAsPatient()
    {
        return $this->hasMany(Appointment::class, 'patient_id');
    }

    public function appointmentsAsClinician()
    {
        return $this->hasMany(Appointment::class, 'clinician_id');
    }

    public function uploadedDocuments()
    {
        return $this->hasMany(Document::class, 'uploaded_by');
    }

    public function medCertsRequested()
    {
        return $this->hasMany(MedCert::class, 'requested_by');
    }

    public function medCertsApproved()
    {
        return $this->hasMany(MedCert::class, 'approved_by');
    }

    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class);
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    // Scopes
    public function scopeClinicians($query)
    {
        return $query->whereHas('roles', function ($q) {
            $q->where('name', 'clinician');
        });
    }

    public function scopePatients($query)
    {
        return $query->whereHas('roles', function ($q) {
            $q->where('name', 'patient');
        });
    }

    public function scopeAdmins($query)
    {
        return $query->whereHas('roles', function ($q) {
            $q->where('name', 'admin');
        });
    }

    // Helpers
    public function isPatient(): bool
    {
        return $this->hasRole('patient');
    }

    public function isClinician(): bool
    {
        return $this->hasRole('clinician') || $this->hasRole('admin');
    }

    public function isAdmin(): bool
    {
        return $this->hasRole('admin');
    }

    public function getProfilePhotoUrlAttribute()
    {
        return $this->profile_photo_path
            ? asset('storage/'.$this->profile_photo_path)
            : $this->defaultProfilePhotoUrl();
    }

    protected function defaultProfilePhotoUrl()
    {
        $name = trim(collect(explode(' ', $this->name))->map(function ($segment) {
            return mb_substr($segment, 0, 1);
        })->join(' '));

        return 'https://ui-avatars.com/api/?name='.urlencode($name).'&color=005C2B&background=E8C439';
    }
}