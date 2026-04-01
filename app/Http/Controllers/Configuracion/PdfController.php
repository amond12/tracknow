<?php

namespace App\Http\Controllers\Configuracion;

use App\Http\Controllers\Controller;
use App\Models\Fichaje;
use App\Models\JornadaPdfSignature;
use App\Models\ResumenDiario;
use App\Models\User;
use App\Models\Vacacion;
use App\Models\WorkCenter;
use App\Support\AdminScope;
use App\Support\WorkCenterTimezone;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class PdfController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $mes = (int) $request->input('mes', now()->month);
        $anio = (int) $request->input('anio', now()->year);

        abort_if($mes < 1 || $mes > 12, 422);
        abort_if($anio < 2000 || $anio > 2100, 422);

        [$fechaInicio, $fechaFin] = $this->monthDateRange($anio, $mes);

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
                'remoto' => $user->remoto,
            ]]);

            $resumen = User::whereKey($user->id)
                ->withCount(['fichajes as total_dias' => function ($query) use ($fechaInicio, $fechaFin) {
                    $query->whereBetween('fecha', [$fechaInicio, $fechaFin]);
                }])
                ->withSum(['fichajes as total_segundos' => function ($query) use ($fechaInicio, $fechaFin) {
                    $query->whereBetween('fecha', [$fechaInicio, $fechaFin]);
                }], 'duracion_jornada')
                ->paginate(20, ['id', 'company_id', 'work_center_id', 'name', 'apellido', 'dni'])
                ->withQueryString();
        } else {
            $companies = AdminScope::companyQueryFor($user)->get(['id', 'nombre']);
            $companyIds = $companies->pluck('id');

            $workCenters = WorkCenter::whereIn('company_id', $companyIds)
                ->get(['id', 'company_id', 'nombre']);

            $employees = User::where(function ($query) use ($companyIds) {
                $query->whereIn('company_id', $companyIds)
                    ->whereIn('role', User::STAFF_ROLES);
            })
                ->orWhere('id', $user->id)
                ->orderBy('apellido')
                ->orderBy('name')
                ->get(['id', 'company_id', 'work_center_id', 'name', 'apellido', 'remoto']);

            $query = User::where(function ($query) use ($companyIds, $user) {
                $query->where(function ($query) use ($companyIds) {
                    $query->whereIn('company_id', $companyIds)
                        ->whereIn('role', User::STAFF_ROLES);
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
                ->withCount(['fichajes as total_dias' => function ($query) use ($fechaInicio, $fechaFin) {
                    $query->whereBetween('fecha', [$fechaInicio, $fechaFin]);
                }])
                ->withSum(['fichajes as total_segundos' => function ($query) use ($fechaInicio, $fechaFin) {
                    $query->whereBetween('fecha', [$fechaInicio, $fechaFin]);
                }], 'duracion_jornada')
                ->orderBy('apellido')
                ->orderBy('name')
                ->paginate(20, ['id', 'company_id', 'work_center_id', 'name', 'apellido', 'dni'])
                ->withQueryString();
        }

        return Inertia::render('configuracion/pdfs/index', [
            'companies' => $companies,
            'workCenters' => $workCenters,
            'employees' => $employees,
            'resumen' => $this->transformResumen($resumen, $anio, $mes),
            'filters' => $request->only(['empresa_id', 'centro_id', 'empleado_id', 'mes', 'anio']),
            'mes' => $mes,
            'anio' => $anio,
        ]);
    }

    public function download(Request $request, User $empleado)
    {
        $user = $request->user();

        $this->ensureCanAccessPdf($user, $empleado);

        $mes = (int) $request->query('mes', now()->month);
        $anio = (int) $request->query('anio', now()->year);

        abort_if($mes < 1 || $mes > 12, 422);
        abort_if($anio < 2000 || $anio > 2100, 422);
        [$fechaInicio, $fechaFin] = $this->monthDateRange($anio, $mes);

        $empleado->load(['company', 'workCenter']);

        $empresa = $empleado->company ?? AdminScope::companyQueryFor($user)->first();
        $centro = $empleado->workCenter ?? $empresa?->workCenters()->first();
        $timezone = WorkCenterTimezone::resolve($centro);

        $fichajes = Fichaje::where('user_id', $empleado->id)
            ->whereBetween('fecha', [$fechaInicio, $fechaFin])
            ->with('pausas')
            ->orderBy('fecha')
            ->get();

        $resumenPorFecha = ResumenDiario::where('user_id', $empleado->id)
            ->whereBetween('fecha', [$fechaInicio, $fechaFin])
            ->get()
            ->keyBy(fn ($resumen) => $resumen->fecha->toDateString());

        $diasSemana = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
        $meses = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

        $eventos = Vacacion::where('user_id', $empleado->id)
            ->whereBetween('fecha', [$fechaInicio, $fechaFin])
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
        $firma = JornadaPdfSignature::query()
            ->where('employee_id', $empleado->id)
            ->where('month', $mes)
            ->where('year', $anio)
            ->first();

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
            'firmas' => $this->signaturePdfData($firma, $empleado, $empresa),
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

    public function sign(Request $request, User $empleado)
    {
        $user = $request->user();
        $validated = $request->validate([
            'mes' => ['required', 'integer', 'between:1,12'],
            'anio' => ['required', 'integer', 'between:2000,2100'],
            'side' => ['required', 'string', 'in:company,employee'],
            'signature' => ['required', 'string', 'max:2000000'],
        ]);

        $mes = (int) $validated['mes'];
        $anio = (int) $validated['anio'];
        $side = $validated['side'];

        $this->ensureCanAccessPdf($user, $empleado);
        $this->ensureCanSignSide($user, $empleado, $side);

        $signature = JornadaPdfSignature::query()->firstOrNew([
            'employee_id' => $empleado->id,
            'month' => $mes,
            'year' => $anio,
        ]);

        if ($signature->exists && $signature->isLocked()) {
            throw ValidationException::withMessages([
                'signature' => 'Este documento ya tiene ambas firmas y ha quedado bloqueado.',
            ]);
        }

        if ($side === 'company'
            && $signature->company_signer_user_id !== null
            && $signature->company_signer_user_id !== $user->id
        ) {
            throw ValidationException::withMessages([
                'signature' => 'La firma de empresa solo puede reemplazarla el mismo firmante mientras el documento siga abierto.',
            ]);
        }

        $binary = $this->decodeSignaturePayload($validated['signature']);
        $path = $this->signaturePathFor($empleado->id, $anio, $mes, $side);

        Storage::disk('public')->put($path, $binary);

        if ($side === 'company') {
            $signature->company_signer_user_id = $user->id;
            $signature->company_signer_name = $this->fullName($user);
            $signature->company_signer_title = $this->companySignerTitle($user);
            $signature->company_signature_path = $path;
            $signature->company_signed_at = now();
        } else {
            $signature->employee_signer_user_id = $user->id;
            $signature->employee_signer_name = $this->fullName($user);
            $signature->employee_signature_path = $path;
            $signature->employee_signed_at = now();
        }

        $signature->locked_at = $this->shouldLockSignature($signature)
            ? ($signature->locked_at ?? now())
            : null;
        $signature->save();

        return back();
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

    private function transformResumen(LengthAwarePaginator $paginator, int $anio, int $mes): LengthAwarePaginator
    {
        $signatures = $this->signatureMapFor($paginator->getCollection()->pluck('id'), $anio, $mes);

        $paginator->setCollection($paginator->getCollection()->map(
            fn (User $employee) => [
                'id' => $employee->id,
                'nombre' => $employee->name,
                'apellido' => $employee->apellido,
                'dni' => $employee->dni,
                'total_segundos' => (int) ($employee->total_segundos ?? 0),
                'total_dias' => (int) ($employee->total_dias ?? 0),
                'tiene_fichajes' => (int) ($employee->total_dias ?? 0) > 0,
                'firmas' => $this->signatureSummary($signatures->get($employee->id)),
            ],
        ));

        return $paginator;
    }

    private function signatureMapFor(Collection $employeeIds, int $anio, int $mes): Collection
    {
        if ($employeeIds->isEmpty()) {
            return collect();
        }

        return JornadaPdfSignature::query()
            ->whereIn('employee_id', $employeeIds->all())
            ->where('year', $anio)
            ->where('month', $mes)
            ->get()
            ->keyBy('employee_id');
    }

    /**
     * @return array{
     *     companySigned: bool,
     *     employeeSigned: bool,
     *     locked: bool,
     *     companySignerName: string|null,
     *     companySignerTitle: string|null,
     *     companySignerUserId: int|null,
     *     companySignedAt: string|null,
     *     employeeSignerName: string|null,
     *     employeeSignerUserId: int|null,
     *     employeeSignedAt: string|null
     * }
     */
    private function signatureSummary(?JornadaPdfSignature $signature): array
    {
        return [
            'companySigned' => $signature?->company_signed_at !== null,
            'employeeSigned' => $signature?->employee_signed_at !== null,
            'locked' => $signature?->isLocked() ?? false,
            'companySignerName' => $signature?->company_signer_name,
            'companySignerTitle' => $signature?->company_signer_title,
            'companySignerUserId' => $signature?->company_signer_user_id,
            'companySignedAt' => $signature?->company_signed_at?->toIso8601String(),
            'employeeSignerName' => $signature?->employee_signer_name,
            'employeeSignerUserId' => $signature?->employee_signer_user_id,
            'employeeSignedAt' => $signature?->employee_signed_at?->toIso8601String(),
        ];
    }

    /**
     * @return array{
     *     locked: bool,
     *     company: array{signed: bool, name: string|null, title: string|null, signed_at: string|null, image: string|null, company_name: string|null},
     *     employee: array{signed: bool, name: string|null, signed_at: string|null, image: string|null}
     * }
     */
    private function signaturePdfData(?JornadaPdfSignature $signature, User $empleado, ?object $empresa): array
    {
        return [
            'locked' => $signature?->isLocked() ?? false,
            'company' => [
                'signed' => $signature?->company_signed_at !== null,
                'name' => $signature?->company_signer_name,
                'title' => $signature?->company_signer_title,
                'signed_at' => $signature?->company_signed_at?->format('d/m/Y'),
                'image' => $this->signatureImageData($signature?->company_signature_path),
                'company_name' => $empresa?->nombre,
            ],
            'employee' => [
                'signed' => $signature?->employee_signed_at !== null,
                'name' => $signature?->employee_signer_name ?: $this->fullName($empleado),
                'signed_at' => $signature?->employee_signed_at?->format('d/m/Y'),
                'image' => $this->signatureImageData($signature?->employee_signature_path),
            ],
        ];
    }

    private function signatureImageData(?string $path): ?string
    {
        if (! $path || ! Storage::disk('public')->exists($path)) {
            return null;
        }

        return 'data:image/png;base64,'.base64_encode(Storage::disk('public')->get($path));
    }

    private function ensureCanAccessPdf(User $user, User $empleado): void
    {
        if ($user->isEmpleado()) {
            abort_if($empleado->id !== $user->id, 403);

            return;
        }

        $companyIds = AdminScope::companyIdsFor($user);
        $esPropioUsuario = $empleado->id === $user->id;

        abort_if(! $esPropioUsuario && ! $companyIds->contains($empleado->company_id), 403);
    }

    private function ensureCanSignSide(User $user, User $empleado, string $side): void
    {
        if ($side === 'employee') {
            abort_if($empleado->id !== $user->id, 403);

            return;
        }

        abort_if(! $user->isManager(), 403);

        $companyIds = AdminScope::companyIdsFor($user);
        $esPropioUsuario = $empleado->id === $user->id;

        abort_if(! $esPropioUsuario && ! $companyIds->contains($empleado->company_id), 403);
    }

    private function shouldLockSignature(JornadaPdfSignature $signature): bool
    {
        return $signature->company_signed_at !== null && $signature->employee_signed_at !== null;
    }

    private function decodeSignaturePayload(string $payload): string
    {
        $prefix = 'data:image/png;base64,';

        if (! str_starts_with($payload, $prefix)) {
            throw ValidationException::withMessages([
                'signature' => 'La firma debe enviarse como una imagen PNG válida.',
            ]);
        }

        $binary = base64_decode(substr($payload, strlen($prefix)), true);

        if ($binary === false || $binary === '') {
            throw ValidationException::withMessages([
                'signature' => 'No se pudo procesar la firma enviada.',
            ]);
        }

        return $binary;
    }

    private function signaturePathFor(int $employeeId, int $anio, int $mes, string $side): string
    {
        return sprintf(
            'pdf-signatures/jornada/%d/%04d/%02d/%s.png',
            $employeeId,
            $anio,
            $mes,
            $side,
        );
    }

    private function fullName(User $user): string
    {
        return trim(implode(' ', array_filter([$user->name, $user->apellido])));
    }

    private function companySignerTitle(User $user): string
    {
        return $user->isAdmin() ? 'Administrador' : 'Encargado';
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function monthDateRange(int $anio, int $mes): array
    {
        $inicio = Carbon::create($anio, $mes, 1)->startOfMonth();
        $fin = $inicio->copy()->endOfMonth();

        return [$inicio->toDateString(), $fin->toDateString()];
    }
}
