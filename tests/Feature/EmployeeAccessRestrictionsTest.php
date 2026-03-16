<?php

use App\Models\User;

test('employees are redirected away from dashboard', function () {
    $employee = User::factory()->create([
        'role' => 'empleado',
    ]);

    $this->actingAs($employee)
        ->get(route('dashboard'))
        ->assertRedirect(route('fichar'));
});

test('employees can enter settings but are redirected away from profile', function () {
    $employee = User::factory()->create([
        'role' => 'empleado',
    ]);

    $this->actingAs($employee)
        ->get(route('settings'))
        ->assertRedirect('/settings/password');
});

test('employees cannot access profile settings page', function () {
    $employee = User::factory()->create([
        'role' => 'empleado',
    ]);

    $this->actingAs($employee)
        ->get(route('profile.edit'))
        ->assertForbidden();
});

test('employees cannot update profile settings', function () {
    $employee = User::factory()->create([
        'role' => 'empleado',
    ]);

    $this->actingAs($employee)
        ->patch(route('profile.update'), [
            'name' => 'Nombre Bloqueado',
            'email' => 'empleado@example.com',
        ])
        ->assertForbidden();
});

test('employees cannot delete own account', function () {
    $employee = User::factory()->create([
        'role' => 'empleado',
    ]);

    $this->actingAs($employee)
        ->delete(route('profile.destroy'), [
            'password' => 'password',
        ])
        ->assertForbidden();
});

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
