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
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('apellido')->nullable();
            $table->string('email')->unique();
            $table->string('telefono', 20)->nullable();
            $table->string('dni', 20)->nullable()->unique();
            $table->string('nss', 30)->nullable()->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->text('two_factor_secret')->nullable();
            $table->text('two_factor_recovery_codes')->nullable();
            $table->timestamp('two_factor_confirmed_at')->nullable();
            $table->string('role')->default('admin');
            $table->foreignId('company_id')->nullable()->index();
            $table->foreignId('work_center_id')->nullable()->index();
            $table->boolean('remoto')->default(false);
            $table->string('clock_code_suffix', 4)->nullable();
            $table->decimal('horario_lunes', 4, 2)->nullable();
            $table->decimal('horario_martes', 4, 2)->nullable();
            $table->decimal('horario_miercoles', 4, 2)->nullable();
            $table->decimal('horario_jueves', 4, 2)->nullable();
            $table->decimal('horario_viernes', 4, 2)->nullable();
            $table->decimal('horario_sabado', 4, 2)->nullable();
            $table->decimal('horario_domingo', 4, 2)->nullable();
            $table->string('stripe_id')->nullable()->index();
            $table->string('pm_type')->nullable();
            $table->string('pm_last_four', 4)->nullable();
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('terms_accepted_at')->nullable();
            $table->timestamp('privacy_policy_accepted_at')->nullable();
            $table->rememberToken();
            $table->timestamps();

            $table->unique(['company_id', 'clock_code_suffix'], 'users_company_clock_code_suffix_unique');
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
