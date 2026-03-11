<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('vacaciones', function (Blueprint $table) {
            $table->enum('tipo', ['vacacion', 'ausencia', 'festivo'])->default('vacacion')->after('fecha');
            $table->text('motivo')->nullable()->after('tipo');
            $table->boolean('dia_completo')->default(true)->after('motivo');
            $table->time('hora_inicio')->nullable()->after('dia_completo');
            $table->time('hora_fin')->nullable()->after('hora_inicio');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vacaciones', function (Blueprint $table) {
            $table->dropColumn(['tipo', 'motivo', 'dia_completo', 'hora_inicio', 'hora_fin']);
        });
    }
};
