<?php

namespace App\Services;

use App\Models\Company;
use App\Models\User;
use RuntimeException;

class ClockCodeService
{
    public function normalizeIdentifier(?string $identifier): string
    {
        $normalized = preg_replace('/[^A-Z0-9]/', '', strtoupper(trim((string) $identifier)));

        return $normalized ?? '';
    }

    public function looksLikeClockCode(string $identifier): bool
    {
        return preg_match('/^\d{8}$/', $identifier) === 1;
    }

    /**
     * @return array{prefix: string, suffix: string}|null
     */
    public function splitClockCode(string $identifier): ?array
    {
        if (! $this->looksLikeClockCode($identifier)) {
            return null;
        }

        return [
            'prefix' => substr($identifier, 0, 4),
            'suffix' => substr($identifier, 4, 4),
        ];
    }

    public function buildClockCode(?string $prefix, ?string $suffix): ?string
    {
        if (! $prefix || ! $suffix) {
            return null;
        }

        return $prefix.$suffix;
    }

    public function ensureCompanyPrefix(Company $company): void
    {
        if (
            $company->clock_code_prefix
            && ! $this->companyPrefixExists(
                $company->clock_code_prefix,
                $company->exists ? $company->getKey() : null,
            )
        ) {
            return;
        }

        $company->clock_code_prefix = $this->generateUniqueCompanyPrefix(
            $company->exists ? $company->getKey() : null,
        );
    }

    public function ensureEmployeeSuffix(User $user): void
    {
        if (! $user->isEmployeeLike() || ! $user->company_id) {
            $user->clock_code_suffix = null;

            return;
        }

        if (
            $user->clock_code_suffix
            && ! $this->employeeSuffixExists(
                (int) $user->company_id,
                $user->clock_code_suffix,
                $user->exists ? $user->getKey() : null,
            )
        ) {
            return;
        }

        $user->clock_code_suffix = $this->generateUniqueEmployeeSuffix(
            (int) $user->company_id,
            $user->exists ? $user->getKey() : null,
        );
    }

    public function backfillMissingCodes(): void
    {
        Company::query()
            ->where(function ($query) {
                $query->whereNull('clock_code_prefix')
                    ->orWhere('clock_code_prefix', '');
            })
            ->orderBy('id')
            ->lazyById()
            ->each(function (Company $company): void {
                $company->clock_code_prefix = $this->generateUniqueCompanyPrefix($company->id);
                $company->saveQuietly();
            });

        User::query()
            ->whereIn('role', User::STAFF_ROLES)
            ->whereNotNull('company_id')
            ->where(function ($query) {
                $query->whereNull('clock_code_suffix')
                    ->orWhere('clock_code_suffix', '');
            })
            ->orderBy('id')
            ->lazyById()
            ->each(function (User $user): void {
                $user->clock_code_suffix = $this->generateUniqueEmployeeSuffix(
                    (int) $user->company_id,
                    $user->id,
                );
                $user->saveQuietly();
            });
    }

    public function generateUniqueCompanyPrefix(?int $ignoreCompanyId = null): string
    {
        for ($attempt = 0; $attempt < 15000; $attempt++) {
            $candidate = $this->randomFourDigits();

            if (! $this->companyPrefixExists($candidate, $ignoreCompanyId)) {
                return $candidate;
            }
        }

        throw new RuntimeException('Unable to generate a unique company clock code prefix.');
    }

    public function generateUniqueEmployeeSuffix(int $companyId, ?int $ignoreUserId = null): string
    {
        for ($attempt = 0; $attempt < 15000; $attempt++) {
            $candidate = $this->randomFourDigits();

            if (! $this->employeeSuffixExists($companyId, $candidate, $ignoreUserId)) {
                return $candidate;
            }
        }

        throw new RuntimeException('Unable to generate a unique employee clock code suffix.');
    }

    private function companyPrefixExists(string $prefix, ?int $ignoreCompanyId = null): bool
    {
        return Company::query()
            ->when($ignoreCompanyId, fn ($query) => $query->whereKeyNot($ignoreCompanyId))
            ->where('clock_code_prefix', $prefix)
            ->exists();
    }

    private function employeeSuffixExists(int $companyId, string $suffix, ?int $ignoreUserId = null): bool
    {
        return User::query()
            ->where('company_id', $companyId)
            ->when($ignoreUserId, fn ($query) => $query->whereKeyNot($ignoreUserId))
            ->where('clock_code_suffix', $suffix)
            ->exists();
    }

    private function randomFourDigits(): string
    {
        return str_pad((string) random_int(0, 9999), 4, '0', STR_PAD_LEFT);
    }
}
