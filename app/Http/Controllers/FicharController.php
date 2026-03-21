<?php

namespace App\Http\Controllers;

use App\Models\Fichaje;
use App\Models\Pausa;
use App\Models\User;
use App\Models\WorkCenter;
use App\Services\HorasExtraService;
use App\Support\WorkCenterTimezone;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class FicharController extends Controller
{
    public function index(Request $request)
    {
        /** @var User $user */
        $user = $request->user();
        $employee = $this->resolveEmployee($request);

        if (! $employee) {
            return Inertia::render('fichar/index', [
                'employee' => null,
                'fichajeActivo' => null,
                'historial' => [],
                'setupMessage' => $this->buildSetupMessage($user),
            ]);
        }

        $fichajeActivo = Fichaje::where('user_id', $employee->id)
            ->whereIn('estado', ['activa', 'pausa'])
            ->with(['pausas', 'workCenter:id,nombre,timezone'])
            ->orderByDesc('fecha')
            ->orderByDesc('inicio_jornada')
            ->first();

        $historial = Fichaje::where('user_id', $employee->id)
            ->where('estado', 'finalizada')
            ->with(['pausas', 'workCenter:id,nombre,timezone'])
            ->orderByDesc('fecha')
            ->orderByDesc('inicio_jornada')
            ->take(7)
            ->get();

        return Inertia::render('fichar/index', [
            'employee' => $employee,
            'fichajeActivo' => $fichajeActivo,
            'historial' => $historial,
            'setupMessage' => null,
        ]);
    }

    public function iniciar(Request $request)
    {
        /** @var User $user */
        $user = $request->user();
        $employee = $this->resolveEmployee($request);

        if (! $employee) {
            return back()->withErrors(['error' => $this->buildSetupMessage($user)]);
        }

        if (! $employee->work_center_id) {
            return back()->withErrors(['error' => 'No tienes un centro de trabajo asignado.']);
        }

        $request->validate([
            'lat' => 'nullable|numeric',
            'lng' => 'nullable|numeric',
            'accuracy' => 'nullable|numeric|min:0|max:1000',
            'ip_publica' => 'nullable|string|max:45',
        ]);

        $error = $this->validarContextoFichaje($request, $employee);
        if ($error) {
            return back()->withErrors(['error' => $error]);
        }

        return DB::transaction(function () use ($employee, $request) {
            $this->lockEmployeeForFichaje($employee);

            $jornadaActiva = $this->activeFichajeQuery($employee->id)
                ->lockForUpdate()
                ->first();

            if ($jornadaActiva) {
                return back()->withErrors(['error' => 'Ya tienes una jornada activa.']);
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

            return back();
        });
    }

    public function pausa(Request $request)
    {
        /** @var User $user */
        $user = $request->user();
        $employee = $this->resolveEmployee($request);

        if (! $employee) {
            return back()->withErrors(['error' => $this->buildSetupMessage($user)]);
        }

        $request->validate([
            'lat' => 'nullable|numeric',
            'lng' => 'nullable|numeric',
            'accuracy' => 'nullable|numeric|min:0|max:1000',
            'ip_publica' => 'nullable|string|max:45',
        ]);

        return DB::transaction(function () use ($employee, $request) {
            $this->lockEmployeeForFichaje($employee);

            $fichaje = $this->activeFichajeQuery($employee->id)
                ->with('pausas')
                ->lockForUpdate()
                ->first();

            if (! $fichaje) {
                return back()->withErrors(['error' => 'No tienes jornada activa.']);
            }

            $error = $this->validarContextoFichaje($request, $employee);
            if ($error) {
                return back()->withErrors(['error' => $error]);
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

                return back();
            }

            $pausaActiva = $fichaje->pausas()
                ->whereNull('fin_pausa')
                ->orderByDesc('inicio_pausa')
                ->lockForUpdate()
                ->first();

            if (! $pausaActiva) {
                return back()->withErrors(['error' => 'No se encontro la pausa activa.']);
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

            return back();
        });
    }

    public function finalizar(Request $request)
    {
        /** @var User $user */
        $user = $request->user();
        $employee = $this->resolveEmployee($request);

        if (! $employee) {
            return back()->withErrors(['error' => $this->buildSetupMessage($user)]);
        }

        $request->validate([
            'lat' => 'nullable|numeric',
            'lng' => 'nullable|numeric',
            'accuracy' => 'nullable|numeric|min:0|max:1000',
            'ip_publica' => 'nullable|string|max:45',
        ]);

        return DB::transaction(function () use ($employee, $request) {
            $this->lockEmployeeForFichaje($employee);

            $fichaje = $this->activeFichajeQuery($employee->id)
                ->with('pausas')
                ->lockForUpdate()
                ->first();

            if (! $fichaje) {
                return back()->withErrors(['error' => 'No tienes jornada activa.']);
            }

            $error = $this->validarContextoFichaje($request, $employee);
            if ($error) {
                return back()->withErrors(['error' => $error]);
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
            app(HorasExtraService::class)->recalcularParaFichaje($fichaje);

            return back();
        });
    }

    private function resolveEmployee(Request $request): ?User
    {
        /** @var User $user */
        $user = $request->user();

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

    private function buildSetupMessage(User $user): string
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
                return 'Debes permitir la geolocalizacion para fichar en remoto.';
            }

            return null;
        }

        return $this->verificarUbicacion($request, $employee);
    }

    private function verificarUbicacion(Request $request, User $employee): ?string
    {
        $workCenter = $employee->workCenter;

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
