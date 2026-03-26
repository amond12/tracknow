<?php

namespace App\Services\Billing;

use App\Contracts\BillingGateway;
use App\Models\User;

class StripeBillingGateway implements BillingGateway
{
    public function createCheckoutUrl(
        User $user,
        string $subscriptionType,
        string $priceId,
        string $successUrl,
        string $cancelUrl,
    ): string {
        return $user->newSubscription($subscriptionType, $priceId)
            ->checkout([
                'success_url' => $successUrl,
                'cancel_url' => $cancelUrl,
            ])
            ->url;
    }

    public function createPortalUrl(
        User $user,
        string $returnUrl,
        array $options = [],
    ): string {
        $user->createOrGetStripeCustomer();

        return $user->billingPortalUrl($returnUrl, $options);
    }
}
