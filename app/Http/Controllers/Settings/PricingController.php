<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\PricingSelectionRequest;
use App\Services\Billing\PricingService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class PricingController extends Controller
{
    public function show(Request $request, PricingService $pricing): Response
    {
        return Inertia::render('settings/pricing', $pricing->pageProps($request->user()));
    }

    public function checkout(
        PricingSelectionRequest $request,
        PricingService $pricing,
    ): SymfonyResponse {
        return Inertia::location(
            $pricing->createCheckoutUrl(
                $request->user(),
                $request->validated('plan'),
                $request->validated('interval'),
            ),
        );
    }

    public function manage(Request $request, PricingService $pricing): SymfonyResponse
    {
        return Inertia::location(
            $pricing->createManagePortalUrl($request->user()),
        );
    }

    public function cancel(Request $request, PricingService $pricing): SymfonyResponse
    {
        return Inertia::location(
            $pricing->createCancelPortalUrl($request->user()),
        );
    }

    public function change(
        PricingSelectionRequest $request,
        PricingService $pricing,
    ): SymfonyResponse {
        return Inertia::location(
            $pricing->createChangePlanUrl(
                $request->user(),
                $request->validated('plan'),
                $request->validated('interval'),
            ),
        );
    }
}
