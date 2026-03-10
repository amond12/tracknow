<?php

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
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));

    $user = \App\Models\User::where('email', 'test@example.com')->first();

    expect($user)->not->toBeNull();
    expect($user->apellido)->toBe('Admin');
    expect($user->telefono)->toBe('600000000');
});
