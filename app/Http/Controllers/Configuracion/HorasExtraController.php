<?php

namespace App\Http\Controllers\Configuracion;

use App\Http\Controllers\Controller;
use App\Models\HorasExtraLog;
use App\Models\ResumenDiario;
use App\Models\User;
use App\Models\WorkCenter;
use App\Services\HorasExtraService;
use App\Support\AdminScope;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HorasExtraController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $mes = (int) $request->input('mes', now()->month);
        $anio = (int) $request->input('anio', now()->year);

        $fechaInicio = Carbon::create($anio, $mes, 1)->startOfMonth();
        $fechaFin = $fechaInicio->copy()->endOfMonth();
        if ($user->isEmpleado()) {
            $user->loadMissing(['company:id,nombre', 'workCenter:id,company_id,nombre']);

            $companies = $user->company
                ? collect([['id' => $user->company->id, 'nombre' => $user->company->nombre]])
                : collect();
            $workCenters = $user->workCenter
                ? collect([[
                    'id' => $user->workCenter->id,
                    'company_id' => $user->workCenter->company_id,
                    'nombre' => $user->workCenter->nombre,
                ]])
                : collect();
            $employees = collect([[
                'id' => $user->id,
                'company_id' => $user->company_id,
                'work_center_id' => $user->work_center_id,
                'name' => $user->name,
                'apellido' => $user->apellido,
            ]]);

            $registros = ResumenDiario::with(['user:id,name,apellido', 'admin:id,name'])
                ->where('user_id', $user->id)
                ->whereBetween('fecha', [$fechaInicio->toDateString(), $fechaFin->toDateString()])
                ->orderBy('fecha', 'desc')
                ->paginate(20)
                ->withQueryString()
                ->through(function ($d) {
                    return [
                        'id' => $d->id,
                        'user_id' => $d->user->id,
                        'nombre' => $d->user->name,
                        'apellido' => $d->user->apellido ?? '',
                        'fecha' => $d->fecha->toDateString(),
                        'horas_extra' => $d->horas_extra,
                        'origen' => $d->origen ?? 'auto',
                        'admin_nombre' => $d->admin?->name,
                    ];
                });
        } else {
            $companies = AdminScope::companyQueryFor($user)->get(['id', 'nombre']);
            $companyIds = $companies->pluck('id');

            $workCenters = WorkCenter::whereIn('company_id', $companyIds)
                ->get(['id', 'company_id', 'nombre']);

            $employees = User::where(function ($q) use ($companyIds) {
                $q->whereIn('company_id', $companyIds)
                    ->whereIn('role', User::STAFF_ROLES);
            })
                ->orWhere('id', $user->id)
                ->orderBy('apellido')
                ->orderBy('name')
                ->get(['id', 'company_id', 'work_center_id', 'name', 'apellido']);

            $query = ResumenDiario::with(['user:id,name,apellido', 'admin:id,name'])
                ->whereHas('user', function ($q) use ($companyIds, $user) {
                    $q->where(function ($q2) use ($companyIds) {
                        $q2->whereIn('company_id', $companyIds)
                            ->whereIn('role', User::STAFF_ROLES);
                    })->orWhere('id', $user->id);
                })
                ->whereBetween('fecha', [$fechaInicio->toDateString(), $fechaFin->toDateString()]);

            if ($request->filled('empresa_id')) {
                $query->whereHas('user', fn ($q) => $q->where('company_id', $request->empresa_id));
            }

            if ($request->filled('centro_id')) {
                $query->whereHas('user', fn ($q) => $q->where('work_center_id', $request->centro_id));
            }

            if ($request->filled('empleado_id')) {
                $query->where('user_id', $request->empleado_id);
            }

            $registros = $query
                ->orderBy('fecha', 'desc')
                ->paginate(20)
                ->withQueryString()
                ->through(function ($d) {
                    return [
                        'id' => $d->id,
                        'user_id' => $d->user->id,
                        'nombre' => $d->user->name,
                        'apellido' => $d->user->apellido ?? '',
                        'fecha' => $d->fecha->toDateString(),
                        'horas_extra' => $d->horas_extra,
                        'origen' => $d->origen ?? 'auto',
                        'admin_nombre' => $d->admin?->name,
                    ];
                });
        }

        return Inertia::render('configuracion/horas-extra/index', [
            'companies' => $companies,
            'workCenters' => $workCenters,
            'employees' => $employees,
            'registros' => $registros,
            'filters' => $request->only(['empresa_id', 'centro_id', 'empleado_id']),
            'mes' => $mes,
            'anio' => $anio,
        ]);
    }

    public function store(Request $request, HorasExtraService $service)
    {
        $admin = $request->user();
        $companyIds = AdminScope::companyIdsFor($admin);

        $validated = $request->validate([
            'user_id' => 'required|integer|exists:users,id',
            'fecha' => 'required|date',
            'horas_extra' => 'required|integer',
        ]);

        $empleado = $this->resolveManagedUserOrFail(
            (int) $validated['user_id'],
            (int) $admin->id,
            $companyIds,
        );

        $fecha = Carbon::parse($validated['fecha']);
        $existente = ResumenDiario::where('user_id', $empleado->id)
            ->where('fecha', $fecha->toDateString())
            ->first();
        $segundosPrevistos = $existente && $existente->segundos_previstos !== null
            ? max(0, (int) $existente->segundos_previstos)
            : $empleado->horarioPrevistoDia($fecha);
        $horasTrabajadas = $existente
            ? $existente->horas_trabajadas
            : $service->calcularHorasTrabajadas($empleado, $fecha);

        ResumenDiario::updateOrCreate(
            ['user_id' => $empleado->id, 'fecha' => $fecha->toDateString()],
            [
                'horas_trabajadas' => $horasTrabajadas,
                'segundos_previstos' => $segundosPrevistos,
                'horas_extra' => $validated['horas_extra'],
                'origen' => 'manual',
                'admin_id' => $admin->id,
            ]
        );

        HorasExtraLog::create([
            'user_id' => $empleado->id,
            'fecha' => $fecha->toDateString(),
            'horas_trabajadas' => $horasTrabajadas,
            'horas_extra' => $validated['horas_extra'],
            'accion' => 'creado',
            'admin_id' => $admin->id,
        ]);

        return back();
    }

    public function destroy(Request $request, ResumenDiario $resumenDiario, HorasExtraService $service)
    {
        abort_if(
            $resumenDiario->origen !== 'manual',
            422,
            'Solo se pueden eliminar ajustes manuales de horas extra.'
        );

        $admin = $request->user();
        $companyIds = AdminScope::companyIdsFor($admin);
        $empleado = $this->resolveManagedUserOrFail(
            (int) $resumenDiario->user_id,
            (int) $admin->id,
            $companyIds,
        );
        $fecha = Carbon::parse($resumenDiario->fecha)->startOfDay();

        HorasExtraLog::create([
            'user_id' => $resumenDiario->user_id,
            'fecha' => $resumenDiario->fecha->toDateString(),
            'horas_trabajadas' => $resumenDiario->horas_trabajadas,
            'horas_extra' => $resumenDiario->horas_extra,
            'accion' => 'eliminado',
            'admin_id' => $admin->id,
        ]);

        $resumenDiario->delete();
        $service->recalcularDia($empleado, $fecha);

        return back();
    }

    private function resolveManagedUserOrFail(
        int $userId,
        int $adminId,
        $companyIds,
    ): User {
        return User::where(function ($q) use ($companyIds) {
            $q->whereIn('company_id', $companyIds)
                ->whereIn('role', User::STAFF_ROLES);
        })
            ->orWhere('id', $adminId)
            ->findOrFail($userId);
    }
}
