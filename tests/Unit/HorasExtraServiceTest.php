<?php

use App\Models\Company;
use App\Models\Fichaje;
use App\Models\Pausa;
use App\Models\ResumenDiario;
use App\Models\User;
use App\Models\WorkCenter;
use App\Services\HorasExtraService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Collection;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

it('calcula los segundos trabajados en el dia para una jornada simple', function () {
    $fichaje = new Fichaje([
        'inicio_jornada' => '2026-03-11 16:57:39',
        'fin_jornada' => '2026-03-11 17:53:38',
    ]);
    $fichaje->setRelation('pausas', new Collection);

    $segundos = app(HorasExtraService::class)->calcularSegundosEnDia($fichaje, Carbon::parse('2026-03-11'));

    expect($segundos)->toBe(3359);
});

it('resta pausas correctamente dentro del dia', function () {
    $fichaje = new Fichaje([
        'inicio_jornada' => '2026-03-11 16:57:39',
        'fin_jornada' => '2026-03-11 17:53:38',
    ]);

    $pausa = new Pausa([
        'inicio_pausa' => '2026-03-11 17:10:00',
        'fin_pausa' => '2026-03-11 17:20:00',
    ]);

    $fichaje->setRelation('pausas', new Collection([$pausa]));

    $segundos = app(HorasExtraService::class)->calcularSegundosEnDia($fichaje, Carbon::parse('2026-03-11'));

    expect($segundos)->toBe(3359 - 600);
});

it('divide una jornada nocturna por dias sin perder segundos', function () {
    $fichaje = new Fichaje([
        'inicio_jornada' => '2026-03-12 22:00:00',
        'fin_jornada' => '2026-03-13 06:00:00',
    ]);
    $fichaje->setRelation('pausas', new Collection);

    $service = app(HorasExtraService::class);
    $jueves = $service->calcularSegundosEnDia($fichaje, Carbon::parse('2026-03-12'));
    $viernes = $service->calcularSegundosEnDia($fichaje, Carbon::parse('2026-03-13'));

    expect($jueves)->toBe(7200)
        ->and($viernes)->toBe(21600)
        ->and($jueves + $viernes)->toBe(28800);
});

it('imputa una jornada nocturna completa al dia de inicio para las horas extra', function () {
    [$company, $workCenter] = createWorkContext();

    $empleado = User::factory()->create([
        'role' => 'empleado',
        'company_id' => $company->id,
        'work_center_id' => $workCenter->id,
        'horario_jueves' => 7,
        'horario_viernes' => 0,
    ]);

    $fichaje = Fichaje::create([
        'user_id' => $empleado->id,
        'work_center_id' => $workCenter->id,
        'fecha' => '2026-03-12',
        'inicio_jornada' => '2026-03-12 22:00:00',
        'fin_jornada' => '2026-03-13 06:00:00',
        'duracion_jornada' => 28800,
        'estado' => 'finalizada',
    ]);

    app(HorasExtraService::class)->recalcularParaFichaje($fichaje);

    $resumen = ResumenDiario::where('user_id', $empleado->id)
        ->where('fecha', '2026-03-12')
        ->first();

    expect($resumen)->not->toBeNull()
        ->and($resumen->horas_trabajadas)->toBe(28800)
        ->and($resumen->segundos_previstos)->toBe(25200)
        ->and($resumen->horas_extra)->toBe(3600)
        ->and(ResumenDiario::where('user_id', $empleado->id)->where('fecha', '2026-03-13')->exists())->toBeFalse();
});

it('mantiene congeladas las horas previstas historicas al recalcular un dia antiguo', function () {
    [$company, $workCenter] = createWorkContext();

    $empleado = User::factory()->create([
        'role' => 'empleado',
        'company_id' => $company->id,
        'work_center_id' => $workCenter->id,
        'horario_jueves' => 7,
    ]);

    $fichaje = Fichaje::create([
        'user_id' => $empleado->id,
        'work_center_id' => $workCenter->id,
        'fecha' => '2026-03-12',
        'inicio_jornada' => '2026-03-12 09:00:00',
        'fin_jornada' => '2026-03-12 17:00:00',
        'duracion_jornada' => 28800,
        'estado' => 'finalizada',
    ]);

    $service = app(HorasExtraService::class);
    $service->recalcularParaFichaje($fichaje);

    $empleado->update(['horario_jueves' => 5]);

    $service->recalcularDia($empleado->fresh(), Carbon::parse('2026-03-12'));

    $resumen = ResumenDiario::where('user_id', $empleado->id)
        ->where('fecha', '2026-03-12')
        ->firstOrFail();

    expect($resumen->segundos_previstos)->toBe(25200)
        ->and($resumen->horas_extra)->toBe(3600);
});

function createWorkContext(): array
{
    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    $company = Company::create([
        'user_id' => $admin->id,
        'nombre' => 'Empresa Test',
        'cif' => 'CIF-TEST',
        'pais' => 'ES',
        'ciudad' => 'Madrid',
        'direccion' => 'Calle Test 1',
        'cp' => '28001',
    ]);

    $workCenter = WorkCenter::create([
        'company_id' => $company->id,
        'nombre' => 'Centro Test',
        'pais' => 'ES',
        'provincia' => 'Madrid',
        'poblacion' => 'Madrid',
        'direccion' => 'Calle Test 1',
        'cp' => '28001',
        'lat' => 40.4168,
        'lng' => -3.7038,
        'radio' => 150,
        'ips' => ['127.0.0.1'],
    ]);

    return [$company, $workCenter];
}
