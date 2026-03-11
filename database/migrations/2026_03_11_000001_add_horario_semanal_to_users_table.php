<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedSmallInteger('horario_lunes')->nullable()->after('remoto');
            $table->unsignedSmallInteger('horario_martes')->nullable()->after('horario_lunes');
            $table->unsignedSmallInteger('horario_miercoles')->nullable()->after('horario_martes');
            $table->unsignedSmallInteger('horario_jueves')->nullable()->after('horario_miercoles');
            $table->unsignedSmallInteger('horario_viernes')->nullable()->after('horario_jueves');
            $table->unsignedSmallInteger('horario_sabado')->nullable()->after('horario_viernes');
            $table->unsignedSmallInteger('horario_domingo')->nullable()->after('horario_sabado');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'horario_lunes',
                'horario_martes',
                'horario_miercoles',
                'horario_jueves',
                'horario_viernes',
                'horario_sabado',
                'horario_domingo',
            ]);
        });
    }
};
