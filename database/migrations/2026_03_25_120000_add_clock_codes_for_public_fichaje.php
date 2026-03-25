<?php

use App\Services\ClockCodeService;
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
        Schema::table('companies', function (Blueprint $table) {
            $table->string('clock_code_prefix', 4)->nullable()->unique()->after('cp');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('clock_code_suffix', 4)->nullable()->after('remoto');
            $table->unique(['company_id', 'clock_code_suffix'], 'users_company_clock_code_suffix_unique');
        });

        app(ClockCodeService::class)->backfillMissingCodes();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique('users_company_clock_code_suffix_unique');
            $table->dropColumn('clock_code_suffix');
        });

        Schema::table('companies', function (Blueprint $table) {
            $table->dropUnique(['clock_code_prefix']);
            $table->dropColumn('clock_code_prefix');
        });
    }
};
