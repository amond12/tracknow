const MAPBOX_BASE_URL = 'https://api.mapbox.com/search/geocode/v6';
const MAPBOX_LANGUAGE = 'es';
const MAPBOX_COUNTRY = 'es';
const MAPBOX_SPAIN_BBOX = '-9.392883,35.94685,4.591888,43.748337';
const MAPBOX_STYLE_URL =
    'https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/512/{z}/{x}/{y}?access_token=';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN?.trim() ?? '';

type MapboxContextEntity = {
    name?: string;
};

type MapboxFeature = {
    id?: string;
    geometry?: {
        coordinates?: [number, number];
    };
    properties?: {
        mapbox_id?: string;
        feature_type?: string;
        full_address?: string;
        name?: string;
        name_preferred?: string;
        place_formatted?: string;
        coordinates?: {
            longitude?: number;
            latitude?: number;
            accuracy?: string;
        };
        context?: {
            address?: MapboxContextEntity;
            country?: MapboxContextEntity;
            locality?: MapboxContextEntity;
            place?: MapboxContextEntity;
            postcode?: MapboxContextEntity;
            region?: MapboxContextEntity;
        };
        match_code?: {
            confidence?: string;
        };
    };
};

type MapboxFeatureCollection = {
    features?: MapboxFeature[];
};

export type WorkCenterAddressInput = {
    pais: string;
    provincia: string;
    poblacion: string;
    direccion: string;
    cp: string;
};

export type MapboxAddressResult = WorkCenterAddressInput & {
    featureId: string;
    label: string;
    lat: number;
    lng: number;
    accuracy: string | null;
    confidence: string | null;
};

export type MapboxAddressSuggestion = {
    id: string;
    title: string;
    subtitle: string;
    result: MapboxAddressResult;
};

function normalizeWhitespace(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
}

function getStreetLabel(feature: MapboxFeature): string {
    const properties = feature.properties;
    const context = properties?.context;

    return normalizeWhitespace(
        context?.address?.name ??
            properties?.name_preferred ??
            properties?.name ??
            properties?.full_address ??
            '',
    );
}

function getCityLabel(feature: MapboxFeature): string {
    const context = feature.properties?.context;
    return normalizeWhitespace(
        context?.place?.name ?? context?.locality?.name ?? '',
    );
}

function getRegionLabel(feature: MapboxFeature): string {
    return normalizeWhitespace(feature.properties?.context?.region?.name ?? '');
}

function getCountryLabel(feature: MapboxFeature): string {
    return normalizeWhitespace(
        feature.properties?.context?.country?.name ?? 'Espana',
    );
}

function getPostcodeLabel(feature: MapboxFeature): string {
    return normalizeWhitespace(
        feature.properties?.context?.postcode?.name ?? '',
    );
}

function getPrimaryCoordinates(
    feature: MapboxFeature,
): { lat: number; lng: number } | null {
    const directCoordinates = feature.properties?.coordinates;

    if (
        typeof directCoordinates?.latitude === 'number' &&
        typeof directCoordinates?.longitude === 'number'
    ) {
        return {
            lat: directCoordinates.latitude,
            lng: directCoordinates.longitude,
        };
    }

    const geometryCoordinates = feature.geometry?.coordinates;

    if (
        Array.isArray(geometryCoordinates) &&
        typeof geometryCoordinates[0] === 'number' &&
        typeof geometryCoordinates[1] === 'number'
    ) {
        return {
            lat: geometryCoordinates[1],
            lng: geometryCoordinates[0],
        };
    }

    return null;
}

function normalizeFeature(feature: MapboxFeature): MapboxAddressResult | null {
    const coordinates = getPrimaryCoordinates(feature);

    if (!coordinates) {
        return null;
    }

    const direccion = getStreetLabel(feature);
    const poblacion = getCityLabel(feature);
    const provincia = getRegionLabel(feature);
    const pais = getCountryLabel(feature);
    const cp = getPostcodeLabel(feature);
    const properties = feature.properties;

    return {
        featureId:
            properties?.mapbox_id ??
            feature.id ??
            `${coordinates.lat},${coordinates.lng}`,
        label: normalizeWhitespace(
            properties?.full_address ??
                [direccion, cp, poblacion, provincia, pais]
                    .filter(Boolean)
                    .join(', '),
        ),
        direccion,
        poblacion,
        provincia,
        pais,
        cp,
        lat: coordinates.lat,
        lng: coordinates.lng,
        accuracy: properties?.coordinates?.accuracy ?? null,
        confidence: properties?.match_code?.confidence ?? null,
    };
}

function buildFullAddress(input: WorkCenterAddressInput): string {
    return [
        normalizeWhitespace(input.direccion),
        normalizeWhitespace(input.cp),
        normalizeWhitespace(input.poblacion),
        normalizeWhitespace(input.provincia),
        normalizeWhitespace(input.pais || 'Espana'),
    ]
        .filter(Boolean)
        .join(', ');
}

async function requestFeatures(
    params: URLSearchParams,
    signal?: AbortSignal,
): Promise<MapboxFeature[]> {
    if (!MAPBOX_TOKEN) {
        return [];
    }

    params.set('access_token', MAPBOX_TOKEN);
    params.set('language', MAPBOX_LANGUAGE);
    params.set('country', MAPBOX_COUNTRY);
    params.set('bbox', MAPBOX_SPAIN_BBOX);

    const response = await fetch(
        `${MAPBOX_BASE_URL}/forward?${params.toString()}`,
        { signal },
    );

    if (!response.ok) {
        throw new Error(`Mapbox request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as MapboxFeatureCollection;
    return payload.features ?? [];
}

export function hasMapboxToken(): boolean {
    return MAPBOX_TOKEN.length > 0;
}

export function getMapboxRasterTilesUrl(): string {
    return `${MAPBOX_STYLE_URL}${MAPBOX_TOKEN}`;
}

export async function searchAddressSuggestions(
    query: string,
    signal?: AbortSignal,
): Promise<MapboxAddressSuggestion[]> {
    const normalizedQuery = normalizeWhitespace(query);

    if (!normalizedQuery || normalizedQuery.length < 3) {
        return [];
    }

    const params = new URLSearchParams({
        q: normalizedQuery,
        autocomplete: 'true',
        limit: '5',
        types: 'address,street',
    });

    const features = await requestFeatures(params, signal);

    return features
        .map((feature) => {
            const result = normalizeFeature(feature);

            if (!result) {
                return null;
            }

            const title = result.direccion || result.label;
            const subtitle = [result.cp, result.poblacion, result.provincia]
                .filter(Boolean)
                .join(', ');

            return {
                id: result.featureId,
                title,
                subtitle,
                result,
            } satisfies MapboxAddressSuggestion;
        })
        .filter(
            (suggestion): suggestion is MapboxAddressSuggestion =>
                suggestion !== null,
        );
}

export async function validateWorkCenterAddress(
    input: WorkCenterAddressInput,
    signal?: AbortSignal,
): Promise<MapboxAddressResult | null> {
    if (
        !normalizeWhitespace(input.direccion) &&
        !normalizeWhitespace(input.poblacion)
    ) {
        return null;
    }

    const structuredParams = new URLSearchParams({
        autocomplete: 'false',
        limit: '1',
        types: 'address,street',
    });

    if (normalizeWhitespace(input.direccion)) {
        structuredParams.set(
            'address_line1',
            normalizeWhitespace(input.direccion),
        );
    }

    if (normalizeWhitespace(input.poblacion)) {
        structuredParams.set('place', normalizeWhitespace(input.poblacion));
    }

    if (normalizeWhitespace(input.provincia)) {
        structuredParams.set('region', normalizeWhitespace(input.provincia));
    }

    if (normalizeWhitespace(input.cp)) {
        structuredParams.set('postcode', normalizeWhitespace(input.cp));
    }

    let features = await requestFeatures(structuredParams, signal);

    if (features.length === 0) {
        const fallbackQuery = buildFullAddress(input);

        if (!fallbackQuery) {
            return null;
        }

        const fallbackParams = new URLSearchParams({
            q: fallbackQuery,
            autocomplete: 'false',
            limit: '1',
            types: 'address,street,postcode,place,locality',
        });

        features = await requestFeatures(fallbackParams, signal);
    }

    if (features.length === 0) {
        return null;
    }

    return normalizeFeature(features[0]);
}
