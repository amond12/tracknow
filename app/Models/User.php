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
}
