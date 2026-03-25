<?php

namespace App\Models;

use App\Services\ClockCodeService;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Company extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'nombre',
        'cif',
        'pais',
        'ciudad',
        'direccion',
        'cp',
        'clock_code_prefix',
    ];

    protected static function booted(): void
    {
        static::saving(function (Company $company): void {
            app(ClockCodeService::class)->ensureCompanyPrefix($company);
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function workCenters(): HasMany
    {
        return $this->hasMany(WorkCenter::class);
    }

    public function empleados(): HasMany
    {
        return $this->hasMany(User::class)
            ->whereIn('role', ['empleado', 'encargado']);
    }
}
