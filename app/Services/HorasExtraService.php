<?php

namespace App\Services;

use App\Models\Fichaje;
use App\Models\ResumenDiario;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class HorasExtraService
{
    /**
     * Recalcula el resumen del dia de imputacion de un fichaje.
     * Si la fecha de inicio ha cambiado, tambien puede recibir la fecha anterior.
     */
    public function recalcularParaFichaje(Fichaje $fichaje, ?Carbon $fechaAnterior = null): void
    {
        if ($fichaje->estado !== 'finalizada') {
            return;
        }

        if (! $fichaje->inicio_jornada || ! $fichaje->fin_jornada) {
            return;
        }

        $user = User::find($fichaje->user_id);
        if (! $user) {
            return;
        }

        $fechas = collect();

        if ($fechaAnterior) {
            $fechas->push($fechaAnterior->copy()->startOfDay());
        }

        $fechas->push($this->fechaResumenParaFichaje($fichaje));

        foreach ($fechas->unique(fn (Carbon $fecha) => $fecha->toDateString()) as $fecha) {
            $this->recalcularDia($user, $fecha);
        }
    }

    /**
     * Recalcula el resumen diario de un empleado para una fecha de imputacion concreta.
     * Agrega todos sus fichajes finalizados cuyo dia de inicio coincide con esa fecha.
     */
    public function recalcularDia(User $user, Carbon $fecha): void
    {
        $fecha = $fecha->copy()->startOfDay();
        $fichajesDelDia = $this->fichajesAsignadosAFecha($user->id, $fecha);

        $existing = ResumenDiario::where('user_id', $user->id)
            ->where('fecha', $fecha->toDateString())
            ->first();

        if ($existing && $existing->origen === 'manual') {
            return;
        }

        if ($fichajesDelDia->isEmpty()) {
            $existing?->delete();

            return;
        }

        $totalTrabajado = 0;
        foreach ($fichajesDelDia as $fichaje) {
            $totalTrabajado += $this->segundosTrabajadosFichaje($fichaje);
        }

        $previsto = $this->segundosPrevistosParaFecha($user, $fecha, $existing);
        $extra = max(0, $totalTrabajado - $previsto);

        ResumenDiario::updateOrCreate(
            ['user_id' => $user->id, 'fecha' => $fecha->toDateString()],
            [
                'horas_trabajadas' => $totalTrabajado,
                'segundos_previstos' => $previsto,
                'horas_extra' => $extra,
                'origen' => 'auto',
                'admin_id' => null,
            ]
        );
    }

    /**
     * Suma los segundos trabajados por un empleado en la fecha de imputacion,
     * que coincide con el dia de inicio del fichaje.
     */
    public function calcularHorasTrabajadas(User $user, Carbon $fecha): int
    {
        $fichajes = $this->fichajesAsignadosAFecha($user->id, $fecha->copy()->startOfDay());

        $total = 0;
        foreach ($fichajes as $fichaje) {
            $total += $this->segundosTrabajadosFichaje($fichaje);
        }

        return $total;
    }

    /**
     * La fecha resumen de un fichaje es siempre la fecha legal almacenada.
     */
    public function fechaResumenParaFichaje(Fichaje $fichaje): Carbon
    {
        return Carbon::parse($fichaje->fecha)->startOfDay();
    }

    /**
     * Calcula los segundos trabajados (sin pausas) que un fichaje aporta
     * a un dia natural concreto. Se mantiene para utilidades y pruebas.
     */
    public function calcularSegundosEnDia(Fichaje $fichaje, Carbon $fecha): int
    {
        $dayStart = $fecha->copy()->startOfDay();
        $dayEnd = $fecha->copy()->addDay()->startOfDay();

        $inicio = Carbon::parse($fichaje->inicio_jornada);
        $fin = Carbon::parse($fichaje->fin_jornada);

        $efectivoInicio = $inicio->lt($dayStart) ? $dayStart->copy() : $inicio->copy();
        $efectivoFin = $fin->gt($dayEnd) ? $dayEnd->copy() : $fin->copy();

        if ($efectivoFin->lte($efectivoInicio)) {
            return 0;
        }

        $bruto = (int) $efectivoInicio->diffInSeconds($efectivoFin);

        $totalPausas = 0;
        foreach ($fichaje->pausas as $pausa) {
            if (! $pausa->fin_pausa) {
                continue;
            }

            $pInicio = Carbon::parse($pausa->inicio_pausa);
            $pFin = Carbon::parse($pausa->fin_pausa);

            $pEfInicio = $pInicio->lt($efectivoInicio) ? $efectivoInicio->copy() : $pInicio->copy();
            $pEfFin = $pFin->gt($efectivoFin) ? $efectivoFin->copy() : $pFin->copy();

            if ($pEfFin->gt($pEfInicio)) {
                $totalPausas += (int) $pEfInicio->diffInSeconds($pEfFin);
            }
        }

        return max(0, $bruto - $totalPausas);
    }

    private function fichajesAsignadosAFecha(int $userId, Carbon $fecha): Collection
    {
        return Fichaje::where('user_id', $userId)
            ->where('fecha', $fecha->toDateString())
            ->where('estado', 'finalizada')
            ->whereNotNull('fin_jornada')
            ->with('pausas')
            ->get();
    }

    private function segundosTrabajadosFichaje(Fichaje $fichaje): int
    {
        if ($fichaje->duracion_jornada !== null) {
            return (int) $fichaje->duracion_jornada;
        }

        if (! $fichaje->inicio_jornada || ! $fichaje->fin_jornada) {
            return 0;
        }

        $inicio = Carbon::parse($fichaje->inicio_jornada);
        $fin = Carbon::parse($fichaje->fin_jornada);
        $bruto = (int) $inicio->diffInSeconds($fin);

        $totalPausas = 0;
        foreach ($fichaje->pausas as $pausa) {
            if (! $pausa->fin_pausa) {
                continue;
            }

            $totalPausas += (int) Carbon::parse($pausa->inicio_pausa)
                ->diffInSeconds(Carbon::parse($pausa->fin_pausa));
        }

        return max(0, $bruto - $totalPausas);
    }

    private function segundosPrevistosParaFecha(User $user, Carbon $fecha, ?ResumenDiario $existing): int
    {
        if ($existing && $existing->segundos_previstos !== null) {
            return max(0, (int) $existing->segundos_previstos);
        }

        return max(0, $user->horarioPrevistoDia($fecha));
    }
}
