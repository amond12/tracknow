<?php

use Inertia\Testing\AssertableInertia as Assert;

test('supplementary public legal pages can be rendered', function (
    string $routeName,
    string $component,
) {
    $this->get(route($routeName))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component($component),
        );
})->with([
    ['legal.notice', 'legal/legal-notice'],
    ['legal.cookies', 'legal/cookies'],
    ['legal.dpa', 'legal/dpa'],
    ['legal.subprocessors', 'legal/subprocessors'],
]);
