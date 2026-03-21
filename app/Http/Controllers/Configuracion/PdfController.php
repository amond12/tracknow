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

        $employees = User::where(function ($query) use ($companyIds) {
            $query->whereIn('company_id', $companyIds)
                ->whereIn('role', ['empleado', 'encargado']);
        })
            ->orWhere('id', $user->id)
            ->orderBy('apellido')
            ->orderBy('name')
            ->get(['id', 'company_id', 'work_center_id', 'name', 'apellido', 'remoto']);

        $mes = (int) $request->input('mes', now()->month);
        $anio = (int) $request->input('anio', now()->year);

        $query = User::where(function ($query) use ($companyIds, $user) {
            $query->where(function ($query) use ($companyIds) {
                $query->whereIn('company_id', $companyIds)
                    ->whereIn('role', ['empleado', 'encargado']);
            })->orWhere('id', $user->id);
        });

        if ($request->filled('empresa_id')) {
            $query->where('company_id', $request->empresa_id);
        }

        if ($request->filled('centro_id')) {
            $query->where('work_center_id', $request->centro_id);
        }

        if ($request->filled('empleado_id')) {
            $query->where('id', $request->empleado_id);
        }

        $resumen = $query
            ->with(['fichajes' => function ($query) use ($mes, $anio) {
                $query->whereMonth('fecha', $mes)
                    ->whereYear('fecha', $anio)
                    ->orderBy('fecha');
            }])
            ->orderBy('apellido')
            ->orderBy('name')
            ->paginate(20, ['id', 'company_id', 'work_center_id', 'name', 'apellido', 'dni'])
            ->withQueryString()
            ->through(fn ($employee) => [
                'id' => $employee->id,
                'nombre' => $employee->name,
                'apellido' => $employee->apellido,
                'dni' => $employee->dni,
                'total_segundos' => $employee->fichajes->sum('duracion_jornada'),
                'total_dias' => $employee->fichajes->count(),
                'tiene_fichajes' => $employee->fichajes->isNotEmpty(),
            ]);

        return Inertia::render('configuracion/pdfs/index', [
            'companies' => $companies,
            'workCenters' => $workCenters,
            'employees' => $employees,
            'resumen' => $resumen,
            'filters' => $request->only(['empresa_id', 'centro_id', 'empleado_id', 'mes', 'anio']),
            'mes' => $mes,
            'anio' => $anio,
        ]);
    }

    public function download(Request $request, User $empleado)
    {
        $companyIds = Company::where('user_id', $request->user()->id)->pluck('id');

        $esPropioAdmin = $empleado->id === $request->user()->id;
        abort_if(! $esPropioAdmin && ! $companyIds->contains($empleado->company_id), 403);

        $mes = (int) $request->query('mes', now()->month);
        $anio = (int) $request->query('anio', now()->year);

        abort_if($mes < 1 || $mes > 12, 422);
        abort_if($anio < 2000 || $anio > 2100, 422);

        $empleado->load(['company', 'workCenter']);

        $empresa = $empleado->company ?? Company::where('user_id', $request->user()->id)->first();
        $centro = $empleado->workCenter ?? $empresa?->workCenters()->first();
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
            ->keyBy(fn ($resumen) => $resumen->fecha->toDateString());

        $diasSemana = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
        $meses = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

        $eventos = Vacacion::where('user_id', $empleado->id)
            ->whereMonth('fecha', $mes)
            ->whereYear('fecha', $anio)
            ->get(['fecha', 'tipo', 'motivo', 'dia_completo', 'hora_inicio', 'hora_fin']);

        $eventosPorFecha = $eventos->keyBy(fn ($evento) => Carbon::parse($evento->fecha)->toDateString());

        $fechasConFichaje = $fichajes->pluck('fecha')
            ->map(fn ($fecha) => Carbon::parse($fecha)->toDateString())
            ->toArray();

        $filas = $fichajes->map(function ($fichaje) use ($diasSemana, $resumenPorFecha, $eventosPorFecha, $timezone) {
            $fecha = Carbon::parse($fichaje->fecha);
            $dateStr = $fecha->toDateString();
            $resumenDia = $resumenPorFecha->get($dateStr);
            $horasExtraSeg = $resumenDia?->horas_extra ?? 0;
            $rowTimeZone = WorkCenterTimezone::resolve($fichaje->timezone ?: $timezone);

            $jornadaSeg = ($fichaje->inicio_jornada && $fichaje->fin_jornada)
                ? Carbon::parse($fichaje->fin_jornada)->diffInSeconds(Carbon::parse($fichaje->inicio_jornada))
                : null;

            $observaciones = '';
            $evento = $eventosPorFecha->get($dateStr);
            if ($evento && $evento->tipo === 'ausencia') {
                if (! $evento->dia_completo && $evento->hora_inicio && $evento->hora_fin) {
                    $observaciones = 'AUSENCIA '.substr($evento->hora_inicio, 0, 5).'-'.substr($evento->hora_fin, 0, 5);
                    if ($evento->motivo) {
                        $observaciones .= ': '.$evento->motivo;
                    }
                } else {
                    $observaciones = 'AUSENCIA'.($evento->motivo ? ': '.$evento->motivo : '');
                }
            }

            return [
                'fecha' => $fecha->format('d/m/Y'),
                'dia_semana' => $diasSemana[$fecha->dayOfWeekIso - 1],
                'entrada' => $fichaje->inicio_jornada ? WorkCenterTimezone::utcToLocal($fichaje->inicio_jornada, $rowTimeZone)->format('H:i') : '-',
                'salida' => $fichaje->fin_jornada ? WorkCenterTimezone::utcToLocal($fichaje->fin_jornada, $rowTimeZone)->format('H:i') : '-',
                'presencia' => $fichaje->duracion_jornada !== null ? $this->formatSeconds($fichaje->duracion_jornada) : '-',
                'jornada' => $jornadaSeg !== null ? $this->formatSeconds($jornadaSeg) : '-',
                'horas_extra' => $horasExtraSeg > 0 ? '+'.$this->formatSeconds($horasExtraSeg) : '',
                'observaciones' => $observaciones,
            ];
        })->toArray();

        foreach ($eventosPorFecha as $fechaStr => $evento) {
            if (! in_array($fechaStr, $fechasConFichaje)) {
                $fecha = Carbon::parse($fechaStr);

                if ($evento->tipo === 'vacacion') {
                    $observaciones = 'VACACIONES';
                } elseif ($evento->tipo === 'ausencia') {
                    if (! $evento->dia_completo && $evento->hora_inicio && $evento->hora_fin) {
                        $observaciones = 'AUSENCIA '.substr($evento->hora_inicio, 0, 5).'-'.substr($evento->hora_fin, 0, 5);
                        if ($evento->motivo) {
                            $observaciones .= ': '.$evento->motivo;
                        }
                    } else {
                        $observaciones = 'AUSENCIA'.($evento->motivo ? ': '.$evento->motivo : '');
                    }
                } else {
                    $observaciones = 'FESTIVO'.($evento->motivo ? ': '.$evento->motivo : '');
                }

                $filas[] = [
                    'fecha' => $fecha->format('d/m/Y'),
                    'dia_semana' => $diasSemana[$fecha->dayOfWeekIso - 1],
                    'entrada' => '-',
                    'salida' => '-',
                    'presencia' => '-',
                    'jornada' => '-',
                    'horas_extra' => '',
                    'observaciones' => $observaciones,
                ];
            }
        }

        usort($filas, function ($a, $b) {
            return strtotime(str_replace('/', '-', $a['fecha'])) <=> strtotime(str_replace('/', '-', $b['fecha']));
        });

        $totalSegundos = $fichajes->sum('duracion_jornada');
        $totalHoras = $this->formatSecondsLong($totalSegundos);
        $mesNombre = $meses[$mes];

        $pdf = Pdf::loadView('pdf.jornada', [
            'empleado' => $empleado,
            'empresa' => $empresa,
            'centro' => $centro,
            'filas' => $filas,
            'totalHoras' => $totalHoras,
            'mes' => $mes,
            'anio' => $anio,
            'mesNombre' => $mesNombre,
            'generadoEn' => WorkCenterTimezone::nowUtc()->setTimezone($timezone)->format('d/m/Y H:i'),
            'esAdmin' => $empleado->role === 'admin',
        ])->setPaper('A4', 'portrait');

        $filename = sprintf(
            'jornada_%s_%s_%02d_%d.pdf',
            Str::slug($empleado->apellido),
            Str::slug($empleado->name),
            $mes,
            $anio,
        );

        return $pdf->download($filename);
    }

    private function formatSeconds(int $seconds): string
    {
        $seconds = abs($seconds);
        $hours = intdiv($seconds, 3600);
        $minutes = intdiv($seconds % 3600, 60);

        return sprintf('%02d:%02d', $hours, $minutes);
    }

    private function formatSecondsLong(int $seconds): string
    {
        $seconds = abs($seconds);
        $hours = intdiv($seconds, 3600);
        $minutes = intdiv($seconds % 3600, 60);

        return $minutes > 0 ? "{$hours}h {$minutes}min" : "{$hours}h";
    }
}
