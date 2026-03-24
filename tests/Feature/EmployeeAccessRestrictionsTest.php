<?php

use App\Models\User;

test('empleados son redirigidos del dashboard a fichar', function () {
    $employee = User::factory()->create([
        'role' => 'empleado',
    ]);

    $this->actingAs($employee)
        ->get(route('dashboard'))
        ->assertRedirect(route('fichar'));
});

test('empleados entran en settings pero se redirigen a password', function () {
    $employee = User::factory()->create([
        'role' => 'empleado',
    ]);

    $this->actingAs($employee)
        ->get(route('settings'))
        ->assertRedirect('/settings/password');
});

test('empleados no pueden acceder ni modificar su perfil', function () {
    $employee = User::factory()->create([
        'role' => 'empleado',
    ]);

    $this->actingAs($employee)
        ->get(route('profile.edit'))
        ->assertForbidden();

    $this->actingAs($employee)
        ->patch(route('profile.update'), [
            'name' => 'Nombre Bloqueado',
            'email' => 'empleado@example.com',
        ])
        ->assertForbidden();

    $this->actingAs($employee)
        ->delete(route('profile.destroy'), [
            'password' => 'password',
        ])
        ->assertForbidden();
});

test('encargados son redirigidos del dashboard a fichar y pueden acceder a perfil', function () {
    $encargado = User::factory()->create([
        'role' => 'encargado',
    ]);

    $this->actingAs($encargado)
        ->get(route('dashboard'))
        ->assertRedirect(route('fichar'));

    $this->actingAs($encargado)
        ->get(route('settings'))
        ->assertRedirect('/settings/profile');

    $this->actingAs($encargado)
        ->get(route('profile.edit'))
        ->assertOk();
});

test('admins son redirigidos del dashboard a fichar y pueden acceder a perfil', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    $this->actingAs($admin)
        ->get(route('dashboard'))
        ->assertRedirect(route('fichar'));

    $this->actingAs($admin)
        ->get(route('profile.edit'))
        ->assertOk();

    $this->actingAs($admin)
        ->get(route('settings'))
        ->assertRedirect('/settings/profile');
});
