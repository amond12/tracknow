<?php

namespace App\Http\Controllers\Configuracion;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Fichaje;
use App\Models\User;
use App\Models\Vacacion;
use App\Models\WorkCenter;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class CalendarioController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $companyIds = Company::where('user_id', $user->id)->pluck('id');

        $employees = User::where(function ($q) use ($companyIds) {
                $q->whereIn('company_id', $companyIds)
                  ->whereIn('role', ['empleado', 'encargado']);
            })
            ->orWhere('id', $user->id)
            ->orderBy('apellido')
            ->orderBy('name')
            ->get(['id', 'name', 'apellido']);

        $anio       = (int) $request->input('anio', now()->year);
        $empleadoId = $request->input('empleado_id');

        $eventos    = [];
        $fichajes   = [];

        if ($empleadoId) {
            $esPropioAdmin  = (int) $empleadoId === $user->id;
            $empleadoValido = $employees->contains('id', (int) $empleadoId);
            abort_if(!$esPropioAdmin && !$empleadoValido, 403);

            $eventos = Vacacion::where('user_id', $empleadoId)
                ->whereYear('fecha', $anio)
                ->get(['id', 'fecha', 'tipo', 'motivo', 'dia_completo', 'hora_inicio', 'hora_fin'])
                ->map(fn ($e) => [
                    'id'          => $e->id,
                    'fecha'       => Carbon::parse($e->fecha)->format('Y-m-d'),
                    'tipo'        => $e->tipo,
                    'motivo'      => $e->motivo,
                    'dia_completo' => (bool) $e->dia_completo,
                    'hora_inicio' => $e->hora_inicio ? substr($e->hora_inicio, 0, 5) : null,
                    'hora_fin'    => $e->hora_fin    ? substr($e->hora_fin, 0, 5)    : null,
                ])
                ->values()
                ->toArray();

            $fichajes = Fichaje::where('user_id', $empleadoId)
                ->whereYear('fecha', $anio)
                ->pluck('fecha')
                ->map(fn ($f) => Carbon::parse($f)->format('Y-m-d'))
                ->values()
                ->toArray();
        }

        $centros = WorkCenter::whereIn('company_id', $companyIds)
            ->orderBy('nombre')
            ->get(['id', 'company_id', 'nombre']);

        return Inertia::render('configuracion/calendario/index', [
            'employees'  => $employees,
            'centros'    => $centros,
            'anio'       => $anio,
            'empleadoId' => $empleadoId ? (int) $empleadoId : null,
            'eventos'    => $eventos,
            'fichajes'   => $fichajes,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id'     => 'required|integer|exists:users,id',
            'fecha'       => 'required|date_format:Y-m-d',
            'tipo'        => 'required|in:vacacion,ausencia,festivo',
            'motivo'      => 'nullable|string|max:500',
            'dia_completo' => 'required|boolean',
            'hora_inicio' => 'nullable|date_format:H:i',
            'hora_fin'    => 'nullable|date_format:H:i',
        ]);

        if ($validated['tipo'] === 'ausencia' && empty($validated['motivo'])) {
            return response()->json(['message' => 'El motivo es obligatorio para ausencias.'], 422);
        }

        if (!$validated['dia_completo']) {
            if (empty($validated['hora_inicio']) || empty($validated['hora_fin'])) {
                return response()->json(['message' => 'Las horas de inicio y fin son obligatorias si no es día completo.'], 422);
            }
        }

        $user = $request->user();
        $companyIds = Company::where('user_id', $user->id)->pluck('id');
        $empleado = User::findOrFail($validated['user_id']);

        $esPropioAdmin = $empleado->id === $user->id;
        abort_if(!$esPropioAdmin && !$companyIds->contains($empleado->company_id), 403);

        $evento = Vacacion::updateOrCreate(
            ['user_id' => $validated['user_id'], 'fecha' => $validated['fecha']],
            [
                'tipo'        => $validated['tipo'],
                'motivo'      => $validated['motivo'] ?? null,
                'dia_completo' => $validated['dia_completo'],
                'hora_inicio' => $validated['dia_completo'] ? null : ($validated['hora_inicio'] ?? null),
                'hora_fin'    => $validated['dia_completo'] ? null : ($validated['hora_fin'] ?? null),
            ]
        );

        return response()->json([
            'success' => true,
            'evento'  => [
                'id'          => $evento->id,
                'fecha'       => Carbon::parse($evento->fecha)->format('Y-m-d'),
                'tipo'        => $evento->tipo,
                'motivo'      => $evento->motivo,
                'dia_completo' => (bool) $evento->dia_completo,
                'hora_inicio' => $evento->hora_inicio ? substr($evento->hora_inicio, 0, 5) : null,
                'hora_fin'    => $evento->hora_fin    ? substr($evento->hora_fin, 0, 5)    : null,
            ],
        ]);
    }

    public function storeRango(Request $request)
    {
        $validated = $request->validate([
            'user_id'      => 'required|integer|exists:users,id',
            'fecha_inicio' => 'required|date_format:Y-m-d',
            'fecha_fin'    => 'required|date_format:Y-m-d|after_or_equal:fecha_inicio',
        ]);

        $user = $request->user();
        $companyIds = Company::where('user_id', $user->id)->pluck('id');
        $empleado = User::findOrFail($validated['user_id']);

        $esPropioAdmin = $empleado->id === $user->id;
        abort_if(!$esPropioAdmin && !$companyIds->contains($empleado->company_id), 403);

        $inicio = Carbon::parse($validated['fecha_inicio']);
        $fin    = Carbon::parse($validated['fecha_fin']);

        if ($fin->diffInDays($inicio) > 90) {
            return response()->json(['message' => 'El rango no puede superar 90 días.'], 422);
        }

        $eventos = [];
        $current = $inicio->copy();
        while ($current->lte($fin)) {
            $evento = Vacacion::updateOrCreate(
                ['user_id' => $validated['user_id'], 'fecha' => $current->toDateString()],
                ['tipo' => 'vacacion', 'motivo' => null, 'dia_completo' => true, 'hora_inicio' => null, 'hora_fin' => null]
            );
            $eventos[] = [
                'id'           => $evento->id,
                'fecha'        => $current->format('Y-m-d'),
                'tipo'         => 'vacacion',
                'motivo'       => null,
                'dia_completo' => true,
                'hora_inicio'  => null,
                'hora_fin'     => null,
            ];
            $current->addDay();
        }

        return response()->json(['success' => true, 'eventos' => $eventos]);
    }

    public function destroy(Request $request, Vacacion $vacacion)
    {
        $user = $request->user();
        $companyIds = Company::where('user_id', $user->id)->pluck('id');
        $empleado = User::findOrFail($vacacion->user_id);

        $esPropioAdmin = $empleado->id === $user->id;
        abort_if(!$esPropioAdmin && !$companyIds->contains($empleado->company_id), 403);

        $vacacion->delete();

        return response()->json(['success' => true]);
    }

    public function storeCentro(Request $request)
    {
        $validated = $request->validate([
            'centro_id'    => 'required|integer|exists:work_centers,id',
            'tipo'         => 'required|in:vacacion,festivo',
            'motivo'       => 'nullable|string|max:500',
            'fecha_inicio' => 'required|date_format:Y-m-d',
            'fecha_fin'    => 'required|date_format:Y-m-d|after_or_equal:fecha_inicio',
        ]);

        $user = $request->user();
        $companyIds = Company::where('user_id', $user->id)->pluck('id');
        $centro = WorkCenter::findOrFail($validated['centro_id']);
        abort_if(!$companyIds->contains($centro->company_id), 403);

        $inicio = Carbon::parse($validated['fecha_inicio']);
        $fin    = Carbon::parse($validated['fecha_fin']);
        if ($fin->diffInDays($inicio) > 90) {
            return response()->json(['message' => 'El rango no puede superar 90 días.'], 422);
        }

        $empleadoIds = User::where('work_center_id', $validated['centro_id'])
            ->whereIn('role', ['empleado', 'encargado'])
            ->pluck('id');

        if ($empleadoIds->isEmpty()) {
            return response()->json(['message' => 'Este centro no tiene empleados asignados.'], 422);
        }

        $totalDias = 0;
        $current = $inicio->copy();
        while ($current->lte($fin)) {
            foreach ($empleadoIds as $empId) {
                Vacacion::updateOrCreate(
                    ['user_id' => $empId, 'fecha' => $current->toDateString()],
                    [
                        'tipo'        => $validated['tipo'],
                        'motivo'      => $validated['motivo'] ?? null,
                        'dia_completo' => true,
                        'hora_inicio' => null,
                        'hora_fin'    => null,
                    ]
                );
            }
            $totalDias++;
            $current->addDay();
        }

        return response()->json([
            'success'         => true,
            'total_empleados' => $empleadoIds->count(),
            'total_dias'      => $totalDias,
        ]);
    }

    public function downloadPdf(Request $request, User $empleado)
    {
        $user = $request->user();
        $companyIds = Company::where('user_id', $user->id)->pluck('id');
        $esPropioAdmin = $empleado->id === $user->id;
        abort_if(!$esPropioAdmin && !$companyIds->contains($empleado->company_id), 403);

        $anio = (int) $request->query('anio', now()->year);
        abort_if($anio < 2000 || $anio > 2100, 422);

        $empleado->load(['company', 'workCenter']);
        $empresa = $empleado->company ?? Company::where('user_id', $user->id)->first();

        $eventos = Vacacion::where('user_id', $empleado->id)
            ->whereYear('fecha', $anio)
            ->get(['fecha', 'tipo', 'motivo', 'dia_completo', 'hora_inicio', 'hora_fin']);
        $eventosPorFecha = $eventos->keyBy(fn ($e) => Carbon::parse($e->fecha)->toDateString());

        $fichajesSet = Fichaje::where('user_id', $empleado->id)
            ->whereYear('fecha', $anio)
            ->pluck('fecha')
            ->map(fn ($f) => Carbon::parse($f)->toDateString())
            ->flip()
            ->toArray();

        $mesesNombre = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        $meses = [];
        for ($m = 1; $m <= 12; $m++) {
            $inicio = Carbon::create($anio, $m, 1);
            $offset = $inicio->dayOfWeekIso - 1;
            $dias = [];
            for ($d = 1; $d <= $inicio->daysInMonth; $d++) {
                $ds = Carbon::create($anio, $m, $d)->toDateString();
                $evento = $eventosPorFecha->get($ds);
                $hasFichaje = isset($fichajesSet[$ds]);
                $dias[] = [
                    'dia'        => $d,
                    'tipo'       => $evento ? $evento->tipo : ($hasFichaje ? 'fichaje' : null),
                    'con_evento' => $evento && $hasFichaje,
                ];
            }
            $meses[] = ['nombre' => $mesesNombre[$m], 'offset' => $offset, 'dias' => $dias];
        }

        $totalVac = $eventos->where('tipo', 'vacacion')->count();
        $totalAus = $eventos->where('tipo', 'ausencia')->count();
        $totalFes = $eventos->where('tipo', 'festivo')->count();
        $totalFic = count($fichajesSet);

        $pdf = Pdf::loadView('pdf.calendario', [
            'empleado'   => $empleado,
            'empresa'    => $empresa,
            'anio'       => $anio,
            'meses'      => $meses,
            'totalVac'   => $totalVac,
            'totalAus'   => $totalAus,
            'totalFes'   => $totalFes,
            'totalFic'   => $totalFic,
            'generadoEn' => now()->format('d/m/Y H:i'),
        ])->setPaper('A4', 'landscape');

        $filename = sprintf('calendario_%s_%s_%d.pdf',
            Str::slug($empleado->apellido), Str::slug($empleado->name), $anio);

        return $pdf->download($filename);
    }
}
