<?php

use App\Models\Company;
use App\Models\Fichaje;
use App\Models\Pausa;
use App\Models\User;
use App\Models\WorkCenter;
use Carbon\Carbon;

test('start stores the frozen timezone and legal date of the work center', function () {
    [$company, $workCenter] = createFicharTransactionContext([
        'timezone' => 'Asia/Tokyo',
        'ips' => [],
    ]);

    $employee = User::factory()->create([
        'role' => 'empleado',
        'company_id' => $company->id,
        'work_center_id' => $workCenter->id,
        'remoto' => true,
    ]);

    Carbon::setTestNow(Carbon::create(2026, 3, 16, 23, 30, 0, 'UTC'));

    try {
        $this->actingAs($employee)
            ->post(route('fichar.iniciar'), [
                'lat' => 35.6762,
                'lng' => 139.6503,
                'accuracy' => 15,
            ])
            ->assertSessionDoesntHaveErrors();
    } finally {
        Carbon::setTestNow();
    }

    $fichaje = Fichaje::query()->where('user_id', $employee->id)->firstOrFail();

    expect($fichaje->timezone)->toBe('Asia/Tokyo');
    expect($fichaje->fecha->toDateString())->toBe('2026-03-17');
    expect($fichaje->inicio_jornada?->copy()->setTimezone('UTC')->format('Y-m-d H:i:s'))->toBe('2026-03-16 23:30:00');
});

test('pause targets the most recent active fichaje by legal datetime instead of creation order', function () {
    [$company, $workCenter] = createFicharTransactionContext();

    $employee = User::factory()->create([
        'role' => 'empleado',
        'company_id' => $company->id,
        'work_center_id' => $workCenter->id,
        'remoto' => true,
    ]);

    $latestByDate = Fichaje::create([
        'user_id' => $employee->id,
        'work_center_id' => $workCenter->id,
        'timezone' => 'Europe/Madrid',
        'fecha' => '2026-03-17',
        'inicio_jornada' => '2026-03-17 08:00:00',
        'estado' => 'activa',
    ]);
    $latestByDate->timestamps = false;
    $latestByDate->forceFill([
        'created_at' => Carbon::parse('2026-03-10 08:00:00', 'UTC'),
        'updated_at' => Carbon::parse('2026-03-10 08:00:00', 'UTC'),
    ])->saveQuietly();

    $latestByCreated = Fichaje::create([
        'user_id' => $employee->id,
        'work_center_id' => $workCenter->id,
        'timezone' => 'Europe/Madrid',
        'fecha' => '2026-03-16',
        'inicio_jornada' => '2026-03-16 08:00:00',
        'estado' => 'activa',
    ]);
    $latestByCreated->timestamps = false;
    $latestByCreated->forceFill([
        'created_at' => Carbon::parse('2026-03-18 08:00:00', 'UTC'),
        'updated_at' => Carbon::parse('2026-03-18 08:00:00', 'UTC'),
    ])->saveQuietly();

    $this->actingAs($employee)
        ->post(route('fichar.pausa'), [
            'lat' => 40.4168,
            'lng' => -3.7038,
            'accuracy' => 10,
        ])
        ->assertSessionDoesntHaveErrors();

    expect($latestByDate->fresh()->estado)->toBe('pausa');
    expect($latestByCreated->fresh()->estado)->toBe('activa');
    expect(Pausa::query()->where('fichaje_id', $latestByDate->id)->count())->toBe(1);
    expect(Pausa::query()->where('fichaje_id', $latestByCreated->id)->count())->toBe(0);
});

function createFicharTransactionContext(array $overrides = []): array
{
    $owner = User::factory()->create([
        'role' => 'admin',
    ]);

    $company = Company::create([
        'user_id' => $owner->id,
        'nombre' => 'Empresa Bloqueos',
        'cif' => 'CIF-'.$owner->id,
        'pais' => 'ES',
        'ciudad' => 'Madrid',
        'direccion' => 'Calle Segura 1',
        'cp' => '28001',
    ]);

    $workCenter = WorkCenter::create(array_merge([
        'company_id' => $company->id,
        'nombre' => 'Centro Segurizado',
        'pais' => 'ES',
        'provincia' => 'Madrid',
        'poblacion' => 'Madrid',
        'direccion' => 'Calle Segura 1',
        'cp' => '28001',
        'timezone' => 'Europe/Madrid',
        'lat' => 40.4168,
        'lng' => -3.7038,
        'radio' => 150,
        'ips' => ['127.0.0.1'],
    ], $overrides));

    return [$company, $workCenter];
}
