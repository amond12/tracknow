<?php

use Inertia\Testing\AssertableInertia as Assert;

test('public legal terms page can be rendered', function () {
    $this->get(route('legal.terms'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('legal/terms'),
        );
});
