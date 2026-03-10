<?php

namespace App\Http\Controllers;

use App\Models\Fichaje;
use App\Models\Pausa;
use App\Models\User;
use App\Models\WorkCenter;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FicharController extends Controller
{
    public function index(Request $request)
    {
        /** @var User $user */
        $user = $request->user();
        $employee = $this->resolveEmployee($request);

        if (!$employee) {
            return Inertia::render('fichar/index', [
                'employee' => null,
                'fichajeActivo' => null,
                'historial' => [],
                'setupMessage' => $this->buildSetupMessage($user),
            ]);
        }

        $fichajeActivo = Fichaje::where('user_id', $employee->id)
            ->whereIn('estado', ['activa', 'pausa'])
            ->with('pausas')
            ->latest()
            ->first();

        $historial = Fichaje::where('user_id', $employee->id)
            ->where('estado', 'finalizada')
            ->with('pausas')
            ->latest()
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

        if (!$employee) {
            return back()->withErrors(['error' => $this->buildSetupMessage($user)]);
        }

        if (!$employee->work_center_id) {
            return back()->withErrors(['error' => 'No tienes un centro de trabajo asignado.']);
        }

        // Comprobar si ya tiene jornada activa hoy
        $jornadaHoy = Fichaje::where('user_id', $employee->id)
            ->whereDate('fecha', today())
            ->whereIn('estado', ['activa', 'pausa'])
            ->first();

        if ($jornadaHoy) {
            return back()->withErrors(['error' => 'Ya tienes una jornada activa hoy.']);
        }

        $request->validate([
            'lat' => 'nullable|numeric',
            'lng' => 'nullable|numeric',
            'ip_publica' => 'nullable|string|max:45',
        ]);

        if (!$employee->remoto) {
            $error = $this->verificarUbicacion($request, $employee);
            if ($error) {
                return back()->withErrors(['error' => $error]);
            }
        }

        Fichaje::create([
            'user_id' => $employee->id,
            'work_center_id' => $employee->work_center_id,
            'fecha' => today(),
            'inicio_jornada' => now(),
            'estado' => 'activa',
            'lat_inicio' => $employee->remoto ? $request->lat : null,
            'lng_inicio' => $employee->remoto ? $request->lng : null,
            'ip_inicio' => $request->ip(),
        ]);

        return back();
    }

    public function pausa(Request $request)
    {
        /** @var User $user */
        $user = $request->user();
        $employee = $this->resolveEmployee($request);

        if (!$employee) {
            return back()->withErrors(['error' => $this->buildSetupMessage($user)]);
        }

        $request->validate([
            'lat' => 'nullable|numeric',
            'lng' => 'nullable|numeric',
            'ip_publica' => 'nullable|string|max:45',
        ]);

        $fichaje = Fichaje::where('user_id', $employee->id)
            ->whereIn('estado', ['activa', 'pausa'])
            ->with('pausas')
            ->latest()
            ->first();

        if (!$fichaje) {
            return back()->withErrors(['error' => 'No tienes jornada activa.']);
        }

        if ($fichaje->estado === 'activa') {
            // Iniciar pausa
            if (!$employee->remoto) {
                $error = $this->verificarUbicacion($request, $employee);
                if ($error) {
                    return back()->withErrors(['error' => $error]);
                }
            }

            Pausa::create([
                'fichaje_id' => $fichaje->id,
                'inicio_pausa' => now(),
                'lat_inicio' => $employee->remoto ? $request->lat : null,
                'lng_inicio' => $employee->remoto ? $request->lng : null,
                'ip_inicio' => $request->ip(),
            ]);

            $fichaje->update(['estado' => 'pausa']);
        } else {
            // Reanudar pausa
            $pausaActiva = $fichaje->pausas()->whereNull('fin_pausa')->latest()->first();

            if (!$pausaActiva) {
                return back()->withErrors(['error' => 'No se encontró la pausa activa.']);
            }

            if (!$employee->remoto) {
                $error = $this->verificarUbicacion($request, $employee);
                if ($error) {
                    return back()->withErrors(['error' => $error]);
                }
            }

            $duracion = (int) now()->diffInSeconds($pausaActiva->inicio_pausa, true);

            $pausaActiva->update([
                'fin_pausa' => now(),
                'duracion_pausa' => $duracion,
                'lat_fin' => $employee->remoto ? $request->lat : null,
                'lng_fin' => $employee->remoto ? $request->lng : null,
                'ip_fin' => $request->ip(),
            ]);

            $fichaje->update(['estado' => 'activa']);
        }

        return back();
    }

    public function finalizar(Request $request)
    {
        /** @var User $user */
        $user = $request->user();
        $employee = $this->resolveEmployee($request);

        if (!$employee) {
            return back()->withErrors(['error' => $this->buildSetupMessage($user)]);
        }

        $request->validate([
            'lat' => 'nullable|numeric',
            'lng' => 'nullable|numeric',
            'ip_publica' => 'nullable|string|max:45',
        ]);

        $fichaje = Fichaje::where('user_id', $employee->id)
            ->whereIn('estado', ['activa', 'pausa'])
            ->with('pausas')
            ->latest()
            ->first();

        if (!$fichaje) {
            return back()->withErrors(['error' => 'No tienes jornada activa.']);
        }

        if (!$employee->remoto) {
            $error = $this->verificarUbicacion($request, $employee);
            if ($error) {
                return back()->withErrors(['error' => $error]);
            }
        }

        // Si estaba en pausa, cerrarla primero
        if ($fichaje->estado === 'pausa') {
            $pausaActiva = $fichaje->pausas()->whereNull('fin_pausa')->latest()->first();
            if ($pausaActiva) {
                $duracion = (int) now()->diffInSeconds($pausaActiva->inicio_pausa, true);
                $pausaActiva->update([
                    'fin_pausa' => now(),
                    'duracion_pausa' => $duracion,
                    'lat_fin' => $employee->remoto ? $request->lat : null,
                    'lng_fin' => $employee->remoto ? $request->lng : null,
                    'ip_fin' => $request->ip(),
                ]);
            }
        }

        // Refrescar fichaje con pausas cerradas
        $fichaje->refresh();
        $fichaje->load('pausas');

        $totalPausas = $fichaje->pausas->sum('duracion_pausa');
        $duracionTotal = (int) now()->diffInSeconds($fichaje->inicio_jornada, true);
        $duracionJornada = max(0, $duracionTotal - $totalPausas);

        $fichaje->update([
            'fin_jornada' => now(),
            'duracion_jornada' => $duracionJornada,
            'estado' => 'finalizada',
            'lat_fin' => $employee->remoto ? $request->lat : null,
            'lng_fin' => $employee->remoto ? $request->lng : null,
            'ip_fin' => $request->ip(),
        ]);

        return back();
    }

    private function resolveEmployee(Request $request): ?User
    {
        /** @var User $user */
        $user = $request->user();

        // Empleados y encargados: son directamente el trabajador
        if (in_array($user->role, ['empleado', 'encargado'])) {
            if (!$user->company_id || !$user->work_center_id) {
                return null;
            }
            $user->load(['workCenter', 'company']);
            return $user;
        }

        // Admins: deben tener company_id + work_center_id asignados para fichar
        // Si no los tiene, intentar asignar el primer centro propio
        if ($user->role === 'admin') {
            if ($user->work_center_id) {
                $user->load(['workCenter', 'company']);
                return $user;
            }

            $workCenter = $this->firstOwnedWorkCenter($user);
            if (!$workCenter) {
                return null;
            }

            $user->update([
                'company_id'     => $workCenter->company_id,
                'work_center_id' => $workCenter->id,
                'remoto'         => true,
            ]);

            $user->refresh()->load(['workCenter', 'company']);
            return $user;
        }

        return null;
    }

    private function buildSetupMessage(User $user): string
    {
        if ($user->role !== 'admin') {
            return 'No tienes un perfil de empleado asignado.';
        }

        if (!$user->companies()->exists()) {
            return 'Para fichar como administrador, crea primero una empresa y un centro de trabajo en Configuracion.';
        }

        if (!$this->firstOwnedWorkCenter($user)) {
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

    private function verificarUbicacion(Request $request, User $employee): ?string
    {
        $workCenter = $employee->workCenter;

        if (!$workCenter) {
            return 'No tienes un centro de trabajo asignado.';
        }

        // Verificar por IP (servidor + IP pública detectada por el cliente)
        $ips = $workCenter->ips ?? [];
        $ipsAComprobar = array_filter(array_unique([
            $request->ip(),
            $request->input('ip_publica'),
        ]));
        foreach ($ipsAComprobar as $ip) {
            if (in_array($ip, $ips)) {
                return null;
            }
        }

        // Verificar por geolocalización
        if ($request->filled('lat') && $request->filled('lng') && $workCenter->lat && $workCenter->lng) {
            $distancia = $this->haversine(
                (float) $request->lat,
                (float) $request->lng,
                (float) $workCenter->lat,
                (float) $workCenter->lng
            );
            $radio = $workCenter->radio ?? 100;
            if ($distancia <= $radio) {
                return null;
            }
        }

        // Mensaje descriptivo para facilitar el diagnóstico
        $ipServidor = $request->ip();
        $ipPublica = $request->input('ip_publica', '—');
        return "No estás en el centro de trabajo. IP detectada: {$ipPublica} (servidor: {$ipServidor}). Verifica las IPs registradas en el centro o activa la geolocalización.";
    }

    private function haversine(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371000; // metros

        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) * sin($dLat / 2)
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2))
            * sin($dLng / 2) * sin($dLng / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}
