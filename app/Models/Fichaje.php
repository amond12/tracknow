<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Fichaje extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'work_center_id',
        'fecha',
        'inicio_jornada',
        'fin_jornada',
        'duracion_jornada',
        'estado',
        'lat_inicio',
        'lng_inicio',
        'ip_inicio',
        'lat_fin',
        'lng_fin',
        'ip_fin',
    ];

    protected $casts = [
        'fecha' => 'date',
        'inicio_jornada' => 'datetime',
        'fin_jornada' => 'datetime',
        'duracion_jornada' => 'integer',
    ];

    protected function fecha(): Attribute
    {
        return Attribute::make(
            set: fn ($value) => $value ? Carbon::parse($value)->toDateString() : null,
        );
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function workCenter(): BelongsTo
    {
        return $this->belongsTo(WorkCenter::class);
    }

    public function pausas(): HasMany
    {
        return $this->hasMany(Pausa::class);
    }

    public function ediciones(): HasMany
    {
        return $this->hasMany(EdicionFichaje::class)->orderBy('created_at', 'asc');
    }
}
