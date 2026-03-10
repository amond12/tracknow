<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Pausa extends Model
{
    protected $fillable = [
        'fichaje_id',
        'inicio_pausa',
        'fin_pausa',
        'duracion_pausa',
        'lat_inicio',
        'lng_inicio',
        'ip_inicio',
        'lat_fin',
        'lng_fin',
        'ip_fin',
    ];

    protected $casts = [
        'inicio_pausa' => 'datetime',
        'fin_pausa' => 'datetime',
        'duracion_pausa' => 'integer',
    ];

    public function fichaje(): BelongsTo
    {
        return $this->belongsTo(Fichaje::class);
    }
}
