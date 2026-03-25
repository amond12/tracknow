<?php

use App\Models\Company;
use App\Models\Fichaje;
use App\Models\Pausa;
use App\Models\User;
use App\Models\WorkCenter;
use App\Services\PublicFichajeEmployeeLookupService;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Testing\AssertableInertia as Assert;

test('guest can open the public fichaje page', function () {
    $this->get(route('fichar.publico'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('fichar-publico/index')
            ->where('employee', null)
            ->where('fichajeActivo', null)
            ->where('auth.user', null),
        );
});

test('public search redirects with the normalized identifier', function () {
    [, , , $employee] = createPublicFichajeContext([
        'dni' => '12345678z',
    ]);

    $this->post(route('fichar.publico.buscar'), [
        'identificador' => ' 12345678z ',
    ])->assertRedirect(route('fichar.publico', [
        'identificador' => '12345678Z',
    ]));
});

test('public page resolves an employee by dni', function () {
    [$company, , , $employee] = createPublicFichajeContext([
        'dni' => '12345678Z',
    ]);

    $this->get(route('fichar.publico', [
        'identificador' => '12345678Z',
    ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('fichar-publico/index')
            ->where('employee.id', $employee->id)
            ->where('employee.clock_code', $company->clock_code_prefix.$employee->clock_code_suffix)
            ->where('lookupError', null),
        );
});

test('public page resolves an employee by 8 digit clock code', function () {
    [$company, , , $employee] = createPublicFichajeContext();

    $this->get(route('fichar.publico', [
        'identificador' => $company->clock_code_prefix.$employee->clock_code_suffix,
    ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('fichar-publico/index')
            ->where('employee.id', $employee->id)
            ->where('lookupError', null),
        );
});

test('invalid public identifier returns a generic lookup error', function () {
    $this->get(route('fichar.publico', [
        'identificador' => '99999999',
    ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('fichar-publico/index')
            ->where('employee', null)
            ->where(
                'lookupError',
                PublicFichajeEmployeeLookupService::GENERIC_LOOKUP_ERROR,
            ),
        );
});

test('admins can be resolved by dni in the public fichaje lookup', function () {
    $admin = User::factory()->create([
        'role' => User::ROLE_ADMIN,
        'dni' => '87654321X',
    ]);

    $company = Company::create([
        'user_id' => $admin->id,
        'nombre' => 'Empresa Admin',
        'cif' => 'CIF-'.$admin->id,
        'pais' => 'ES',
        'ciudad' => 'Madrid',
        'direccion' => 'Calle Admin 1',
        'cp' => '28001',
    ]);

    $workCenter = WorkCenter::create([
        'company_id' => $company->id,
        'nombre' => 'Centro Admin',
        'pais' => 'ES',
        'provincia' => 'Madrid',
        'poblacion' => 'Madrid',
        'direccion' => 'Calle Admin 1',
        'cp' => '28001',
        'timezone' => 'Europe/Madrid',
        'lat' => 40.4168,
        'lng' => -3.7038,
        'radio' => 150,
        'ips' => ['127.0.0.1'],
    ]);

    $this->get(route('fichar.publico', [
        'identificador' => '87654321X',
    ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('fichar-publico/index')
            ->where('employee.id', $admin->id)
            ->where('employee.remoto', true)
            ->where('lookupError', null),
        );

    $admin->refresh();

    expect($admin->company_id)->toBe($company->id)
        ->and($admin->work_center_id)->toBe($workCenter->id);
});

test('admin can start a workday from public fichaje using dni', function () {
    $admin = User::factory()->create([
        'role' => User::ROLE_ADMIN,
        'dni' => '87654321X',
    ]);

    $company = Company::create([
        'user_id' => $admin->id,
        'nombre' => 'Empresa Admin',
        'cif' => 'CIF-'.$admin->id,
        'pais' => 'ES',
        'ciudad' => 'Madrid',
        'direccion' => 'Calle Admin 1',
        'cp' => '28001',
    ]);

    WorkCenter::create([
        'company_id' => $company->id,
        'nombre' => 'Centro Admin',
        'pais' => 'ES',
        'provincia' => 'Madrid',
        'poblacion' => 'Madrid',
        'direccion' => 'Calle Admin 1',
        'cp' => '28001',
        'timezone' => 'Europe/Madrid',
        'lat' => 40.4168,
        'lng' => -3.7038,
        'radio' => 150,
        'ips' => ['127.0.0.1'],
    ]);

    $this->followingRedirects()
        ->post(route('fichar.publico.iniciar'), [
            'identificador' => '87654321X',
            'lat' => 40.4168,
            'lng' => -3.7038,
            'accuracy' => 10,
        ])
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('fichar-publico/index')
            ->where('identificador', '')
            ->where('employee', null)
            ->where('successMessage', 'Entrada registrada correctamente.'),
        );

    $admin->refresh();

    expect($admin->company_id)->toBe($company->id)
        ->and($admin->work_center_id)->not->toBeNull()
        ->and(Fichaje::query()->where('user_id', $admin->id)->exists())->toBeTrue();
});

test('public workflow supports start pause resume and finish without login', function () {
    [$company, $workCenter, , $employee] = createPublicFichajeContext([
        'remoto' => true,
    ]);

    $identifier = $company->clock_code_prefix.$employee->clock_code_suffix;

    $this->followingRedirects()
        ->post(route('fichar.publico.iniciar'), [
            'identificador' => $identifier,
            'lat' => $workCenter->lat,
            'lng' => $workCenter->lng,
            'accuracy' => 10,
        ])
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('fichar-publico/index')
            ->where('identificador', '')
            ->where('employee', null)
            ->where('successMessage', 'Entrada registrada correctamente.'),
        );

    $fichaje = Fichaje::query()->where('user_id', $employee->id)->firstOrFail();

    expect($fichaje->estado)->toBe('activa');

    $this->post(route('fichar.publico.pausa'), [
        'identificador' => $identifier,
        'lat' => $workCenter->lat,
        'lng' => $workCenter->lng,
        'accuracy' => 10,
    ])->assertRedirect(route('fichar.publico'));

    expect($fichaje->fresh()->estado)->toBe('pausa');

    $this->post(route('fichar.publico.pausa'), [
        'identificador' => $identifier,
        'lat' => $workCenter->lat,
        'lng' => $workCenter->lng,
        'accuracy' => 10,
    ])->assertRedirect(route('fichar.publico'));

    $fichaje->refresh();
    $pausa = Pausa::query()->where('fichaje_id', $fichaje->id)->sole();

    expect($fichaje->estado)->toBe('activa')
        ->and($pausa->fin_pausa)->not->toBeNull();

    $this->followingRedirects()
        ->post(route('fichar.publico.finalizar'), [
            'identificador' => $identifier,
            'lat' => $workCenter->lat,
            'lng' => $workCenter->lng,
            'accuracy' => 10,
        ])
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('fichar-publico/index')
            ->where('identificador', '')
            ->where('employee', null)
            ->where('successMessage', 'Salida registrada correctamente.'),
        );

    expect($fichaje->fresh()->estado)->toBe('finalizada');
});

test('public workflow preserves the geofence validation for onsite employees', function () {
    [$company, $workCenter, , $employee] = createPublicFichajeContext([
        'remoto' => false,
    ], [
        'ips' => [],
    ]);

    $identifier = $company->clock_code_prefix.$employee->clock_code_suffix;

    $response = $this->post(route('fichar.publico.iniciar'), [
        'identificador' => $identifier,
        'lat' => $workCenter->lat + 0.05,
        'lng' => $workCenter->lng + 0.05,
        'accuracy' => 10,
    ]);

    $response->assertRedirect(route('fichar.publico', [
        'identificador' => $identifier,
    ]));
    $response->assertSessionHasErrors('error');

    expect(session('errors')->first('error'))->toBe(
        'No se pudo validar tu ubicacion para fichar.',
    );
    expect(Fichaje::query()->where('user_id', $employee->id)->exists())->toBeFalse();
});

test('public workflow allows onsite employees to fichar by IP without work center coordinates', function () {
    [$company, $workCenter, , $employee] = createPublicFichajeContext([
        'remoto' => false,
    ], [
        'lat' => null,
        'lng' => null,
        'ips' => ['79.116.142.27'],
    ]);

    $identifier = $company->clock_code_prefix.$employee->clock_code_suffix;

    $this->followingRedirects()
        ->post(route('fichar.publico.iniciar'), [
            'identificador' => $identifier,
            'ip_publica' => '79.116.142.27',
        ])
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('fichar-publico/index')
            ->where('identificador', '')
            ->where('employee', null)
            ->where('successMessage', 'Entrada registrada correctamente.'),
        );

    expect(Fichaje::query()->where('user_id', $employee->id)->exists())->toBeTrue();
    expect($workCenter->fresh()->lat)->toBeNull()
        ->and($workCenter->fresh()->lng)->toBeNull();
});

test('public lookup is rate limited', function () {
    [$company, , , $employee] = createPublicFichajeContext();

    $identifier = $company->clock_code_prefix.$employee->clock_code_suffix;
    $burstKey = md5(
        'public-clock-lookup'.'burst:127.0.0.1|lookup|'.$identifier,
    );

    RateLimiter::clear($burstKey);

    for ($attempt = 0; $attempt < 6; $attempt++) {
        RateLimiter::hit($burstKey, 1);
    }

    $this->get(route('fichar.publico', [
        'identificador' => $identifier,
    ]))->assertStatus(429);
});

function createPublicFichajeContext(
    array $employeeOverrides = [],
    array $workCenterOverrides = [],
): array {
    $owner = User::factory()->create([
        'role' => User::ROLE_ADMIN,
    ]);

    $company = Company::create([
        'user_id' => $owner->id,
        'nombre' => 'Empresa Publica',
        'cif' => 'CIF-'.$owner->id,
        'pais' => 'ES',
        'ciudad' => 'Madrid',
        'direccion' => 'Calle Publica 1',
        'cp' => '28001',
    ]);

    $workCenter = WorkCenter::create(array_merge([
        'company_id' => $company->id,
        'nombre' => 'Centro Publico',
        'pais' => 'ES',
        'provincia' => 'Madrid',
        'poblacion' => 'Madrid',
        'direccion' => 'Calle Publica 1',
        'cp' => '28001',
        'timezone' => 'Europe/Madrid',
        'lat' => 40.4168,
        'lng' => -3.7038,
        'radio' => 150,
        'ips' => ['127.0.0.1'],
    ], $workCenterOverrides));

    $employee = User::factory()->create(array_merge([
        'role' => User::ROLE_EMPLEADO,
        'company_id' => $company->id,
        'work_center_id' => $workCenter->id,
        'remoto' => true,
    ], $employeeOverrides));

    return [$company, $workCenter, $owner, $employee];
}
