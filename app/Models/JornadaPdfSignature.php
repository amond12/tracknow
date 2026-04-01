<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JornadaPdfSignature extends Model
{
    protected $guarded = [];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'company_signed_at' => 'datetime',
            'employee_signed_at' => 'datetime',
            'locked_at' => 'datetime',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'employee_id');
    }

    public function companySigner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'company_signer_user_id');
    }

    public function employeeSigner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'employee_signer_user_id');
    }

    public function isLocked(): bool
    {
        return $this->locked_at !== null
            || ($this->company_signed_at !== null && $this->employee_signed_at !== null);
    }
}
