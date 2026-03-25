<?php

namespace App\Http\Controllers;

use App\Models\Fichaje;
use App\Models\User;
use App\Services\ClockCodeService;
use App\Services\FichajeWorkflowService;
use App\Services\PublicFichajeEmployeeLookupService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PublicFicharController extends Controller
{
    public function __construct(
        private readonly PublicFichajeEmployeeLookupService $lookupService,
        private readonly FichajeWorkflowService $workflowService,
        private readonly ClockCodeService $clockCodeService,
    ) {}

    public function index(Request $request): Response
    {
        $identifier = $this->lookupService->normalize($request->query('identificador'));
        $employee = $identifier !== '' ? $this->lookupService->resolve($identifier) : null;
        $fichajeActivo = $employee
            ? $this->workflowService->activeFichajeFor($employee)
            : null;

        return Inertia::render('fichar-publico/index', [
            'identificador' => $identifier,
            'employee' => $employee ? $this->serializeEmployee($employee) : null,
            'fichajeActivo' => $this->serializeFichaje($fichajeActivo),
            'lookupError' => $identifier !== '' && ! $employee
                ? PublicFichajeEmployeeLookupService::GENERIC_LOOKUP_ERROR
                : null,
            'successMessage' => session('successMessage'),
        ]);
    }

    public function buscar(Request $request): RedirectResponse
    {
        $request->validate([
            'identificador' => ['required', 'string', 'max:20'],
        ]);

        $identifier = $this->lookupService->normalize($request->input('identificador'));

        if ($identifier === '') {
            return to_route('fichar.publico')->withErrors([
                'identificador' => 'Introduce un DNI o un codigo de empleado valido.',
            ]);
        }

        return to_route('fichar.publico', ['identificador' => $identifier]);
    }

    public function iniciar(Request $request): RedirectResponse
    {
        return $this->handleAction(
            $request,
            action: 'iniciar',
            successMessage: 'Entrada registrada correctamente.',
        );
    }

    public function pausa(Request $request): RedirectResponse
    {
        $employee = $this->resolveEmployeeFromRequest($request);

        if (! $employee) {
            return $this->redirectWithLookupError($request);
        }

        $activeFichaje = $this->workflowService->activeFichajeFor($employee);
        $successMessage = $activeFichaje?->estado === 'pausa'
            ? 'Jornada reanudada correctamente.'
            : 'Pausa registrada correctamente.';

        return $this->handleAction(
            $request,
            action: 'pausa',
            successMessage: $successMessage,
            employee: $employee,
        );
    }

    public function finalizar(Request $request): RedirectResponse
    {
        return $this->handleAction(
            $request,
            action: 'finalizar',
            successMessage: 'Salida registrada correctamente.',
        );
    }

    private function handleAction(
        Request $request,
        string $action,
        string $successMessage,
        ?User $employee = null,
    ): RedirectResponse {
        $request->validate([
            'identificador' => ['required', 'string', 'max:20'],
            ...$this->workflowService->actionValidationRules(),
        ]);

        $employee ??= $this->resolveEmployeeFromRequest($request);

        if (! $employee) {
            return $this->redirectWithLookupError($request);
        }

        $error = $this->workflowService->{$action}($employee, $request);

        if ($error) {
            return to_route('fichar.publico', [
                'identificador' => $this->normalizedIdentifierFromRequest($request),
            ])->withErrors(['error' => $error]);
        }

        return to_route('fichar.publico')->with('successMessage', $successMessage);
    }

    private function resolveEmployeeFromRequest(Request $request): ?User
    {
        return $this->lookupService->resolve(
            $this->normalizedIdentifierFromRequest($request),
        );
    }

    private function normalizedIdentifierFromRequest(Request $request): string
    {
        return $this->clockCodeService->normalizeIdentifier(
            $request->input('identificador'),
        );
    }

    private function redirectWithLookupError(Request $request): RedirectResponse
    {
        return to_route('fichar.publico', [
            'identificador' => $this->normalizedIdentifierFromRequest($request),
        ])->withErrors([
            'identificador' => PublicFichajeEmployeeLookupService::GENERIC_LOOKUP_ERROR,
        ]);
    }

    /**
     * @return array{id: int, name: string, apellido: string|null, remoto: bool, clock_code: string|null, work_center: array{id: int, nombre: string, timezone: string|null}|null}
     */
    private function serializeEmployee(User $employee): array
    {
        return [
            'id' => $employee->id,
            'name' => $employee->name,
            'apellido' => $employee->apellido,
            'remoto' => (bool) $employee->remoto,
            'clock_code' => $employee->clock_code,
            'work_center' => $employee->workCenter
                ? [
                    'id' => $employee->workCenter->id,
                    'nombre' => $employee->workCenter->nombre,
                    'timezone' => $employee->workCenter->timezone,
                ]
                : null,
        ];
    }

    /**
     * @return array{id: int, fecha: string, inicio_jornada: string, fin_jornada: string|null, duracion_jornada: int|null, estado: string, timezone: string|null, work_center: array{id: int, nombre: string, timezone: string|null}|null, pausas: array<int, array{id: int, inicio_pausa: string, fin_pausa: string|null, duracion_pausa: int|null}>}|null
     */
    private function serializeFichaje(?Fichaje $fichaje): ?array
    {
        if (! $fichaje) {
            return null;
        }

        return [
            'id' => $fichaje->id,
            'fecha' => $fichaje->fecha->toDateString(),
            'inicio_jornada' => $fichaje->inicio_jornada?->toISOString(),
            'fin_jornada' => $fichaje->fin_jornada?->toISOString(),
            'duracion_jornada' => $fichaje->duracion_jornada,
            'estado' => $fichaje->estado,
            'timezone' => $fichaje->timezone,
            'work_center' => $fichaje->workCenter
                ? [
                    'id' => $fichaje->workCenter->id,
                    'nombre' => $fichaje->workCenter->nombre,
                    'timezone' => $fichaje->workCenter->timezone,
                ]
                : null,
            'pausas' => $fichaje->pausas->map(fn ($pausa) => [
                'id' => $pausa->id,
                'inicio_pausa' => $pausa->inicio_pausa?->toISOString(),
                'fin_pausa' => $pausa->fin_pausa?->toISOString(),
                'duracion_pausa' => $pausa->duracion_pausa,
            ])->values()->all(),
        ];
    }
}
