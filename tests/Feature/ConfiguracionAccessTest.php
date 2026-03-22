<?php

use App\Models\Company;
use App\Models\User;
use App\Models\WorkCenter;

function createCompanyForAdmin(User $admin, array $overrides = []): Company
{
    return Company::create(array_merge([
        'user_id' => $admin->id,
        'nombre' => 'Empresa Demo',
        'cif' => 'B12345678',
        'pais' => 'ES',
        'ciudad' => 'Madrid',
        'direccion' => 'Calle Demo 1',
        'cp' => '28001',
    ], $overrides));
}

function createWorkCenterForCompany(Company $company, array $overrides = []): WorkCenter
{
    return WorkCenter::create(array_merge([
        'company_id' => $company->id,
        'nombre' => 'Centro Demo',
        'pais' => 'ES',
        'provincia' => 'Madrid',
        'poblacion' => 'Madrid',
        'direccion' => 'Calle Centro 1',
        'cp' => '28001',
        'timezone' => 'Europe/Madrid',
    ], $overrides));
}

test('empleados no pueden acceder a configuración', function (string $routeName) {
    $employee = User::factory()->create([
        'role' => 'empleado',
    ]);

    $this->actingAs($employee)
        ->get(route($routeName))
        ->assertForbidden();
})->with([
    'configuracion.empresas.index',
    'configuracion.centros.index',
    'configuracion.empleados.index',
]);

test('encargados y admins pueden acceder a las pantallas de configuración', function (string $role, string $routeName) {
    $user = User::factory()->create([
        'role' => $role,
    ]);

    if ($role === 'encargado') {
        $admin = User::factory()->create(['role' => 'admin']);
        $company = createCompanyForAdmin($admin);
        $workCenter = createWorkCenterForCompany($company);

        $user->update([
            'company_id' => $company->id,
            'work_center_id' => $workCenter->id,
        ]);
    }

    $this->actingAs($user)
        ->get(route($routeName))
        ->assertOk();
})->with([
    ['encargado', 'configuracion.empresas.index'],
    ['encargado', 'configuracion.centros.index'],
    ['encargado', 'configuracion.empleados.index'],
    ['admin', 'configuracion.empresas.index'],
    ['admin', 'configuracion.centros.index'],
    ['admin', 'configuracion.empleados.index'],
]);

test('encargados no pueden crear empresas ni centros', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $company = createCompanyForAdmin($admin);
    $workCenter = createWorkCenterForCompany($company);
    $encargado = User::factory()->create([
        'role' => 'encargado',
        'company_id' => $company->id,
        'work_center_id' => $workCenter->id,
    ]);

    $this->actingAs($encargado)
        ->post(route('configuracion.empresas.store'), [
            'nombre' => 'Empresa Nueva',
            'cif' => 'B87654321',
        ])
        ->assertForbidden();

    $this->actingAs($encargado)
        ->post(route('configuracion.centros.store'), [
            'company_id' => $company->id,
            'nombre' => 'Centro Nuevo',
            'pais' => 'ES',
            'provincia' => 'Madrid',
            'poblacion' => 'Madrid',
            'direccion' => 'Calle 2',
            'cp' => '28002',
            'timezone' => 'Europe/Madrid',
        ])
        ->assertForbidden();
});
