<?php

namespace App\Services;

use App\Models\User;
use App\Models\WorkCenter;

class AuthenticatedFichajeEmployeeResolver
{
    public function resolve(User $user): ?User
    {
        if ($user->isEmployeeLike()) {
            if (! $user->company_id || ! $user->work_center_id) {
                return null;
            }

            $user->load(['workCenter', 'company']);

            return $user;
        }

        if ($user->isAdmin()) {
            if ($user->work_center_id) {
                $user->load(['workCenter', 'company']);

                return $user;
            }

            $workCenter = $this->firstOwnedWorkCenter($user);
            if (! $workCenter) {
                return null;
            }

            $user->update([
                'company_id' => $workCenter->company_id,
                'work_center_id' => $workCenter->id,
                'remoto' => true,
            ]);

            $user->refresh()->load(['workCenter', 'company']);

            return $user;
        }

        return null;
    }

    public function buildSetupMessage(User $user): string
    {
        if (! $user->isAdmin()) {
            return 'No tienes un perfil de empleado asignado.';
        }

        if (! $user->companies()->exists()) {
            return 'Para fichar como administrador, crea primero una empresa y un centro de trabajo en Configuracion.';
        }

        if (! $this->firstOwnedWorkCenter($user)) {
            return 'Para fichar como administrador, crea al menos un centro de trabajo en Configuracion.';
        }

        return 'No se pudo preparar tu perfil para fichar. Revisa tu configuracion.';
    }

    private function firstOwnedWorkCenter(User $user): ?WorkCenter
    {
        return WorkCenter::query()
            ->whereHas('company', fn ($query) => $query->where('user_id', $user->id))
            ->orderBy('company_id')
            ->orderBy('id')
            ->first();
    }
}
