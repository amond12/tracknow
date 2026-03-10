<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fichajes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->foreignId('work_center_id')->constrained()->cascadeOnDelete();
            $table->date('fecha');
            $table->dateTime('inicio_jornada');
            $table->dateTime('fin_jornada')->nullable();
            $table->unsignedInteger('duracion_jornada')->nullable()->comment('Segundos trabajados (sin pausas)');
            $table->enum('estado', ['activa', 'pausa', 'finalizada'])->default('activa');
            $table->decimal('lat_inicio', 10, 7)->nullable();
            $table->decimal('lng_inicio', 10, 7)->nullable();
            $table->string('ip_inicio')->nullable();
            $table->decimal('lat_fin', 10, 7)->nullable();
            $table->decimal('lng_fin', 10, 7)->nullable();
            $table->string('ip_fin')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fichajes');
    }
};
