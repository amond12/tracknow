const INTERNAL_IP_ENDPOINT = '/fichar/contexto-red';
const EXTERNAL_IP_ENDPOINTS = [
    'https://api64.ipify.org?format=json',
    'https://api.ipify.org?format=json',
] as const;
const REQUEST_TIMEOUT_MS = 4000;

type IpPayload = {
    ip?: string | null;
};

function isValidIp(value: unknown): value is string {
    return (
        typeof value === 'string' &&
        value.length > 0 &&
        value.length <= 45 &&
        /^[0-9a-fA-F:.]+$/.test(value)
    );
}

function isReservedIpv4(ip: string): boolean {
    const octets = ip.split('.').map((segment) => Number(segment));

    if (
        octets.length !== 4 ||
        octets.some(
            (octet) => Number.isNaN(octet) || octet < 0 || octet > 255,
        )
    ) {
        return false;
    }

    const [first, second] = octets;

    return (
        first === 0 ||
        first === 10 ||
        first === 127 ||
        (first === 100 && second >= 64 && second <= 127) ||
        (first === 169 && second === 254) ||
        (first === 172 && second >= 16 && second <= 31) ||
        (first === 192 && second === 168)
    );
}

function isReservedIpv6(ip: string): boolean {
    const normalized = ip.toLowerCase();

    return (
        normalized === '::' ||
        normalized === '::1' ||
        normalized.startsWith('fc') ||
        normalized.startsWith('fd') ||
        normalized.startsWith('fe8') ||
        normalized.startsWith('fe9') ||
        normalized.startsWith('fea') ||
        normalized.startsWith('feb')
    );
}

function isRoutableIp(value: string): boolean {
    if (value.includes('.')) {
        return !isReservedIpv4(value);
    }

    if (value.includes(':')) {
        return !isReservedIpv6(value);
    }

    return false;
}

async function fetchWithTimeout(
    input: RequestInfo | URL,
    init: RequestInit = {},
    timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(input, {
            ...init,
            signal: controller.signal,
            cache: 'no-store',
        });
    } finally {
        window.clearTimeout(timeoutId);
    }
}

async function extractIpFromResponse(response: Response): Promise<string> {
    if (!response.ok) {
        throw new Error('No se pudo resolver la IP.');
    }

    const payload = (await response.json()) as IpPayload;
    if (!isValidIp(payload.ip)) {
        throw new Error('La respuesta no contiene una IP valida.');
    }

    return payload.ip;
}

async function tryResolveInternalIp(): Promise<string | null> {
    try {
        const response = await fetchWithTimeout(
            INTERNAL_IP_ENDPOINT,
            {
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                },
            },
            3000,
        );

        return await extractIpFromResponse(response);
    } catch {
        return null;
    }
}

async function tryResolveExternalIp(url: string): Promise<string | null> {
    try {
        const response = await fetchWithTimeout(url, {
            headers: {
                Accept: 'application/json',
            },
        });

        return await extractIpFromResponse(response);
    } catch {
        return null;
    }
}

export async function resolveClientPublicIp(): Promise<string> {
    const internalIp = await tryResolveInternalIp();
    if (internalIp && isRoutableIp(internalIp)) {
        return internalIp;
    }

    for (const endpoint of EXTERNAL_IP_ENDPOINTS) {
        const externalIp = await tryResolveExternalIp(endpoint);
        if (externalIp && isRoutableIp(externalIp)) {
            return externalIp;
        }
    }

    return '';
}
