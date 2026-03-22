<?php

namespace App\Providers;

use Carbon\CarbonImmutable;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureRateLimiting();

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
}
