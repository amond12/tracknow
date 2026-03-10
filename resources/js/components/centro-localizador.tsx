import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import { useCallback, useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Fix Leaflet default icon broken in Vite/webpack bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

interface Props {
    direccion: string;
    onCoordenadas: (lat: number, lng: number, radio: number) => void;
}

export function CentroLocalizador({ direccion, onCoordenadas }: Props) {
    const [lat, setLat] = useState<number | null>(null);
    const [lng, setLng] = useState<number | null>(null);
    const [radio, setRadio] = useState(100);
    const [error, setError] = useState<string | null>(null);
    const [geocoding, setGeocoding] = useState(false);
    const markerRef = useRef<L.Marker>(null);

    async function handlePosicionar() {
        if (!direccion.trim()) {
            setError('Introduce una dirección antes de posicionar.');
            return;
        }
        setGeocoding(true);
        setError(null);
        try {
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(direccion)}&format=json&limit=1`;
            const res = await fetch(url, { headers: { 'Accept-Language': 'es' } });
            const data = await res.json();
            if (!data || data.length === 0) {
                setError('No se encontró la dirección. Intenta con más detalles.');
                return;
            }
            const newLat = parseFloat(data[0].lat);
            const newLng = parseFloat(data[0].lon);
            setLat(newLat);
            setLng(newLng);
            onCoordenadas(newLat, newLng, radio);
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
        if (lat !== null && lng !== null) {
            onCoordenadas(lat, lng, value);
        }
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handlePosicionar}
                    disabled={geocoding}
                >
                    {geocoding ? 'Buscando...' : '📍 Posicionar'}
                </Button>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            {lat !== null && lng !== null && (
                <>
                    <div
                        className="overflow-hidden rounded-md border"
                        style={{ height: 240 }}
                    >
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
                        </MapContainer>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="grid gap-1">
                            <Label className="text-xs text-muted-foreground">Latitud</Label>
                            <Input readOnly value={lat.toFixed(6)} className="h-8 text-sm" />
                        </div>
                        <div className="grid gap-1">
                            <Label className="text-xs text-muted-foreground">Longitud</Label>
                            <Input readOnly value={lng.toFixed(6)} className="h-8 text-sm" />
                        </div>
                    </div>
                </>
            )}

            <div className="grid gap-1">
                <Label htmlFor="radio_geofence">Radio de geofence (metros)</Label>
                <Input
                    id="radio_geofence"
                    type="number"
                    min={10}
                    value={radio}
                    onChange={(e) => handleRadioChange(Number(e.target.value))}
                    className="h-8 text-sm"
                />
            </div>
        </div>
    );
}
