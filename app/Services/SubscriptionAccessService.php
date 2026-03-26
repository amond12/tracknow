<?php

namespace App\Services;

use App\Models\Subscription;
use App\Models\User;
use Stripe\Subscription as StripeSubscription;

class SubscriptionAccessService
{
    /**
     * @return array{
     *     ownerAdminId:int|null,
     *     state:'trial'|'paid'|'expired',
     *     trialEndsAt:string|null,
     *     hasPaidAccess:bool
     * }
     */
    public function accessFor(?User $user): ?array
    {
        if (! $user) {
            return null;
        }

        $owner = $this->ownerAdminFor($user);

        if (! $owner) {
            return [
                'ownerAdminId' => null,
                'state' => 'paid',
                'trialEndsAt' => null,
                'hasPaidAccess' => true,
            ];
        }

        $subscription = $this->currentSubscriptionForOwner($owner);
        $trialEndsAt = $owner->trial_ends_at;
        $trialIsActive = $trialEndsAt !== null && now()->lt($trialEndsAt);

        if ($subscription) {
            return [
                'ownerAdminId' => $owner->id,
                'state' => 'paid',
                'trialEndsAt' => $trialEndsAt?->toIso8601String(),
                'hasPaidAccess' => true,
            ];
        }

        if ($trialIsActive) {
            return [
                'ownerAdminId' => $owner->id,
                'state' => 'trial',
                'trialEndsAt' => $trialEndsAt?->toIso8601String(),
                'hasPaidAccess' => false,
            ];
        }

        return [
            'ownerAdminId' => $owner->id,
            'state' => 'expired',
            'trialEndsAt' => $trialEndsAt?->toIso8601String(),
            'hasPaidAccess' => false,
        ];
    }

    /**
     * @return array{
     *     ownerAdminId:int|null,
     *     state:'trial'|'paid'|'expired',
     *     trialEndsAt:string|null,
     *     hasPaidAccess:bool,
     *     canManageBilling:bool,
     *     canAccessLegalPdfs:bool
     * }|null
     */
    public function sharePayloadFor(?User $user): ?array
    {
        $access = $this->accessFor($user);

        if (! $access || ! $user) {
            return null;
        }

        return [
            ...$access,
            'canManageBilling' => $user->isAdmin(),
            'canAccessLegalPdfs' => true,
        ];
    }

    public function isExpired(?User $user): bool
    {
        return ($this->accessFor($user)['state'] ?? null) === 'expired';
    }

    public function ownerAdminFor(User $user): ?User
    {
        if ($user->isAdmin()) {
            return $user;
        }

        if (! $user->company_id) {
            return null;
        }

        $ownerAdminId = $user->company()
            ->whereKey($user->company_id)
            ->value('user_id');

        return $ownerAdminId
            ? User::query()->find($ownerAdminId)
            : null;
    }

    public function currentSubscriptionForOwner(User $owner): ?Subscription
    {
        /** @var Subscription|null $subscription */
        $subscription = $owner->subscriptions()
            ->where('type', $this->subscriptionType())
            ->where('stripe_status', '!=', StripeSubscription::STATUS_INCOMPLETE_EXPIRED)
            ->where(function ($query): void {
                $query->whereNull('ends_at')
                    ->orWhere('ends_at', '>', now());
            })
            ->latest('id')
            ->first();

        return $subscription;
    }

    protected function subscriptionType(): string
    {
        return (string) config('billing.subscription_type', 'default');
    }
}
