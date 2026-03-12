<?php

namespace App\Http\Controllers\Configuracion;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\HorasExtraLog;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class EmpresaController extends Controller
{
    public function index(Request $request): Response
    {
        $companies = $request->user()->companies()->orderBy('nombre')->get();

        return Inertia::render('configuracion/empresas/index', [
            'companies' => $companies,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nombre'    => ['required', 'string', 'max:255'],
            'cif'       => ['required', 'string', 'max:20'],
            'pais'      => ['required', 'string', 'max:100'],
            'ciudad'    => ['required', 'string', 'max:100'],
            'direccion' => ['required', 'string', 'max:255'],
            'cp'        => ['required', 'string', 'max:10'],
        ]);

        $request->user()->companies()->create($validated);

        return redirect()->back();
    }

    public function update(Request $request, Company $empresa): RedirectResponse
    {
        abort_if($empresa->user_id !== $request->user()->id, 403);

        $validated = $request->validate([
            'nombre'    => ['required', 'string', 'max:255'],
            'cif'       => ['required', 'string', 'max:20'],
            'pais'      => ['required', 'string', 'max:100'],
            'ciudad'    => ['required', 'string', 'max:100'],
            'direccion' => ['required', 'string', 'max:255'],
            'cp'        => ['required', 'string', 'max:10'],
        ]);

        $empresa->update($validated);

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
