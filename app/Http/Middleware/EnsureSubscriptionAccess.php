<?php

namespace App\Http\Middleware;

use App\Services\SubscriptionAccessService;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class EnsureSubscriptionAccess
{
    private const ALLOWED_ROUTES = [
        'subscription.required',
        'pricing.show',
        'pricing.checkout',
        'pricing.manage',
        'pricing.change',
        'pricing.cancel',
        'pdfs.index',
        'pdfs.download',
        'calendario.index',
        'calendario.downloadPdf',
    ];

    private const ADMIN_ALLOWED_ROUTES = [
        'settings',
        'profile.edit',
        'profile.update',
        'profile.destroy',
    ];

    public function __construct(
        private readonly SubscriptionAccessService $subscriptionAccess,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $this->subscriptionAccess->isExpired($user)) {
            return $next($request);
        }

        $routeName = $request->route()?->getName();

        if (in_array($routeName, self::ALLOWED_ROUTES, true)) {
            return $next($request);
        }

        if ($user->isAdmin() && in_array($routeName, self::ADMIN_ALLOWED_ROUTES, true)) {
            return $next($request);
        }

        $redirectUrl = route('subscription.required');

        if ($request->header('X-Inertia')) {
            return Inertia::location($redirectUrl);
        }

        return redirect()->to($redirectUrl);
    }
}
