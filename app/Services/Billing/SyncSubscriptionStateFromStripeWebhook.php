<?php

namespace App\Services\Billing;

use App\Models\Subscription;
use Carbon\CarbonImmutable;

class SyncSubscriptionStateFromStripeWebhook
{
    public function handle(array $payload): void
    {
        if (! in_array($payload['type'] ?? null, [
            'customer.subscription.created',
            'customer.subscription.updated',
            'customer.subscription.deleted',
        ], true)) {
            return;
        }

        $subscription = $payload['data']['object'] ?? null;

        if (! is_array($subscription) || ! isset($subscription['id'])) {
            return;
        }

        $currentPeriodEnd = isset($subscription['current_period_end'])
            ? CarbonImmutable::createFromTimestamp($subscription['current_period_end'])
            : null;

        Subscription::query()
            ->where('stripe_id', $subscription['id'])
            ->update([
                'current_period_end' => $currentPeriodEnd,
            ]);
    }
}
