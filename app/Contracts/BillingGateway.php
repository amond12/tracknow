<?php

namespace App\Contracts;

use App\Models\User;

interface BillingGateway
{
    public function createCheckoutUrl(
        User $user,
        string $subscriptionType,
        string $priceId,
        string $successUrl,
        string $cancelUrl,
    ): string;

    /**
     * @param  array<string, mixed>  $options
     */
    public function createPortalUrl(
        User $user,
        string $returnUrl,
        array $options = [],
    ): string;
}
