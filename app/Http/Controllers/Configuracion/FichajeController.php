<?php

namespace App\Http\Controllers\Configuracion;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\EdicionFichaje;
use App\Models\Fichaje;
use App\Models\Pausa;
use App\Models\User;
use App\Models\WorkCenter;
use App\Services\HorasExtraService;
use App\Support\WorkCenterTimezone;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FichajeController extends Controller
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
            ->with('workCenter:id,nombre,timezone')
            ->orderBy('apellido')
            ->orderBy('name')
            ->get(['id', 'company_id', 'work_center_id', 'name', 'apellido', 'remoto']);

        $query = Fichaje::with([
            'user',
            'workCenter:id,nombre,timezone',
            'pausas',
            'ediciones.user:id,name',
        ])
            ->whereHas('user', fn ($q) => $q->whereIn('company_id', $companyIds));

        if ($request->filled('empresa_id')) {
            $query->whereHas('user', fn ($q) => $q->where('company_id', $request->empresa_id));
        }

        if ($request->filled('centro_id')) {
            $query->where('work_center_id', $request->centro_id);
        }

        if ($request->filled('empleado_id')) {
            $query->where('user_id', $request->empleado_id);
        }

        if ($request->filled('fecha_desde')) {
            $query->where('fecha', '>=', $request->fecha_desde);
        }

        if ($request->filled('fecha_hasta')) {
            $query->where('fecha', '<=', $request->fecha_hasta);
        }

        $fichajes = $query->orderBy('fecha', 'desc')->orderBy('inicio_jornada', 'desc')->get();

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
        $timezone = WorkCenterTimezone::resolve($fichaje->workCenter);
        $nuevaFecha = WorkCenterTimezone::localToUtc(
            $validated['datetime'],
            $timezone,
        );
        $valorAnterior = $fichaje->{$campo}?->toJSON();

        $payload = [$campo => $nuevaFecha];
        if ($campo === 'inicio_jornada') {
            $payload['fecha'] = $nuevaFecha
                ->copy()
                ->setTimezone($timezone)
                ->toDateString();
        }

        $fichaje->update($payload);

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

        // Recalcular duración si ambos extremos existen
        $fichaje->refresh()->load('pausas');
        if ($fichaje->inicio_jornada && $fichaje->fin_jornada) {
            $totalPausas = $fichaje->pausas->sum('duracion_pausa');
            $duracion = max(0, (int) $fichaje->fin_jornada->diffInSeconds($fichaje->inicio_jornada, true) - $totalPausas);
            $fichaje->update(['duracion_jornada' => $duracion]);
        }

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

        $timezone = WorkCenterTimezone::resolve($fichaje->workCenter);
        $inicioPausa = WorkCenterTimezone::localToUtc(
            $validated['inicio_pausa'],
            $timezone,
        );
        $finPausa = $validated['fin_pausa']
            ? WorkCenterTimezone::localToUtc($validated['fin_pausa'], $timezone)
            : null;

        $duracionPausa = $finPausa
            ? max(0, (int) $finPausa->diffInSeconds($inicioPausa, true))
            : null;

        $pausa = Pausa::create([
            'fichaje_id' => $fichaje->id,
            'inicio_pausa' => $inicioPausa,
            'fin_pausa' => $finPausa,
            'duracion_pausa' => $duracionPausa,
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

        // Recalcular duración de la jornada
        $fichaje->refresh()->load('pausas');
        if ($fichaje->inicio_jornada && $fichaje->fin_jornada) {
            $totalPausas = $fichaje->pausas->sum('duracion_pausa');
            $duracion = max(0, (int) $fichaje->fin_jornada->diffInSeconds($fichaje->inicio_jornada, true) - $totalPausas);
            $fichaje->update(['duracion_jornada' => $duracion]);
        }

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
        $timezone = WorkCenterTimezone::resolve($fichaje->workCenter);
        $nuevaFecha = WorkCenterTimezone::localToUtc(
            $validated['datetime'],
            $timezone,
        );
        $valorAnterior = $pausa->{$campo}?->toJSON();

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

        // Recalcular duración de la pausa
        $pausa->refresh();
        if ($pausa->inicio_pausa && $pausa->fin_pausa) {
            $duracionPausa = max(0, (int) \Carbon\Carbon::parse($pausa->fin_pausa)->diffInSeconds(\Carbon\Carbon::parse($pausa->inicio_pausa), true));
            $pausa->update(['duracion_pausa' => $duracionPausa]);
        }

        // Recalcular duración de la jornada
        $fichaje->refresh()->load('pausas');
        if ($fichaje->inicio_jornada && $fichaje->fin_jornada) {
            $totalPausas = $fichaje->pausas->sum('duracion_pausa');
            $duracion = max(0, (int) $fichaje->fin_jornada->diffInSeconds($fichaje->inicio_jornada, true) - $totalPausas);
            $fichaje->update(['duracion_jornada' => $duracion]);
        }

        if ($fichaje->estado === 'finalizada') {
            app(HorasExtraService::class)->recalcularParaFichaje($fichaje);
        }

        return back();
    }

    public function finalizarAdmin(Request $request, Fichaje $fichaje)
    {
        $this->autorizarFichaje($request, $fichaje);

        if ($fichaje->estado === 'finalizada') {
            abort(422, 'El fichaje ya está finalizado.');
        }

        $validated = $request->validate([
            'motivo' => 'required|string|max:500',
        ]);

        $ahora = WorkCenterTimezone::nowUtc();

        // Si estaba en pausa, cerrar la pausa activa
        if ($fichaje->estado === 'pausa') {
            $pausaActiva = $fichaje->pausas()->whereNull('fin_pausa')->latest()->first();
            if ($pausaActiva) {
                $duracionPausa = max(0, (int) $ahora->diffInSeconds(\Carbon\Carbon::parse($pausaActiva->inicio_pausa), true));
                $pausaActiva->update([
                    'fin_pausa' => $ahora,
                    'duracion_pausa' => $duracionPausa,
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
        $totalPausas = $fichaje->pausas->sum('duracion_pausa');
        $duracionJornada = max(0, (int) $ahora->diffInSeconds($fichaje->inicio_jornada, true) - $totalPausas);

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
        $companyIds = Company::where('user_id', $user->id)->pluck('id');

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
            ->whereIn('company_id', $companyIds)
            ->whereIn('role', ['empleado', 'encargado'])
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

        $estado = $finJornada ? 'finalizada' : 'activa';

        $fichaje = Fichaje::create([
            'user_id' => $empleado->id,
            'work_center_id' => $empleado->work_center_id,
            'fecha' => $fecha,
            'inicio_jornada' => $inicioJornada,
            'fin_jornada' => $finJornada,
            'estado' => $estado,
        ]);

        $totalPausas = 0;
        $pausasSnapshot = [];

        foreach ($validated['pausas'] ?? [] as $pausaData) {
            $inicioPausa = WorkCenterTimezone::localToUtc(
                $pausaData['inicio_pausa'],
                $timezone,
            );
            $finPausa = ! empty($pausaData['fin_pausa'])
                ? WorkCenterTimezone::localToUtc($pausaData['fin_pausa'], $timezone)
                : null;

            $duracionPausa = $finPausa
                ? max(0, (int) $finPausa->diffInSeconds($inicioPausa, true))
                : null;

            Pausa::create([
                'fichaje_id' => $fichaje->id,
                'inicio_pausa' => $inicioPausa,
                'fin_pausa' => $finPausa,
                'duracion_pausa' => $duracionPausa,
            ]);

            $totalPausas += $duracionPausa ?? 0;

            $pausasSnapshot[] = [
                'inicio_pausa' => $inicioPausa->toJSON(),
                'fin_pausa' => $finPausa?->toJSON(),
            ];
        }

        if ($finJornada) {
            $duracionJornada = max(0, (int) $finJornada->diffInSeconds($inicioJornada, true) - $totalPausas);
            $fichaje->update(['duracion_jornada' => $duracionJornada]);
            $fichaje->refresh()->load('pausas');
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

        // Recalcular duración de la jornada
        $fichaje->refresh()->load('pausas');
        if ($fichaje->inicio_jornada && $fichaje->fin_jornada) {
            $totalPausas = $fichaje->pausas->sum('duracion_pausa');
            $duracion = max(0, (int) $fichaje->fin_jornada->diffInSeconds($fichaje->inicio_jornada, true) - $totalPausas);
            $fichaje->update(['duracion_jornada' => $duracion]);
        }

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

        // Capturar datos antes de borrar para recalcular tras el soft-delete
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
        $companyIds = Company::where('user_id', $user->id)->pluck('id');

        $pertenece = User::where('id', $fichaje->user_id)
            ->whereIn('company_id', $companyIds)
            ->exists();

        if (! $pertenece) {
            abort(403);
        }
    }
}
