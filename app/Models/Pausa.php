<?php

namespace App\Models;

use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Casts\Attribute;
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
        'duracion_pausa' => 'integer',
    ];

    protected function inicioPausa(): Attribute
    {
        return $this->makeUtcDateTimeCast();
    }

    protected function finPausa(): Attribute
    {
        return $this->makeUtcDateTimeCast();
    }

    public function fichaje(): BelongsTo
    {
        return $this->belongsTo(Fichaje::class);
    }

    private function makeUtcDateTimeCast(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $value
                ? Carbon::createFromFormat($this->getDateFormat(), $value, 'UTC')
                : null,
            set: fn ($value) => $this->serializeUtcDateTime($value),
        );
    }

    private function serializeUtcDateTime(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if ($value instanceof CarbonInterface) {
            return $value->copy()->setTimezone('UTC')->format($this->getDateFormat());
        }

        return Carbon::parse($value)->setTimezone('UTC')->format($this->getDateFormat());
    }
}
