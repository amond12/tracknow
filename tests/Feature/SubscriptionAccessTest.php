<?php

use App\Models\Company;
use App\Models\Subscription;
use App\Models\User;
use App\Models\WorkCenter;
use Inertia\Testing\AssertableInertia as Assert;

function createSubscriptionAccessAdmin(): array
{
    $admin = User::factory()->create([
        'role' => User::ROLE_ADMIN,
    ]);

    $company = Company::create([
        'user_id' => $admin->id,
        'nombre' => 'Empresa Acceso',
        'cif' => 'B'.fake()->unique()->numerify('#######'),
        'pais' => 'ES',
        'ciudad' => 'Madrid',
        'direccion' => 'Calle Acceso 1',
        'cp' => '28001',
    ]);

    $workCenter = WorkCenter::create([
        'company_id' => $company->id,
        'nombre' => 'Centro Acceso',
        'pais' => 'ES',
        'provincia' => 'Madrid',
        'poblacion' => 'Madrid',
        'direccion' => 'Calle Acceso 1',
        'cp' => '28001',
        'timezone' => 'Europe/Madrid',
    ]);

    return [$admin, $company, $workCenter];
}

function createSubscriptionAccessEmployee(
    Company $company,
    WorkCenter $workCenter,
    string $role = User::ROLE_EMPLEADO,
): User {
    return User::factory()->create([
        'role' => $role,
        'company_id' => $company->id,
        'work_center_id' => $workCenter->id,
    ]);
}

function createAccessSubscription(User $admin, string $priceId = 'price_inicio_monthly'): Subscription
{
    $subscription = Subscription::query()->create([
        'user_id' => $admin->id,
        'type' => config('billing.subscription_type', 'default'),
        'stripe_id' => 'sub_'.fake()->unique()->numerify('#####'),
        'stripe_status' => 'active',
        'stripe_price' => $priceId,
        'quantity' => 1,
        'trial_ends_at' => null,
        'current_period_end' => now()->addMonth(),
        'ends_at' => null,
    ]);

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

test('expired admin is redirected away from blocked app routes', function () {
    [$admin] = createSubscriptionAccessAdmin();

    $admin->forceFill([
        'trial_ends_at' => now()->subDay(),
    ])->save();

    $this->actingAs($admin)
        ->get(route('fichar'))
        ->assertRedirect(route('subscription.required'));
});

test('active trial keeps the app accessible', function () {
    [$admin, $company, $workCenter] = createSubscriptionAccessAdmin();
    $employee = createSubscriptionAccessEmployee($company, $workCenter);

    $admin->forceFill([
        'trial_ends_at' => now()->addDays(10),
    ])->save();

    $this->actingAs($employee)
        ->get(route('fichar'))
        ->assertOk();
});

test('expired employee is redirected away from blocked app routes', function () {
    [$admin, $company, $workCenter] = createSubscriptionAccessAdmin();
    $employee = createSubscriptionAccessEmployee($company, $workCenter);

    $admin->forceFill([
        'trial_ends_at' => now()->subDay(),
    ])->save();

    $this->actingAs($employee)
        ->get(route('fichar'))
        ->assertRedirect(route('subscription.required'));
});

test('expired admin keeps access to pricing and legal routes', function () {
    [$admin] = createSubscriptionAccessAdmin();

    $admin->forceFill([
        'trial_ends_at' => now()->subDay(),
    ])->save();

    $this->actingAs($admin)
        ->get(route('pricing.show'))
        ->assertOk();

    $this->actingAs($admin)
        ->get(route('profile.edit'))
        ->assertOk();

    $this->actingAs($admin)
        ->get(route('pdfs.index'))
        ->assertOk();

    $this->actingAs($admin)
        ->get(route('calendario.index'))
        ->assertOk();
});

test('expired employee keeps access to legal routes but not pricing', function () {
    [$admin, $company, $workCenter] = createSubscriptionAccessAdmin();
    $employee = createSubscriptionAccessEmployee($company, $workCenter);

    $admin->forceFill([
        'trial_ends_at' => now()->subDay(),
    ])->save();

    $this->actingAs($employee)
        ->get(route('pdfs.index'))
        ->assertOk();

    $this->actingAs($employee)
        ->get(route('calendario.index'))
        ->assertOk();

    $this->actingAs($employee)
        ->get(route('pricing.show'))
        ->assertForbidden();

    $this->actingAs($employee)
        ->get(route('profile.edit'))
        ->assertRedirect(route('subscription.required'));
});

test('expired admin is redirected away from blocked mutating routes', function () {
    [$admin] = createSubscriptionAccessAdmin();

    $admin->forceFill([
        'trial_ends_at' => now()->subDay(),
    ])->save();

    $this->actingAs($admin)
        ->post(route('calendario.store'), [])
        ->assertRedirect(route('subscription.required'));
});

test('active paid subscription restores access after the trial expires', function () {
    [$admin, $company, $workCenter] = createSubscriptionAccessAdmin();
    $employee = createSubscriptionAccessEmployee($company, $workCenter);

    $admin->forceFill([
        'trial_ends_at' => now()->subDay(),
    ])->save();

    createAccessSubscription($admin);

    $this->actingAs($employee)
        ->get(route('fichar'))
        ->assertOk();
});

test('subscription required page renders the expired access state', function () {
    [$admin] = createSubscriptionAccessAdmin();

    $admin->forceFill([
        'trial_ends_at' => now()->subDay(),
    ])->save();

    $this->actingAs($admin)
        ->get(route('subscription.required'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('subscription-required')
            ->where('auth.access.state', 'expired')
            ->where('auth.access.canManageBilling', true)
            ->where('auth.access.canAccessLegalPdfs', true),
        );
});
