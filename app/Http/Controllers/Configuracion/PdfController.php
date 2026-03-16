<?php

namespace App\Http\Controllers\Configuracion;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Fichaje;
use App\Models\ResumenDiario;
use App\Models\User;
use App\Models\Vacacion;
use App\Models\WorkCenter;
use App\Support\WorkCenterTimezone;
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

        $esPropioAdmin = $empleado->id === $request->user()->id;
        abort_if(!$esPropioAdmin && !$companyIds->contains($empleado->company_id), 403);

        $mes  = (int) $request->query('mes',  now()->month);
        $anio = (int) $request->query('anio', now()->year);

        abort_if($mes < 1 || $mes > 12, 422);
        abort_if($anio < 2000 || $anio > 2100, 422);

        $empleado->load(['company', 'workCenter']);

        $empresa = $empleado->company ?? Company::where('user_id', $request->user()->id)->first();
        $centro  = $empleado->workCenter ?? $empresa?->workCenters()->first();
        $timezone = WorkCenterTimezone::resolve($centro);

        $fichajes = Fichaje::where('user_id', $empleado->id)
            ->whereMonth('fecha', $mes)
            ->whereYear('fecha', $anio)
            ->with('pausas')
            ->orderBy('fecha')
            ->get();

        $resumenPorFecha = ResumenDiario::where('user_id', $empleado->id)
            ->whereMonth('fecha', $mes)
            ->whereYear('fecha', $anio)
            ->get()
            ->keyBy(fn ($r) => $r->fecha->toDateString());

        $diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        $meses = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

        $eventos = Vacacion::where('user_id', $empleado->id)
            ->whereMonth('fecha', $mes)
            ->whereYear('fecha', $anio)
            ->get(['fecha', 'tipo', 'motivo', 'dia_completo', 'hora_inicio', 'hora_fin']);

        $eventosPorFecha = $eventos->keyBy(fn ($e) => Carbon::parse($e->fecha)->toDateString());

        $fechasConFichaje = $fichajes->pluck('fecha')
            ->map(fn ($f) => Carbon::parse($f)->toDateString())
            ->toArray();

        $filas = $fichajes->map(function ($f) use ($diasSemana, $resumenPorFecha, $eventosPorFecha, $timezone) {
            $fecha = Carbon::parse($f->fecha);
            $dateStr = $fecha->toDateString();
            $resumenDia = $resumenPorFecha->get($dateStr);
            $horasExtraSeg = $resumenDia?->horas_extra ?? 0;

            $jornadaSeg = ($f->inicio_jornada && $f->fin_jornada)
                ? Carbon::parse($f->fin_jornada)->diffInSeconds(Carbon::parse($f->inicio_jornada))
                : null;

            // Observación: ausencias parciales en días con fichaje
            $obs = '';
            $evento = $eventosPorFecha->get($dateStr);
            if ($evento && $evento->tipo === 'ausencia') {
                if (!$evento->dia_completo && $evento->hora_inicio && $evento->hora_fin) {
                    $obs = 'AUSENCIA ' . substr($evento->hora_inicio, 0, 5) . '-' . substr($evento->hora_fin, 0, 5);
                    if ($evento->motivo) $obs .= ': ' . $evento->motivo;
                } else {
                    $obs = 'AUSENCIA' . ($evento->motivo ? ': ' . $evento->motivo : '');
                }
            }

            return [
                'fecha'        => $fecha->format('d/m/Y'),
                'dia_semana'   => $diasSemana[$fecha->dayOfWeekIso - 1],
                'entrada'      => $f->inicio_jornada ? WorkCenterTimezone::utcToLocal($f->inicio_jornada, $timezone)->format('H:i') : '—',
                'salida'       => $f->fin_jornada    ? WorkCenterTimezone::utcToLocal($f->fin_jornada, $timezone)->format('H:i')    : '—',
                'presencia'    => $f->duracion_jornada !== null ? $this->formatSeconds($f->duracion_jornada) : '—',
                'jornada'      => $jornadaSeg !== null ? $this->formatSeconds($jornadaSeg) : '—',
                'horas_extra'  => $horasExtraSeg > 0 ? ('+' . $this->formatSeconds($horasExtraSeg)) : '',
                'observaciones' => $obs,
            ];
        })->toArray();

        // Filas sin fichaje: vacaciones, ausencias y festivos
        foreach ($eventosPorFecha as $fechaStr => $evento) {
            if (!in_array($fechaStr, $fechasConFichaje)) {
                $fecha = Carbon::parse($fechaStr);

                if ($evento->tipo === 'vacacion') {
                    $obs = 'VACACIONES';
                } elseif ($evento->tipo === 'ausencia') {
                    if (!$evento->dia_completo && $evento->hora_inicio && $evento->hora_fin) {
                        $obs = 'AUSENCIA ' . substr($evento->hora_inicio, 0, 5) . '-' . substr($evento->hora_fin, 0, 5);
                        if ($evento->motivo) $obs .= ': ' . $evento->motivo;
                    } else {
                        $obs = 'AUSENCIA' . ($evento->motivo ? ': ' . $evento->motivo : '');
                    }
                } else {
                    $obs = 'FESTIVO' . ($evento->motivo ? ': ' . $evento->motivo : '');
                }

                $filas[] = [
                    'fecha'        => $fecha->format('d/m/Y'),
                    'dia_semana'   => $diasSemana[$fecha->dayOfWeekIso - 1],
                    'entrada'      => '—',
                    'salida'       => '—',
                    'presencia'    => '—',
                    'jornada'      => '—',
                    'horas_extra'  => '',
                    'observaciones' => $obs,
                ];
            }
        }

        usort($filas, function ($a, $b) {
            return strtotime(str_replace('/', '-', $a['fecha'])) <=> strtotime(str_replace('/', '-', $b['fecha']));
        });

        $totalSegundos = $fichajes->sum('duracion_jornada');
        $totalHoras    = $this->formatSecondsLong($totalSegundos);
        $mesNombre     = $meses[$mes];

        $pdf = Pdf::loadView('pdf.jornada', [
            'empleado'   => $empleado,
            'empresa'    => $empresa,
            'centro'     => $centro,
            'filas'      => $filas,
            'totalHoras' => $totalHoras,
            'mes'        => $mes,
            'anio'       => $anio,
            'mesNombre'  => $mesNombre,
            'generadoEn' => WorkCenterTimezone::nowUtc()->setTimezone($timezone)->format('d/m/Y H:i'),
            'esAdmin'    => $empleado->role === 'admin',
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
        $seconds = abs($seconds);
        $h = intdiv($seconds, 3600);
        $m = intdiv($seconds % 3600, 60);
        return sprintf('%02d:%02d', $h, $m);
    }

    private function formatSecondsLong(int $seconds): string
    {
        $seconds = abs($seconds);
        $h = intdiv($seconds, 3600);
        $m = intdiv($seconds % 3600, 60);
        return $m > 0 ? "{$h}h {$m}min" : "{$h}h";
    }
}
