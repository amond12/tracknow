<?php

use App\Models\Company;
use App\Models\User;
use App\Models\WorkCenter;
use Inertia\Testing\AssertableInertia as Assert;

function createCompanyForAdminScope(User $admin, array $overrides = []): Company
{
    return Company::create(array_merge([
        'user_id' => $admin->id,
        'nombre' => 'Empresa Demo',
        'cif' => 'B22345678',
        'pais' => 'ES',
        'ciudad' => 'Madrid',
        'direccion' => 'Calle Demo 2',
        'cp' => '28002',
    ], $overrides));
}

function createWorkCenterForScopeCompany(Company $company, array $overrides = []): WorkCenter
{
    return WorkCenter::create(array_merge([
        'company_id' => $company->id,
        'nombre' => 'Centro Demo',
        'pais' => 'ES',
        'provincia' => 'Madrid',
        'poblacion' => 'Madrid',
        'direccion' => 'Calle Centro 2',
        'cp' => '28002',
        'timezone' => 'Europe/Madrid',
    ], $overrides));
}

test('empleados pueden acceder a sus vistas personales', function (string $routeName) {
    $admin = User::factory()->create(['role' => 'admin']);
    $company = createCompanyForAdminScope($admin, ['nombre' => 'Empresa Personal']);
    $workCenter = createWorkCenterForScopeCompany($company, ['nombre' => 'Centro Personal']);
    $employee = User::factory()->create([
        'role' => 'empleado',
        'company_id' => $company->id,
        'work_center_id' => $workCenter->id,
    ]);

    $this->actingAs($employee)
        ->get(route($routeName))
        ->assertOk();
})->with([
    'fichajes.index',
    'pdfs.index',
    'horas-extra.index',
]);

test('empleados ven su propio calendario', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $company = createCompanyForAdminScope($admin, ['nombre' => 'Empresa Calendario']);
    $workCenter = createWorkCenterForScopeCompany($company, ['nombre' => 'Centro Calendario']);
    $employee = User::factory()->create([
        'role' => 'empleado',
        'company_id' => $company->id,
        'work_center_id' => $workCenter->id,
    ]);

    $this->actingAs($employee)
        ->get(route('calendario.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('configuracion/calendario/index')
            ->where('empleadoId', $employee->id)
        );
});

test('empleados no pueden crear registros administrativos', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $company = createCompanyForAdminScope($admin, ['nombre' => 'Empresa Bloqueada']);
    $workCenter = createWorkCenterForScopeCompany($company, ['nombre' => 'Centro Bloqueado']);
    $employee = User::factory()->create([
        'role' => 'empleado',
        'company_id' => $company->id,
        'work_center_id' => $workCenter->id,
    ]);

    $this->actingAs($employee)
        ->post(route('fichajes.store'), [
            'employee_id' => $employee->id,
            'fecha' => now()->toDateString(),
            'inicio_jornada' => now()->startOfDay()->toDateTimeString(),
            'motivo' => 'Intento bloqueado',
        ])
        ->assertForbidden();

    $this->actingAs($employee)
        ->post(route('horas-extra.store'), [
            'user_id' => $employee->id,
            'fecha' => now()->toDateString(),
            'horas_extra' => 3600,
        ])
        ->assertForbidden();
});

test('encargados pueden crear empleados en cualquier empresa del admin propietario', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $companyA = createCompanyForAdminScope($admin, [
        'nombre' => 'Empresa A',
        'cif' => 'B10000001',
    ]);
    $companyB = createCompanyForAdminScope($admin, [
        'nombre' => 'Empresa B',
        'cif' => 'B10000002',
    ]);
    $workCenterA = createWorkCenterForScopeCompany($companyA, ['nombre' => 'Centro A']);
    $workCenterB = createWorkCenterForScopeCompany($companyB, ['nombre' => 'Centro B']);

    $encargado = User::factory()->create([
        'role' => 'encargado',
        'company_id' => $companyA->id,
        'work_center_id' => $workCenterA->id,
    ]);

    $this->actingAs($encargado)
        ->post(route('configuracion.empleados.store'), [
            'nombre' => 'Nuevo',
            'apellido' => 'Empleado',
            'email' => 'nuevo-empleado@example.com',
            'telefono' => '600000123',
            'dni' => '12.345.678-z',
            'nss' => '280000009999',
            'rol' => 'empleado',
            'remoto' => false,
            'company_id' => $companyB->id,
            'work_center_id' => $workCenterB->id,
            'horario_lunes' => 8,
            'horario_martes' => 8,
            'horario_miercoles' => 8,
            'horario_jueves' => 8,
            'horario_viernes' => 8,
            'horario_sabado' => 0,
            'horario_domingo' => 0,
        ])
        ->assertRedirect();

    $created = User::where('email', 'nuevo-empleado@example.com')->first();

    expect($created)->not->toBeNull();
    expect($created->company_id)->toBe($companyB->id);
    expect($created->work_center_id)->toBe($workCenterB->id);
    expect($created->role)->toBe('empleado');
    expect($created->dni)->toBe('12345678Z');
});
