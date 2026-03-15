<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ResumenDiario extends Model
{
    protected $table = 'resumen_diario';

    protected $fillable = [
        'user_id',
        'fecha',
        'horas_trabajadas',
        'segundos_previstos',
        'horas_extra',
        'origen',
        'admin_id',
    ];

    protected $casts = [
        'fecha' => 'date',
        'horas_trabajadas' => 'integer',
        'segundos_previstos' => 'integer',
        'horas_extra' => 'integer',
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

    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }
}
