<?php
// app/Models/Document.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Document extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'patient_id',
        'document_type_id',
        'name',
        'file_name',
        'mime_type',
        'size',
        'disk',
        'path',
        'version',
        'tags',
        'description',
        'uploaded_by',
        'checksum',
        'is_encrypted',
        'is_public',
        'last_accessed_at',
    ];

    protected $casts = [
        'tags' => 'array',
        'is_encrypted' => 'boolean',
        'is_public' => 'boolean',
        'last_accessed_at' => 'datetime',
        'size' => 'integer',
    ];

    // Relationships
    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function documentType()
    {
        return $this->belongsTo(DocumentType::class);
    }

    // Accessors
    public function getFileSizeAttribute()
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = $this->size;
        $factor = floor((strlen($bytes) - 1) / 3);
        return sprintf("%.2f", $bytes / pow(1024, $factor)) . ' ' . @$units[$factor];
    }

    public function getFileUrlAttribute()
    {
        return Storage::disk($this->disk)->path($this->path);
    }

    public function getFileExtensionAttribute()
    {
        return pathinfo($this->file_name, PATHINFO_EXTENSION);
    }

    // Methods
    public function recordAccess()
    {
        $this->update(['last_accessed_at' => now()]);
    }

    public function isImage()
    {
        return str_starts_with($this->mime_type, 'image/');
    }

    public function isPdf()
    {
        return $this->mime_type === 'application/pdf';
    }

    // Scopes
    public function scopeImages($query)
    {
        return $query->where('mime_type', 'like', 'image/%');
    }

    public function scopePdfs($query)
    {
        return $query->where('mime_type', 'application/pdf');
    }

    public function scopeByTags($query, array $tags)
    {
        return $query->whereJsonContains('tags', $tags);
    }

    public function scopeSearch($query, $search)
    {
        return $query->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
    }
}