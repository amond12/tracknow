<?php

use App\Models\User;

test('employees cannot access configuration pages', function (string $routeName) {
    $employee = User::factory()->create([
        'role' => 'employee',
    ]);

    $this->actingAs($employee)
        ->get(route($routeName))
        ->assertForbidden();
})->with([
    'configuracion.empresas.index',
    'configuracion.centros.index',
    'configuracion.empleados.index',
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
