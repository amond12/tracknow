export const DEFAULT_WORK_CENTER_TIMEZONE = 'Europe/Madrid';

export const WORK_CENTER_TIMEZONE_OPTIONS = [
    { value: 'Europe/Madrid', label: 'Madrid (Europa/Madrid)' },
    { value: 'Atlantic/Canary', label: 'Canarias (Atlantic/Canary)' },
    { value: 'Europe/London', label: 'Londres (Europa/London)' },
    { value: 'Europe/Paris', label: 'Paris (Europa/Paris)' },
    { value: 'Europe/Berlin', label: 'Berlin (Europa/Berlin)' },
    { value: 'Europe/Rome', label: 'Roma (Europa/Rome)' },
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Nueva York (America/New_York)' },
    { value: 'America/Chicago', label: 'Chicago (America/Chicago)' },
    { value: 'America/Denver', label: 'Denver (America/Denver)' },
    {
        value: 'America/Los_Angeles',
        label: 'Los Angeles (America/Los_Angeles)',
    },
    {
        value: 'America/Mexico_City',
        label: 'Ciudad de Mexico (America/Mexico_City)',
    },
    { value: 'America/Bogota', label: 'Bogota (America/Bogota)' },
    {
        value: 'America/Argentina/Buenos_Aires',
        label: 'Buenos Aires (America/Argentina/Buenos_Aires)',
    },
    { value: 'America/Sao_Paulo', label: 'Sao Paulo (America/Sao_Paulo)' },
    { value: 'Asia/Dubai', label: 'Dubai (Asia/Dubai)' },
    { value: 'Asia/Kolkata', label: 'India (Asia/Kolkata)' },
    { value: 'Asia/Singapore', label: 'Singapur (Asia/Singapore)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (Asia/Tokyo)' },
    { value: 'Australia/Sydney', label: 'Sydney (Australia/Sydney)' },
] as const;

function resolveTimeZone(timeZone?: string | null): string {
    return timeZone || DEFAULT_WORK_CENTER_TIMEZONE;
}

function formatParts(
    value: string | Date,
    timeZone?: string | null,
    options?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatPart[] {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: resolveTimeZone(timeZone),
        hour12: false,
        ...options,
    }).formatToParts(new Date(value));
}

function getPart(
    parts: Intl.DateTimeFormatPart[],
    type: Intl.DateTimeFormatPartTypes,
): string {
    return parts.find((part) => part.type === type)?.value ?? '';
}

export function formatDateInTimeZone(
    value: string | Date,
    timeZone?: string | null,
): string {
    return new Intl.DateTimeFormat('es-ES', {
        timeZone: resolveTimeZone(timeZone),
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(value));
}

export function formatDateValue(value: string): string {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!match) {
        return formatDateInTimeZone(value);
    }

    return `${match[3]}/${match[2]}/${match[1]}`;
}

export function formatTimeInTimeZone(
    value: string | Date,
    timeZone?: string | null,
): string {
    return new Intl.DateTimeFormat('es-ES', {
        timeZone: resolveTimeZone(timeZone),
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(new Date(value));
}

export function formatDateTimeInTimeZone(
    value: string | Date,
    timeZone?: string | null,
): string {
    return new Intl.DateTimeFormat('es-ES', {
        timeZone: resolveTimeZone(timeZone),
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(new Date(value));
}

export function getDateKeyInTimeZone(
    value: string | Date,
    timeZone?: string | null,
): string {
    const parts = formatParts(value, timeZone, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });

    return `${getPart(parts, 'year')}-${getPart(parts, 'month')}-${getPart(parts, 'day')}`;
}

export function getCurrentDateKeyInTimeZone(timeZone?: string | null): string {
    return getDateKeyInTimeZone(new Date(), timeZone);
}

export function getTimeInputValueInTimeZone(
    value: string | Date,
    timeZone?: string | null,
): string {
    const parts = formatParts(value, timeZone, {
        hour: '2-digit',
        minute: '2-digit',
    });

    return `${getPart(parts, 'hour')}:${getPart(parts, 'minute')}`;
}

export function getTimeZoneLabel(timeZone?: string | null): string {
    const resolvedTimeZone = resolveTimeZone(timeZone);

    return (
        WORK_CENTER_TIMEZONE_OPTIONS.find(
            (option) => option.value === resolvedTimeZone,
        )?.label ?? resolvedTimeZone
    );
}
