<?php

namespace App\Http\Controllers\Configuracion;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Fichaje;
use App\Models\User;
use App\Models\WorkCenter;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class PdfController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $companies = Company::where('user_id', $user->id)->get(['id', 'nombre']);
        $companyIds = $companies->pluck('id');

        $workCenters = WorkCenter::whereIn('company_id', $companyIds)
            ->get(['id', 'company_id', 'nombre']);

        $employees = User::where(function ($q) use ($companyIds) {
                $q->whereIn('company_id', $companyIds)
                  ->whereIn('role', ['empleado', 'encargado']);
            })
            ->orWhere('id', $user->id)
            ->orderBy('apellido')
            ->orderBy('name')
            ->get(['id', 'company_id', 'work_center_id', 'name', 'apellido', 'remoto']);

        $mes  = (int) $request->input('mes',  now()->month);
        $anio = (int) $request->input('anio', now()->year);

        $query = User::where(function ($q) use ($companyIds) {
            $q->whereIn('company_id', $companyIds)
              ->whereIn('role', ['empleado', 'encargado']);
        })->orWhere('id', $user->id);

        if ($request->filled('empresa_id')) {
            $query->where('company_id', $request->empresa_id);
        }

        if ($request->filled('centro_id')) {
            $query->where('work_center_id', $request->centro_id);
        }

        if ($request->filled('empleado_id')) {
            $query->where('id', $request->empleado_id);
        }

        $empleadosFiltrados = $query
            ->with(['fichajes' => function ($q) use ($mes, $anio) {
                $q->whereMonth('fecha', $mes)
                  ->whereYear('fecha', $anio)
                  ->orderBy('fecha');
            }])
            ->get(['id', 'company_id', 'work_center_id', 'name', 'apellido', 'dni']);

        $resumen = $empleadosFiltrados->map(fn ($e) => [
            'id'             => $e->id,
            'nombre'         => $e->name,
            'apellido'       => $e->apellido,
            'dni'            => $e->dni,
            'total_segundos' => $e->fichajes->sum('duracion_jornada'),
            'total_dias'     => $e->fichajes->count(),
            'tiene_fichajes' => $e->fichajes->isNotEmpty(),
        ])->values();

        return Inertia::render('configuracion/pdfs/index', [
            'companies'   => $companies,
            'workCenters' => $workCenters,
            'employees'   => $employees,
            'resumen'     => $resumen,
            'filters'     => $request->only(['empresa_id', 'centro_id', 'empleado_id', 'mes', 'anio']),
            'mes'         => $mes,
            'anio'        => $anio,
        ]);
    }

    public function download(Request $request, User $empleado)
    {
        $companyIds = Company::where('user_id', $request->user()->id)->pluck('id');

        abort_if(!$companyIds->contains($empleado->company_id), 403);

        $mes  = (int) $request->query('mes',  now()->month);
        $anio = (int) $request->query('anio', now()->year);

        abort_if($mes < 1 || $mes > 12, 422);
        abort_if($anio < 2000 || $anio > 2100, 422);

        $empleado->load(['company', 'workCenter']);

        $fichajes = Fichaje::where('user_id', $empleado->id)
            ->whereMonth('fecha', $mes)
            ->whereYear('fecha', $anio)
            ->with('pausas')
            ->orderBy('fecha')
            ->get();

        $diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        $meses = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

        $filas = $fichajes->map(function ($f) use ($diasSemana) {
            $totalPausasSeg = $f->pausas->sum('duracion_pausa');

            return [
                'fecha'        => Carbon::parse($f->fecha)->format('d/m/Y'),
                'dia_semana'   => $diasSemana[Carbon::parse($f->fecha)->dayOfWeekIso - 1],
                'entrada'      => $f->inicio_jornada ? Carbon::parse($f->inicio_jornada)->format('H:i') : '—',
                'salida'       => $f->fin_jornada    ? Carbon::parse($f->fin_jornada)->format('H:i')    : '—',
                'pausas'       => $this->formatSeconds($totalPausasSeg),
                'horas'        => $f->duracion_jornada !== null ? $this->formatSeconds($f->duracion_jornada) : '—',
                'estado'       => ucfirst($f->estado),
                'estado_clase' => strtolower($f->estado),
            ];
        })->toArray();

        $totalSegundos = $fichajes->sum('duracion_jornada');
        $totalHoras    = $this->formatSeconds($totalSegundos);
        $mesNombre     = $meses[$mes];

        $pdf = Pdf::loadView('pdf.jornada', [
            'empleado'   => $empleado,
            'empresa'    => $empleado->company,
            'centro'     => $empleado->workCenter,
            'filas'      => $filas,
            'totalHoras' => $totalHoras,
            'mes'        => $mes,
            'anio'       => $anio,
            'mesNombre'  => $mesNombre,
            'generadoEn' => now()->format('d/m/Y H:i'),
        ])->setPaper('A4', 'portrait');

        $filename = sprintf(
            'jornada_%s_%s_%02d_%d.pdf',
            Str::slug($empleado->apellido),
            Str::slug($empleado->name),
            $mes,
            $anio
        );

        return $pdf->download($filename);
    }

    private function formatSeconds(int $seconds): string
    {
        $h = intdiv($seconds, 3600);
        $m = intdiv($seconds % 3600, 60);
        $s = $seconds % 60;
        return sprintf('%02d:%02d:%02d', $h, $m, $s);
    }
}
