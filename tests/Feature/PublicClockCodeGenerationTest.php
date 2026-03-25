<?php

use App\Models\Company;
use App\Models\User;
use App\Models\WorkCenter;
use App\Services\ClockCodeService;

test('companies and staff receive public clock codes automatically', function () {
    [$company, $employee] = createPublicClockCodeContext();

    $employee->load('company');

    expect($company->clock_code_prefix)->toMatch('/^\d{4}$/')
        ->and($employee->clock_code_suffix)->toMatch('/^\d{4}$/')
        ->and($employee->clock_code)->toBe(
            $company->clock_code_prefix.$employee->clock_code_suffix,
        );
});

test('backfill assigns missing public clock codes to existing companies and staff', function () {
    [$company, $employee] = createPublicClockCodeContext();

    $company->forceFill(['clock_code_prefix' => null])->saveQuietly();
    $employee->forceFill(['clock_code_suffix' => null])->saveQuietly();

    app(ClockCodeService::class)->backfillMissingCodes();

    $company->refresh();
    $employee->refresh()->load('company');

    expect($company->clock_code_prefix)->toMatch('/^\d{4}$/')
        ->and($employee->clock_code_suffix)->toMatch('/^\d{4}$/')
        ->and($employee->clock_code)->toBe(
            $company->clock_code_prefix.$employee->clock_code_suffix,
        );
});

function createPublicClockCodeContext(): array
{
    $owner = User::factory()->create([
        'role' => User::ROLE_ADMIN,
    ]);

    $company = Company::create([
        'user_id' => $owner->id,
        'nombre' => 'Empresa Kiosco',
        'cif' => 'CIF-'.$owner->id,
        'pais' => 'ES',
        'ciudad' => 'Madrid',
        'direccion' => 'Calle Central 1',
        'cp' => '28001',
    ]);

    $workCenter = WorkCenter::create([
        'company_id' => $company->id,
        'nombre' => 'Centro Kiosco',
        'pais' => 'ES',
        'provincia' => 'Madrid',
        'poblacion' => 'Madrid',
        'direccion' => 'Calle Central 1',
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

    return [$company, $employee];
}
