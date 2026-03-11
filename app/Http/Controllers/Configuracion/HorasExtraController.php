<?php

namespace App\Http\Controllers\Configuracion;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\ResumenDiario;
use App\Models\User;
use App\Models\WorkCenter;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HorasExtraController extends Controller
{
    public function index(Request $request)
    {
        $user       = $request->user();
        $companies  = Company::where('user_id', $user->id)->get(['id', 'nombre']);
        $companyIds = $companies->pluck('id');

        $workCenters = WorkCenter::whereIn('company_id', $companyIds)
            ->get(['id', 'company_id', 'nombre']);

        $employees = User::where(function ($q) use ($companyIds) {
                $q->whereIn('company_id', $companyIds)
                  ->whereIn('role', ['empleado', 'encargado']);
            })
            ->orderBy('apellido')
            ->orderBy('name')
            ->get(['id', 'company_id', 'work_center_id', 'name', 'apellido',
                   'horario_lunes', 'horario_martes', 'horario_miercoles',
                   'horario_jueves', 'horario_viernes', 'horario_sabado', 'horario_domingo']);

        $mes  = (int) $request->input('mes',  now()->month);
        $anio = (int) $request->input('anio', now()->year);

        $fechaInicio = Carbon::create($anio, $mes, 1)->startOfMonth();
        $fechaFin    = $fechaInicio->copy()->endOfMonth();

        $query = ResumenDiario::with('user:id,name,apellido')
            ->whereHas('user', function ($q) use ($companyIds) {
                $q->whereIn('company_id', $companyIds)
                  ->whereIn('role', ['empleado', 'encargado']);
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

        $registros = $query->orderBy('fecha', 'desc')->get();

        $resumenPorEmpleado = $registros->groupBy('user_id')->map(function ($dias) {
            $firstUser = $dias->first()->user;

            return [
                'user_id'         => $firstUser->id,
                'nombre'          => $firstUser->name,
                'apellido'        => $firstUser->apellido ?? '',
                'total_trabajado' => $dias->sum('horas_trabajadas'),
                'total_extra'     => $dias->sum('horas_extra'),
                'dias'            => $dias->map(fn ($d) => [
                    'fecha'            => $d->fecha->toDateString(),
                    'horas_trabajadas' => $d->horas_trabajadas,
                    'horas_extra'      => $d->horas_extra,
                ])->values(),
            ];
        })->values();

        return Inertia::render('configuracion/horas-extra/index', [
            'companies'          => $companies,
            'workCenters'        => $workCenters,
            'employees'          => $employees,
            'resumenPorEmpleado' => $resumenPorEmpleado,
            'filters'            => $request->only(['empresa_id', 'centro_id', 'empleado_id']),
            'mes'                => $mes,
            'anio'               => $anio,
        ]);
    }
}
