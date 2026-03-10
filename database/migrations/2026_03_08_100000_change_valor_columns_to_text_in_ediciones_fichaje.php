<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ediciones_fichaje', function (Blueprint $table) {
            $table->text('valor_anterior')->nullable()->change();
            $table->text('valor_nuevo')->change();
        });
    }

    public function down(): void
    {
        Schema::table('ediciones_fichaje', function (Blueprint $table) {
            $table->string('valor_anterior')->nullable()->change();
            $table->string('valor_nuevo')->change();
        });
    }
};
