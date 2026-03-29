<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $users = DB::table('users')
            ->select('id', 'dni')
            ->whereNotNull('dni')
            ->orderBy('id')
            ->get();

        $seen = [];
        $collisions = [];
        $updates = [];

        foreach ($users as $user) {
            $normalizedDni = User::normalizeDni($user->dni);

            if ($normalizedDni !== null) {
                if (array_key_exists($normalizedDni, $seen)) {
                    $collisions[$normalizedDni] ??= [$seen[$normalizedDni]];
                    $collisions[$normalizedDni][] = $user->id;
                } else {
                    $seen[$normalizedDni] = $user->id;
                }
            }

            if ($normalizedDni !== $user->dni) {
                $updates[] = [
                    'id' => $user->id,
                    'dni' => $normalizedDni,
                ];
            }
        }

        if ($collisions !== []) {
            $formattedCollisions = collect($collisions)
                ->map(
                    fn (array $ids, string $dni): string => $dni.' => '.implode(', ', $ids),
                )
                ->implode('; ');

            throw new RuntimeException(
                'No se pueden normalizar los DNI existentes porque hay colisiones: '.$formattedCollisions,
            );
        }

        foreach ($updates as $update) {
            DB::table('users')
                ->where('id', $update['id'])
                ->update(['dni' => $update['dni']]);
        }
    }

    public function down(): void
    {
        //
    }
};
