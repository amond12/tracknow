<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Vacacion extends Model
{
    protected $table = 'vacaciones';

    protected $fillable = [
        'user_id',
        'fecha',
        'tipo',
        'motivo',
        'dia_completo',
        'hora_inicio',
        'hora_fin',
    ];

    protected $casts = [
        'fecha' => 'date',
        'dia_completo' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
