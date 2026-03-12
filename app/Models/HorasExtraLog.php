<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HorasExtraLog extends Model
{
    public $timestamps = false;

    const UPDATED_AT = null;

    protected $table = 'horas_extra_log';

    protected $fillable = [
        'user_id',
        'fecha',
        'horas_trabajadas',
        'horas_extra',
        'accion',
        'admin_id',
    ];

    protected $casts = [
        'fecha'      => 'date',
        'created_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }
}
