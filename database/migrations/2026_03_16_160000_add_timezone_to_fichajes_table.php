<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('fichajes', function (Blueprint $table) {
            $table->string('timezone')->default('Europe/Madrid')->after('work_center_id');
        });

        $rows = DB::table('fichajes')
            ->leftJoin('work_centers', 'work_centers.id', '=', 'fichajes.work_center_id')
            ->select('fichajes.id', 'work_centers.timezone as work_center_timezone')
            ->orderBy('fichajes.id')
            ->get();

        foreach ($rows as $row) {
            DB::table('fichajes')
                ->where('id', $row->id)
                ->update([
                    'timezone' => $row->work_center_timezone ?: 'Europe/Madrid',
                ]);
        }
    }

    public function down(): void
    {
        Schema::table('fichajes', function (Blueprint $table) {
            $table->dropColumn('timezone');
        });
    }
};
