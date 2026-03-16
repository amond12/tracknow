<?php

namespace App\Models;

use Carbon\Carbon;
use Carbon\CarbonInterface;
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
        'timezone',
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
        'duracion_jornada' => 'integer',
    ];

    protected function fecha(): Attribute
    {
        return Attribute::make(
            set: fn ($value) => $value ? Carbon::parse($value)->toDateString() : null,
        );
    }

    protected function inicioJornada(): Attribute
    {
        return $this->makeUtcDateTimeCast();
    }

    protected function finJornada(): Attribute
    {
        return $this->makeUtcDateTimeCast();
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
