<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\AuthenticatedFichajeEmployeeResolver;
use App\Services\FichajeWorkflowService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FicharController extends Controller
{
    public function __construct(
        private readonly AuthenticatedFichajeEmployeeResolver $employeeResolver,
        private readonly FichajeWorkflowService $workflowService,
    ) {}

    public function index(Request $request)
    {
        /** @var User $user */
        $user = $request->user();
        $employee = $this->employeeResolver->resolve($user);

        if (! $employee) {
            return Inertia::render('fichar/index', [
                'employee' => null,
                'fichajeActivo' => null,
                'historial' => [],
                'setupMessage' => $this->employeeResolver->buildSetupMessage($user),
            ]);
        }

        return Inertia::render('fichar/index', [
            'employee' => $employee,
            'fichajeActivo' => $this->workflowService->activeFichajeFor($employee),
            'historial' => $this->workflowService->historyFor($employee),
            'setupMessage' => null,
        ]);
    }

    public function contextoRed(Request $request): JsonResponse
    {
        return response()->json([
            'ip' => $request->ip(),
        ]);
    }

    public function iniciar(Request $request)
    {
        /** @var User $user */
        $user = $request->user();
        $employee = $this->employeeResolver->resolve($user);

        if (! $employee) {
            return back()->withErrors(['error' => $this->employeeResolver->buildSetupMessage($user)]);
        }

        $this->workflowService->validateActionRequest($request);

        $error = $this->workflowService->iniciar($employee, $request);

        return $error
            ? back()->withErrors(['error' => $error])
            : back();
    }

    public function pausa(Request $request)
    {
        /** @var User $user */
        $user = $request->user();
        $employee = $this->employeeResolver->resolve($user);

        if (! $employee) {
            return back()->withErrors(['error' => $this->employeeResolver->buildSetupMessage($user)]);
        }

        $this->workflowService->validateActionRequest($request);

        $error = $this->workflowService->pausa($employee, $request);

        return $error
            ? back()->withErrors(['error' => $error])
            : back();
    }

    public function finalizar(Request $request)
    {
        /** @var User $user */
        $user = $request->user();
        $employee = $this->employeeResolver->resolve($user);

        if (! $employee) {
            return back()->withErrors(['error' => $this->employeeResolver->buildSetupMessage($user)]);
        }

        $this->workflowService->validateActionRequest($request);

        $error = $this->workflowService->finalizar($employee, $request);

        return $error
            ? back()->withErrors(['error' => $error])
            : back();
    }
}
