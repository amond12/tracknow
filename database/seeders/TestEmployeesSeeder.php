<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Seeder;
use RuntimeException;

class TestEmployeesSeeder extends Seeder
{
    public function run(): void
    {
        $company = Company::with('workCenters')->orderBy('id')->first();

        if (! $company) {
            throw new RuntimeException('No existe ninguna empresa para asociar empleados de prueba.');
        }

        $workCenter = $company->workCenters->sortBy('id')->first();

        if (! $workCenter) {
            throw new RuntimeException('La empresa seleccionada no tiene centros de trabajo.');
        }

        $employees = [
            ['name' => 'Lucia', 'apellido' => 'Garcia', 'email' => 'lucia.garcia.test1@example.com', 'telefono' => '600000001', 'dni' => '10000001A', 'nss' => '280000000001', 'role' => 'empleado', 'remoto' => false],
            ['name' => 'Mario', 'apellido' => 'Lopez', 'email' => 'mario.lopez.test2@example.com', 'telefono' => '600000002', 'dni' => '10000002B', 'nss' => '280000000002', 'role' => 'empleado', 'remoto' => true],
            ['name' => 'Carmen', 'apellido' => 'Fernandez', 'email' => 'carmen.fernandez.test3@example.com', 'telefono' => '600000003', 'dni' => '10000003C', 'nss' => '280000000003', 'role' => 'empleado', 'remoto' => false],
            ['name' => 'David', 'apellido' => 'Martinez', 'email' => 'david.martinez.test4@example.com', 'telefono' => '600000004', 'dni' => '10000004D', 'nss' => '280000000004', 'role' => 'empleado', 'remoto' => true],
            ['name' => 'Elena', 'apellido' => 'Sanchez', 'email' => 'elena.sanchez.test5@example.com', 'telefono' => '600000005', 'dni' => '10000005E', 'nss' => '280000000005', 'role' => 'empleado', 'remoto' => false],
            ['name' => 'Javier', 'apellido' => 'Perez', 'email' => 'javier.perez.test6@example.com', 'telefono' => '600000006', 'dni' => '10000006F', 'nss' => '280000000006', 'role' => 'empleado', 'remoto' => false],
            ['name' => 'Sara', 'apellido' => 'Gomez', 'email' => 'sara.gomez.test7@example.com', 'telefono' => '600000007', 'dni' => '10000007G', 'nss' => '280000000007', 'role' => 'encargado', 'remoto' => true],
            ['name' => 'Pablo', 'apellido' => 'Diaz', 'email' => 'pablo.diaz.test8@example.com', 'telefono' => '600000008', 'dni' => '10000008H', 'nss' => '280000000008', 'role' => 'empleado', 'remoto' => false],
            ['name' => 'Marta', 'apellido' => 'Ruiz', 'email' => 'marta.ruiz.test9@example.com', 'telefono' => '600000009', 'dni' => '10000009J', 'nss' => '280000000009', 'role' => 'empleado', 'remoto' => true],
            ['name' => 'Adrian', 'apellido' => 'Torres', 'email' => 'adrian.torres.test10@example.com', 'telefono' => '600000010', 'dni' => '10000010K', 'nss' => '280000000010', 'role' => 'empleado', 'remoto' => false],
        ];

        foreach ($employees as $employee) {
            User::updateOrCreate(
                ['email' => $employee['email']],
                array_merge($employee, [
                    'password' => $employee['dni'],
                    'company_id' => $company->id,
                    'work_center_id' => $workCenter->id,
                    'horario_lunes' => 8,
                    'horario_martes' => 8,
                    'horario_miercoles' => 8,
                    'horario_jueves' => 8,
                    'horario_viernes' => 8,
                    'horario_sabado' => 0,
                    'horario_domingo' => 0,
                    'email_verified_at' => now(),
                ])
            );
        }
    }
}
