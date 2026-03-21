<?php

use App\Models\User;

test('restricted staff cannot access configuration pages', function (string $role, string $routeName) {
    $employee = User::factory()->create([
        'role' => $role,
    ]);

    $this->actingAs($employee)
        ->get(route($routeName))
        ->assertForbidden();
})->with([
    ['empleado', 'configuracion.empresas.index'],
    ['empleado', 'configuracion.centros.index'],
    ['empleado', 'configuracion.empleados.index'],
    ['encargado', 'configuracion.empresas.index'],
    ['encargado', 'configuracion.centros.index'],
    ['encargado', 'configuracion.empleados.index'],
]);

test('admins can access configuration pages', function (string $routeName) {
    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    $this->actingAs($admin)
        ->get(route($routeName))
        ->assertOk();
})->with([
    'configuracion.empresas.index',
    'configuracion.centros.index',
    'configuracion.empleados.index',
]);
