<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('resumen_diario', function (Blueprint $table) {
            $table->string('origen', 10)->default('auto')->after('horas_extra');
            $table->foreignId('admin_id')->nullable()->constrained('users')->nullOnDelete()->after('origen');
        });
    }

    public function down(): void
    {
        Schema::table('resumen_diario', function (Blueprint $table) {
            $table->dropConstrainedForeignId('admin_id');
            $table->dropColumn('origen');
        });
    }
};
