<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ediciones_fichaje', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fichaje_id')->constrained()->cascadeOnDelete();
            $table->foreignId('pausa_id')->nullable()->constrained('pausas')->nullOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('campo')->comment('inicio_jornada|fin_jornada|inicio_pausa|fin_pausa|finalizacion_admin');
            $table->text('valor_anterior')->nullable();
            $table->text('valor_nuevo');
            $table->text('motivo');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ediciones_fichaje');
    }
};
