<?php

namespace App\Http\Controllers\Configuracion;

use App\Http\Controllers\Controller;
use App\Models\HorasExtraLog;
use App\Models\User;
use App\Models\WorkCenter;
use App\Support\WorkCenterTimezone;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CentroController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $workCenters = WorkCenter::whereHas('company', fn ($q) => $q->where('user_id', $user->id))
            ->with('company:id,nombre')
            ->withCount('users')
            ->orderBy('nombre')
            ->get();

        $companies = $user->companies()->orderBy('nombre')->get(['id', 'nombre']);

        return Inertia::render('configuracion/centros/index', [
            'workCenters' => $workCenters,
            'companies'   => $companies,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'company_id' => ['required', 'integer', 'exists:companies,id'],
            'nombre'     => ['required', 'string', 'max:255'],
            'pais'       => ['required', 'string', 'max:100'],
            'provincia'  => ['required', 'string', 'max:100'],
            'poblacion'  => ['required', 'string', 'max:100'],
            'direccion'  => ['required', 'string', 'max:255'],
            'cp'         => ['required', 'string', 'max:10'],
            'timezone'   => ['required', 'string', 'max:100', function ($attribute, $value, $fail) {
                if (! WorkCenterTimezone::isValid($value)) {
                    $fail('La zona horaria seleccionada no es valida.');
                }
            }],
            'lat'        => ['nullable', 'numeric'],
            'lng'        => ['nullable', 'numeric'],
            'radio'      => ['nullable', 'integer', 'min:10'],
            'ips'        => ['nullable', 'array'],
            'ips.*'      => ['ip'],
        ]);

        $request->user()->companies()->findOrFail($validated['company_id'])
            ->workCenters()->create($validated);

        return redirect()->back();
    }

    public function update(Request $request, WorkCenter $centro): RedirectResponse
    {
        abort_if($centro->company->user_id !== $request->user()->id, 403);

        $validated = $request->validate([
            'company_id' => ['required', 'integer', 'exists:companies,id'],
            'nombre'     => ['required', 'string', 'max:255'],
            'pais'       => ['required', 'string', 'max:100'],
            'provincia'  => ['required', 'string', 'max:100'],
            'poblacion'  => ['required', 'string', 'max:100'],
            'direccion'  => ['required', 'string', 'max:255'],
            'cp'         => ['required', 'string', 'max:10'],
            'timezone'   => ['required', 'string', 'max:100', function ($attribute, $value, $fail) {
                if (! WorkCenterTimezone::isValid($value)) {
                    $fail('La zona horaria seleccionada no es valida.');
                }
            }],
            'lat'        => ['nullable', 'numeric'],
            'lng'        => ['nullable', 'numeric'],
            'radio'      => ['nullable', 'integer', 'min:10'],
            'ips'        => ['nullable', 'array'],
            'ips.*'      => ['ip'],
        ]);

        $request->user()->companies()->findOrFail($validated['company_id']);

        $centro->update($validated);

        return redirect()->back();
    }

    public function destroy(Request $request, WorkCenter $centro): RedirectResponse
    {
        abort_if($centro->company->user_id !== $request->user()->id, 403);

        DB::transaction(function () use ($centro, $request) {
            $admin = $request->user();

            if ($admin->work_center_id === $centro->id) {
                $admin->resumenDiario()->delete();
                HorasExtraLog::where('user_id', $admin->id)->delete();
                $admin->update(['work_center_id' => null]);
            }

            User::where('work_center_id', $centro->id)
                ->whereIn('role', ['empleado', 'encargado'])
                ->delete();

            $centro->delete();
        });

        return redirect()->back();
    }
}
