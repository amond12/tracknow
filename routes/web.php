<?php

use App\Http\Middleware\RedirectEmployeeFromDashboard;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route(auth()->check() ? 'dashboard' : 'login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')
        ->middleware(RedirectEmployeeFromDashboard::class)
        ->name('dashboard');
});

require __DIR__.'/settings.php';
require __DIR__.'/configuracion.php';
require __DIR__.'/fichar.php';
