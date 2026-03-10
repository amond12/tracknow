<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EdicionFichaje extends Model
{
    protected $table = 'ediciones_fichaje';

    protected $fillable = [
        'fichaje_id',
        'pausa_id',
        'user_id',
        'campo',
        'valor_anterior',
        'valor_nuevo',
        'motivo',
    ];

    public function fichaje(): BelongsTo
    {
        return $this->belongsTo(Fichaje::class);
    }

    public function pausa(): BelongsTo
    {
        return $this->belongsTo(Pausa::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
