<?php

use Inertia\Testing\AssertableInertia as Assert;

test('public legal privacy page can be rendered', function () {
    $this->get(route('legal.privacy'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('legal/privacy'),
        );
});
