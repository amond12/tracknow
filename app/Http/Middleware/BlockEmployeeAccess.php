<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class BlockEmployeeAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->isEmployeeLike()) {
            abort(403);
        }

        return $next($request);
    }
}
