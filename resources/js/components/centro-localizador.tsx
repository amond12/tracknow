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
import {
    getMapboxRasterTilesUrl,
    hasMapboxToken,
    validateWorkCenterAddress,
} from '@/lib/mapbox';
import type { MapboxAddressResult } from '@/lib/mapbox';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)
    ._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

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
    onAddressResolved?: (address: MapboxAddressResult) => void;
    autoLocateOnMount?: boolean;
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
    onAddressResolved,
    autoLocateOnMount = false,
}: Props) {
    const [lat, setLat] = useState<number | null>(initialLat);
    const [lng, setLng] = useState<number | null>(initialLng);
    const [radio, setRadio] = useState(initialRadio ?? 100);
    const [error, setError] = useState<string | null>(null);
    const [geocoding, setGeocoding] = useState(false);
    const markerRef = useRef<L.Marker>(null);
    const autoLocateAttemptedRef = useRef(false);

    useEffect(() => {
        setLat(initialLat);
        setLng(initialLng);
    }, [initialLat, initialLng]);

    useEffect(() => {
        setRadio(initialRadio ?? 100);
    }, [initialRadio]);

    const handlePosicionar = useCallback(async () => {
        if (!hasMapboxToken()) {
            setError('Falta configurar VITE_MAPBOX_TOKEN para usar el mapa.');
            return;
        }

        if (!direccion.trim() && !poblacion.trim()) {
            setError(
                'Introduce al menos la direccion o la poblacion antes de posicionar.',
            );
            return;
        }

        setGeocoding(true);
        setError(null);

        try {
            const result = await validateWorkCenterAddress({
                direccion,
                poblacion,
                provincia,
                cp,
                pais,
            });

            if (!result) {
                setError(
                    'Mapbox no ha encontrado la direccion. Revisa los datos e intentalo otra vez.',
                );
                return;
            }

            setLat(result.lat);
            setLng(result.lng);
            onCoordenadas(result.lat, result.lng, radio);
            onAddressResolved?.(result);
        } catch {
            setError('Error al conectar con Mapbox.');
        } finally {
            setGeocoding(false);
        }
    }, [
        cp,
        direccion,
        onAddressResolved,
        onCoordenadas,
        pais,
        poblacion,
        provincia,
        radio,
    ]);

    useEffect(() => {
        if (
            !autoLocateOnMount ||
            autoLocateAttemptedRef.current ||
            initialLat !== null ||
            initialLng !== null ||
            (!direccion.trim() && !poblacion.trim())
        ) {
            return;
        }

        autoLocateAttemptedRef.current = true;
        void handlePosicionar();
    }, [
        autoLocateOnMount,
        direccion,
        handlePosicionar,
        initialLat,
        initialLng,
        poblacion,
    ]);

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
        <div className="grid gap-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handlePosicionar}
                    disabled={geocoding}
                    className="w-full rounded-xl border-blue-200 bg-blue-50 text-blue-700 transition-colors hover:border-blue-300 hover:bg-blue-100 sm:w-auto"
                >
                    {geocoding
                        ? 'Buscando...'
                        : lat !== null && lng !== null
                          ? 'Reposicionar desde la direccion'
                          : 'Usar direccion para posicionar'}
                </Button>
                {lat !== null && lng !== null && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleLimpiar}
                        className="w-full rounded-xl border-border bg-background text-muted-foreground transition-colors hover:bg-muted sm:w-auto"
                    >
                        Quitar ubicacion
                    </Button>
                )}
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}

            {lat !== null && lng !== null && (
                <>
                    <div
                        className="overflow-hidden rounded-xl border border-border/70"
                        style={{ height: 190 }}
                    >
                        <MapContainer
                            key={`${lat},${lng}`}
                            center={[lat, lng]}
                            zoom={15}
                            style={{ height: '100%', width: '100%' }}
                        >
                            <TileLayer
                                url={getMapboxRasterTilesUrl()}
                                attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                tileSize={512}
                                zoomOffset={-1}
                            />
                            <Marker
                                position={[lat, lng]}
                                draggable
                                ref={markerRef}
                                eventHandlers={{ dragend: handleDragEnd }}
                            />
                            <Circle
                                center={[lat, lng]}
                                radius={radio}
                                pathOptions={{
                                    color: '#2563eb',
                                    fillColor: '#2563eb',
                                    fillOpacity: 0.12,
                                }}
                            />
                        </MapContainer>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="grid gap-1">
                            <Label className="text-xs text-muted-foreground">
                                Latitud
                            </Label>
                            <Input
                                readOnly
                                value={lat.toFixed(6)}
                                className="h-8 rounded-lg border-border/70 bg-background/70 font-mono text-sm"
                            />
                        </div>
                        <div className="grid gap-1">
                            <Label className="text-xs text-muted-foreground">
                                Longitud
                            </Label>
                            <Input
                                readOnly
                                value={lng.toFixed(6)}
                                className="h-8 rounded-lg border-border/70 bg-background/70 font-mono text-sm"
                            />
                        </div>
                    </div>
                </>
            )}

            <div className="grid gap-2 rounded-xl border border-border/70 bg-background/70 p-3">
                <Label
                    htmlFor="radio_geofence"
                    className="text-xs text-muted-foreground"
                >
                    Radio de geofence (metros)
                </Label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                        id="radio_geofence"
                        type="number"
                        min={10}
                        value={radio}
                        onChange={(e) =>
                            handleRadioChange(Number(e.target.value))
                        }
                        className="h-8 w-24 rounded-lg border-border/70 text-center font-mono text-sm"
                    />
                    <span className="text-xs text-muted-foreground">
                        metros
                    </span>
                </div>
                <p className="text-xs text-muted-foreground/70">
                    Si mueves el pin manualmente, revisa la direccion antes de
                    guardar.
                </p>
            </div>
        </div>
    );
}
