<?php

use App\Contracts\BillingGateway;
use App\Models\Company;
use App\Models\Subscription;
use App\Models\User;
use App\Models\WorkCenter;
use Carbon\CarbonImmutable;
use Inertia\Testing\AssertableInertia as Assert;

function makeFakeBillingGateway(): BillingGateway
{
    return new class implements BillingGateway
    {
        public ?array $checkoutPayload = null;

        public ?array $portalPayload = null;

        public function createCheckoutUrl(
            User $user,
            string $subscriptionType,
            string $priceId,
            string $successUrl,
            string $cancelUrl,
        ): string {
            $this->checkoutPayload = compact(
                'user',
                'subscriptionType',
                'priceId',
                'successUrl',
                'cancelUrl',
            );

            return 'https://checkout.stripe.test/session';
        }

        public function createPortalUrl(
            User $user,
            string $returnUrl,
            array $options = [],
        ): string {
            $this->portalPayload = compact('user', 'returnUrl', 'options');

            return 'https://billing.stripe.test/session';
        }
    };
}

function seedBillingConfig(): void
{
    config([
        'billing.subscription_type' => 'default',
        'billing.portals.main_configuration' => 'bpc_main_test',
        'billing.portals.change_configuration' => 'bpc_change_test',
        'billing.plans.inicio.prices.monthly.stripe_price' => 'price_inicio_monthly',
        'billing.plans.inicio.prices.yearly.stripe_price' => 'price_inicio_yearly',
        'billing.plans.equipo.prices.monthly.stripe_price' => 'price_equipo_monthly',
        'billing.plans.equipo.prices.yearly.stripe_price' => 'price_equipo_yearly',
        'billing.plans.empresa.prices.monthly.stripe_price' => 'price_empresa_monthly',
        'billing.plans.empresa.prices.yearly.stripe_price' => 'price_empresa_yearly',
    ]);
}

function createBillingAdmin(): array
{
    $admin = User::factory()->create([
        'role' => User::ROLE_ADMIN,
        'stripe_id' => 'cus_admin_'.fake()->unique()->numerify('####'),
    ]);

    $company = Company::create([
        'user_id' => $admin->id,
        'nombre' => 'Empresa Billing',
        'cif' => 'B'.fake()->unique()->numerify('#######'),
        'pais' => 'ES',
        'ciudad' => 'Madrid',
        'direccion' => 'Calle Billing 1',
        'cp' => '28001',
    ]);

    $workCenter = WorkCenter::create([
        'company_id' => $company->id,
        'nombre' => 'Centro Billing',
        'pais' => 'ES',
        'provincia' => 'Madrid',
        'poblacion' => 'Madrid',
        'direccion' => 'Calle Billing 1',
        'cp' => '28001',
        'timezone' => 'Europe/Madrid',
    ]);

    return [$admin, $company, $workCenter];
}

function attachStaff(Company $company, WorkCenter $workCenter, string $role): User
{
    return User::factory()->create([
        'role' => $role,
        'company_id' => $company->id,
        'work_center_id' => $workCenter->id,
    ]);
}

function createLocalSubscription(
    User $admin,
    string $priceId,
    array $overrides = [],
): Subscription {
    /** @var Subscription $subscription */
    $subscription = Subscription::query()->create(array_merge([
        'user_id' => $admin->id,
        'type' => 'default',
        'stripe_id' => 'sub_'.fake()->unique()->numerify('#####'),
        'stripe_status' => 'active',
        'stripe_price' => $priceId,
        'quantity' => 1,
        'trial_ends_at' => null,
        'current_period_end' => now()->addMonth(),
        'ends_at' => null,
    ], $overrides));

    $subscription->items()->create([
        'stripe_id' => 'si_'.fake()->unique()->numerify('#####'),
        'stripe_product' => 'prod_'.fake()->unique()->numerify('#####'),
        'stripe_price' => $priceId,
        'quantity' => 1,
        'meter_id' => null,
        'meter_event_name' => null,
    ]);

    return $subscription->fresh();
}

beforeEach(function () {
    seedBillingConfig();
});

test('pricing settings page can be rendered for admins with subscription data', function () {
    [$admin, $company, $workCenter] = createBillingAdmin();

    attachStaff($company, $workCenter, User::ROLE_EMPLEADO);
    attachStaff($company, $workCenter, User::ROLE_ENCARGADO);

    createLocalSubscription($admin, 'price_equipo_monthly', [
        'current_period_end' => now()->addDays(30),
    ]);

    $this->actingAs($admin)
        ->get(route('pricing.show'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/pricing')
            ->where('usage.activeEmployees', 2)
            ->where('usage.currentPlanLimit', 25)
            ->where('currentSubscription.planSlug', 'equipo')
            ->where('currentSubscription.interval', 'monthly')
            ->where('currentSubscription.status', 'active')
            ->where('currentSubscription.hasPaymentIssue', false)
            ->where('currentSubscription.isCustomPlan', false)
            ->has('plans', 3),
        );
});

test('pricing settings page is forbidden for non admins', function (string $role) {
    $user = User::factory()->create([
        'role' => $role,
    ]);

    $this->actingAs($user)
        ->get(route('pricing.show'))
        ->assertForbidden();
})->with([
    User::ROLE_EMPLEADO,
    User::ROLE_ENCARGADO,
]);

test('checkout action starts stripe checkout through billing gateway', function () {
    $gateway = makeFakeBillingGateway();
    app()->instance(BillingGateway::class, $gateway);

    [$admin] = createBillingAdmin();

    $response = $this->actingAs($admin)
        ->withHeader('X-Inertia', 'true')
        ->post(route('pricing.checkout'), [
            'plan' => 'inicio',
            'interval' => 'monthly',
        ]);

    $response->assertStatus(409);
    $response->assertHeader('X-Inertia-Location', 'https://checkout.stripe.test/session');

    expect($gateway->checkoutPayload)->not->toBeNull()
        ->and($gateway->checkoutPayload['subscriptionType'])->toBe('default')
        ->and($gateway->checkoutPayload['priceId'])->toBe('price_inicio_monthly');
});

test('checkout action rejects plans below current employee usage', function () {
    [$admin, $company, $workCenter] = createBillingAdmin();

    foreach (range(1, 11) as $index) {
        attachStaff(
            $company,
            $workCenter,
            $index === 11 ? User::ROLE_ENCARGADO : User::ROLE_EMPLEADO,
        );
    }

    $this->actingAs($admin)
        ->post(route('pricing.checkout'), [
            'plan' => 'inicio',
            'interval' => 'monthly',
        ])
        ->assertSessionHasErrors('billing');
});

test('change action rejects selecting the current price', function () {
    [$admin] = createBillingAdmin();

    createLocalSubscription($admin, 'price_inicio_monthly');

    $this->actingAs($admin)
        ->post(route('pricing.change'), [
            'plan' => 'inicio',
            'interval' => 'monthly',
        ])
        ->assertSessionHasErrors('billing');
});

test('change action builds a billing portal deep link for plan updates', function () {
    $gateway = makeFakeBillingGateway();
    app()->instance(BillingGateway::class, $gateway);

    [$admin] = createBillingAdmin();
    $subscription = createLocalSubscription($admin, 'price_inicio_monthly');
    $subscriptionItem = $subscription->items->firstOrFail();

    $response = $this->actingAs($admin)
        ->withHeader('X-Inertia', 'true')
        ->post(route('pricing.change'), [
            'plan' => 'equipo',
            'interval' => 'yearly',
        ]);

    $response->assertStatus(409);
    $response->assertHeader('X-Inertia-Location', 'https://billing.stripe.test/session');

    expect($gateway->portalPayload)->not->toBeNull()
        ->and($gateway->portalPayload['options']['configuration'])->toBe('bpc_change_test')
        ->and($gateway->portalPayload['options']['flow_data']['type'])->toBe('subscription_update_confirm')
        ->and($gateway->portalPayload['options']['flow_data']['subscription_update_confirm']['subscription'])->toBe($subscription->stripe_id)
        ->and($gateway->portalPayload['options']['flow_data']['subscription_update_confirm']['items'][0]['id'])->toBe($subscriptionItem->stripe_id)
        ->and($gateway->portalPayload['options']['flow_data']['subscription_update_confirm']['items'][0]['price'])->toBe('price_equipo_yearly');
});

test('cancel action builds a billing portal deep link for subscription cancellation', function () {
    $gateway = makeFakeBillingGateway();
    app()->instance(BillingGateway::class, $gateway);

    [$admin] = createBillingAdmin();
    $subscription = createLocalSubscription($admin, 'price_inicio_monthly');

    $response = $this->actingAs($admin)
        ->withHeader('X-Inertia', 'true')
        ->post(route('pricing.cancel'));

    $response->assertStatus(409);
    $response->assertHeader('X-Inertia-Location', 'https://billing.stripe.test/session');

    expect($gateway->portalPayload)->not->toBeNull()
        ->and($gateway->portalPayload['options']['configuration'])->toBe('bpc_main_test')
        ->and($gateway->portalPayload['options']['flow_data']['type'])->toBe('subscription_cancel')
        ->and($gateway->portalPayload['options']['flow_data']['subscription_cancel']['subscription'])->toBe($subscription->stripe_id);
});

test('cancel action rejects when there is no current subscription', function () {
    [$admin] = createBillingAdmin();

    $this->actingAs($admin)
        ->post(route('pricing.cancel'))
        ->assertSessionHasErrors('billing');
});

test('cancel action rejects when cancellation is already scheduled', function () {
    [$admin] = createBillingAdmin();

    createLocalSubscription($admin, 'price_inicio_monthly', [
        'ends_at' => now()->addDays(15),
    ]);

    $this->actingAs($admin)
        ->post(route('pricing.cancel'))
        ->assertSessionHasErrors('billing');
});

test('stripe webhook keeps current period end synchronized locally', function () {
    config(['cashier.webhook.secret' => null]);

    $admin = User::factory()->create([
        'role' => User::ROLE_ADMIN,
        'stripe_id' => 'cus_sync_123',
    ]);

    $subscription = createLocalSubscription($admin, 'price_inicio_monthly', [
        'stripe_id' => 'sub_sync_123',
        'current_period_end' => null,
    ]);

    $subscriptionItem = $subscription->items->firstOrFail();
    $newPeriodEnd = now()->addDays(45)->timestamp;

    $this->postJson(route('cashier.webhook'), [
        'type' => 'customer.subscription.updated',
        'data' => [
            'object' => [
                'id' => 'sub_sync_123',
                'customer' => 'cus_sync_123',
                'status' => 'active',
                'cancel_at_period_end' => false,
                'current_period_end' => $newPeriodEnd,
                'items' => [
                    'data' => [[
                        'id' => $subscriptionItem->stripe_id,
                        'price' => [
                            'id' => 'price_inicio_monthly',
                            'product' => 'prod_sync_123',
                        ],
                        'quantity' => 1,
                    ]],
                ],
                'metadata' => [
                    'type' => 'default',
                ],
            ],
        ],
    ])->assertOk();

    $this->assertDatabaseHas('subscriptions', [
        'id' => $subscription->id,
        'current_period_end' => CarbonImmutable::createFromTimestampUTC($newPeriodEnd)->toDateTimeString(),
    ]);
});
