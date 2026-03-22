<?php

namespace App\Http\Controllers\Configuracion;

use App\Http\Controllers\Controller;
use App\Models\EdicionFichaje;
use App\Models\Fichaje;
use App\Models\Pausa;
use App\Models\User;
use App\Models\WorkCenter;
use App\Services\HorasExtraService;
use App\Support\AdminScope;
use App\Support\WorkCenterTimezone;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class FichajeController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Fichaje::with([
            'user',
            'workCenter:id,nombre,timezone',
            'pausas',
            'ediciones.user:id,name',
        ]);

        if ($user->isEmpleado()) {
            $user->loadMissing(['company:id,nombre', 'workCenter:id,company_id,nombre,timezone']);

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
                'work_center' => $user->workCenter
                    ? [
                        'id' => $user->workCenter->id,
                        'nombre' => $user->workCenter->nombre,
                        'timezone' => $user->workCenter->timezone,
                    ]
                    : null,
            ]]);

            if ($request->filled('empleado_id') && (int) $request->empleado_id !== $user->id) {
                abort(403);
            }

            $query->where('user_id', $user->id);

            if ($request->filled('empresa_id')) {
                $query->whereHas('user', fn ($q) => $q->where('company_id', $request->empresa_id));
            }

            if ($request->filled('centro_id')) {
                $query->where('work_center_id', $request->centro_id);
            }
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
                ->with('workCenter:id,nombre,timezone')
                ->orderBy('apellido')
                ->orderBy('name')
                ->get(['id', 'company_id', 'work_center_id', 'name', 'apellido', 'remoto']);

            $query->whereHas('user', function ($q) use ($companyIds, $user) {
                $q->where(function ($staffQuery) use ($companyIds) {
                    $staffQuery->whereIn('company_id', $companyIds)
                        ->whereIn('role', User::STAFF_ROLES);
                })->orWhere('id', $user->id);
            });

            if ($request->filled('empresa_id')) {
                $query->whereHas('user', fn ($q) => $q->where('company_id', $request->empresa_id));
            }

            if ($request->filled('centro_id')) {
                $query->where('work_center_id', $request->centro_id);
            }

            if ($request->filled('empleado_id')) {
                $query->where('user_id', $request->empleado_id);
            }
        }

        if ($request->filled('fecha_desde')) {
            $query->where('fecha', '>=', $request->fecha_desde);
        }

        if ($request->filled('fecha_hasta')) {
            $query->where('fecha', '<=', $request->fecha_hasta);
        }

        $fichajes = $query
            ->orderBy('fecha', 'desc')
            ->orderBy('inicio_jornada', 'desc')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('configuracion/fichajes/index', [
            'fichajes' => $fichajes,
            'companies' => $companies,
            'workCenters' => $workCenters,
            'employees' => $employees,
            'filters' => $request->only(['empresa_id', 'centro_id', 'empleado_id', 'fecha_desde', 'fecha_hasta']),
        ]);
    }

    public function updateJornada(Request $request, Fichaje $fichaje)
    {
        $this->autorizarFichaje($request, $fichaje);
        $service = app(HorasExtraService::class);
        $fechaResumenAnterior = $service->fechaResumenParaFichaje($fichaje);

        $validated = $request->validate([
            'campo' => 'required|in:inicio_jornada,fin_jornada',
            'datetime' => 'required|date_format:Y-m-d\TH:i:s',
            'motivo' => 'required|string|max:500',
        ]);

        $campo = $validated['campo'];
        $timezone = WorkCenterTimezone::resolve($fichaje->timezone ?: $fichaje->workCenter?->timezone);
        $nuevaFecha = WorkCenterTimezone::localToUtc(
            $validated['datetime'],
            $timezone,
        );
        $valorAnterior = $fichaje->{$campo}?->toJSON();

        $fichaje->loadMissing('pausas');

        $payload = [$campo => $nuevaFecha];
        if ($campo === 'inicio_jornada') {
            $payload['fecha'] = $nuevaFecha
                ->copy()
                ->setTimezone($timezone)
                ->toDateString();
        }

        $fichaje->fill($payload);
        $this->assertValidFichajeTimeline($fichaje, 'hora');
        $fichaje->save();

        $edicion = EdicionFichaje::where([
            'fichaje_id' => $fichaje->id,
            'pausa_id' => null,
            'campo' => $campo,
        ])->first();

        if ($edicion) {
            $edicion->update([
                'user_id' => $request->user()->id,
                'valor_nuevo' => $nuevaFecha->toJSON(),
                'motivo' => $validated['motivo'],
            ]);
        } else {
            EdicionFichaje::create([
                'fichaje_id' => $fichaje->id,
                'pausa_id' => null,
                'user_id' => $request->user()->id,
                'campo' => $campo,
                'valor_anterior' => $valorAnterior,
                'valor_nuevo' => $nuevaFecha->toJSON(),
                'motivo' => $validated['motivo'],
            ]);
        }

        $fichaje->refresh()->load('pausas');
        $this->syncFichajeEstadoFromPausas($fichaje);
        $this->recalculateFichajeDuration($fichaje, 'hora');

        if ($fichaje->estado === 'finalizada') {
            $service->recalcularParaFichaje($fichaje, $fechaResumenAnterior);
        }

        return back();
    }

    public function storePausa(Request $request, Fichaje $fichaje)
    {
        $this->autorizarFichaje($request, $fichaje);

        $validated = $request->validate([
            'inicio_pausa' => 'required|date_format:Y-m-d\TH:i:s',
            'fin_pausa' => 'nullable|date_format:Y-m-d\TH:i:s',
            'motivo' => 'required|string|max:500',
        ]);

        $timezone = WorkCenterTimezone::resolve($fichaje->timezone ?: $fichaje->workCenter?->timezone);
        $inicioPausa = WorkCenterTimezone::localToUtc(
            $validated['inicio_pausa'],
            $timezone,
        );
        $finPausa = $validated['fin_pausa']
            ? WorkCenterTimezone::localToUtc($validated['fin_pausa'], $timezone)
            : null;

        $fichaje->loadMissing('pausas');
        $this->assertPausaCanBeApplied(
            $fichaje,
            $inicioPausa,
            $finPausa,
            null,
            'inicio_pausa',
            'fin_pausa',
        );

        $pausa = Pausa::create([
            'fichaje_id' => $fichaje->id,
            'inicio_pausa' => $inicioPausa,
            'fin_pausa' => $finPausa,
            'duracion_pausa' => $finPausa
                ? $this->secondsBetween($inicioPausa, $finPausa)
                : null,
        ]);

        EdicionFichaje::create([
            'fichaje_id' => $fichaje->id,
            'pausa_id' => $pausa->id,
            'user_id' => $request->user()->id,
            'campo' => 'creacion_pausa',
            'valor_anterior' => null,
            'valor_nuevo' => json_encode([
                'inicio_pausa' => $inicioPausa->toJSON(),
                'fin_pausa' => $finPausa?->toJSON(),
            ]),
            'motivo' => $validated['motivo'],
        ]);

        $fichaje->refresh()->load('pausas');
        $this->syncFichajeEstadoFromPausas($fichaje);
        $this->recalculateFichajeDuration($fichaje, 'inicio_pausa');

        if ($fichaje->estado === 'finalizada') {
            app(HorasExtraService::class)->recalcularParaFichaje($fichaje);
        }

        return back();
    }

    public function updatePausa(Request $request, Fichaje $fichaje, Pausa $pausa)
    {
        $this->autorizarFichaje($request, $fichaje);

        if ($pausa->fichaje_id !== $fichaje->id) {
            abort(403);
        }

        $validated = $request->validate([
            'campo' => 'required|in:inicio_pausa,fin_pausa',
            'datetime' => 'required|date_format:Y-m-d\TH:i:s',
            'motivo' => 'required|string|max:500',
        ]);

        $campo = $validated['campo'];
        $timezone = WorkCenterTimezone::resolve($fichaje->timezone ?: $fichaje->workCenter?->timezone);
        $nuevaFecha = WorkCenterTimezone::localToUtc(
            $validated['datetime'],
            $timezone,
        );
        $valorAnterior = $pausa->{$campo}?->toJSON();

        $inicioPausa = $campo === 'inicio_pausa' ? $nuevaFecha : $pausa->inicio_pausa;
        $finPausa = $campo === 'fin_pausa' ? $nuevaFecha : $pausa->fin_pausa;

        $fichaje->loadMissing('pausas');
        $this->assertPausaCanBeApplied(
            $fichaje,
            $inicioPausa,
            $finPausa,
            $pausa->id,
            'hora',
            'hora',
        );

        $pausa->update([$campo => $nuevaFecha]);

        $edicion = EdicionFichaje::where([
            'fichaje_id' => $fichaje->id,
            'pausa_id' => $pausa->id,
            'campo' => $campo,
        ])->first();

        if ($edicion) {
            $edicion->update([
                'user_id' => $request->user()->id,
                'valor_nuevo' => $nuevaFecha->toJSON(),
                'motivo' => $validated['motivo'],
            ]);
        } else {
            EdicionFichaje::create([
                'fichaje_id' => $fichaje->id,
                'pausa_id' => $pausa->id,
                'user_id' => $request->user()->id,
                'campo' => $campo,
                'valor_anterior' => $valorAnterior,
                'valor_nuevo' => $nuevaFecha->toJSON(),
                'motivo' => $validated['motivo'],
            ]);
        }

        $pausa->refresh();
        $this->recalculatePausaDuration($pausa, 'hora');

        $fichaje->refresh()->load('pausas');
        $this->syncFichajeEstadoFromPausas($fichaje);
        $this->recalculateFichajeDuration($fichaje, 'hora');

        if ($fichaje->estado === 'finalizada') {
            app(HorasExtraService::class)->recalcularParaFichaje($fichaje);
        }

        return back();
    }

    public function finalizarAdmin(Request $request, Fichaje $fichaje)
    {
        $this->autorizarFichaje($request, $fichaje);

        if ($fichaje->estado === 'finalizada') {
            abort(422, 'El fichaje ya esta finalizado.');
        }

        $validated = $request->validate([
            'motivo' => 'required|string|max:500',
        ]);

        $ahora = WorkCenterTimezone::nowUtc();

        if ($fichaje->estado === 'pausa') {
            $pausaActiva = $fichaje->pausas()->whereNull('fin_pausa')->latest()->first();
            if ($pausaActiva) {
                $this->assertChronological(
                    $pausaActiva->inicio_pausa,
                    $ahora,
                    'motivo',
                    'La pausa activa debe comenzar antes de poder finalizarla.',
                );

                $pausaActiva->update([
                    'fin_pausa' => $ahora,
                    'duracion_pausa' => $this->secondsBetween($pausaActiva->inicio_pausa, $ahora),
                ]);

                EdicionFichaje::create([
                    'fichaje_id' => $fichaje->id,
                    'pausa_id' => $pausaActiva->id,
                    'user_id' => $request->user()->id,
                    'campo' => 'fin_pausa',
                    'valor_anterior' => null,
                    'valor_nuevo' => $ahora->toJSON(),
                    'motivo' => $validated['motivo'],
                ]);
            }
        }

        $fichaje->refresh()->load('pausas');
        $this->assertChronological(
            $fichaje->inicio_jornada,
            $ahora,
            'motivo',
            'La jornada debe comenzar antes de poder finalizarla.',
        );

        $fichaje->fill([
            'fin_jornada' => $ahora,
            'estado' => 'finalizada',
        ]);
        $this->assertValidFichajeTimeline($fichaje, 'motivo');
        $duracionJornada = $this->calculateFichajeDurationFromModel($fichaje, 'motivo');

        $fichaje->update([
            'fin_jornada' => $ahora,
            'duracion_jornada' => $duracionJornada,
            'estado' => 'finalizada',
        ]);

        EdicionFichaje::create([
            'fichaje_id' => $fichaje->id,
            'pausa_id' => null,
            'user_id' => $request->user()->id,
            'campo' => 'finalizacion_admin',
            'valor_anterior' => null,
            'valor_nuevo' => $ahora->toJSON(),
            'motivo' => $validated['motivo'],
        ]);

        $fichaje->refresh()->load('pausas');
        app(HorasExtraService::class)->recalcularParaFichaje($fichaje);

        return back();
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $companyIds = AdminScope::companyIdsFor($user);

        $validated = $request->validate([
            'employee_id' => 'required|integer',
            'fecha' => 'required|date',
            'inicio_jornada' => 'required|date',
            'fin_jornada' => 'nullable|date',
            'pausas' => 'nullable|array',
            'pausas.*.inicio_pausa' => 'required|date',
            'pausas.*.fin_pausa' => 'nullable|date',
            'motivo' => 'required|string|max:500',
        ]);

        $empleado = User::where('id', $validated['employee_id'])
            ->where(function ($query) use ($companyIds, $user) {
                $query->where(function ($staffQuery) use ($companyIds) {
                    $staffQuery->whereIn('company_id', $companyIds)
                        ->whereIn('role', User::STAFF_ROLES);
                })->orWhere('id', $user->id);
            })
            ->with('workCenter:id,timezone')
            ->first();

        if (! $empleado) {
            abort(403);
        }

        abort_if(! $empleado->workCenter, 422, 'El empleado no tiene centro de trabajo asignado.');

        $timezone = WorkCenterTimezone::resolve($empleado->workCenter);
        $inicioJornada = WorkCenterTimezone::localToUtc(
            $validated['inicio_jornada'],
            $timezone,
        );
        $finJornada = $validated['fin_jornada']
            ? WorkCenterTimezone::localToUtc($validated['fin_jornada'], $timezone)
            : null;
        $fecha = $inicioJornada->copy()->setTimezone($timezone)->toDateString();

        $this->assertChronological(
            $inicioJornada,
            $finJornada,
            'fin_jornada',
            'La hora de fin debe ser posterior a la de inicio.',
        );

        $pausasNormalizadas = $this->normalizeDraftPausas(
            $validated['pausas'] ?? [],
            $timezone,
            $inicioJornada,
            $finJornada,
        );
        $hayPausaAbierta = collect($pausasNormalizadas)->contains(
            fn (array $pausa) => $pausa['fin'] === null,
        );
        $estado = $finJornada ? 'finalizada' : ($hayPausaAbierta ? 'pausa' : 'activa');

        $fichaje = Fichaje::create([
            'user_id' => $empleado->id,
            'work_center_id' => $empleado->work_center_id,
            'timezone' => $timezone,
            'fecha' => $fecha,
            'inicio_jornada' => $inicioJornada,
            'fin_jornada' => $finJornada,
            'estado' => $estado,
        ]);

        $pausasSnapshot = [];

        foreach ($pausasNormalizadas as $pausaData) {
            Pausa::create([
                'fichaje_id' => $fichaje->id,
                'inicio_pausa' => $pausaData['inicio'],
                'fin_pausa' => $pausaData['fin'],
                'duracion_pausa' => $pausaData['duracion'],
            ]);

            $pausasSnapshot[] = [
                'inicio_pausa' => $pausaData['inicio']->toJSON(),
                'fin_pausa' => $pausaData['fin']?->toJSON(),
            ];
        }

        if ($finJornada) {
            $fichaje->refresh()->load('pausas');
            $this->recalculateFichajeDuration($fichaje, 'fin_jornada');
            app(HorasExtraService::class)->recalcularParaFichaje($fichaje);
        }

        EdicionFichaje::create([
            'fichaje_id' => $fichaje->id,
            'pausa_id' => null,
            'user_id' => $user->id,
            'campo' => 'creacion_admin',
            'valor_anterior' => null,
            'valor_nuevo' => json_encode([
                'user_id' => $empleado->id,
                'fecha' => $fecha,
                'inicio_jornada' => $inicioJornada->toJSON(),
                'fin_jornada' => $finJornada?->toJSON(),
                'pausas' => $pausasSnapshot,
            ]),
            'motivo' => $validated['motivo'],
        ]);

        return back();
    }

    public function destroyPausa(Request $request, Fichaje $fichaje, Pausa $pausa)
    {
        $this->autorizarFichaje($request, $fichaje);

        if ($pausa->fichaje_id !== $fichaje->id) {
            abort(403);
        }

        $validated = $request->validate([
            'motivo' => 'required|string|max:500',
        ]);

        EdicionFichaje::create([
            'fichaje_id' => $fichaje->id,
            'pausa_id' => $pausa->id,
            'user_id' => $request->user()->id,
            'campo' => 'eliminacion_pausa',
            'valor_anterior' => json_encode([
                'inicio_pausa' => $pausa->inicio_pausa?->toJSON(),
                'fin_pausa' => $pausa->fin_pausa?->toJSON(),
            ]),
            'valor_nuevo' => 'eliminada',
            'motivo' => $validated['motivo'],
        ]);

        $pausa->delete();

        $fichaje->refresh()->load('pausas');
        $this->syncFichajeEstadoFromPausas($fichaje);
        $this->recalculateFichajeDuration($fichaje, 'motivo');

        if ($fichaje->estado === 'finalizada') {
            app(HorasExtraService::class)->recalcularParaFichaje($fichaje);
        }

        return back();
    }

    public function destroy(Request $request, Fichaje $fichaje)
    {
        $this->autorizarFichaje($request, $fichaje);

        $validated = $request->validate([
            'motivo' => 'required|string|max:500',
        ]);

        EdicionFichaje::create([
            'fichaje_id' => $fichaje->id,
            'pausa_id' => null,
            'user_id' => $request->user()->id,
            'campo' => 'eliminacion',
            'valor_anterior' => null,
            'valor_nuevo' => now()->toJSON(),
            'motivo' => $validated['motivo'],
        ]);

        $userId = $fichaje->user_id;
        $service = app(HorasExtraService::class);
        $fechaResumenAnterior = $service->fechaResumenParaFichaje($fichaje);

        $fichaje->delete();

        $empleado = User::find($userId);
        if ($empleado) {
            $service->recalcularDia($empleado, $fechaResumenAnterior);
        }

        return back();
    }

    private function autorizarFichaje(Request $request, Fichaje $fichaje): void
    {
        $user = $request->user();
        if ($user->isEmpleado()) {
            abort_if($fichaje->user_id !== $user->id, 403);

            return;
        }

        $companyIds = AdminScope::companyIdsFor($user);

        $pertenece = User::where('id', $fichaje->user_id)
            ->where(function ($query) use ($companyIds, $user) {
                $query->where(function ($staffQuery) use ($companyIds) {
                    $staffQuery->whereIn('company_id', $companyIds)
                        ->whereIn('role', User::STAFF_ROLES);
                })->orWhere('id', $user->id);
            })
            ->exists();

        abort_if(! $pertenece, 403);
    }

    private function normalizeDraftPausas(
        array $pausas,
        string $timezone,
        Carbon $inicioJornada,
        ?Carbon $finJornada,
    ): array {
        $draftPausas = [];

        foreach ($pausas as $index => $pausaData) {
            $inicioPausa = WorkCenterTimezone::localToUtc(
                $pausaData['inicio_pausa'],
                $timezone,
            );
            $finPausa = ! empty($pausaData['fin_pausa'])
                ? WorkCenterTimezone::localToUtc($pausaData['fin_pausa'], $timezone)
                : null;

            $this->assertPauseFitsWithinJornada(
                $inicioPausa,
                $finPausa,
                $inicioJornada,
                $finJornada,
                "pausas.{$index}.inicio_pausa",
                "pausas.{$index}.fin_pausa",
            );

            $draftPausas[] = [
                'inicio' => $inicioPausa,
                'fin' => $finPausa,
                'duracion' => $finPausa
                    ? $this->secondsBetween($inicioPausa, $finPausa)
                    : null,
                'start_field' => "pausas.{$index}.inicio_pausa",
            ];
        }

        usort(
            $draftPausas,
            fn (array $left, array $right) => $left['inicio']->getTimestamp() <=> $right['inicio']->getTimestamp(),
        );

        for ($index = 1; $index < count($draftPausas); $index++) {
            $previous = $draftPausas[$index - 1];
            $current = $draftPausas[$index];

            if ($this->intervalsOverlap(
                $previous['inicio'],
                $previous['fin'],
                $current['inicio'],
                $current['fin'],
            )) {
                $this->validationError(
                    $current['start_field'],
                    'Las pausas no pueden solaparse entre si.',
                );
            }
        }

        return $draftPausas;
    }

    private function assertValidFichajeTimeline(Fichaje $fichaje, string $errorField): void
    {
        $inicioJornada = $fichaje->inicio_jornada;
        $finJornada = $fichaje->fin_jornada;

        if (! $inicioJornada) {
            return;
        }

        $this->assertChronological(
            $inicioJornada,
            $finJornada,
            $errorField,
            'La hora de fin debe ser posterior a la de inicio.',
        );

        foreach ($fichaje->pausas as $pausa) {
            $this->assertPauseFitsWithinJornada(
                $pausa->inicio_pausa,
                $pausa->fin_pausa,
                $inicioJornada,
                $finJornada,
                $errorField,
                $errorField,
            );
        }

        $pausasOrdenadas = $fichaje->pausas
            ->sortBy(fn (Pausa $pausa) => $pausa->inicio_pausa?->getTimestamp() ?? PHP_INT_MIN)
            ->values();

        for ($index = 1; $index < $pausasOrdenadas->count(); $index++) {
            $previous = $pausasOrdenadas[$index - 1];
            $current = $pausasOrdenadas[$index];

            if ($this->intervalsOverlap(
                $previous->inicio_pausa,
                $previous->fin_pausa,
                $current->inicio_pausa,
                $current->fin_pausa,
            )) {
                $this->validationError(
                    $errorField,
                    'Las pausas no pueden solaparse entre si.',
                );
            }
        }
    }

    private function assertPausaCanBeApplied(
        Fichaje $fichaje,
        Carbon $inicioPausa,
        ?Carbon $finPausa,
        ?int $ignorePausaId,
        string $startErrorField,
        string $endErrorField,
    ): void {
        $this->assertPauseFitsWithinJornada(
            $inicioPausa,
            $finPausa,
            $fichaje->inicio_jornada,
            $fichaje->fin_jornada,
            $startErrorField,
            $endErrorField,
        );

        foreach ($fichaje->pausas as $pausaExistente) {
            if ($ignorePausaId !== null && $pausaExistente->id === $ignorePausaId) {
                continue;
            }

            if ($this->intervalsOverlap(
                $pausaExistente->inicio_pausa,
                $pausaExistente->fin_pausa,
                $inicioPausa,
                $finPausa,
            )) {
                $this->validationError(
                    $startErrorField,
                    'Las pausas no pueden solaparse entre si.',
                );
            }
        }
    }

    private function assertPauseFitsWithinJornada(
        ?Carbon $inicioPausa,
        ?Carbon $finPausa,
        ?Carbon $inicioJornada,
        ?Carbon $finJornada,
        string $startErrorField,
        string $endErrorField,
    ): void {
        if (! $inicioPausa || ! $inicioJornada) {
            return;
        }

        $this->assertChronological(
            $inicioPausa,
            $finPausa,
            $endErrorField,
            'El fin de la pausa debe ser posterior al inicio.',
        );

        if ($inicioPausa->lt($inicioJornada)) {
            $this->validationError(
                $startErrorField,
                'La pausa debe comenzar dentro de la jornada.',
            );
        }

        if ($finJornada === null) {
            return;
        }

        if ($inicioPausa->gte($finJornada)) {
            $this->validationError(
                $startErrorField,
                'La pausa debe comenzar antes del fin de la jornada.',
            );
        }

        if ($finPausa === null) {
            $this->validationError(
                $endErrorField,
                'Debes indicar el fin de la pausa dentro de una jornada finalizada.',
            );
        }

        if ($finPausa->gt($finJornada)) {
            $this->validationError(
                $endErrorField,
                'La pausa debe terminar dentro de la jornada.',
            );
        }
    }

    private function syncFichajeEstadoFromPausas(Fichaje $fichaje): void
    {
        $estado = $fichaje->fin_jornada
            ? 'finalizada'
            : ($fichaje->pausas->contains(fn (Pausa $pausa) => $pausa->fin_pausa === null)
                ? 'pausa'
                : 'activa');

        if ($fichaje->estado !== $estado) {
            $fichaje->update(['estado' => $estado]);
        }
    }

    private function recalculatePausaDuration(Pausa $pausa, string $errorField): void
    {
        if (! $pausa->inicio_pausa || ! $pausa->fin_pausa) {
            $pausa->update(['duracion_pausa' => null]);

            return;
        }

        $this->assertChronological(
            $pausa->inicio_pausa,
            $pausa->fin_pausa,
            $errorField,
            'El fin de la pausa debe ser posterior al inicio.',
        );

        $pausa->update([
            'duracion_pausa' => $this->secondsBetween($pausa->inicio_pausa, $pausa->fin_pausa),
        ]);
    }

    private function recalculateFichajeDuration(Fichaje $fichaje, string $errorField): void
    {
        if (! $fichaje->inicio_jornada || ! $fichaje->fin_jornada) {
            $fichaje->update(['duracion_jornada' => null]);

            return;
        }

        $fichaje->loadMissing('pausas');
        $this->assertValidFichajeTimeline($fichaje, $errorField);

        $fichaje->update([
            'duracion_jornada' => $this->calculateFichajeDurationFromModel($fichaje, $errorField),
        ]);
    }

    private function calculateFichajeDurationFromModel(Fichaje $fichaje, string $errorField): int
    {
        $inicioJornada = $fichaje->inicio_jornada;
        $finJornada = $fichaje->fin_jornada;

        if (! $inicioJornada || ! $finJornada) {
            return 0;
        }

        $this->assertChronological(
            $inicioJornada,
            $finJornada,
            $errorField,
            'La hora de fin debe ser posterior a la de inicio.',
        );

        $duracion = $this->secondsBetween($inicioJornada, $finJornada)
            - $this->totalPauseSeconds($fichaje->pausas);

        if ($duracion < 0) {
            $this->validationError(
                $errorField,
                'La suma de pausas no puede superar la duracion total de la jornada.',
            );
        }

        return $duracion;
    }

    private function totalPauseSeconds(iterable $pausas): int
    {
        $total = 0;

        foreach ($pausas as $pausa) {
            if (! $pausa->inicio_pausa || ! $pausa->fin_pausa) {
                continue;
            }

            $total += $this->secondsBetween($pausa->inicio_pausa, $pausa->fin_pausa);
        }

        return $total;
    }

    private function intervalsOverlap(
        ?Carbon $inicioA,
        ?Carbon $finA,
        ?Carbon $inicioB,
        ?Carbon $finB,
    ): bool {
        if (! $inicioA || ! $inicioB) {
            return false;
        }

        $finATimestamp = $finA?->getTimestamp() ?? PHP_INT_MAX;
        $finBTimestamp = $finB?->getTimestamp() ?? PHP_INT_MAX;

        return $inicioA->getTimestamp() < $finBTimestamp
            && $inicioB->getTimestamp() < $finATimestamp;
    }

    private function secondsBetween(Carbon $inicio, Carbon $fin): int
    {
        return $fin->getTimestamp() - $inicio->getTimestamp();
    }

    private function assertChronological(
        ?Carbon $inicio,
        ?Carbon $fin,
        string $errorField,
        string $message,
    ): void {
        if ($inicio && $fin && $fin->lte($inicio)) {
            $this->validationError($errorField, $message);
        }
    }

    private function validationError(string $field, string $message): never
    {
        throw ValidationException::withMessages([
            $field => $message,
        ]);
    }
}
