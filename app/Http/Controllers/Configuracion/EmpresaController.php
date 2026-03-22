<?php

namespace App\Http\Controllers\Configuracion;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\HorasExtraLog;
use App\Models\User;
use App\Support\AdminScope;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class EmpresaController extends Controller
{
    public function index(Request $request): Response
    {
        $companies = AdminScope::companyQueryFor($request->user())
            ->withCount(['workCenters', 'empleados'])
            ->orderBy('nombre')
            ->get();

        return Inertia::render('configuracion/empresas/index', [
            'companies' => $companies,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:255'],
            'cif' => ['required', 'string', 'max:20'],
            'pais' => ['nullable', 'string', 'max:100'],
            'ciudad' => ['nullable', 'string', 'max:100'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'cp' => ['nullable', 'string', 'max:10'],
        ]);

        $request->user()->companies()->create([
            'nombre' => $validated['nombre'],
            'cif' => $validated['cif'],
            'pais' => $validated['pais'] ?? '',
            'ciudad' => $validated['ciudad'] ?? '',
            'direccion' => $validated['direccion'] ?? '',
            'cp' => $validated['cp'] ?? '',
        ]);

        return redirect()->back();
    }

    public function update(Request $request, Company $empresa): RedirectResponse
    {
        abort_if($empresa->user_id !== $request->user()->id, 403);

        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:255'],
            'cif' => ['required', 'string', 'max:20'],
            'pais' => ['nullable', 'string', 'max:100'],
            'ciudad' => ['nullable', 'string', 'max:100'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'cp' => ['nullable', 'string', 'max:10'],
        ]);

        $payload = [
            'nombre' => $validated['nombre'],
            'cif' => $validated['cif'],
        ];

        foreach (['pais', 'ciudad', 'direccion', 'cp'] as $field) {
            if (array_key_exists($field, $validated)) {
                $payload[$field] = $validated[$field] ?? '';
            }
        }

        $empresa->update($payload);

        return redirect()->back();
    }

    public function destroy(Request $request, Company $empresa): RedirectResponse
    {
        abort_if($empresa->user_id !== $request->user()->id, 403);

        DB::transaction(function () use ($empresa, $request) {
            $admin = $request->user();

            if ($admin->company_id === $empresa->id) {
                $admin->resumenDiario()->delete();
                HorasExtraLog::where('user_id', $admin->id)->delete();
                $admin->update(['work_center_id' => null]);
            }

            User::where('company_id', $empresa->id)
                ->whereIn('role', ['empleado', 'encargado'])
                ->delete();

            $empresa->delete();
        });

        return redirect()->back();
    }
}
