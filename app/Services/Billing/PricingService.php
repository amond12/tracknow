<?php

namespace App\Services\Billing;

use App\Contracts\BillingGateway;
use App\Models\Subscription;
use App\Models\User;
use App\Services\SubscriptionAccessService;
use App\Support\AdminScope;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Stripe\Subscription as StripeSubscription;

class PricingService
{
    public function __construct(
        protected BillingCatalog $catalog,
        protected BillingGateway $gateway,
        protected SubscriptionAccessService $subscriptionAccess,
    ) {}

    public function pageProps(User $admin): array
    {
        $activeEmployees = $this->activeEmployeeCount($admin);
        $currentSubscription = $this->currentSubscription($admin);
        $currentSummary = $this->currentSubscriptionSummary($currentSubscription);

        return [
            'plans' => $this->catalog->plans()->map(function (array $plan) use ($activeEmployees): array {
                return [
                    'slug' => $plan['slug'],
                    'name' => $plan['name'],
                    'employeeLimit' => $plan['employee_limit'],
                    'monthly' => [
                        'amount' => $plan['prices']['monthly']['amount'],
                    ],
                    'yearly' => [
                        'amount' => $plan['prices']['yearly']['amount'],
                    ],
                    'isAllowedForCurrentUsage' => $activeEmployees <= $plan['employee_limit'],
                ];
            })->all(),
            'currentSubscription' => $currentSummary,
            'usage' => [
                'activeEmployees' => $activeEmployees,
                'currentPlanLimit' => $currentSummary['currentPlanLimit'],
            ],
        ];
    }

    public function createCheckoutUrl(User $admin, string $plan, string $interval): string
    {
        $selectedPlan = $this->requirePlan($plan);
        $currentSubscription = $this->currentSubscription($admin);

        if ($currentSubscription) {
            throw ValidationException::withMessages([
                'billing' => 'Ya existe una suscripcion activa o pendiente. Usa actualizar o gestionar facturacion.',
            ]);
        }

        $this->guardPlanSupportsCurrentUsage($admin, $selectedPlan['employee_limit']);
        $priceId = $this->requirePriceId($plan, $interval);

        return $this->gateway->createCheckoutUrl(
            $admin,
            $this->subscriptionType(),
            $priceId,
            route('pricing.show', ['checkout' => 'success']),
            route('pricing.show', ['checkout' => 'cancelled']),
        );
    }

    public function createManagePortalUrl(User $admin): string
    {
        return $this->gateway->createPortalUrl(
            $admin,
            route('pricing.show'),
            [
                'configuration' => $this->requirePortalConfiguration('billing.portals.main_configuration'),
            ],
        );
    }

    public function createCancelPortalUrl(User $admin): string
    {
        $currentSubscription = $this->currentSubscription($admin);

        if (! $currentSubscription) {
            throw ValidationException::withMessages([
                'billing' => 'No hay una suscripcion activa para cancelar.',
            ]);
        }

        if ($currentSubscription->onGracePeriod()) {
            throw ValidationException::withMessages([
                'billing' => 'La suscripcion ya tiene una cancelacion programada.',
            ]);
        }

        return $this->gateway->createPortalUrl(
            $admin,
            route('pricing.show'),
            [
                'configuration' => $this->requirePortalConfiguration('billing.portals.main_configuration'),
                'flow_data' => [
                    'type' => 'subscription_cancel',
                    'after_completion' => [
                        'type' => 'redirect',
                        'redirect' => [
                            'return_url' => route('pricing.show'),
                        ],
                    ],
                    'subscription_cancel' => [
                        'subscription' => $currentSubscription->stripe_id,
                    ],
                ],
            ],
        );
    }

    public function createChangePlanUrl(User $admin, string $plan, string $interval): string
    {
        $selectedPlan = $this->requirePlan($plan);
        $currentSubscription = $this->currentSubscription($admin);

        if (! $currentSubscription) {
            throw ValidationException::withMessages([
                'billing' => 'No hay una suscripcion activa para actualizar. Inicia el alta con pagar.',
            ]);
        }

        if ($this->isCustomSubscription($currentSubscription)) {
            throw ValidationException::withMessages([
                'billing' => 'El plan actual es personalizado. Gestiona la facturacion desde el portal principal.',
            ]);
        }

        if ($this->hasPaymentIssue($currentSubscription)) {
            throw ValidationException::withMessages([
                'billing' => 'Resuelve primero el problema de cobro desde gestionar facturacion.',
            ]);
        }

        $this->guardPlanSupportsCurrentUsage($admin, $selectedPlan['employee_limit']);

        $targetPriceId = $this->requirePriceId($plan, $interval);
        $currentPriceId = $this->currentPriceId($currentSubscription);

        if ($targetPriceId === $currentPriceId) {
            throw ValidationException::withMessages([
                'billing' => 'Ya estas en ese plan e intervalo.',
            ]);
        }

        $subscriptionItem = $currentSubscription->items->first();

        if (! $subscriptionItem) {
            throw ValidationException::withMessages([
                'billing' => 'No se pudo identificar la suscripcion actual para actualizarla.',
            ]);
        }

        return $this->gateway->createPortalUrl(
            $admin,
            route('pricing.show'),
            [
                'configuration' => $this->requirePortalConfiguration('billing.portals.change_configuration'),
                'flow_data' => [
                    'type' => 'subscription_update_confirm',
                    'after_completion' => [
                        'type' => 'redirect',
                        'redirect' => [
                            'return_url' => route('pricing.show'),
                        ],
                    ],
                    'subscription_update_confirm' => [
                        'subscription' => $currentSubscription->stripe_id,
                        'items' => [[
                            'id' => $subscriptionItem->stripe_id,
                            'price' => $targetPriceId,
                            'quantity' => $subscriptionItem->quantity ?? 1,
                        ]],
                    ],
                ],
            ],
        );
    }

    public function activeEmployeeCount(User $admin): int
    {
        $companyIds = AdminScope::companyIdsFor($admin);

        if ($companyIds->isEmpty()) {
            return 0;
        }

        return User::query()
            ->whereIn('company_id', $companyIds)
            ->whereIn('role', User::STAFF_ROLES)
            ->count();
    }

    protected function currentSubscription(User $admin): ?Subscription
    {
        return $this->subscriptionAccess->currentSubscriptionForOwner($admin);
    }

    protected function currentSubscriptionSummary(?Subscription $subscription): array
    {
        if (! $subscription) {
            return [
                'status' => null,
                'planSlug' => null,
                'interval' => null,
                'currentPeriodEnd' => null,
                'cancelAtPeriodEnd' => false,
                'hasPaymentIssue' => false,
                'isCustomPlan' => false,
                'currentPlanLimit' => null,
            ];
        }

        $resolvedPlan = $this->catalog->findByPriceId($this->currentPriceId($subscription));
        $currentPeriodEnd = $subscription->current_period_end instanceof Carbon
            ? $subscription->current_period_end
            : ($subscription->current_period_end ? Carbon::parse($subscription->current_period_end) : null);
        $currentPeriodEnd ??= $subscription->ends_at;

        return [
            'status' => $subscription->stripe_status,
            'planSlug' => $resolvedPlan['slug'] ?? null,
            'interval' => $resolvedPlan['interval'] ?? null,
            'currentPeriodEnd' => $currentPeriodEnd?->toIso8601String(),
            'cancelAtPeriodEnd' => $subscription->onGracePeriod(),
            'hasPaymentIssue' => $this->hasPaymentIssue($subscription),
            'isCustomPlan' => $this->isCustomSubscription($subscription),
            'currentPlanLimit' => $resolvedPlan['employee_limit'] ?? null,
        ];
    }

    protected function currentPriceId(Subscription $subscription): ?string
    {
        if ($subscription->hasMultiplePrices()) {
            return null;
        }

        return $subscription->stripe_price ?: $subscription->items->first()?->stripe_price;
    }

    protected function isCustomSubscription(Subscription $subscription): bool
    {
        if ($subscription->hasMultiplePrices()) {
            return true;
        }

        return $this->catalog->findByPriceId($this->currentPriceId($subscription)) === null;
    }

    protected function hasPaymentIssue(Subscription $subscription): bool
    {
        return $subscription->hasIncompletePayment() || $subscription->stripe_status === StripeSubscription::STATUS_UNPAID;
    }

    protected function requirePlan(string $slug): array
    {
        $plan = $this->catalog->findPlan($slug);

        if (! $plan) {
            throw ValidationException::withMessages([
                'plan' => 'El plan seleccionado no existe.',
            ]);
        }

        return $plan;
    }

    protected function requirePriceId(string $plan, string $interval): string
    {
        $priceId = $this->catalog->priceId($plan, $interval);

        if (! $priceId) {
            throw new RuntimeException("Missing Stripe price configuration for {$plan}.{$interval}.");
        }

        return $priceId;
    }

    protected function requirePortalConfiguration(string $key): string
    {
        $configuration = config($key);

        if (! is_string($configuration) || $configuration === '') {
            throw new RuntimeException("Missing Stripe portal configuration: {$key}.");
        }

        return $configuration;
    }

    protected function guardPlanSupportsCurrentUsage(User $admin, int $employeeLimit): void
    {
        $activeEmployees = $this->activeEmployeeCount($admin);

        if ($activeEmployees > $employeeLimit) {
            throw ValidationException::withMessages([
                'billing' => 'Tu numero actual de empleados supera el limite de ese plan.',
            ]);
        }
    }

    protected function subscriptionType(): string
    {
        return (string) config('billing.subscription_type', 'default');
    }
}
