<?php

use App\Models\Company;
use App\Models\User;
use App\Models\WorkCenter;

test('onsite employee sees distance and radius when geofence rejects the check-in', function () {
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

    $error = session('errors')->first('error');

    expect($error)
        ->toContain('Distancia detectada:')
        ->toContain('Radio permitido: 100 m.')
        ->toContain('Precisión GPS reportada: ±42 m.');
});
