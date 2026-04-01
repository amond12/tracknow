<?php

use App\Http\Controllers\SubscriptionRequiredController;
use App\Http\Middleware\EnsureSubscriptionAccess;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route(auth()->check() ? 'fichar' : 'login');
})->name('home');

Route::get('terminos-y-condiciones', fn () => Inertia::render('legal/terms'))
    ->name('legal.terms');

Route::get('politica-de-privacidad', fn () => Inertia::render('legal/privacy'))
    ->name('legal.privacy');

Route::get('aviso-legal', fn () => Inertia::render('legal/legal-notice'))
    ->name('legal.notice');

Route::get('politica-de-cookies', fn () => Inertia::render('legal/cookies'))
    ->name('legal.cookies');

Route::get('encargo-del-tratamiento', fn () => Inertia::render('legal/dpa'))
    ->name('legal.dpa');

Route::get('anexo-de-subencargados', fn () => Inertia::render('legal/subprocessors'))
    ->name('legal.subprocessors');

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
