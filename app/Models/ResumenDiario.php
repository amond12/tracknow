<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ResumenDiario extends Model
{
    protected $table = 'resumen_diario';

    protected $fillable = [
        'user_id',
        'fecha',
        'horas_trabajadas',
        'horas_extra',
    ];

    protected $casts = [
        'fecha'            => 'date',
        'horas_trabajadas' => 'integer',
        'horas_extra'      => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
