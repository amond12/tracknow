<?php

use App\Http\Controllers\Configuracion\CentroController;
use App\Http\Controllers\Configuracion\EmpleadoController;
use App\Http\Controllers\Configuracion\EmpresaController;
use App\Http\Controllers\Configuracion\FichajeController;
use App\Http\Controllers\Configuracion\HorasExtraController;
use App\Http\Controllers\Configuracion\PdfController;
use App\Http\Middleware\BlockEmployeeAccess;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', BlockEmployeeAccess::class])->prefix('configuracion')->name('configuracion.')->group(function () {
    Route::get('empresas', [EmpresaController::class, 'index'])->name('empresas.index');
    Route::post('empresas', [EmpresaController::class, 'store'])->name('empresas.store');
    Route::put('empresas/{empresa}', [EmpresaController::class, 'update'])->name('empresas.update');
    Route::delete('empresas/{empresa}', [EmpresaController::class, 'destroy'])->name('empresas.destroy');

    Route::get('centros', [CentroController::class, 'index'])->name('centros.index');
    Route::post('centros', [CentroController::class, 'store'])->name('centros.store');
    Route::put('centros/{centro}', [CentroController::class, 'update'])->name('centros.update');
    Route::delete('centros/{centro}', [CentroController::class, 'destroy'])->name('centros.destroy');

    Route::get('empleados', [EmpleadoController::class, 'index'])->name('empleados.index');
    Route::post('empleados', [EmpleadoController::class, 'store'])->name('empleados.store');
    Route::put('empleados/{empleado}', [EmpleadoController::class, 'update'])->name('empleados.update');
    Route::delete('empleados/{empleado}', [EmpleadoController::class, 'destroy'])->name('empleados.destroy');
});

Route::middleware(['auth', 'verified', BlockEmployeeAccess::class])->group(function () {
    Route::get('fichajes', [FichajeController::class, 'index'])->name('fichajes.index');
    Route::post('fichajes', [FichajeController::class, 'store'])->name('fichajes.store');
    Route::put('fichajes/{fichaje}/jornada', [FichajeController::class, 'updateJornada'])->name('fichajes.updateJornada');
    Route::post('fichajes/{fichaje}/pausas', [FichajeController::class, 'storePausa'])->name('fichajes.storePausa');
    Route::put('fichajes/{fichaje}/pausas/{pausa}', [FichajeController::class, 'updatePausa'])->name('fichajes.updatePausa');
    Route::delete('fichajes/{fichaje}/pausas/{pausa}', [FichajeController::class, 'destroyPausa'])->name('fichajes.destroyPausa');
    Route::post('fichajes/{fichaje}/finalizar', [FichajeController::class, 'finalizarAdmin'])->name('fichajes.finalizarAdmin');
    Route::delete('fichajes/{fichaje}', [FichajeController::class, 'destroy'])->name('fichajes.destroy');

    Route::get('pdfs', [PdfController::class, 'index'])->name('pdfs.index');
    Route::get('pdfs/{empleado}/download', [PdfController::class, 'download'])->name('pdfs.download');

    Route::get('horas-extra', [HorasExtraController::class, 'index'])->name('horas-extra.index');
});
