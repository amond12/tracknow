<?php

use App\Http\Controllers\FicharController;
use App\Http\Controllers\PublicFicharController;
use Illuminate\Support\Facades\Route;

Route::get('fichar/contexto-red', [FicharController::class, 'contextoRed'])->name('fichar.contexto-red');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('fichar', [FicharController::class, 'index'])->name('fichar');
    Route::post('fichar/iniciar', [FicharController::class, 'iniciar'])->name('fichar.iniciar');
    Route::post('fichar/pausa', [FicharController::class, 'pausa'])->name('fichar.pausa');
    Route::post('fichar/finalizar', [FicharController::class, 'finalizar'])->name('fichar.finalizar');
});

Route::middleware('throttle:public-clock-lookup')->group(function () {
    Route::get('fichar/publico', [PublicFicharController::class, 'index'])->name('fichar.publico');
    Route::post('fichar/publico/buscar', [PublicFicharController::class, 'buscar'])->name('fichar.publico.buscar');
});

Route::middleware('throttle:public-clock-actions')->group(function () {
    Route::post('fichar/publico/iniciar', [PublicFicharController::class, 'iniciar'])->name('fichar.publico.iniciar');
    Route::post('fichar/publico/pausa', [PublicFicharController::class, 'pausa'])->name('fichar.publico.pausa');
    Route::post('fichar/publico/finalizar', [PublicFicharController::class, 'finalizar'])->name('fichar.publico.finalizar');
});
