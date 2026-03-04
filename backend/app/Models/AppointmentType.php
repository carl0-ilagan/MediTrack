<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use Carbon\Carbon;

class AppointmentType extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'category',
        'slug',
        'description',
        'estimated_minutes',
        'price',
        'is_active',
        'available_from',
        'available_until',
        'available_days',
        'available_start_time',
        'available_end_time',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'price' => 'decimal:2',
        'available_from' => 'date',
        'available_until' => 'date',
        'available_days' => 'array',
    ];

    protected static function booted(): void
    {
        static::saving(function (AppointmentType $type) {
            if (empty($type->slug)) {
                $type->slug = Str::slug($type->name);
            }
        });
    }

    public function isAvailableAt(Carbon $start, ?Carbon $end = null): bool
    {
        if (!$this->is_active) {
            return false;
        }

        $end = $end ?: $start->copy()->addMinutes((int) ($this->estimated_minutes ?: 30));

        if ($this->available_from && $start->toDateString() < $this->available_from->toDateString()) {
            return false;
        }

        if ($this->available_until && $start->toDateString() > $this->available_until->toDateString()) {
            return false;
        }

        $days = is_array($this->available_days) ? $this->available_days : [];
        if (!empty($days)) {
            $dayKey = strtolower(substr($start->format('D'), 0, 3));
            if (!in_array($dayKey, $days, true)) {
                return false;
            }
        }

        if ($this->available_start_time && $this->available_end_time) {
            $date = $start->toDateString();
            $windowStart = Carbon::parse($date.' '.$this->available_start_time);
            $windowEnd = Carbon::parse($date.' '.$this->available_end_time);
            if ($start->lt($windowStart) || $end->gt($windowEnd)) {
                return false;
            }
        }

        return true;
    }
}
