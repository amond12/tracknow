<?php

use App\Models\Company;
use App\Models\EdicionFichaje;
use App\Models\Fichaje;
use App\Models\Pausa;
use App\Models\ResumenDiario;
use App\Models\User;
use App\Models\WorkCenter;
use App\Services\HorasExtraService;
use App\Support\WorkCenterTimezone;
use Carbon\Carbon;

test('admin can create a final manual fichaje with pauses and computed summary', function () {
    [$admin, $employee] = createFichajeWorkflowContext();

    $this->actingAs($admin)
        ->post(route('fichajes.store'), [
            'employee_id' => $employee->id,
            'fecha' => '2026-03-12',
            'inicio_jornada' => '2026-03-12T09:00:00',
            'fin_jornada' => '2026-03-12T18:00:00',
            'pausas' => [
                [
                    'inicio_pausa' => '2026-03-12T14:00:00',
                    'fin_pausa' => '2026-03-12T14:30:00',
                ],
            ],
            'motivo' => 'Alta manual completa',
        ])
        ->assertRedirect();

    $fichaje = Fichaje::query()->with('pausas')->sole();
    $resumen = ResumenDiario::query()->where('user_id', $employee->id)->where('fecha', '2026-03-12')->firstOrFail();

    expect($fichaje->estado)->toBe('finalizada')
        ->and($fichaje->duracion_jornada)->toBe(30600)
        ->and(formatLocalDateTime($fichaje->inicio_jornada))->toBe('2026-03-12 09:00:00')
        ->and(formatLocalDateTime($fichaje->fin_jornada))->toBe('2026-03-12 18:00:00')
        ->and($fichaje->pausas)->toHaveCount(1)
        ->and($fichaje->pausas->first()->duracion_pausa)->toBe(1800)
        ->and($resumen->horas_trabajadas)->toBe(30600)
        ->and($resumen->segundos_previstos)->toBe(28800)
        ->and($resumen->horas_extra)->toBe(1800)
        ->and(EdicionFichaje::query()->where('fichaje_id', $fichaje->id)->where('campo', 'creacion_admin')->exists())->toBeTrue();
});

test('admin can create a final overnight manual fichaje with overnight pause without negative extra hours', function () {
    [$admin, $employee] = createFichajeWorkflowContext();

    $this->actingAs($admin)
        ->post(route('fichajes.store'), [
            'employee_id' => $employee->id,
            'fecha' => '2026-03-12',
            'inicio_jornada' => '2026-03-12T22:00:00',
            'fin_jornada' => '2026-03-12T06:00:00',
            'pausas' => [
                [
                    'inicio_pausa' => '2026-03-12T01:00:00',
                    'fin_pausa' => '2026-03-12T01:15:00',
                ],
            ],
            'motivo' => 'Alta manual nocturna',
        ])
        ->assertRedirect();

    $fichaje = Fichaje::query()->with('pausas')->sole();
    $pausa = $fichaje->pausas->sole();
    $resumen = ResumenDiario::query()->where('user_id', $employee->id)->where('fecha', '2026-03-12')->firstOrFail();

    expect(formatLocalDateTime($fichaje->inicio_jornada))->toBe('2026-03-12 22:00:00')
        ->and(formatLocalDateTime($fichaje->fin_jornada))->toBe('2026-03-13 06:00:00')
        ->and($fichaje->duracion_jornada)->toBe(27900)
        ->and(formatLocalDateTime($pausa->inicio_pausa))->toBe('2026-03-13 01:00:00')
        ->and(formatLocalDateTime($pausa->fin_pausa))->toBe('2026-03-13 01:15:00')
        ->and($pausa->duracion_pausa)->toBe(900)
        ->and($resumen->horas_trabajadas)->toBe(27900)
        ->and($resumen->horas_extra)->toBe(0);
});

test('admin can create an active manual fichaje with an open pause', function () {
    [$admin, $employee] = createFichajeWorkflowContext();

    $this->actingAs($admin)
        ->post(route('fichajes.store'), [
            'employee_id' => $employee->id,
            'fecha' => '2026-03-12',
            'inicio_jornada' => '2026-03-12T09:00:00',
            'fin_jornada' => null,
            'pausas' => [
                [
                    'inicio_pausa' => '2026-03-12T11:00:00',
                    'fin_pausa' => null,
                ],
            ],
            'motivo' => 'Alta manual abierta',
        ])
        ->assertRedirect();

    $fichaje = Fichaje::query()->with('pausas')->sole();

    expect($fichaje->estado)->toBe('pausa')
        ->and($fichaje->fin_jornada)->toBeNull()
        ->and($fichaje->duracion_jornada)->toBeNull()
        ->and($fichaje->pausas)->toHaveCount(1)
        ->and($fichaje->pausas->first()->fin_pausa)->toBeNull()
        ->and($fichaje->pausas->first()->duracion_pausa)->toBeNull();
});

test('admin can create a manual fichaje for themselves', function () {
    [$admin, , $workCenter] = createFichajeWorkflowContext();

    $admin->update([
        'company_id' => $workCenter->company_id,
        'work_center_id' => $workCenter->id,
        'horario_jueves' => 8,
        'remoto' => true,
    ]);

    $this->actingAs($admin)
        ->post(route('fichajes.store'), [
            'employee_id' => $admin->id,
            'fecha' => '2026-03-12',
            'inicio_jornada' => '2026-03-12T09:00:00',
            'fin_jornada' => '2026-03-12T18:00:00',
            'pausas' => [],
            'motivo' => 'Alta manual admin',
        ])
        ->assertRedirect();

    $fichaje = Fichaje::query()->sole();

    expect($fichaje->user_id)->toBe($admin->id)
        ->and($fichaje->work_center_id)->toBe($workCenter->id)
        ->and($fichaje->estado)->toBe('finalizada')
        ->and($fichaje->duracion_jornada)->toBe(32400);
});

test('admin can set end time on an active workday and create its summary', function () {
    [$admin, $employee, $workCenter] = createFichajeWorkflowContext();

    $fichaje = Fichaje::create([
        'user_id' => $employee->id,
        'work_center_id' => $workCenter->id,
        'timezone' => 'Europe/Madrid',
        'fecha' => '2026-03-12',
        'inicio_jornada' => localUtc('2026-03-12T09:00:00'),
        'estado' => 'activa',
    ]);

    $this->actingAs($admin)
        ->put(route('fichajes.updateJornada', $fichaje), [
            'campo' => 'fin_jornada',
            'datetime' => '2026-03-12T18:00:00',
            'motivo' => 'Cierre manual',
        ])
        ->assertRedirect();

    $fichaje->refresh();
    $resumen = ResumenDiario::query()->where('user_id', $employee->id)->where('fecha', '2026-03-12')->firstOrFail();

    expect($fichaje->estado)->toBe('finalizada')
        ->and($fichaje->duracion_jornada)->toBe(32400)
        ->and(formatLocalDateTime($fichaje->fin_jornada))->toBe('2026-03-12 18:00:00')
        ->and($resumen->horas_trabajadas)->toBe(32400)
        ->and($resumen->horas_extra)->toBe(3600)
        ->and(EdicionFichaje::query()->where('fichaje_id', $fichaje->id)->where('campo', 'fin_jornada')->exists())->toBeTrue();
});

test('admin can correct a delayed end time back to the fichaje day', function () {
    [$admin, $employee, $workCenter] = createFichajeWorkflowContext();

    $fichaje = Fichaje::create([
        'user_id' => $employee->id,
        'work_center_id' => $workCenter->id,
        'timezone' => 'Europe/Madrid',
        'fecha' => '2026-03-12',
        'inicio_jornada' => localUtc('2026-03-12T14:00:00'),
        'fin_jornada' => localUtc('2026-03-13T09:00:00'),
        'duracion_jornada' => 68400,
        'estado' => 'finalizada',
    ]);

    app(HorasExtraService::class)->recalcularParaFichaje($fichaje);

    $this->actingAs($admin)
        ->put(route('fichajes.updateJornada', $fichaje), [
            'campo' => 'fin_jornada',
            'datetime' => '2026-03-13T22:00:00',
            'motivo' => 'Corregir salida olvidada',
        ])
        ->assertRedirect();

    $fichaje->refresh();
    $resumen = ResumenDiario::query()
        ->where('user_id', $employee->id)
        ->where('fecha', '2026-03-12')
        ->firstOrFail();

    expect(formatLocalDateTime($fichaje->fin_jornada))->toBe('2026-03-12 22:00:00')
        ->and($fichaje->duracion_jornada)->toBe(28800)
        ->and($resumen->horas_trabajadas)->toBe(28800)
        ->and($resumen->horas_extra)->toBe(0);
});

test('admin can move workday start and recalculate summary', function () {
    [$admin, $employee, $workCenter] = createFichajeWorkflowContext();

    $fichaje = Fichaje::create([
        'user_id' => $employee->id,
        'work_center_id' => $workCenter->id,
        'timezone' => 'Europe/Madrid',
        'fecha' => '2026-03-12',
        'inicio_jornada' => localUtc('2026-03-12T09:00:00'),
        'fin_jornada' => localUtc('2026-03-12T18:00:00'),
        'duracion_jornada' => 32400,
        'estado' => 'finalizada',
    ]);

    app(HorasExtraService::class)->recalcularParaFichaje($fichaje);

    $this->actingAs($admin)
        ->put(route('fichajes.updateJornada', $fichaje), [
            'campo' => 'inicio_jornada',
            'datetime' => '2026-03-12T08:30:00',
            'motivo' => 'Ajuste de entrada',
        ])
        ->assertRedirect();

    $fichaje->refresh();
    $resumen = ResumenDiario::query()->where('user_id', $employee->id)->where('fecha', '2026-03-12')->firstOrFail();

    expect(formatLocalDateTime($fichaje->inicio_jornada))->toBe('2026-03-12 08:30:00')
        ->and($fichaje->duracion_jornada)->toBe(34200)
        ->and($resumen->horas_trabajadas)->toBe(34200)
        ->and($resumen->horas_extra)->toBe(5400)
        ->and(EdicionFichaje::query()->where('fichaje_id', $fichaje->id)->where('campo', 'inicio_jornada')->exists())->toBeTrue();
});

test('admin can add and edit pauses on a finalised workday with duration recalculation', function () {
    [$admin, $employee, $workCenter] = createFichajeWorkflowContext();

    $fichaje = Fichaje::create([
        'user_id' => $employee->id,
        'work_center_id' => $workCenter->id,
        'timezone' => 'Europe/Madrid',
        'fecha' => '2026-03-12',
        'inicio_jornada' => localUtc('2026-03-12T09:00:00'),
        'fin_jornada' => localUtc('2026-03-12T18:00:00'),
        'duracion_jornada' => 32400,
        'estado' => 'finalizada',
    ]);

    app(HorasExtraService::class)->recalcularParaFichaje($fichaje);

    $this->actingAs($admin)
        ->post(route('fichajes.storePausa', $fichaje), [
            'inicio_pausa' => '2026-03-12T14:00:00',
            'fin_pausa' => '2026-03-12T14:15:00',
            'motivo' => 'Pausa manual',
        ])
        ->assertRedirect();

    $pausa = Pausa::query()->where('fichaje_id', $fichaje->id)->sole();
    $fichaje->refresh();
    $resumen = ResumenDiario::query()->where('user_id', $employee->id)->where('fecha', '2026-03-12')->firstOrFail();

    expect($pausa->duracion_pausa)->toBe(900)
        ->and($fichaje->duracion_jornada)->toBe(31500)
        ->and($resumen->horas_trabajadas)->toBe(31500)
        ->and($resumen->horas_extra)->toBe(2700);

    $this->actingAs($admin)
        ->put(route('fichajes.updatePausa', ['fichaje' => $fichaje, 'pausa' => $pausa]), [
            'campo' => 'fin_pausa',
            'datetime' => '2026-03-12T14:30:00',
            'motivo' => 'Extender pausa',
        ])
        ->assertRedirect();

    $pausa->refresh();
    $fichaje->refresh();
    $resumen->refresh();

    expect($pausa->duracion_pausa)->toBe(1800)
        ->and(formatLocalDateTime($pausa->fin_pausa))->toBe('2026-03-12 14:30:00')
        ->and($fichaje->duracion_jornada)->toBe(30600)
        ->and($resumen->horas_trabajadas)->toBe(30600)
        ->and($resumen->horas_extra)->toBe(1800)
        ->and(EdicionFichaje::query()->where('fichaje_id', $fichaje->id)->where('campo', 'creacion_pausa')->exists())->toBeTrue()
        ->and(EdicionFichaje::query()->where('fichaje_id', $fichaje->id)->where('campo', 'fin_pausa')->exists())->toBeTrue();
});

test('admin can add and edit overnight pauses on a finalised overnight workday', function () {
    [$admin, $employee, $workCenter] = createFichajeWorkflowContext();

    $fichaje = Fichaje::create([
        'user_id' => $employee->id,
        'work_center_id' => $workCenter->id,
        'timezone' => 'Europe/Madrid',
        'fecha' => '2026-03-12',
        'inicio_jornada' => localUtc('2026-03-12T22:00:00'),
        'fin_jornada' => localUtc('2026-03-13T06:00:00'),
        'duracion_jornada' => 28800,
        'estado' => 'finalizada',
    ]);

    app(HorasExtraService::class)->recalcularParaFichaje($fichaje);

    $this->actingAs($admin)
        ->post(route('fichajes.storePausa', $fichaje), [
            'inicio_pausa' => '2026-03-12T01:00:00',
            'fin_pausa' => '2026-03-12T01:15:00',
            'motivo' => 'Pausa nocturna',
        ])
        ->assertRedirect();

    $pausa = Pausa::query()->where('fichaje_id', $fichaje->id)->sole();
    $fichaje->refresh();
    $resumen = ResumenDiario::query()->where('user_id', $employee->id)->where('fecha', '2026-03-12')->firstOrFail();

    expect(formatLocalDateTime($pausa->inicio_pausa))->toBe('2026-03-13 01:00:00')
        ->and(formatLocalDateTime($pausa->fin_pausa))->toBe('2026-03-13 01:15:00')
        ->and($fichaje->duracion_jornada)->toBe(27900)
        ->and($resumen->horas_trabajadas)->toBe(27900);

    $this->actingAs($admin)
        ->put(route('fichajes.updatePausa', ['fichaje' => $fichaje, 'pausa' => $pausa]), [
            'campo' => 'fin_pausa',
            'datetime' => '2026-03-12T01:30:00',
            'motivo' => 'Extender pausa nocturna',
        ])
        ->assertRedirect();

    $pausa->refresh();
    $fichaje->refresh();
    $resumen->refresh();

    expect(formatLocalDateTime($pausa->fin_pausa))->toBe('2026-03-13 01:30:00')
        ->and($pausa->duracion_pausa)->toBe(1800)
        ->and($fichaje->duracion_jornada)->toBe(27000)
        ->and($resumen->horas_trabajadas)->toBe(27000);
});

test('admin can close an open pause and return the workday to active state', function () {
    [$admin, $employee, $workCenter] = createFichajeWorkflowContext();

    $fichaje = Fichaje::create([
        'user_id' => $employee->id,
        'work_center_id' => $workCenter->id,
        'timezone' => 'Europe/Madrid',
        'fecha' => '2026-03-12',
        'inicio_jornada' => localUtc('2026-03-12T09:00:00'),
        'estado' => 'pausa',
    ]);

    $pausa = Pausa::create([
        'fichaje_id' => $fichaje->id,
        'inicio_pausa' => localUtc('2026-03-12T11:00:00'),
    ]);

    $this->actingAs($admin)
        ->put(route('fichajes.updatePausa', ['fichaje' => $fichaje, 'pausa' => $pausa]), [
            'campo' => 'fin_pausa',
            'datetime' => '2026-03-12T11:20:00',
            'motivo' => 'Cerrar pausa',
        ])
        ->assertRedirect();

    $pausa->refresh();
    $fichaje->refresh();

    expect($pausa->duracion_pausa)->toBe(1200)
        ->and(formatLocalDateTime($pausa->fin_pausa))->toBe('2026-03-12 11:20:00')
        ->and($fichaje->estado)->toBe('activa')
        ->and($fichaje->duracion_jornada)->toBeNull();
});

test('admin can close an overnight open pause the next day', function () {
    [$admin, $employee, $workCenter] = createFichajeWorkflowContext();

    $fichaje = Fichaje::create([
        'user_id' => $employee->id,
        'work_center_id' => $workCenter->id,
        'timezone' => 'Europe/Madrid',
        'fecha' => '2026-03-12',
        'inicio_jornada' => localUtc('2026-03-12T22:00:00'),
        'estado' => 'pausa',
    ]);

    $pausa = Pausa::create([
        'fichaje_id' => $fichaje->id,
        'inicio_pausa' => localUtc('2026-03-12T23:50:00'),
    ]);

    Carbon::setTestNow(Carbon::create(2026, 3, 13, 0, 30, 0, 'UTC'));

    try {
        $this->actingAs($admin)
            ->put(route('fichajes.updatePausa', ['fichaje' => $fichaje, 'pausa' => $pausa]), [
                'campo' => 'fin_pausa',
                'datetime' => '2026-03-12T00:10:00',
                'motivo' => 'Cerrar pausa nocturna',
            ])
            ->assertRedirect();
    } finally {
        Carbon::setTestNow();
    }

    $pausa->refresh();
    $fichaje->refresh();

    expect(formatLocalDateTime($pausa->fin_pausa))->toBe('2026-03-13 00:10:00')
        ->and($pausa->duracion_pausa)->toBe(1200)
        ->and($fichaje->estado)->toBe('activa');
});

test('admin can finalise a paused workday and the active pause is closed automatically', function () {
    [$admin, $employee, $workCenter] = createFichajeWorkflowContext();

    $fichaje = Fichaje::create([
        'user_id' => $employee->id,
        'work_center_id' => $workCenter->id,
        'timezone' => 'Europe/Madrid',
        'fecha' => '2026-03-12',
        'inicio_jornada' => localUtc('2026-03-12T09:00:00'),
        'estado' => 'pausa',
    ]);

    $pausa = Pausa::create([
        'fichaje_id' => $fichaje->id,
        'inicio_pausa' => localUtc('2026-03-12T17:30:00'),
    ]);

    Carbon::setTestNow(Carbon::create(2026, 3, 12, 17, 0, 0, 'UTC'));

    try {
        $this->actingAs($admin)
            ->post(route('fichajes.finalizarAdmin', $fichaje), [
                'motivo' => 'Finalizacion administrativa',
            ])
            ->assertRedirect();
    } finally {
        Carbon::setTestNow();
    }

    $pausa->refresh();
    $fichaje->refresh();
    $resumen = ResumenDiario::query()->where('user_id', $employee->id)->where('fecha', '2026-03-12')->firstOrFail();

    expect(formatLocalDateTime($pausa->fin_pausa))->toBe('2026-03-12 18:00:00')
        ->and($pausa->duracion_pausa)->toBe(1800)
        ->and(formatLocalDateTime($fichaje->fin_jornada))->toBe('2026-03-12 18:00:00')
        ->and($fichaje->estado)->toBe('finalizada')
        ->and($fichaje->duracion_jornada)->toBe(30600)
        ->and($resumen->horas_trabajadas)->toBe(30600)
        ->and($resumen->horas_extra)->toBe(1800)
        ->and(EdicionFichaje::query()->where('fichaje_id', $fichaje->id)->where('campo', 'finalizacion_admin')->exists())->toBeTrue();
});

function createFichajeWorkflowContext(): array
{
    $admin = User::factory()->create([
        'role' => User::ROLE_ADMIN,
    ]);

    $company = Company::create([
        'user_id' => $admin->id,
        'nombre' => 'Empresa Fichajes',
        'cif' => 'CIF-FICHAJES-'.$admin->id,
        'pais' => 'ES',
        'ciudad' => 'Madrid',
        'direccion' => 'Calle Fichajes 1',
        'cp' => '28001',
    ]);

    $workCenter = WorkCenter::create([
        'company_id' => $company->id,
        'nombre' => 'Centro Fichajes',
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
        'horario_jueves' => 8,
        'remoto' => false,
    ]);

    return [$admin, $employee, $workCenter];
}

function localUtc(string $localDateTime): Carbon
{
    return WorkCenterTimezone::localToUtc($localDateTime, 'Europe/Madrid');
}

function formatLocalDateTime(?Carbon $value): ?string
{
    return $value?->copy()->setTimezone('Europe/Madrid')->format('Y-m-d H:i:s');
}
