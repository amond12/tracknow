<?php

use App\Models\User;

test('authenticated users can resolve the network context IP used by fichar', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->withServerVariables([
            'REMOTE_ADDR' => '203.0.113.24',
        ])
        ->getJson(route('fichar.contexto-red'))
        ->assertOk()
        ->assertExactJson([
            'ip' => '203.0.113.24',
        ]);
});
