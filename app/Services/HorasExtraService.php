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
     * Recalcula el resumen diario para todos los días naturales que toca un fichaje.
     * Llamar tras cualquier cambio en un fichaje o sus pausas.
     */
    public function recalcularParaFichaje(Fichaje $fichaje): void
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

        foreach ($this->diasQueAfecta($fichaje) as $fecha) {
            $this->recalcularDia($user, $fecha);
        }
    }

    /**
     * Recalcula el resumen diario de un empleado para un día concreto.
     * Agrega todos sus fichajes finalizados que solapan ese día natural.
     */
    public function recalcularDia(User $user, Carbon $fecha): void
    {
        $fichajesDelDia = $this->fichajesQueTocanDia($user->id, $fecha);

        $totalTrabajado = 0;
        foreach ($fichajesDelDia as $f) {
            $totalTrabajado += $this->calcularSegundosEnDia($f, $fecha);
        }

        $previsto = $user->horarioPrevistoDia($fecha);
        $extra    = $totalTrabajado - $previsto;

        ResumenDiario::updateOrCreate(
            ['user_id' => $user->id, 'fecha' => $fecha->toDateString()],
            ['horas_trabajadas' => $totalTrabajado, 'horas_extra' => $extra]
        );
    }

    /**
     * Calcula los segundos TRABAJADOS (sin pausas) que un fichaje aporta
     * a un día natural concreto.
     *
     * Clampea la ventana del fichaje al día y resta las pausas que caen
     * dentro de esa ventana (también clampeadas).
     */
    public function calcularSegundosEnDia(Fichaje $fichaje, Carbon $fecha): int
    {
        $dayStart = $fecha->copy()->startOfDay();
        $dayEnd   = $fecha->copy()->endOfDay();

        $inicio = Carbon::parse($fichaje->inicio_jornada);
        $fin    = Carbon::parse($fichaje->fin_jornada);

        $efectivoInicio = $inicio->lt($dayStart) ? $dayStart->copy() : $inicio->copy();
        $efectivoFin    = $fin->gt($dayEnd)       ? $dayEnd->copy()   : $fin->copy();

        if ($efectivoFin->lte($efectivoInicio)) {
            return 0;
        }

        // En Carbon 3 la diferencia puede ser con signo; medir de inicio -> fin evita valores negativos.
        $bruto = (int) $efectivoInicio->diffInSeconds($efectivoFin);

        $totalPausas = 0;
        foreach ($fichaje->pausas as $pausa) {
            if (! $pausa->fin_pausa) {
                continue;
            }

            $pInicio = Carbon::parse($pausa->inicio_pausa);
            $pFin    = Carbon::parse($pausa->fin_pausa);

            $pEfInicio = $pInicio->lt($efectivoInicio) ? $efectivoInicio->copy() : $pInicio->copy();
            $pEfFin    = $pFin->gt($efectivoFin)       ? $efectivoFin->copy()    : $pFin->copy();

            if ($pEfFin->gt($pEfInicio)) {
                $totalPausas += (int) $pEfInicio->diffInSeconds($pEfFin);
            }
        }

        return max(0, $bruto - $totalPausas);
    }

    /**
     * Devuelve los días naturales (Carbon a medianoche) que toca el fichaje.
     */
    private function diasQueAfecta(Fichaje $fichaje): array
    {
        $inicio = Carbon::parse($fichaje->inicio_jornada);
        $fin    = Carbon::parse($fichaje->fin_jornada);

        $iniDay = $inicio->copy()->startOfDay();
        $finDay = $fin->copy()->startOfDay();

        $dias = [$iniDay];

        if ($finDay->gt($iniDay)) {
            $dias[] = $finDay;
        }

        return $dias;
    }

    /**
     * Devuelve todos los fichajes finalizados de un empleado que solapan un día natural.
     */
    private function fichajesQueTocanDia(int $userId, Carbon $fecha): Collection
    {
        $startOfDay     = $fecha->copy()->startOfDay();
        $startOfNextDay = $fecha->copy()->addDay()->startOfDay();

        return Fichaje::where('user_id', $userId)
            ->where('estado', 'finalizada')
            ->whereNotNull('fin_jornada')
            ->where('inicio_jornada', '<', $startOfNextDay)
            ->where('fin_jornada', '>=', $startOfDay)
            ->with('pausas')
            ->get();
    }
}
