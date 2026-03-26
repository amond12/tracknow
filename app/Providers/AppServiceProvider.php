<?php

namespace App\Providers;

use App\Contracts\BillingGateway;
use App\Models\Subscription;
use App\Models\User;
use App\Services\Billing\BillingCatalog;
use App\Services\Billing\PricingService;
use App\Services\Billing\StripeBillingGateway;
use App\Services\Billing\SyncSubscriptionStateFromStripeWebhook;
use App\Services\ClockCodeService;
use App\Services\SubscriptionAccessService;
use Carbon\CarbonImmutable;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Laravel\Cashier\Cashier;
use Laravel\Cashier\Events\WebhookHandled;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(BillingCatalog::class);
        $this->app->singleton(BillingGateway::class, StripeBillingGateway::class);
        $this->app->singleton(PricingService::class);
        $this->app->singleton(SubscriptionAccessService::class);
        $this->app->singleton(SyncSubscriptionStateFromStripeWebhook::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureRateLimiting();
        $this->configureBilling();

        if (config('app.env') === 'production') {
            URL::forceScheme('https');
        }
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }

    /**
     * Configure custom application rate limiters.
     */
    protected function configureRateLimiting(): void
    {
        RateLimiter::for('public-clock-lookup', function (Request $request): array {
            $identifier = app(ClockCodeService::class)->normalizeIdentifier(
                (string) ($request->input('identificador') ?? $request->query('identificador', '')),
            );
            $ipPart = $request->ip() ?? 'no-ip';
            $key = "{$ipPart}|lookup|".($identifier !== '' ? $identifier : 'empty');

            return [
                Limit::perSecond(6)->by("burst:{$key}"),
                Limit::perMinute(180)->by("minute:{$key}"),
            ];
        });

        RateLimiter::for('public-clock-actions', function (Request $request): array {
            $identifier = app(ClockCodeService::class)->normalizeIdentifier(
                (string) $request->input('identificador', ''),
            );
            $ipPart = $request->ip() ?? 'no-ip';
            $routePart = $request->route()?->getName() ?? $request->path();
            $key = "{$ipPart}|{$routePart}|".($identifier !== '' ? $identifier : 'empty');

            return [
                Limit::perSecond(4)->by("burst:{$key}"),
                Limit::perMinute(90)->by("minute:{$key}"),
            ];
        });

        RateLimiter::for('config-filters', function (Request $request): array {
            $userPart = $request->user()?->id ? 'user:'.$request->user()->id : 'guest';
            $ipPart = $request->ip() ?? 'no-ip';
            $routePart = $request->route()?->getName() ?? $request->path();
            $key = "{$userPart}|{$ipPart}|{$routePart}";

            return [
                // Burst limit (e.g. bots toggling filters aggressively).
                Limit::perSecond(20, 10)->by("burst:{$key}"),
                // Sustained rate limit.
                Limit::perMinute(120)->by("minute:{$key}"),
            ];
        });
    }

    protected function configureBilling(): void
    {
        Cashier::useCustomerModel(User::class);
        Cashier::useSubscriptionModel(Subscription::class);

        Event::listen(WebhookHandled::class, function (WebhookHandled $event): void {
            $this->app->make(SyncSubscriptionStateFromStripeWebhook::class)->handle(
                $event->payload,
            );
        });
    }
}
