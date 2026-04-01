<?php

use App\Models\Company;
use App\Models\JornadaPdfSignature;
use App\Models\User;
use App\Models\WorkCenter;
use Barryvdh\DomPDF\Facade\Pdf;
use Barryvdh\DomPDF\PDF as DomPdf;
use Carbon\Carbon;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

test('pdfs index exposes signature state for managers and employees', function () {
    Storage::fake('public');

    [$admin, $company, $workCenter, $manager, $employee] = createPdfSignatureContext();
    $signaturePath = pdfSignaturePathFor($employee->id, 2026, 4, 'company');

    Storage::disk('public')->put($signaturePath, pdfSignatureBinary());

    JornadaPdfSignature::create([
        'employee_id' => $employee->id,
        'month' => 4,
        'year' => 2026,
        'company_signer_user_id' => $manager->id,
        'company_signer_name' => fullTestUserName($manager),
        'company_signer_title' => 'Encargado',
        'company_signature_path' => $signaturePath,
        'company_signed_at' => Carbon::parse('2026-04-05 10:00:00'),
    ]);

    $this->actingAs($manager)
        ->get(route('pdfs.index', [
            'empleado_id' => $employee->id,
            'mes' => 4,
            'anio' => 2026,
        ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('configuracion/pdfs/index')
            ->has('resumen.data', 1)
            ->where('resumen.data.0.id', $employee->id)
            ->where('resumen.data.0.firmas.companySigned', true)
            ->where('resumen.data.0.firmas.companySignerName', fullTestUserName($manager))
            ->where('resumen.data.0.firmas.companySignerTitle', 'Encargado')
            ->where('resumen.data.0.firmas.employeeSigned', false)
            ->where('resumen.data.0.firmas.locked', false),
        );

    $this->actingAs($employee)
        ->get(route('pdfs.index', ['mes' => 4, 'anio' => 2026]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('configuracion/pdfs/index')
            ->has('resumen.data', 1)
            ->where('resumen.data.0.id', $employee->id)
            ->where('resumen.data.0.firmas.companySigned', true)
            ->where('resumen.data.0.firmas.employeeSigned', false),
        );
});

test('manager can sign company side but employee cannot', function () {
    Storage::fake('public');

    [$admin, $company, $workCenter, $manager, $employee] = createPdfSignatureContext();

    $this->actingAs($manager)
        ->from('/pdfs?mes=4&anio=2026')
        ->post(route('pdfs.sign', $employee), [
            'mes' => 4,
            'anio' => 2026,
            'side' => 'company',
            'signature' => pdfSignatureDataUri(),
        ])
        ->assertRedirect('/pdfs?mes=4&anio=2026');

    $signature = JornadaPdfSignature::query()->sole();

    expect($signature->company_signer_user_id)->toBe($manager->id)
        ->and($signature->company_signer_name)->toBe(fullTestUserName($manager))
        ->and($signature->company_signer_title)->toBe('Encargado')
        ->and($signature->employee_signed_at)->toBeNull();

    Storage::disk('public')->assertExists(
        pdfSignaturePathFor($employee->id, 2026, 4, 'company'),
    );

    $this->actingAs($employee)
        ->post(route('pdfs.sign', $employee), [
            'mes' => 4,
            'anio' => 2026,
            'side' => 'company',
            'signature' => pdfSignatureDataUri(),
        ])
        ->assertForbidden();
});

test('manager cannot sign employee side of another user but employee can sign their own side', function () {
    Storage::fake('public');

    [$admin, $company, $workCenter, $manager, $employee] = createPdfSignatureContext();

    $this->actingAs($manager)
        ->post(route('pdfs.sign', $employee), [
            'mes' => 4,
            'anio' => 2026,
            'side' => 'employee',
            'signature' => pdfSignatureDataUri(),
        ])
        ->assertForbidden();

    $this->actingAs($employee)
        ->from('/pdfs?mes=4&anio=2026')
        ->post(route('pdfs.sign', $employee), [
            'mes' => 4,
            'anio' => 2026,
            'side' => 'employee',
            'signature' => pdfSignatureDataUri(),
        ])
        ->assertRedirect('/pdfs?mes=4&anio=2026');

    $signature = JornadaPdfSignature::query()->sole();

    expect($signature->employee_signer_user_id)->toBe($employee->id)
        ->and($signature->employee_signer_name)->toBe(fullTestUserName($employee))
        ->and($signature->employee_signed_at)->not->toBeNull();

    Storage::disk('public')->assertExists(
        pdfSignaturePathFor($employee->id, 2026, 4, 'employee'),
    );
});

test('manager outside the owner scope cannot sign company side', function () {
    Storage::fake('public');

    [$adminA, $companyA, $workCenterA, $managerA, $employeeA] = createPdfSignatureContext();
    [$adminB, $companyB, $workCenterB, $managerB, $employeeB] = createPdfSignatureContext('B');

    $this->actingAs($managerA)
        ->post(route('pdfs.sign', $employeeB), [
            'mes' => 4,
            'anio' => 2026,
            'side' => 'company',
            'signature' => pdfSignatureDataUri(),
        ])
        ->assertForbidden();

    expect(JornadaPdfSignature::query()->count())->toBe(0);
});

test('signatures can be replaced while open and lock once both sides exist', function () {
    Storage::fake('public');

    [$admin, $company, $workCenter, $manager, $employee] = createPdfSignatureContext();

    Carbon::setTestNow('2026-04-05 10:00:00');

    try {
        $this->actingAs($manager)
            ->from('/pdfs?mes=4&anio=2026')
            ->post(route('pdfs.sign', $employee), [
                'mes' => 4,
                'anio' => 2026,
                'side' => 'company',
                'signature' => pdfSignatureDataUri(),
            ])
            ->assertRedirect('/pdfs?mes=4&anio=2026');

        Carbon::setTestNow('2026-04-05 10:05:00');

        $this->actingAs($manager)
            ->from('/pdfs?mes=4&anio=2026')
            ->post(route('pdfs.sign', $employee), [
                'mes' => 4,
                'anio' => 2026,
                'side' => 'company',
                'signature' => pdfSignatureDataUri(),
            ])
            ->assertRedirect('/pdfs?mes=4&anio=2026');

        $signature = JornadaPdfSignature::query()->sole();

        expect($signature->company_signed_at?->format('Y-m-d H:i:s'))
            ->toBe('2026-04-05 10:05:00')
            ->and($signature->locked_at)->toBeNull();

        Carbon::setTestNow('2026-04-05 10:10:00');

        $this->actingAs($employee)
            ->from('/pdfs?mes=4&anio=2026')
            ->post(route('pdfs.sign', $employee), [
                'mes' => 4,
                'anio' => 2026,
                'side' => 'employee',
                'signature' => pdfSignatureDataUri(),
            ])
            ->assertRedirect('/pdfs?mes=4&anio=2026');

        $signature->refresh();

        expect($signature->locked_at?->format('Y-m-d H:i:s'))
            ->toBe('2026-04-05 10:10:00');

        $companySignedAt = $signature->company_signed_at?->format('Y-m-d H:i:s');
        $lockedAt = $signature->locked_at?->format('Y-m-d H:i:s');

        Carbon::setTestNow('2026-04-05 10:15:00');

        $this->actingAs($manager)
            ->from('/pdfs?mes=4&anio=2026')
            ->post(route('pdfs.sign', $employee), [
                'mes' => 4,
                'anio' => 2026,
                'side' => 'company',
                'signature' => pdfSignatureDataUri(),
            ])
            ->assertRedirect('/pdfs?mes=4&anio=2026')
            ->assertSessionHasErrors('signature');

        $signature->refresh();

        expect($signature->company_signed_at?->format('Y-m-d H:i:s'))
            ->toBe($companySignedAt)
            ->and($signature->locked_at?->format('Y-m-d H:i:s'))
            ->toBe($lockedAt);
    } finally {
        Carbon::setTestNow();
    }
});

test('expired access can still sign pending legal pdfs', function () {
    Storage::fake('public');

    [$admin, $company, $workCenter, $manager, $employee] = createPdfSignatureContext();

    $admin->forceFill([
        'trial_ends_at' => now()->subDay(),
    ])->save();

    $this->actingAs($manager)
        ->from('/pdfs?mes=4&anio=2026')
        ->post(route('pdfs.sign', $employee), [
            'mes' => 4,
            'anio' => 2026,
            'side' => 'company',
            'signature' => pdfSignatureDataUri(),
        ])
        ->assertRedirect('/pdfs?mes=4&anio=2026');

    expect(JornadaPdfSignature::query()->count())->toBe(1);
});

test('download injects signature data into the pdf view payload', function () {
    Storage::fake('public');

    [$admin, $company, $workCenter, $manager, $employee] = createPdfSignatureContext();
    $companyPath = pdfSignaturePathFor($employee->id, 2026, 4, 'company');
    $employeePath = pdfSignaturePathFor($employee->id, 2026, 4, 'employee');

    Storage::disk('public')->put($companyPath, pdfSignatureBinary());
    Storage::disk('public')->put($employeePath, pdfSignatureBinary());

    JornadaPdfSignature::create([
        'employee_id' => $employee->id,
        'month' => 4,
        'year' => 2026,
        'company_signer_user_id' => $manager->id,
        'company_signer_name' => fullTestUserName($manager),
        'company_signer_title' => 'Encargado',
        'company_signature_path' => $companyPath,
        'company_signed_at' => Carbon::parse('2026-04-05 10:00:00'),
        'employee_signer_user_id' => $employee->id,
        'employee_signer_name' => fullTestUserName($employee),
        'employee_signature_path' => $employeePath,
        'employee_signed_at' => Carbon::parse('2026-04-05 10:10:00'),
        'locked_at' => Carbon::parse('2026-04-05 10:10:00'),
    ]);

    $pdfMock = \Mockery::mock(DomPdf::class);
    $pdfMock->shouldReceive('setPaper')
        ->once()
        ->with('A4', 'portrait')
        ->andReturnSelf();
    $pdfMock->shouldReceive('download')
        ->once()
        ->andReturn(response('pdf-binary', 200, ['Content-Type' => 'application/pdf']));

    Pdf::shouldReceive('loadView')
        ->once()
        ->withArgs(function (string $view, array $data) use ($employee): bool {
            return $view === 'pdf.jornada'
                && $data['empleado']->is($employee)
                && $data['firmas']['company']['signed'] === true
                && $data['firmas']['company']['name'] === 'Elena Encargada'
                && $data['firmas']['company']['title'] === 'Encargado'
                && str_starts_with($data['firmas']['company']['image'] ?? '', 'data:image/png;base64,')
                && $data['firmas']['employee']['signed'] === true
                && $data['firmas']['employee']['name'] === 'Pablo Empleado'
                && str_starts_with($data['firmas']['employee']['image'] ?? '', 'data:image/png;base64,');
        })
        ->andReturn($pdfMock);

    $this->actingAs($manager)
        ->get(route('pdfs.download', [
            'empleado' => $employee,
            'mes' => 4,
            'anio' => 2026,
        ]))
        ->assertOk()
        ->assertHeader('content-type', 'application/pdf');
});

function createPdfSignatureContext(string $suffix = 'A'): array
{
    $admin = User::factory()->create([
        'role' => User::ROLE_ADMIN,
        'name' => "Admin {$suffix}",
        'apellido' => 'Owner',
    ]);

    $company = Company::create([
        'user_id' => $admin->id,
        'nombre' => "Empresa {$suffix}",
        'cif' => "CIF-PDF-{$suffix}",
        'pais' => 'ES',
        'ciudad' => 'Madrid',
        'direccion' => 'Calle PDF 1',
        'cp' => '28001',
    ]);

    $workCenter = WorkCenter::create([
        'company_id' => $company->id,
        'nombre' => "Centro {$suffix}",
        'pais' => 'ES',
        'provincia' => 'Madrid',
        'poblacion' => 'Madrid',
        'direccion' => 'Calle PDF 1',
        'cp' => '28001',
        'timezone' => 'Europe/Madrid',
    ]);

    $manager = User::factory()->create([
        'role' => User::ROLE_ENCARGADO,
        'name' => 'Elena',
        'apellido' => 'Encargada',
        'company_id' => $company->id,
        'work_center_id' => $workCenter->id,
    ]);

    $employee = User::factory()->create([
        'role' => User::ROLE_EMPLEADO,
        'name' => 'Pablo',
        'apellido' => 'Empleado',
        'company_id' => $company->id,
        'work_center_id' => $workCenter->id,
    ]);

    return [$admin, $company, $workCenter, $manager, $employee];
}

function pdfSignatureDataUri(): string
{
    return 'data:image/png;base64,'.base64_encode(pdfSignatureBinary());
}

function pdfSignatureBinary(): string
{
    return base64_decode(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4//8/AwAI/AL+XcX4VQAAAABJRU5ErkJggg==',
        true,
    );
}

function pdfSignaturePathFor(int $employeeId, int $year, int $month, string $side): string
{
    return sprintf(
        'pdf-signatures/jornada/%d/%04d/%02d/%s.png',
        $employeeId,
        $year,
        $month,
        $side,
    );
}

function fullTestUserName(User $user): string
{
    return trim(implode(' ', array_filter([$user->name, $user->apellido])));
}
