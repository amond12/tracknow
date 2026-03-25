<?php

namespace App\Services;

use App\Models\Fichaje;
use App\Models\Pausa;
use App\Models\User;
use App\Services\HorasExtraService;
use App\Support\WorkCenterTimezone;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class FichajeWorkflowService
{
    public function __construct(
        private readonly HorasExtraService $horasExtraService,
    ) {}

    public function activeFichajeFor(User $employee): ?Fichaje
    {
        return $this->activeFichajeQuery($employee->id)
            ->with(['pausas', 'workCenter:id,nombre,timezone'])
            ->first();
    }

    public function historyFor(User $employee, int $limit = 7): Collection
    {
        return Fichaje::query()
            ->where('user_id', $employee->id)
            ->where('estado', 'finalizada')
            ->with(['pausas', 'workCenter:id,nombre,timezone'])
            ->orderByDesc('fecha')
            ->orderByDesc('inicio_jornada')
            ->take($limit)
            ->get();
    }

    public function actionValidationRules(): array
    {
        return [
            'lat' => 'nullable|numeric',
            'lng' => 'nullable|numeric',
            'accuracy' => 'nullable|numeric|min:0|max:1000',
            'ip_publica' => 'nullable|string|max:45',
        ];
    }

    public function validateActionRequest(Request $request): void
    {
        $request->validate($this->actionValidationRules());
    }

    public function iniciar(User $employee, Request $request): ?string
    {
        if (! $employee->work_center_id) {
            return 'No tienes un centro de trabajo asignado.';
        }

        $error = $this->validarContextoFichaje($request, $employee);
        if ($error) {
            return $error;
        }

        return DB::transaction(function () use ($employee, $request) {
            $this->lockEmployeeForFichaje($employee);

            $jornadaActiva = $this->activeFichajeQuery($employee->id)
                ->lockForUpdate()
                ->first();

            if ($jornadaActiva) {
                return 'Ya tienes una jornada activa.';
            }

            $startedAt = WorkCenterTimezone::nowUtc();
            $workCenter = $employee->workCenter;
            $timezone = WorkCenterTimezone::resolve($workCenter);

            Fichaje::create([
                'user_id' => $employee->id,
                'work_center_id' => $employee->work_center_id,
                'timezone' => $timezone,
                'fecha' => $startedAt->copy()->setTimezone($timezone)->toDateString(),
                'inicio_jornada' => $startedAt,
                'estado' => 'activa',
                'lat_inicio' => $employee->remoto ? $request->lat : null,
                'lng_inicio' => $employee->remoto ? $request->lng : null,
                'ip_inicio' => $request->ip(),
            ]);

            return null;
        });
    }

    public function pausa(User $employee, Request $request): ?string
    {
        return DB::transaction(function () use ($employee, $request) {
            $this->lockEmployeeForFichaje($employee);

            $fichaje = $this->activeFichajeQuery($employee->id)
                ->with('pausas')
                ->lockForUpdate()
                ->first();

            if (! $fichaje) {
                return 'No tienes jornada activa.';
            }

            $error = $this->validarContextoFichaje($request, $employee);
            if ($error) {
                return $error;
            }

            if ($fichaje->estado === 'activa') {
                $pauseStartedAt = WorkCenterTimezone::nowUtc();

                Pausa::create([
                    'fichaje_id' => $fichaje->id,
                    'inicio_pausa' => $pauseStartedAt,
                    'lat_inicio' => $employee->remoto ? $request->lat : null,
                    'lng_inicio' => $employee->remoto ? $request->lng : null,
                    'ip_inicio' => $request->ip(),
                ]);

                $fichaje->update(['estado' => 'pausa']);

                return null;
            }

            $pausaActiva = $fichaje->pausas()
                ->whereNull('fin_pausa')
                ->orderByDesc('inicio_pausa')
                ->lockForUpdate()
                ->first();

            if (! $pausaActiva) {
                return 'No se encontro la pausa activa.';
            }

            $pauseFinishedAt = WorkCenterTimezone::nowUtc();
            $duracion = (int) $pauseFinishedAt->diffInSeconds(
                $pausaActiva->inicio_pausa,
                true,
            );

            $pausaActiva->update([
                'fin_pausa' => $pauseFinishedAt,
                'duracion_pausa' => $duracion,
                'lat_fin' => $employee->remoto ? $request->lat : null,
                'lng_fin' => $employee->remoto ? $request->lng : null,
                'ip_fin' => $request->ip(),
            ]);

            $fichaje->update(['estado' => 'activa']);

            return null;
        });
    }

    public function finalizar(User $employee, Request $request): ?string
    {
        return DB::transaction(function () use ($employee, $request) {
            $this->lockEmployeeForFichaje($employee);

            $fichaje = $this->activeFichajeQuery($employee->id)
                ->with('pausas')
                ->lockForUpdate()
                ->first();

            if (! $fichaje) {
                return 'No tienes jornada activa.';
            }

            $error = $this->validarContextoFichaje($request, $employee);
            if ($error) {
                return $error;
            }

            $finishedAt = WorkCenterTimezone::nowUtc();

            if ($fichaje->estado === 'pausa') {
                $pausaActiva = $fichaje->pausas()
                    ->whereNull('fin_pausa')
                    ->orderByDesc('inicio_pausa')
                    ->lockForUpdate()
                    ->first();

                if ($pausaActiva) {
                    $duracion = (int) $finishedAt->diffInSeconds(
                        $pausaActiva->inicio_pausa,
                        true,
                    );
                    $pausaActiva->update([
                        'fin_pausa' => $finishedAt,
                        'duracion_pausa' => $duracion,
                        'lat_fin' => $employee->remoto ? $request->lat : null,
                        'lng_fin' => $employee->remoto ? $request->lng : null,
                        'ip_fin' => $request->ip(),
                    ]);
                }
            }

            $fichaje->refresh()->load('pausas');

            $totalPausas = $fichaje->pausas->sum('duracion_pausa');
            $duracionTotal = (int) $finishedAt->diffInSeconds(
                $fichaje->inicio_jornada,
                true,
            );
            $duracionJornada = max(0, $duracionTotal - $totalPausas);

            $fichaje->update([
                'fin_jornada' => $finishedAt,
                'duracion_jornada' => $duracionJornada,
                'estado' => 'finalizada',
                'lat_fin' => $employee->remoto ? $request->lat : null,
                'lng_fin' => $employee->remoto ? $request->lng : null,
                'ip_fin' => $request->ip(),
            ]);

            $fichaje->refresh()->load('pausas');
            $this->horasExtraService->recalcularParaFichaje($fichaje);

            return null;
        });
    }

    private function activeFichajeQuery(int $userId)
    {
        return Fichaje::query()
            ->where('user_id', $userId)
            ->whereIn('estado', ['activa', 'pausa'])
            ->orderByDesc('fecha')
            ->orderByDesc('inicio_jornada');
    }

    private function lockEmployeeForFichaje(User $employee): void
    {
        User::query()
            ->whereKey($employee->id)
            ->lockForUpdate()
            ->first();
    }

    private function validarContextoFichaje(Request $request, User $employee): ?string
    {
        if ($employee->remoto) {
            if (! $request->filled('lat') || ! $request->filled('lng')) {
                $error = 'Debes permitir la geolocalizacion para fichar en remoto.';
                $this->logContextValidationFailure($request, $employee, $error);

                return $error;
            }

            return null;
        }

        $error = $this->verificarUbicacion($request, $employee);
        if ($error) {
            $this->logContextValidationFailure($request, $employee, $error);
        }

        return $error;
    }

    private function verificarUbicacion(Request $request, User $employee): ?string
    {
        // Reload the work center from the database to avoid partial eager loads
        // that omit validation fields like ips, lat, lng or radio.
        $workCenter = $employee->workCenter()->first();

        if (! $workCenter) {
            return 'No tienes un centro de trabajo asignado.';
        }

        $ips = $workCenter->ips ?? [];
        $radio = $workCenter->radio ?? 100;
        $ipsAComprobar = array_filter(array_unique([
            $request->ip(),
            $request->input('ip_publica'),
        ]));

        foreach ($ipsAComprobar as $ip) {
            if (in_array($ip, $ips, true)) {
                return null;
            }
        }

        if ($request->filled('lat') && $request->filled('lng') && $workCenter->lat !== null && $workCenter->lng !== null) {
            $distancia = $this->haversine(
                (float) $request->lat,
                (float) $request->lng,
                (float) $workCenter->lat,
                (float) $workCenter->lng,
            );

            if ($distancia <= $radio) {
                return null;
            }
        }

        return 'No se pudo validar tu ubicacion para fichar.';
    }

    private function logContextValidationFailure(
        Request $request,
        User $employee,
        string $reason,
    ): void {
        Log::warning('Fichaje context validation failed', [
            'reason' => $reason,
            'employee_id' => $employee->id,
            'work_center_id' => $employee->work_center_id,
            'is_remote' => $employee->remoto,
            'request_ip' => $request->ip(),
            'public_ip' => $request->input('ip_publica'),
            'lat' => $request->input('lat'),
            'lng' => $request->input('lng'),
            'accuracy' => $request->input('accuracy'),
        ]);
    }

    private function haversine(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371000;

        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) * sin($dLat / 2)
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2))
            * sin($dLng / 2) * sin($dLng / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}
