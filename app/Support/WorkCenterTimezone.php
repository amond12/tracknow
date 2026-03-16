<?php

namespace App\Support;

use App\Models\WorkCenter;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use DateTimeZone;

class WorkCenterTimezone
{
    public const DEFAULT_TIMEZONE = 'Europe/Madrid';

    public static function default(): string
    {
        return self::DEFAULT_TIMEZONE;
    }

    public static function isValid(string $timezone): bool
    {
        return in_array($timezone, DateTimeZone::listIdentifiers(), true);
    }

    public static function resolve(WorkCenter|string|null $workCenter = null): string
    {
        if ($workCenter instanceof WorkCenter) {
            return self::resolve($workCenter->timezone);
        }

        if (is_string($workCenter) && self::isValid($workCenter)) {
            return $workCenter;
        }

        return self::default();
    }

    public static function nowUtc(): Carbon
    {
        return Carbon::now('UTC');
    }

    public static function currentDateFor(WorkCenter|string|null $workCenter = null): string
    {
        return Carbon::now(self::resolve($workCenter))->toDateString();
    }

    public static function localToUtc(
        CarbonInterface|string|null $value,
        WorkCenter|string|null $workCenter = null,
    ): ?Carbon {
        if ($value === null || $value === '') {
            return null;
        }

        $timezone = self::resolve($workCenter);

        if ($value instanceof CarbonInterface) {
            return Carbon::instance($value)->setTimezone('UTC');
        }

        return Carbon::parse($value, $timezone)->setTimezone('UTC');
    }

    public static function utcToLocal(
        CarbonInterface|string|null $value,
        WorkCenter|string|null $workCenter = null,
    ): ?Carbon {
        if ($value === null || $value === '') {
            return null;
        }

        $timezone = self::resolve($workCenter);

        if ($value instanceof CarbonInterface) {
            return Carbon::instance($value)->setTimezone($timezone);
        }

        return Carbon::parse($value, 'UTC')->setTimezone($timezone);
    }
}
