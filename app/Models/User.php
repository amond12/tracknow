<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    public const ROLE_ADMIN = 'admin';

    public const ROLE_EMPLEADO = 'empleado';

    public const ROLE_ENCARGADO = 'encargado';

    public const MANAGER_ROLES = [
        self::ROLE_ADMIN,
        self::ROLE_ENCARGADO,
    ];

    public const STAFF_ROLES = [
        self::ROLE_EMPLEADO,
        self::ROLE_ENCARGADO,
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'apellido',
        'email',
        'telefono',
        'dni',
        'nss',
        'password',
        'role',
        'company_id',
        'work_center_id',
        'remoto',
        'horario_lunes',
        'horario_martes',
        'horario_miercoles',
        'horario_jueves',
        'horario_viernes',
        'horario_sabado',
        'horario_domingo',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'remoto' => 'boolean',
            'horario_lunes' => 'float',
            'horario_martes' => 'float',
            'horario_miercoles' => 'float',
            'horario_jueves' => 'float',
            'horario_viernes' => 'float',
            'horario_sabado' => 'float',
            'horario_domingo' => 'float',
        ];
    }

    /** Empresas que administra este usuario (admins) */
    public function companies(): HasMany
    {
        return $this->hasMany(Company::class);
    }

    /** Empresa a la que pertenece (empleados) */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /** Centro de trabajo al que pertenece */
    public function workCenter(): BelongsTo
    {
        return $this->belongsTo(WorkCenter::class);
    }

    /** Fichajes del usuario */
    public function fichajes(): HasMany
    {
        return $this->hasMany(Fichaje::class);
    }

    /** Resúmenes diarios del usuario */
    public function resumenDiario(): HasMany
    {
        return $this->hasMany(ResumenDiario::class);
    }

    /** Segundos previstos para un día natural dado */
    public function horarioPrevistoDia(\Carbon\Carbon $fecha): int
    {
        $map = [
            1 => $this->horario_lunes,
            2 => $this->horario_martes,
            3 => $this->horario_miercoles,
            4 => $this->horario_jueves,
            5 => $this->horario_viernes,
            6 => $this->horario_sabado,
            7 => $this->horario_domingo,
        ];

        return (int) round(($map[$fecha->dayOfWeekIso] ?? 0) * 3600);
    }

    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    public function isEmpleado(): bool
    {
        return $this->role === self::ROLE_EMPLEADO;
    }

    public function isEncargado(): bool
    {
        return $this->role === self::ROLE_ENCARGADO;
    }

    public function isManager(): bool
    {
        return in_array($this->role, self::MANAGER_ROLES, true);
    }

    public function isEmployeeLike(): bool
    {
        return in_array($this->role, self::STAFF_ROLES, true);
    }
}
