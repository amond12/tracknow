<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\WorkCenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TrabajoController extends Controller
{
    public function edit(Request $request): Response
    {
        $user       = $request->user();
        $companies  = Company::where('user_id', $user->id)->get(['id', 'nombre']);
        $companyIds = $companies->pluck('id');

        $workCenters = WorkCenter::whereIn('company_id', $companyIds)
            ->get(['id', 'company_id', 'nombre']);

        return Inertia::render('settings/trabajo', [
            'companies'   => $companies,
            'workCenters' => $workCenters,
            'trabajo' => [
                'company_id'          => $user->company_id,
                'work_center_id'      => $user->work_center_id,
                'horario_lunes'       => $user->horario_lunes,
                'horario_martes'      => $user->horario_martes,
                'horario_miercoles'   => $user->horario_miercoles,
                'horario_jueves'      => $user->horario_jueves,
                'horario_viernes'     => $user->horario_viernes,
                'horario_sabado'      => $user->horario_sabado,
                'horario_domingo'     => $user->horario_domingo,
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $user       = $request->user();
        $companyIds = Company::where('user_id', $user->id)->pluck('id');

        $validated = $request->validate([
            'company_id'        => 'required|integer|in:' . $companyIds->implode(','),
            'work_center_id'    => 'required|integer|exists:work_centers,id',
            'horario_lunes'     => 'nullable|numeric|min:0|max:24',
            'horario_martes'    => 'nullable|numeric|min:0|max:24',
            'horario_miercoles' => 'nullable|numeric|min:0|max:24',
            'horario_jueves'    => 'nullable|numeric|min:0|max:24',
            'horario_viernes'   => 'nullable|numeric|min:0|max:24',
            'horario_sabado'    => 'nullable|numeric|min:0|max:24',
            'horario_domingo'   => 'nullable|numeric|min:0|max:24',
        ]);

        // Verificar que el centro pertenece a una empresa del admin
        if (!empty($validated['work_center_id'])) {
            $centro = WorkCenter::findOrFail($validated['work_center_id']);
            abort_if(!$companyIds->contains($centro->company_id), 403);
        }

        $user->update($validated);

        return to_route('trabajo.edit');
    }
}
