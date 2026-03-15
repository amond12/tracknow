<?php

use Carbon\Carbon;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('resumen_diario', function (Blueprint $table) {
            $table->unsignedInteger('segundos_previstos')->default(0)->after('horas_trabajadas');
        });

        DB::table('fichajes')
            ->whereNotNull('inicio_jornada')
            ->update(['fecha' => DB::raw('DATE(inicio_jornada)')]);

        DB::table('resumen_diario')->update([
            'segundos_previstos' => DB::raw('CASE WHEN horas_trabajadas - horas_extra < 0 THEN 0 ELSE horas_trabajadas - horas_extra END'),
        ]);

        $legacyPrevistos = [];
        foreach (DB::table('resumen_diario')->where('origen', 'auto')->get(['user_id', 'fecha', 'segundos_previstos']) as $row) {
            $legacyPrevistos[$this->rowKey((int) $row->user_id, $row->fecha)] = (int) $row->segundos_previstos;
        }

        $manualKeys = [];
        foreach (DB::table('resumen_diario')->where('origen', 'manual')->get(['user_id', 'fecha']) as $row) {
            $manualKeys[$this->rowKey((int) $row->user_id, $row->fecha)] = true;
        }

        $users = DB::table('users')->get([
            'id',
            'horario_lunes',
            'horario_martes',
            'horario_miercoles',
            'horario_jueves',
            'horario_viernes',
            'horario_sabado',
            'horario_domingo',
        ])->keyBy('id');

        DB::table('resumen_diario')->where('origen', 'auto')->delete();

        $rows = DB::table('fichajes')
            ->select('user_id', 'fecha', DB::raw('SUM(COALESCE(duracion_jornada, 0)) as horas_trabajadas'))
            ->whereNull('deleted_at')
            ->where('estado', 'finalizada')
            ->whereNotNull('fin_jornada')
            ->groupBy('user_id', 'fecha')
            ->orderBy('user_id')
            ->orderBy('fecha')
            ->get();

        $now = Carbon::now();
        $inserts = [];

        foreach ($rows as $row) {
            $key = $this->rowKey((int) $row->user_id, $row->fecha);

            if (isset($manualKeys[$key])) {
                continue;
            }

            $fecha = Carbon::parse($row->fecha);
            $previsto = $legacyPrevistos[$key] ?? $this->segundosPrevistosDesdeUsuario($users->get($row->user_id), $fecha);
            $trabajado = (int) $row->horas_trabajadas;

            $inserts[] = [
                'user_id' => (int) $row->user_id,
                'fecha' => $row->fecha,
                'horas_trabajadas' => $trabajado,
                'segundos_previstos' => max(0, $previsto),
                'horas_extra' => $trabajado - max(0, $previsto),
                'origen' => 'auto',
                'admin_id' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        foreach (array_chunk($inserts, 500) as $chunk) {
            DB::table('resumen_diario')->insert($chunk);
        }
    }

    public function down(): void
    {
        Schema::table('resumen_diario', function (Blueprint $table) {
            $table->dropColumn('segundos_previstos');
        });
    }

    private function rowKey(int $userId, string $fecha): string
    {
        return $userId.'|'.$fecha;
    }

    private function segundosPrevistosDesdeUsuario(?object $user, Carbon $fecha): int
    {
        if (! $user) {
            return 0;
        }

        $map = [
            1 => $user->horario_lunes,
            2 => $user->horario_martes,
            3 => $user->horario_miercoles,
            4 => $user->horario_jueves,
            5 => $user->horario_viernes,
            6 => $user->horario_sabado,
            7 => $user->horario_domingo,
        ];

        return (int) round(((float) ($map[$fecha->dayOfWeekIso] ?? 0)) * 3600);
    }
};
