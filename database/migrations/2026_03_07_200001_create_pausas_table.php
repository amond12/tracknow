<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pausas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fichaje_id')->constrained()->cascadeOnDelete();
            $table->dateTime('inicio_pausa');
            $table->dateTime('fin_pausa')->nullable();
            $table->unsignedInteger('duracion_pausa')->nullable()->comment('Segundos de pausa');
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
        Schema::dropIfExists('pausas');
    }
};
