<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class BlockEmployeeAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $role = $request->user()?->role;

        if (in_array($role, ['empleado', 'encargado'], true)) {
            abort(403);
        }

        return $next($request);
    }
}
