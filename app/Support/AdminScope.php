<?php

namespace App\Support;

use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class AdminScope
{
    public static function ownerAdminId(User $user): ?int
    {
        if ($user->isAdmin()) {
            return $user->id;
        }

        if (! $user->company_id) {
            return null;
        }

        $user->loadMissing('company:id,user_id');

        return $user->company?->user_id;
    }

    public static function companyQueryFor(User $user): Builder
    {
        $adminId = self::ownerAdminId($user);

        if ($adminId === null) {
            return Company::query()->whereRaw('1 = 0');
        }

        return Company::query()->where('user_id', $adminId);
    }

    public static function companyIdsFor(User $user): Collection
    {
        return self::companyQueryFor($user)->pluck('id');
    }
}
