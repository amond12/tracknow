<?php

namespace App\Services\Billing;

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

class BillingCatalog
{
    public function plans(): Collection
    {
        return collect(config('billing.plans', []))
            ->map(function (array $plan, string $slug): array {
                return [
                    'slug' => $slug,
                    'name' => $plan['name'],
                    'employee_limit' => $plan['employee_limit'],
                    'prices' => $plan['prices'],
                ];
            })
            ->values();
    }

    public function slugs(): array
    {
        return $this->plans()->pluck('slug')->all();
    }

    public function intervals(): array
    {
        return ['monthly', 'yearly'];
    }

    public function findPlan(string $slug): ?array
    {
        return $this->plans()->firstWhere('slug', $slug);
    }

    public function findPrice(string $slug, string $interval): ?array
    {
        $plan = $this->findPlan($slug);

        if (! $plan) {
            return null;
        }

        return Arr::get($plan, "prices.{$interval}");
    }

    public function priceId(string $slug, string $interval): ?string
    {
        return $this->findPrice($slug, $interval)['stripe_price'] ?? null;
    }

    public function findByPriceId(?string $priceId): ?array
    {
        if (! $priceId) {
            return null;
        }

        foreach ($this->plans() as $plan) {
            foreach ($this->intervals() as $interval) {
                if (($plan['prices'][$interval]['stripe_price'] ?? null) === $priceId) {
                    return [
                        'slug' => $plan['slug'],
                        'name' => $plan['name'],
                        'employee_limit' => $plan['employee_limit'],
                        'interval' => $interval,
                        'amount' => $plan['prices'][$interval]['amount'],
                        'stripe_price' => $priceId,
                    ];
                }
            }
        }

        return null;
    }
}
