<?php

use App\Models\Company;
use App\Models\User;
use App\Models\WorkCenter;

test('onsite employee sees the generic geofence rejection message', function () {
    $owner = User::factory()->create([
        'role' => 'admin',
    ]);

    $company = Company::create([
        'user_id' => $owner->id,
        'nombre' => 'Empresa Demo',
        'cif' => 'CIF-'.$owner->id,
        'pais' => 'ES',
        'ciudad' => 'Madrid',
        'direccion' => 'Calle Mayor 1',
        'cp' => '28001',
    ]);

    $workCenter = WorkCenter::create([
        'company_id' => $company->id,
        'nombre' => 'Centro Madrid',
        'pais' => 'ES',
        'provincia' => 'Madrid',
        'poblacion' => 'Madrid',
        'direccion' => 'Calle Mayor 1',
        'cp' => '28001',
        'timezone' => 'Europe/Madrid',
        'lat' => 40.4168,
        'lng' => -3.7038,
        'radio' => 100,
        'ips' => [],
    ]);

    $employee = User::factory()->create([
        'role' => 'empleado',
        'company_id' => $company->id,
        'work_center_id' => $workCenter->id,
        'remoto' => false,
    ]);

    $response = $this->actingAs($employee)->post(route('fichar.iniciar'), [
        'lat' => 40.4182,
        'lng' => -3.7038,
        'accuracy' => 42,
    ]);

    $response->assertSessionHasErrors('error');

    expect(session('errors')->first('error'))->toBe('No se pudo validar tu ubicacion para fichar.');
});
