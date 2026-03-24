<?php

use App\Models\User;

test('guests are redirected from home to the login page', function () {
    $response = $this->get(route('home'));

    $response->assertRedirect(route('login'));
});

test('authenticated users are redirected from home to fichar', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->get(route('home'));

    $response->assertRedirect(route('fichar'));
});
