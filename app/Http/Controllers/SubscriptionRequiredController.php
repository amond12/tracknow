<?php

namespace App\Http\Controllers;

use App\Services\SubscriptionAccessService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SubscriptionRequiredController extends Controller
{
    public function show(
        Request $request,
        SubscriptionAccessService $subscriptionAccess,
    ): Response|\Illuminate\Http\RedirectResponse {
        if (! $subscriptionAccess->isExpired($request->user())) {
            return redirect()->route('fichar');
        }

        return Inertia::render('subscription-required');
    }
}
