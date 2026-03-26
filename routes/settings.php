<?php

use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\PricingController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\TrabajoController;
use App\Http\Controllers\Settings\TwoFactorAuthenticationController;
use App\Http\Middleware\BlockEmployeeAccess;
use App\Http\Middleware\EnsureAdminAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::get('settings', function (Request $request) {
        if ($request->user()?->isEmpleado()) {
            return redirect('/settings/password');
        }

        return redirect('/settings/profile');
    })->name('settings');

    Route::middleware(BlockEmployeeAccess::class)->group(function () {
        Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
        Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');

        Route::get('settings/trabajo', [TrabajoController::class, 'edit'])->name('trabajo.edit');
        Route::patch('settings/trabajo', [TrabajoController::class, 'update'])->name('trabajo.update');
    });
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])
        ->middleware(BlockEmployeeAccess::class)
        ->name('profile.destroy');

    Route::get('settings/password', [PasswordController::class, 'edit'])->name('user-password.edit');

    Route::put('settings/password', [PasswordController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');

    Route::inertia('settings/appearance', 'settings/appearance')->name('appearance.edit');

    Route::get('settings/two-factor', [TwoFactorAuthenticationController::class, 'show'])
        ->name('two-factor.show');

    Route::middleware(EnsureAdminAccess::class)->group(function () {
        Route::get('settings/pricing', [PricingController::class, 'show'])->name('pricing.show');
        Route::post('settings/pricing/checkout', [PricingController::class, 'checkout'])->name('pricing.checkout');
        Route::post('settings/pricing/manage', [PricingController::class, 'manage'])->name('pricing.manage');
        Route::post('settings/pricing/cancel', [PricingController::class, 'cancel'])->name('pricing.cancel');
        Route::post('settings/pricing/change', [PricingController::class, 'change'])->name('pricing.change');
    });
});
