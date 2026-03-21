<?php

use App\Models\User;

test('restricted staff are redirected away from dashboard', function (string $role) {
    $employee = User::factory()->create([
        'role' => $role,
    ]);

    $this->actingAs($employee)
        ->get(route('dashboard'))
        ->assertRedirect(route('fichar'));
})->with(['empleado', 'encargado']);

test('restricted staff can enter settings but are redirected away from profile', function (string $role) {
    $employee = User::factory()->create([
        'role' => $role,
    ]);

    $this->actingAs($employee)
        ->get(route('settings'))
        ->assertRedirect('/settings/password');
})->with(['empleado', 'encargado']);

test('restricted staff cannot access profile settings page', function (string $role) {
    $employee = User::factory()->create([
        'role' => $role,
    ]);

    $this->actingAs($employee)
        ->get(route('profile.edit'))
        ->assertForbidden();
})->with(['empleado', 'encargado']);

test('restricted staff cannot update profile settings', function (string $role) {
    $employee = User::factory()->create([
        'role' => $role,
    ]);

    $this->actingAs($employee)
        ->patch(route('profile.update'), [
            'name' => 'Nombre Bloqueado',
            'email' => 'empleado@example.com',
        ])
        ->assertForbidden();
})->with(['empleado', 'encargado']);

test('restricted staff cannot delete own account', function (string $role) {
    $employee = User::factory()->create([
        'role' => $role,
    ]);

    $this->actingAs($employee)
        ->delete(route('profile.destroy'), [
            'password' => 'password',
        ])
        ->assertForbidden();
})->with(['empleado', 'encargado']);

test('admins can access dashboard and profile settings page', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    $this->actingAs($admin)
        ->get(route('dashboard'))
        ->assertOk();

    $this->actingAs($admin)
        ->get(route('profile.edit'))
        ->assertOk();

    $this->actingAs($admin)
        ->get(route('settings'))
        ->assertRedirect('/settings/profile');
});
