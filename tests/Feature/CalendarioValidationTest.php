<?php

use App\Models\Company;
use App\Models\User;
use App\Models\Vacacion;
use App\Models\WorkCenter;

test('admin cannot store a partial absence with end time before start time', function () {
    [$admin, $employee] = createCalendarioValidationContext();

    $this->actingAs($admin)
        ->postJson(route('calendario.store'), [
            'user_id' => $employee->id,
            'fecha' => '2026-03-18',
            'tipo' => 'ausencia',
            'motivo' => 'Cita medica',
            'dia_completo' => false,
            'hora_inicio' => '18:00',
            'hora_fin' => '09:00',
        ])
        ->assertStatus(422)
        ->assertJson([
            'message' => 'La hora de fin debe ser posterior a la hora de inicio.',
        ]);

    expect(Vacacion::query()->count())->toBe(0);
});

function createCalendarioValidationContext(): array
{
    $admin = User::factory()->create([
        'role' => User::ROLE_ADMIN,
    ]);

    $company = Company::create([
        'user_id' => $admin->id,
        'nombre' => 'Empresa Calendario',
        'cif' => 'CIF-CAL-'.$admin->id,
        'pais' => 'ES',
        'ciudad' => 'Madrid',
        'direccion' => 'Calle Calendario 1',
        'cp' => '28001',
    ]);

    $workCenter = WorkCenter::create([
        'company_id' => $company->id,
        'nombre' => 'Centro Calendario',
        'pais' => 'ES',
        'provincia' => 'Madrid',
        'poblacion' => 'Madrid',
        'direccion' => 'Calle Calendario 1',
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
    ]);

    return [$admin, $employee, $workCenter];
}
