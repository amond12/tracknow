<?php

namespace App\Http\Controllers\Configuracion;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class EmpleadoController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $companyIds = $user->companies()->pluck('id');

        $employees = User::whereIn('company_id', $companyIds)
            ->whereIn('role', ['empleado', 'encargado'])
            ->with(['company:id,nombre', 'workCenter:id,nombre'])
            ->orderBy('apellido')
            ->orderBy('name')
            ->get();

        $companies = $user->companies()->orderBy('nombre')->get(['id', 'nombre']);

        $workCenters = \App\Models\WorkCenter::whereIn('company_id', $companyIds)
            ->orderBy('nombre')
            ->get(['id', 'company_id', 'nombre']);

        return Inertia::render('configuracion/empleados/index', [
            'employees'   => $employees,
            'companies'   => $companies,
            'workCenters' => $workCenters,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nombre'         => ['required', 'string', 'max:100'],
            'apellido'       => ['required', 'string', 'max:100'],
            'email'          => ['required', 'email', 'max:255', 'unique:users,email'],
            'telefono'       => ['required', 'string', 'max:20'],
            'dni'            => ['required', 'string', 'max:20', 'unique:users,dni'],
            'nss'            => ['required', 'string', 'max:30', 'unique:users,nss'],
            'rol'            => ['required', 'in:empleado,encargado'],
            'remoto'         => ['required', 'boolean'],
            'company_id'     => ['required', 'integer', 'exists:companies,id'],
            'work_center_id' => ['required', 'integer', Rule::exists('work_centers', 'id')->where('company_id', $request->input('company_id'))],
        ]);

        $request->user()->companies()->findOrFail($validated['company_id']);

        User::create([
            'name'           => $validated['nombre'],
            'apellido'       => $validated['apellido'],
            'email'          => $validated['email'],
            'telefono'       => $validated['telefono'],
            'dni'            => $validated['dni'],
            'nss'            => $validated['nss'],
            'password'       => $validated['dni'],
            'role'           => $validated['rol'],
            'remoto'         => $validated['remoto'],
            'company_id'     => $validated['company_id'],
            'work_center_id' => $validated['work_center_id'],
        ]);

        return redirect()->back();
    }

    public function update(Request $request, User $empleado): RedirectResponse
    {
        $companyIds = $request->user()->companies()->pluck('id');
        abort_if(! $companyIds->contains($empleado->company_id), 403);
        abort_if($empleado->role === 'admin', 403, 'No se puede gestionar un usuario administrador desde empleados.');

        $validated = $request->validate([
            'nombre'         => ['required', 'string', 'max:100'],
            'apellido'       => ['required', 'string', 'max:100'],
            'email'          => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($empleado->id)],
            'telefono'       => ['required', 'string', 'max:20'],
            'dni'            => ['required', 'string', 'max:20', Rule::unique('users', 'dni')->ignore($empleado->id)],
            'nss'            => ['required', 'string', 'max:30', Rule::unique('users', 'nss')->ignore($empleado->id)],
            'rol'            => ['required', 'in:empleado,encargado'],
            'remoto'         => ['required', 'boolean'],
            'company_id'     => ['required', 'integer', 'exists:companies,id'],
            'work_center_id' => ['required', 'integer', Rule::exists('work_centers', 'id')->where('company_id', $request->input('company_id'))],
        ]);

        $request->user()->companies()->findOrFail($validated['company_id']);

        $empleado->update([
            'name'           => $validated['nombre'],
            'apellido'       => $validated['apellido'],
            'email'          => $validated['email'],
            'telefono'       => $validated['telefono'],
            'dni'            => $validated['dni'],
            'nss'            => $validated['nss'],
            'role'           => $validated['rol'],
            'remoto'         => $validated['remoto'],
            'company_id'     => $validated['company_id'],
            'work_center_id' => $validated['work_center_id'],
        ]);

        return redirect()->back();
    }

    public function destroy(Request $request, User $empleado): RedirectResponse
    {
        $companyIds = $request->user()->companies()->pluck('id');
        abort_if(! $companyIds->contains($empleado->company_id), 403);
        abort_if($empleado->role === 'admin', 403, 'No se puede gestionar un usuario administrador desde empleados.');
        abort_if($empleado->id === $request->user()->id, 422, 'No puedes eliminar tu propio perfil.');

        $empleado->delete();

        return redirect()->back();
    }
}
