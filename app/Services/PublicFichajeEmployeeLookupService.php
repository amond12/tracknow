<?php

namespace App\Services;

use App\Models\User;

class PublicFichajeEmployeeLookupService
{
    public const GENERIC_LOOKUP_ERROR = 'No se ha encontrado ningun empleado con ese identificador.';

    public function __construct(
        private readonly ClockCodeService $clockCodeService,
        private readonly AuthenticatedFichajeEmployeeResolver $employeeResolver,
    ) {}

    public function normalize(?string $identifier): string
    {
        return $this->clockCodeService->normalizeIdentifier($identifier);
    }

    public function resolve(string $identifier): ?User
    {
        $normalized = $this->normalize($identifier);

        if ($normalized === '') {
            return null;
        }

        $employee = $this->clockCodeService->looksLikeClockCode($normalized)
            ? $this->resolveByClockCode($normalized)
            : $this->resolveByDni($normalized);

        if (! $employee) {
            return null;
        }

        $employee->append('clock_code');

        return $employee;
    }

    private function resolveByClockCode(string $identifier): ?User
    {
        $parts = $this->clockCodeService->splitClockCode($identifier);

        if (! $parts) {
            return null;
        }

        $employee = $this->staffBaseQuery()
            ->where('clock_code_suffix', $parts['suffix'])
            ->whereHas('company', fn ($query) => $query->where('clock_code_prefix', $parts['prefix']))
            ->first();

        return $employee ? $this->prepareResolvedUser($employee) : null;
    }

    private function resolveByDni(string $identifier): ?User
    {
        $user = User::query()
            ->whereIn('role', [
                User::ROLE_EMPLEADO,
                User::ROLE_ENCARGADO,
                User::ROLE_ADMIN,
            ])
            ->whereRaw(
                "REPLACE(REPLACE(UPPER(dni), ' ', ''), '-', '') = ?",
                [$identifier],
            )
            ->first();

        return $user ? $this->prepareResolvedUser($user) : null;
    }

    private function prepareResolvedUser(User $user): ?User
    {
        if ($user->isAdmin()) {
            return $this->employeeResolver->resolve($user);
        }

        if (! $user->company_id || ! $user->work_center_id) {
            return null;
        }

        $user->load([
            'company:id,nombre,clock_code_prefix',
            'workCenter:id,nombre,timezone',
        ]);

        return $user;
    }

    private function staffBaseQuery()
    {
        return User::query()
            ->whereIn('role', User::STAFF_ROLES)
            ->whereNotNull('company_id')
            ->whereNotNull('work_center_id')
            ->with([
                'company:id,nombre,clock_code_prefix',
                'workCenter:id,nombre,timezone',
            ]);
    }
}
