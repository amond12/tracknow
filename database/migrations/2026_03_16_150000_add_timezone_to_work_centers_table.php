<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('work_centers', function (Blueprint $table) {
            $table->string('timezone')->default('Europe/Madrid')->after('cp');
        });

        DB::table('work_centers')
            ->whereNull('timezone')
            ->update(['timezone' => 'Europe/Madrid']);
    }

    public function down(): void
    {
        Schema::table('work_centers', function (Blueprint $table) {
            $table->dropColumn('timezone');
        });
    }
};
