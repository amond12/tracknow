<?php

use App\Models\Company;
use App\Models\Fichaje;
use App\Models\ResumenDiario;
use App\Models\User;
use App\Models\WorkCenter;
use App\Services\HorasExtraService;

test('deleting a manual extra-hours adjustment restores the automatic summary', function () {
    [$admin, $employee, $workCenter] = createHorasExtraContext();

    $fichaje = Fichaje::create([
        'user_id' => $employee->id,
        'work_center_id' => $workCenter->id,
        'timezone' => 'Europe/Madrid',
        'fecha' => '2026-03-12',
        'inicio_jornada' => '2026-03-12 09:00:00',
        'fin_jornada' => '2026-03-12 18:00:00',
        'duracion_jornada' => 32400,
        'estado' => 'finalizada',
    ]);

    app(HorasExtraService::class)->recalcularParaFichaje($fichaje);

    $autoResumen = ResumenDiario::query()
        ->where('user_id', $employee->id)
        ->where('fecha', '2026-03-12')
        ->firstOrFail();

    expect($autoResumen->origen)->toBe('auto')
        ->and($autoResumen->horas_extra)->toBe(3600);

    $this->actingAs($admin)
        ->post(route('horas-extra.store'), [
            'user_id' => $employee->id,
            'fecha' => '2026-03-12',
            'horas_extra' => 0,
        ])
        ->assertRedirect();

    $manualResumen = ResumenDiario::query()
        ->where('user_id', $employee->id)
        ->where('fecha', '2026-03-12')
        ->firstOrFail();

    expect($manualResumen->origen)->toBe('manual')
        ->and($manualResumen->horas_extra)->toBe(0)
        ->and($manualResumen->admin_id)->toBe($admin->id);

    $this->actingAs($admin)
        ->delete(route('horas-extra.destroy', $manualResumen))
        ->assertRedirect();

    $restoredResumen = ResumenDiario::query()
        ->where('user_id', $employee->id)
        ->where('fecha', '2026-03-12')
        ->firstOrFail();

    expect($restoredResumen->origen)->toBe('auto')
        ->and($restoredResumen->horas_trabajadas)->toBe(32400)
        ->and($restoredResumen->segundos_previstos)->toBe(28800)
        ->and($restoredResumen->horas_extra)->toBe(3600)
        ->and($restoredResumen->admin_id)->toBeNull();
});

test('automatic extra-hours summaries cannot be deleted directly', function () {
    [$admin, $employee, $workCenter] = createHorasExtraContext();

    $fichaje = Fichaje::create([
        'user_id' => $employee->id,
        'work_center_id' => $workCenter->id,
        'timezone' => 'Europe/Madrid',
        'fecha' => '2026-03-12',
        'inicio_jornada' => '2026-03-12 09:00:00',
        'fin_jornada' => '2026-03-12 18:00:00',
        'duracion_jornada' => 32400,
        'estado' => 'finalizada',
    ]);

    app(HorasExtraService::class)->recalcularParaFichaje($fichaje);

    $autoResumen = ResumenDiario::query()
        ->where('user_id', $employee->id)
        ->where('fecha', '2026-03-12')
        ->firstOrFail();

    $this->actingAs($admin)
        ->delete(route('horas-extra.destroy', $autoResumen))
        ->assertStatus(422);

    $autoResumen->refresh();

    expect($autoResumen->origen)->toBe('auto')
        ->and($autoResumen->horas_extra)->toBe(3600);
});

test('manual extra-hours adjustments clamp negative values to zero', function () {
    [$admin, $employee] = createHorasExtraContext();

    $this->actingAs($admin)
        ->post(route('horas-extra.store'), [
            'user_id' => $employee->id,
            'fecha' => '2026-03-12',
            'horas_extra' => -1800,
        ])
        ->assertRedirect();

    $manualResumen = ResumenDiario::query()
        ->where('user_id', $employee->id)
        ->where('fecha', '2026-03-12')
        ->firstOrFail();

    expect($manualResumen->origen)->toBe('manual')
        ->and($manualResumen->horas_extra)->toBe(0);
});

function createHorasExtraContext(): array
{
    $admin = User::factory()->create([
        'role' => User::ROLE_ADMIN,
    ]);

    $company = Company::create([
        'user_id' => $admin->id,
        'nombre' => 'Empresa Horas Extra',
        'cif' => 'CIF-HORAS-'.$admin->id,
        'pais' => 'ES',
        'ciudad' => 'Madrid',
        'direccion' => 'Calle Horas Extra 1',
        'cp' => '28001',
    ]);

    $workCenter = WorkCenter::create([
        'company_id' => $company->id,
        'nombre' => 'Centro Horas Extra',
        'pais' => 'ES',
        'provincia' => 'Madrid',
        'poblacion' => 'Madrid',
        'direccion' => 'Calle Horas Extra 1',
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
        'horario_jueves' => 8,
        'remoto' => false,
    ]);

    return [$admin, $employee, $workCenter];
}
