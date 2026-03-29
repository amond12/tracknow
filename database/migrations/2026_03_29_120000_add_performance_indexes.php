<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->index(
                ['company_id', 'apellido', 'name'],
                'users_company_name_idx',
            );
            $table->index(
                ['company_id', 'work_center_id', 'apellido', 'name'],
                'users_company_center_name_idx',
            );
        });

        Schema::table('companies', function (Blueprint $table) {
            $table->index(['user_id', 'nombre'], 'companies_user_nombre_idx');
        });

        Schema::table('work_centers', function (Blueprint $table) {
            $table->index(
                ['company_id', 'nombre'],
                'work_centers_company_nombre_idx',
            );
        });

        Schema::table('fichajes', function (Blueprint $table) {
            $table->index(
                ['user_id', 'deleted_at', 'estado', 'fecha', 'inicio_jornada'],
                'fichajes_user_state_date_start_idx',
            );
            $table->index(
                ['user_id', 'deleted_at', 'fecha', 'estado'],
                'fichajes_user_date_state_idx',
            );
            $table->index(
                ['work_center_id', 'deleted_at', 'fecha', 'inicio_jornada'],
                'fichajes_center_date_start_idx',
            );
        });

        Schema::table('pausas', function (Blueprint $table) {
            $table->index(
                ['fichaje_id', 'fin_pausa', 'inicio_pausa'],
                'pausas_fichaje_end_start_idx',
            );
        });

        Schema::table('ediciones_fichaje', function (Blueprint $table) {
            $table->index(
                ['fichaje_id', 'pausa_id', 'campo'],
                'ediciones_fichaje_lookup_idx',
            );
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_company_name_idx');
            $table->dropIndex('users_company_center_name_idx');
        });

        Schema::table('companies', function (Blueprint $table) {
            $table->dropIndex('companies_user_nombre_idx');
        });

        Schema::table('work_centers', function (Blueprint $table) {
            $table->dropIndex('work_centers_company_nombre_idx');
        });

        Schema::table('fichajes', function (Blueprint $table) {
            $table->dropIndex('fichajes_user_state_date_start_idx');
            $table->dropIndex('fichajes_user_date_state_idx');
            $table->dropIndex('fichajes_center_date_start_idx');
        });

        Schema::table('pausas', function (Blueprint $table) {
            $table->dropIndex('pausas_fichaje_end_start_idx');
        });

        Schema::table('ediciones_fichaje', function (Blueprint $table) {
            $table->dropIndex('ediciones_fichaje_lookup_idx');
        });
    }
};
