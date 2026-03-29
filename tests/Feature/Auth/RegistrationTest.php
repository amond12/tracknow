<?php

use App\Models\User;
use Carbon\Carbon;

test('registration screen can be rendered', function () {
    $response = $this->get(route('register'));

    $response->assertOk();
});

test('new users can register', function () {
    $response = $this->post(route('register.store'), [
        'name' => 'Test User',
        'apellido' => 'Admin',
        'email' => 'test@example.com',
        'telefono' => '600000000',
        'dni' => '12.345.678-a',
        'password' => 'password',
        'password_confirmation' => 'password',
        'legal_documents' => '1',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));

    $user = \App\Models\User::where('email', 'test@example.com')->first();

    expect($user)->not->toBeNull();
    expect($user->apellido)->toBe('Admin');
    expect($user->telefono)->toBe('600000000');
    expect($user->dni)->toBe('12345678A');
    expect($user->role)->toBe(User::ROLE_ADMIN);
    expect($user->trial_ends_at)->not->toBeNull();
    expect($user->terms_accepted_at)->not->toBeNull();
    expect($user->privacy_policy_accepted_at)->not->toBeNull();
    expect($user->trial_ends_at?->between(
        Carbon::now()->addDays(14)->startOfMinute(),
        Carbon::now()->addDays(15)->addMinute(),
    ))->toBeTrue();
});

test('new users must accept legal documents to register', function () {
    $response = $this->from(route('register'))->post(route('register.store'), [
        'name' => 'Test User',
        'apellido' => 'Admin',
        'email' => 'test@example.com',
        'telefono' => '600000000',
        'dni' => '12345678A',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response
        ->assertRedirect(route('register'))
        ->assertSessionHasErrors(['legal_documents']);

    $this->assertGuest();
});

test('registration rejects a dni that matches an existing user after normalization', function () {
    User::factory()->create([
        'dni' => '12345678A',
    ]);

    $response = $this->from(route('register'))->post(route('register.store'), [
        'name' => 'Test User',
        'apellido' => 'Admin',
        'email' => 'duplicate@example.com',
        'telefono' => '600000000',
        'dni' => '12 345 678-a',
        'password' => 'password',
        'password_confirmation' => 'password',
        'legal_documents' => '1',
    ]);

    $response
        ->assertRedirect(route('register'))
        ->assertSessionHasErrors(['dni']);

    $this->assertGuest();
});
