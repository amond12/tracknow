<?php

use App\Models\Company;
use App\Models\Employee;
use App\Models\Fichaje;
use App\Models\User;
use App\Models\WorkCenter;
use Inertia\Testing\AssertableInertia as Assert;

test('admin without company and center sees setup message in fichar', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    $this->actingAs($admin)
        ->get(route('fichar'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('fichar/index')
            ->where('employee', null)
            ->where(
                'setupMessage',
                'Para fichar como administrador, crea primero una empresa y un centro de trabajo en Configuracion.'
            ),
        );

    expect(Employee::where('user_id', $admin->id)->exists())->toBeFalse();
});

test('admin gets employee profile automatically when entering fichar with at least one center', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
        'name' => 'Carlos',
        'apellido' => 'Martinez',
        'telefono' => '600123123',
    ]);

    $workCenter = createOwnedWorkCenter($admin);

    $this->actingAs($admin)
        ->get(route('fichar'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('fichar/index')
            ->where('employee.user_id', $admin->id)
            ->where('setupMessage', null),
        );

    $employee = Employee::where('user_id', $admin->id)->first();

    expect($employee)->not->toBeNull();
    expect($employee->company_id)->toBe($workCenter->company_id);
    expect($employee->work_center_id)->toBe($workCenter->id);
    expect($employee->nombre)->toBe('Carlos');
    expect($employee->apellido)->toBe('Martinez');
    expect($employee->telefono)->toBe('600123123');
    expect($employee->remoto)->toBeTrue();
});

test('admin can start workday without pre-created employee profile', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    $workCenter = createOwnedWorkCenter($admin);

    $this->actingAs($admin)
        ->post(route('fichar.iniciar'))
        ->assertSessionDoesntHaveErrors();

    $employee = Employee::where('user_id', $admin->id)->first();
    expect($employee)->not->toBeNull();

    $fichaje = Fichaje::where('employee_id', $employee->id)->latest()->first();
    expect($fichaje)->not->toBeNull();
    expect($fichaje->work_center_id)->toBe($workCenter->id);
    expect($fichaje->estado)->toBe('activa');
});

test('admin cannot delete own employee profile from configuracion', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    createOwnedWorkCenter($admin);

    $this->actingAs($admin)->get(route('fichar'));
    $employee = Employee::where('user_id', $admin->id)->firstOrFail();

    $this->actingAs($admin)
        ->delete(route('configuracion.empleados.destroy', $employee))
        ->assertStatus(422);

    expect(Employee::whereKey($employee->id)->exists())->toBeTrue();
    expect(User::whereKey($admin->id)->exists())->toBeTrue();
});

test('admin employee profile gets synced with user name and apellido on fichar', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
        'name' => 'Ana',
        'apellido' => 'Lopez',
        'telefono' => '611000111',
    ]);

    createOwnedWorkCenter($admin);

    $this->actingAs($admin)->get(route('fichar'));

    $admin->update([
        'name' => 'Ana Maria',
        'apellido' => 'Garcia',
        'telefono' => '622333444',
    ]);

    $this->actingAs($admin)->get(route('fichar'));

    $employee = Employee::where('user_id', $admin->id)->firstOrFail();

    expect($employee->nombre)->toBe('Ana Maria');
    expect($employee->apellido)->toBe('Garcia');
    expect($employee->telefono)->toBe('622333444');
});

function createOwnedWorkCenter(User $admin): WorkCenter
{
    $company = Company::create([
        'user_id' => $admin->id,
        'nombre' => 'Empresa Admin',
        'cif' => 'CIF-' . $admin->id,
        'pais' => 'ES',
        'ciudad' => 'Madrid',
        'direccion' => 'Calle Principal 1',
        'cp' => '28001',
    ]);

    return WorkCenter::create([
        'company_id' => $company->id,
        'nombre' => 'Sede Principal',
        'pais' => 'ES',
        'provincia' => 'Madrid',
        'poblacion' => 'Madrid',
        'direccion' => 'Calle Principal 1',
        'cp' => '28001',
        'lat' => 40.4168,
        'lng' => -3.7038,
        'radio' => 150,
        'ips' => ['127.0.0.1'],
    ]);
}
