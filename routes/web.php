<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route(auth()->check() ? 'fichar' : 'login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return redirect()->route('fichar');
    })->name('dashboard');
});

require __DIR__.'/settings.php';
require __DIR__.'/configuracion.php';
require __DIR__.'/fichar.php';
