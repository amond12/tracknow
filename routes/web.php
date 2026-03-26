<?php

use App\Http\Controllers\SubscriptionRequiredController;
use App\Http\Middleware\EnsureSubscriptionAccess;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route(auth()->check() ? 'fichar' : 'login');
})->name('home');

Route::middleware(['auth', EnsureSubscriptionAccess::class])->group(function () {
    Route::get('subscription-required', [SubscriptionRequiredController::class, 'show'])
        ->name('subscription.required');
});

Route::middleware(['auth', 'verified', EnsureSubscriptionAccess::class])->group(function () {
    Route::get('dashboard', function () {
        return redirect()->route('fichar');
    })->name('dashboard');
});

require __DIR__.'/settings.php';
require __DIR__.'/configuracion.php';
require __DIR__.'/fichar.php';
