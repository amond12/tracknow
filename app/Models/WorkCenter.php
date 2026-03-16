<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WorkCenter extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'nombre',
        'pais',
        'provincia',
        'poblacion',
        'direccion',
        'cp',
        'timezone',
        'lat',
        'lng',
        'radio',
        'ips',
    ];

    protected $casts = [
        'ips' => 'array',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
