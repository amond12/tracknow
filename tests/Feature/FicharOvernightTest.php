<?php

use App\Models\Company;
use App\Models\Fichaje;
use App\Models\User;
use App\Models\WorkCenter;
use Carbon\Carbon;

test('no permite iniciar una segunda jornada activa si la anterior cruza medianoche', function () {
    [$company, $workCenter] = createOvernightWorkContext();

    $empleado = User::factory()->create([
        'role' => 'empleado',
        'company_id' => $company->id,
        'work_center_id' => $workCenter->id,
        'remoto' => true,
    ]);

    Fichaje::create([
        'user_id' => $empleado->id,
        'work_center_id' => $workCenter->id,
        'fecha' => '2026-03-12',
        'inicio_jornada' => '2026-03-12 22:00:00',
        'estado' => 'activa',
    ]);

    Carbon::setTestNow('2026-03-13 01:00:00');

    try {
        $this->actingAs($empleado)
            ->post(route('fichar.iniciar'))
            ->assertSessionHasErrors(['error' => 'Ya tienes una jornada activa.']);
    } finally {
        Carbon::setTestNow();
    }

    expect(Fichaje::where('user_id', $empleado->id)->count())->toBe(1);
});

function createOvernightWorkContext(): array
{
    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    $company = Company::create([
        'user_id' => $admin->id,
        'nombre' => 'Empresa Noche',
        'cif' => 'CIF-NOCHE',
        'pais' => 'ES',
        'ciudad' => 'Madrid',
        'direccion' => 'Calle Luna 1',
        'cp' => '28001',
    ]);

    $workCenter = WorkCenter::create([
        'company_id' => $company->id,
        'nombre' => 'Centro Noche',
        'pais' => 'ES',
        'provincia' => 'Madrid',
        'poblacion' => 'Madrid',
        'direccion' => 'Calle Luna 1',
        'cp' => '28001',
        'lat' => 40.4168,
        'lng' => -3.7038,
        'radio' => 150,
        'ips' => ['127.0.0.1'],
    ]);

    return [$company, $workCenter];
}
