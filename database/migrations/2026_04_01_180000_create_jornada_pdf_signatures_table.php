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
        Schema::create('jornada_pdf_signatures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedTinyInteger('month');
            $table->unsignedSmallInteger('year');

            $table->foreignId('company_signer_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('company_signer_name')->nullable();
            $table->string('company_signer_title')->nullable();
            $table->string('company_signature_path')->nullable();
            $table->timestamp('company_signed_at')->nullable();

            $table->foreignId('employee_signer_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('employee_signer_name')->nullable();
            $table->string('employee_signature_path')->nullable();
            $table->timestamp('employee_signed_at')->nullable();

            $table->timestamp('locked_at')->nullable();
            $table->timestamps();

            $table->unique(['employee_id', 'month', 'year'], 'jornada_pdf_signatures_employee_period_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('jornada_pdf_signatures');
    }
};
