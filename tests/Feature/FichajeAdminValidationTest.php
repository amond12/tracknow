<?php

use App\Models\Company;
use App\Models\Fichaje;
use App\Models\Pausa;
use App\Models\User;
use App\Models\WorkCenter;

test('admin cannot create a manual fichaje with end time equal to start time', function () {
    [$admin, $employee] = createAdminEmployeeContext();

    $this->actingAs($admin)
        ->post(route('fichajes.store'), [
            'employee_id' => $employee->id,
            'fecha' => '2026-03-18',
            'inicio_jornada' => '2026-03-18T18:00:00',
            'fin_jornada' => '2026-03-18T18:00:00',
            'pausas' => [],
            'motivo' => 'Alta manual invalida',
        ])
        ->assertSessionHasErrors(['fin_jornada']);

    expect(Fichaje::query()->count())->toBe(0);
});

test('admin cannot move a workday end before its start', function () {
    [$admin, $employee, $workCenter] = createAdminEmployeeContext();

    $fichaje = Fichaje::create([
        'user_id' => $employee->id,
        'work_center_id' => $workCenter->id,
        'timezone' => 'Europe/Madrid',
        'fecha' => '2026-03-18',
        'inicio_jornada' => '2026-03-18 08:00:00',
        'fin_jornada' => '2026-03-18 17:00:00',
        'duracion_jornada' => 32400,
        'estado' => 'finalizada',
    ]);

    $this->actingAs($admin)
        ->put(route('fichajes.updateJornada', $fichaje), [
            'campo' => 'fin_jornada',
            'datetime' => '2026-03-18T07:30:00',
            'motivo' => 'Intento invalido',
        ])
        ->assertSessionHasErrors(['hora']);

    expect(
        $fichaje->fresh()->fin_jornada?->copy()->setTimezone('Europe/Madrid')->format('Y-m-d H:i:s')
    )->toBe('2026-03-18 17:00:00');
});

test('admin cannot add an overlapping pause to a fichaje', function () {
    [$admin, $employee, $workCenter] = createAdminEmployeeContext();

    $fichaje = Fichaje::create([
        'user_id' => $employee->id,
        'work_center_id' => $workCenter->id,
        'timezone' => 'Europe/Madrid',
        'fecha' => '2026-03-18',
        'inicio_jornada' => '2026-03-18 08:00:00',
        'fin_jornada' => '2026-03-18 17:00:00',
        'duracion_jornada' => 31500,
        'estado' => 'finalizada',
    ]);

    Pausa::create([
        'fichaje_id' => $fichaje->id,
        'inicio_pausa' => '2026-03-18 10:00:00',
        'fin_pausa' => '2026-03-18 10:15:00',
        'duracion_pausa' => 900,
    ]);

    $this->actingAs($admin)
        ->post(route('fichajes.storePausa', $fichaje), [
            'inicio_pausa' => '2026-03-18T10:10:00',
            'fin_pausa' => '2026-03-18T10:20:00',
            'motivo' => 'Pausa solapada',
        ])
        ->assertSessionHasErrors(['inicio_pausa']);

    expect(Pausa::query()->where('fichaje_id', $fichaje->id)->count())->toBe(1);
});

test('admin cannot move a pause outside the workday bounds', function () {
    [$admin, $employee, $workCenter] = createAdminEmployeeContext();

    $fichaje = Fichaje::create([
        'user_id' => $employee->id,
        'work_center_id' => $workCenter->id,
        'timezone' => 'Europe/Madrid',
        'fecha' => '2026-03-18',
        'inicio_jornada' => '2026-03-18 08:00:00',
        'fin_jornada' => '2026-03-18 17:00:00',
        'duracion_jornada' => 31500,
        'estado' => 'finalizada',
    ]);

    $pausa = Pausa::create([
        'fichaje_id' => $fichaje->id,
        'inicio_pausa' => '2026-03-18 10:00:00',
        'fin_pausa' => '2026-03-18 10:15:00',
        'duracion_pausa' => 900,
    ]);

    $this->actingAs($admin)
        ->put(route('fichajes.updatePausa', ['fichaje' => $fichaje, 'pausa' => $pausa]), [
            'campo' => 'fin_pausa',
            'datetime' => '2026-03-18T18:00:00',
            'motivo' => 'Pausa fuera de rango',
        ])
        ->assertSessionHasErrors(['hora']);

    expect(
        $pausa->fresh()->fin_pausa?->copy()->setTimezone('Europe/Madrid')->format('Y-m-d H:i:s')
    )->toBe('2026-03-18 10:15:00');
});

function createAdminEmployeeContext(): array
{
    $admin = User::factory()->create([
        'role' => User::ROLE_ADMIN,
    ]);

    $company = Company::create([
        'user_id' => $admin->id,
        'nombre' => 'Empresa Validaciones',
        'cif' => 'CIF-'.$admin->id,
        'pais' => 'ES',
        'ciudad' => 'Madrid',
        'direccion' => 'Calle Fichajes 1',
        'cp' => '28001',
    ]);

    $workCenter = WorkCenter::create([
        'company_id' => $company->id,
        'nombre' => 'Centro Validaciones',
        'pais' => 'ES',
        'provincia' => 'Madrid',
        'poblacion' => 'Madrid',
        'direccion' => 'Calle Fichajes 1',
        'cp' => '28001',
        'timezone' => 'Europe/Madrid',
        'lat' => 40.4168,
        'lng' => -3.7038,
        'radio' => 150,
        'ips' => ['127.0.0.1'],
    ]);

    $employee = User::factory()->create([
        'role' => User::ROLE_EMPLEADO,
        'company_id' => $company->id,
        'work_center_id' => $workCenter->id,
        'remoto' => false,
    ]);

    return [$admin, $employee, $workCenter];
}
