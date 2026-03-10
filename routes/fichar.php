<?php

use App\Http\Controllers\FicharController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('fichar', [FicharController::class, 'index'])->name('fichar');
    Route::post('fichar/iniciar', [FicharController::class, 'iniciar'])->name('fichar.iniciar');
    Route::post('fichar/pausa', [FicharController::class, 'pausa'])->name('fichar.pausa');
    Route::post('fichar/finalizar', [FicharController::class, 'finalizar'])->name('fichar.finalizar');
});
