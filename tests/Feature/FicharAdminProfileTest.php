<?php

use App\Models\Company;
use App\Models\Fichaje;
use App\Models\User;
use App\Models\WorkCenter;
use Inertia\Testing\AssertableInertia as Assert;

test('admin without company and center sees setup message in fichar', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
        'company_id' => null,
        'work_center_id' => null,
        'remoto' => false,
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

    $admin->refresh();

    expect($admin->company_id)->toBeNull();
    expect($admin->work_center_id)->toBeNull();
    expect($admin->remoto)->toBeFalse();
});

test('admin gets assigned to the first owned work center when entering fichar', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
        'name' => 'Carlos',
        'apellido' => 'Martinez',
        'telefono' => '600123123',
        'company_id' => null,
        'work_center_id' => null,
        'remoto' => false,
    ]);

    $workCenter = createOwnedWorkCenter($admin);

    $this->actingAs($admin)
        ->get(route('fichar'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('fichar/index')
            ->where('employee.id', $admin->id)
            ->where('employee.name', 'Carlos')
            ->where('employee.apellido', 'Martinez')
            ->where('employee.telefono', '600123123')
            ->where('employee.work_center.id', $workCenter->id)
            ->where('setupMessage', null),
        );

    $admin->refresh();

    expect($admin->company_id)->toBe($workCenter->company_id);
    expect($admin->work_center_id)->toBe($workCenter->id);
    expect($admin->remoto)->toBeTrue();
});

test('admin can start workday after the automatic assignment', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
        'company_id' => null,
        'work_center_id' => null,
        'remoto' => false,
    ]);

    $workCenter = createOwnedWorkCenter($admin);

    $this->actingAs($admin)
        ->post(route('fichar.iniciar'), [
            'lat' => 35.6764,
            'lng' => 139.6500,
            'accuracy' => 25,
        ])
        ->assertSessionDoesntHaveErrors();

    $admin->refresh();

    expect($admin->company_id)->toBe($workCenter->company_id);
    expect($admin->work_center_id)->toBe($workCenter->id);
    expect($admin->remoto)->toBeTrue();

    $fichaje = Fichaje::query()
        ->where('user_id', $admin->id)
        ->latest('id')
        ->first();

    expect($fichaje)->not->toBeNull();
    expect($fichaje->work_center_id)->toBe($workCenter->id);
    expect($fichaje->estado)->toBe('activa');
});

test('admin cannot delete own admin user from empleados configuration', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
        'company_id' => null,
        'work_center_id' => null,
        'remoto' => false,
    ]);

    createOwnedWorkCenter($admin);

    $this->actingAs($admin)->get(route('fichar'))->assertOk();

    $this->actingAs($admin)
        ->delete(route('configuracion.empleados.destroy', $admin))
        ->assertForbidden();

    expect(User::whereKey($admin->id)->exists())->toBeTrue();
});

test('fichar always renders the current admin user data', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
        'name' => 'Ana',
        'apellido' => 'Lopez',
        'telefono' => '611000111',
        'company_id' => null,
        'work_center_id' => null,
        'remoto' => false,
    ]);

    createOwnedWorkCenter($admin);

    $this->actingAs($admin)->get(route('fichar'))->assertOk();

    $admin->update([
        'name' => 'Ana Maria',
        'apellido' => 'Garcia',
        'telefono' => '622333444',
    ]);

    $this->actingAs($admin)
        ->get(route('fichar'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('fichar/index')
            ->where('employee.id', $admin->id)
            ->where('employee.name', 'Ana Maria')
            ->where('employee.apellido', 'Garcia')
            ->where('employee.telefono', '622333444'),
        );
});

function createOwnedWorkCenter(User $admin): WorkCenter
{
    $company = Company::create([
        'user_id' => $admin->id,
        'nombre' => 'Empresa Admin',
        'cif' => 'CIF-'.$admin->id,
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
        'timezone' => 'Europe/Madrid',
        'lat' => 40.4168,
        'lng' => -3.7038,
        'radio' => 150,
        'ips' => ['127.0.0.1'],
    ]);
}
