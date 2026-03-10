<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Añadir columnas a users
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('company_id')->nullable()->constrained('companies')->nullOnDelete()->after('role');
            $table->foreignId('work_center_id')->nullable()->constrained('work_centers')->nullOnDelete()->after('company_id');
            $table->string('nss', 30)->nullable()->after('dni');
            $table->boolean('remoto')->default(false)->after('nss');
        });

        // 2. Copiar datos de employees → users
        DB::table('employees')->orderBy('id')->each(function ($emp) {
            DB::table('users')->where('id', $emp->user_id)->update([
                'name'           => $emp->nombre,
                'apellido'       => $emp->apellido,
                'telefono'       => $emp->telefono,
                'dni'            => $emp->dni,
                'company_id'     => $emp->company_id,
                'work_center_id' => $emp->work_center_id,
                'nss'            => $emp->nss,
                'remoto'         => $emp->remoto,
                'role'           => $emp->rol,
            ]);
        });

        // 3. Actualizar fichajes: employee_id → user_id (valores)
        DB::table('employees')->orderBy('id')->each(function ($emp) {
            DB::table('fichajes')
                ->where('employee_id', $emp->id)
                ->update(['employee_id' => $emp->user_id]);
        });

        // 4. Renombrar columna fichajes.employee_id → user_id + fix FK
        Schema::table('fichajes', function (Blueprint $table) {
            $table->dropForeign(['employee_id']);
            $table->renameColumn('employee_id', 'user_id');
        });
        Schema::table('fichajes', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        // 5. Eliminar tabla employees
        Schema::dropIfExists('employees');
    }

    public function down(): void
    {
        throw new \RuntimeException('Esta migración no es reversible automáticamente.');
    }
};
