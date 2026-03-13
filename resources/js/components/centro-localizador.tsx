import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Circle, MapContainer, Marker, TileLayer } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Fix Leaflet default icon broken in Vite/webpack bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

// Prefijos de tipo de vía comunes en lenguas de España
const STREET_TYPE_PREFIXES = /^(calle|carrer|carrer de|carrer d'|avinguda|avinguda de|avinguda d'|avenida|avenida de|passeig|passeig de|paseo|paseo de|plaça|plaça de|plaza|plaza de|carretera|carretera de|rúa|rúa de|rua|rua de|camino|camino de|cami|camí|camí de|travessera|travessera de|travesia|gran via|via|c\/|av\.|avda\.|pza\.|pl\.)\s+/i;

function stripStreetType(street: string): string {
    return street.replace(STREET_TYPE_PREFIXES, '').trim();
}

async function geocodeStructured(
    street: string,
    city: string,
    state: string,
    postalcode: string,
    country: string,
): Promise<{ lat: number; lng: number } | null> {
    const params = new URLSearchParams({ format: 'json', limit: '1', addressdetails: '1' });
    if (street) params.set('street', street);
    if (city) params.set('city', city);
    if (state) params.set('state', state);
    if (postalcode) params.set('postalcode', postalcode);
    if (country) params.set('country', country);

    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        headers: { 'Accept-Language': 'es' },
    });
    const data = await res.json();
    if (!data || data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

interface Props {
    direccion: string;
    poblacion: string;
    provincia: string;
    cp: string;
    pais: string;
    initialLat?: number | null;
    initialLng?: number | null;
    initialRadio?: number | null;
    onCoordenadas: (lat: number, lng: number, radio: number) => void;
    onRadioChange?: (radio: number) => void;
    onLimpiar?: () => void;
}

export function CentroLocalizador({
    direccion,
    poblacion,
    provincia,
    cp,
    pais,
    initialLat = null,
    initialLng = null,
    initialRadio = 100,
    onCoordenadas,
    onRadioChange,
    onLimpiar,
}: Props) {
    const [lat, setLat] = useState<number | null>(initialLat);
    const [lng, setLng] = useState<number | null>(initialLng);
    const [radio, setRadio] = useState(initialRadio ?? 100);
    const [error, setError] = useState<string | null>(null);
    const [geocoding, setGeocoding] = useState(false);
    const markerRef = useRef<L.Marker>(null);

    useEffect(() => {
        setLat(initialLat);
        setLng(initialLng);
    }, [initialLat, initialLng]);

    useEffect(() => {
        setRadio(initialRadio ?? 100);
    }, [initialRadio]);

    async function handlePosicionar() {
        if (!direccion.trim() && !poblacion.trim()) {
            setError('Introduce al menos la dirección o la población antes de posicionar.');
            return;
        }
        setGeocoding(true);
        setError(null);

        try {
            // Intento 1: query estructurada con la dirección tal como está
            let result = await geocodeStructured(direccion, poblacion, provincia, cp, pais);

            // Intento 2: eliminar el prefijo de tipo de vía (Calle → Carrer, etc.)
            if (!result && direccion.trim()) {
                const stripped = stripStreetType(direccion);
                if (stripped !== direccion.trim()) {
                    result = await geocodeStructured(stripped, poblacion, provincia, cp, pais);
                }
            }

            // Intento 3: solo ciudad + CP + país (sin calle), para al menos centrar el mapa
            if (!result) {
                result = await geocodeStructured('', poblacion || provincia, provincia, cp, pais);
            }

            if (!result) {
                setError('No se encontró la dirección. Comprueba los datos e inténtalo de nuevo.');
                return;
            }

            setLat(result.lat);
            setLng(result.lng);
            onCoordenadas(result.lat, result.lng, radio);
        } catch {
            setError('Error al conectar con el servicio de geocodificación.');
        } finally {
            setGeocoding(false);
        }
    }

    const handleDragEnd = useCallback(() => {
        const marker = markerRef.current;
        if (!marker) return;
        const pos = marker.getLatLng();
        setLat(pos.lat);
        setLng(pos.lng);
        onCoordenadas(pos.lat, pos.lng, radio);
    }, [onCoordenadas, radio]);

    function handleRadioChange(value: number) {
        setRadio(value);
        onRadioChange?.(value);
        if (lat !== null && lng !== null) {
            onCoordenadas(lat, lng, value);
        }
    }

    function handleLimpiar() {
        setLat(null);
        setLng(null);
        setError(null);
        onLimpiar?.();
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 flex-wrap">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handlePosicionar}
                    disabled={geocoding}
                    className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 hover:-translate-y-px transition-all"
                >
                    {geocoding ? 'Buscando...' : '📍 Posicionar en el mapa'}
                </Button>
                {lat !== null && lng !== null && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleLimpiar}
                        className="border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300 hover:-translate-y-px transition-all"
                    >
                        ✕ Quitar posición
                    </Button>
                )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            {lat !== null && lng !== null && (
                <>
                    <div className="overflow-hidden rounded-lg border" style={{ height: 240 }}>
                        <MapContainer
                            key={`${lat},${lng}`}
                            center={[lat, lng]}
                            zoom={15}
                            style={{ height: '100%', width: '100%' }}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            />
                            <Marker
                                position={[lat, lng]}
                                draggable
                                ref={markerRef}
                                eventHandlers={{ dragend: handleDragEnd }}
                            />
                            <Circle center={[lat, lng]} radius={radio} pathOptions={{ color: '#10b981', fillOpacity: 0.12 }} />
                        </MapContainer>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="grid gap-1">
                            <Label className="text-xs text-muted-foreground">Latitud</Label>
                            <Input readOnly value={lat.toFixed(6)} className="h-8 text-sm font-mono" />
                        </div>
                        <div className="grid gap-1">
                            <Label className="text-xs text-muted-foreground">Longitud</Label>
                            <Input readOnly value={lng.toFixed(6)} className="h-8 text-sm font-mono" />
                        </div>
                    </div>
                </>
            )}

            <div className="grid gap-1">
                <Label htmlFor="radio_geofence" className="text-xs text-muted-foreground">
                    Radio de geofence (metros)
                </Label>
                <div className="flex items-center gap-2">
                    <Input
                        id="radio_geofence"
                        type="number"
                        min={10}
                        value={radio}
                        onChange={(e) => handleRadioChange(Number(e.target.value))}
                        className="h-8 text-sm w-24 font-mono text-center"
                    />
                    <span className="text-xs text-muted-foreground">metros de radio</span>
                </div>
                <p className="text-xs text-muted-foreground/70">
                    💡 100 m → un edificio &nbsp;·&nbsp; 500 m → un campus
                </p>
            </div>
        </div>
    );
}
