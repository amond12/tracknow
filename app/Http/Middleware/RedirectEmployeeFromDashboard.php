<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RedirectEmployeeFromDashboard
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->isEmpleado()) {
            return redirect()->route('fichar');
        }

        return $next($request);
    }
}
