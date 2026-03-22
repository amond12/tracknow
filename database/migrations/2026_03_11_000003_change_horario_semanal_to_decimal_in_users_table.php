<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->decimal('horario_lunes', 4, 2)->nullable()->change();
            $table->decimal('horario_martes', 4, 2)->nullable()->change();
            $table->decimal('horario_miercoles', 4, 2)->nullable()->change();
            $table->decimal('horario_jueves', 4, 2)->nullable()->change();
            $table->decimal('horario_viernes', 4, 2)->nullable()->change();
            $table->decimal('horario_sabado', 4, 2)->nullable()->change();
            $table->decimal('horario_domingo', 4, 2)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedSmallInteger('horario_lunes')->nullable()->change();
            $table->unsignedSmallInteger('horario_martes')->nullable()->change();
            $table->unsignedSmallInteger('horario_miercoles')->nullable()->change();
            $table->unsignedSmallInteger('horario_jueves')->nullable()->change();
            $table->unsignedSmallInteger('horario_viernes')->nullable()->change();
            $table->unsignedSmallInteger('horario_sabado')->nullable()->change();
            $table->unsignedSmallInteger('horario_domingo')->nullable()->change();
        });
    }
};
