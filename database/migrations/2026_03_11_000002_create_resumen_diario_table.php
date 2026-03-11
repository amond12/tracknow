<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('resumen_diario', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('fecha');
            $table->unsignedInteger('horas_trabajadas')->default(0);
            $table->integer('horas_extra')->default(0);
            $table->timestamps();

            $table->unique(['user_id', 'fecha']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('resumen_diario');
    }
};
