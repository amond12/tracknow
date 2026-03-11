<?php

namespace App\Http\Controllers\Configuracion;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Fichaje;
use App\Models\User;
use App\Models\Vacacion;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VacacionesController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $companyIds = Company::where('user_id', $user->id)->pluck('id');

        $employees = User::where(function ($q) use ($companyIds) {
                $q->whereIn('company_id', $companyIds)
                  ->whereIn('role', ['empleado', 'encargado']);
            })
            ->orderBy('apellido')
            ->orderBy('name')
            ->get(['id', 'name', 'apellido']);

        $mes        = (int) $request->input('mes',  now()->month);
        $anio       = (int) $request->input('anio', now()->year);
        $empleadoId = $request->input('empleado_id');
        $modo       = $request->input('modo', 'mes'); // 'mes' | 'anio'

        $vacaciones     = [];
        $fichajesDelMes = [];

        if ($empleadoId) {
            $esPropioAdmin = (int) $empleadoId === $user->id;
            $empleadoValido = $employees->contains('id', (int) $empleadoId);
            abort_if(!$esPropioAdmin && !$empleadoValido, 403);

            $queryVac = Vacacion::where('user_id', $empleadoId)
                ->whereYear('fecha', $anio);

            $queryFich = Fichaje::where('user_id', $empleadoId)
                ->whereYear('fecha', $anio);

            if ($modo === 'mes') {
                $queryVac->whereMonth('fecha', $mes);
                $queryFich->whereMonth('fecha', $mes);
            }

            $vacaciones = $queryVac
                ->pluck('fecha')
                ->map(fn ($f) => Carbon::parse($f)->format('Y-m-d'))
                ->values()
                ->toArray();

            $fichajesDelMes = $queryFich
                ->pluck('fecha')
                ->map(fn ($f) => Carbon::parse($f)->format('Y-m-d'))
                ->values()
                ->toArray();
        }

        return Inertia::render('configuracion/vacaciones/index', [
            'employees'      => $employees,
            'mes'            => $mes,
            'anio'           => $anio,
            'modo'           => $modo,
            'empleadoId'     => $empleadoId ? (int) $empleadoId : null,
            'vacaciones'     => $vacaciones,
            'fichajesDelMes' => $fichajesDelMes,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id'  => 'required|integer|exists:users,id',
            'anio'     => 'required|integer|min:2000|max:2100',
            'mes'      => 'nullable|integer|min:1|max:12',
            'fechas'   => 'present|array',
            'fechas.*' => 'date_format:Y-m-d',
        ]);

        $user = $request->user();
        $companyIds = Company::where('user_id', $user->id)->pluck('id');
        $empleado = User::findOrFail($validated['user_id']);

        $esPropioAdmin = $empleado->id === $user->id;
        abort_if(!$esPropioAdmin && !$companyIds->contains($empleado->company_id), 403);

        $query = Vacacion::where('user_id', $validated['user_id'])
            ->whereYear('fecha', $validated['anio']);

        if (!empty($validated['mes'])) {
            $query->whereMonth('fecha', $validated['mes']);
        }

        $query->delete();

        foreach ($validated['fechas'] as $fecha) {
            Vacacion::create([
                'user_id' => $validated['user_id'],
                'fecha'   => $fecha,
            ]);
        }

        return back()->with('success', 'Vacaciones guardadas correctamente.');
    }
}
