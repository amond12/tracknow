import { Head, useForm, usePage } from '@inertiajs/react';
import { AlertCircle, CheckCircle2, Clock, Coffee, LogIn, LogOut, MapPin, Wifi } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import {
    DEFAULT_WORK_CENTER_TIMEZONE,
    formatDateTimeInTimeZone,
    formatDateValue,
    formatTimeInTimeZone,
    getTimeZoneLabel,
} from '@/lib/timezones';
import type { BreadcrumbItem, Fichaje, User } from '@/types';

type AccionPendiente = 'iniciar' | 'pausa' | 'finalizar' | null;

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Fichar', href: '/fichar' },
];

function formatSeconds(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

type LocationState = { lat: number; lng: number; accuracy: number } | null;

export default function FicharPage() {
    const { props } = usePage<{
        employee: User | null;
        fichajeActivo: Fichaje | null;
        historial: Fichaje[];
        serverNowUtc?: string | null;
        setupMessage?: string | null;
        errors: Record<string, string>;
        [key: string]: unknown;
    }>();
    const { employee, fichajeActivo, historial, errors, serverNowUtc, setupMessage } = props;
    const workCenterTimeZone = employee?.work_center?.timezone ?? DEFAULT_WORK_CENTER_TIMEZONE;
    const workCenterTimeZoneLabel = getTimeZoneLabel(workCenterTimeZone);
    const [clientRenderedAt] = useState(() => Date.now());
    const clockDriftMinutes = (() => {
        if (!serverNowUtc) {
            return null;
        }

        const serverTimestamp = new Date(serverNowUtc).getTime();
        if (Number.isNaN(serverTimestamp)) {
            return null;
        }

        const driftMinutes = Math.round((clientRenderedAt - serverTimestamp) / 60000);
        return Math.abs(driftMinutes) >= 5 ? driftMinutes : null;
    })();

    const [location, setLocation] = useState<LocationState>(null);
    const [ipPublica, setIpPublica] = useState<string>('');
    const [geoError, setGeoError] = useState<string | null>(null);
    const [geoLoading, setGeoLoading] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Modal de confirmación
    const [accionPendiente, setAccionPendiente] = useState<AccionPendiente>(null);
    const [horaConfirmacion, setHoraConfirmacion] = useState('');
    const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (accionPendiente) {
            const tick = () =>
                setHoraConfirmacion(
                    new Intl.DateTimeFormat('es-ES', {
                        timeZone: workCenterTimeZone,
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false,
                    }).format(new Date()),
                );
            tick();
            clockRef.current = setInterval(tick, 1000);
        } else {
            if (clockRef.current) clearInterval(clockRef.current);
        }
        return () => { if (clockRef.current) clearInterval(clockRef.current); };
    }, [accionPendiente, workCenterTimeZone]);

    const iniciarForm = useForm({ lat: '', lng: '', accuracy: '', ip_publica: '' });
    const pausaForm = useForm({ lat: '', lng: '', accuracy: '', ip_publica: '' });
    const finalizarForm = useForm({ lat: '', lng: '', accuracy: '', ip_publica: '' });

    useEffect(() => {
        fetch('https://api.ipify.org?format=json')
            .then((r) => r.json())
            .then((d) => setIpPublica(d.ip ?? ''))
            .catch(() => {});
    }, []);

    // Solicitar geolocalización si el empleado no es remoto
    const fetchCurrentLocation = useCallback(
        () =>
            new Promise<LocationState>((resolve) => {
                if (!navigator.geolocation) {
                    setGeoError('Tu navegador no soporta geolocalización.');
                    resolve(null);
                    return;
                }
                setGeoLoading(true);
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        const currentLocation = {
                            lat: pos.coords.latitude,
                            lng: pos.coords.longitude,
                            accuracy: pos.coords.accuracy,
                        };
                        setLocation(currentLocation);
                        setGeoError(null);
                        setGeoLoading(false);
                        resolve(currentLocation);
                    },
                    () => {
                        setGeoError('No se pudo obtener la ubicación. Se verificará por IP.');
                        setGeoLoading(false);
                        resolve(null);
                    },
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
                );
            }),
        [],
    );

    const requestLocation = useCallback(() => {
        void fetchCurrentLocation();
    }, [fetchCurrentLocation]);

    useEffect(() => {
        requestLocation();
    }, [requestLocation]);

    // Temporizador en vivo
    useEffect(() => {
        if (timerRef.current) clearInterval(timerRef.current);

        if (!fichajeActivo || fichajeActivo.estado === 'finalizada') {
            return;
        }

        const calcElapsed = () => {
            const ahora = Date.now();
            const start = new Date(fichajeActivo.inicio_jornada).getTime();
            // Suma de pausas completadas (en segundos, guardadas en BD)
            const totalPausasMs = (fichajeActivo.pausas ?? []).reduce(
                (acc, p) => acc + ((p.duracion_pausa ?? 0) * 1000),
                0,
            );
            // Pausa activa: tiempo desde que empezó (en ms)
            let pausaActivaMs = 0;
            if (fichajeActivo.estado === 'pausa') {
                const pausaActiva = (fichajeActivo.pausas ?? []).find((p) => !p.fin_pausa);
                if (pausaActiva) {
                    pausaActivaMs = Math.max(0, ahora - new Date(pausaActiva.inicio_pausa).getTime());
                }
            }
            const totalMs = ahora - start;
            return Math.max(0, Math.floor((totalMs - totalPausasMs - pausaActivaMs) / 1000));
        };

        const initTimeout = setTimeout(() => {
            setElapsed(calcElapsed());
        }, 0);
        timerRef.current = setInterval(() => setElapsed(calcElapsed()), 1000);

        return () => {
            clearTimeout(initTimeout);
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [fichajeActivo]);

    const getPayload = (currentLocation: LocationState) => ({
        lat: currentLocation ? String(currentLocation.lat) : '',
        lng: currentLocation ? String(currentLocation.lng) : '',
        accuracy: currentLocation ? String(Math.round(currentLocation.accuracy)) : '',
        ip_publica: ipPublica,
    });

    const handleIniciar = () => setAccionPendiente('iniciar');
    const handlePausa = () => setAccionPendiente('pausa');
    const handleFinalizar = () => setAccionPendiente('finalizar');

    const confirmarAccion = async () => {
        const accion = accionPendiente;
        if (!accion) return;

        setAccionPendiente(null);
        const currentLocation = await fetchCurrentLocation();
        const payload = getPayload(currentLocation);

        if (accion === 'iniciar') {
            iniciarForm.transform(() => payload);
            iniciarForm.post('/fichar/iniciar', { preserveScroll: true });
        } else if (accion === 'pausa') {
            pausaForm.transform(() => payload);
            pausaForm.post('/fichar/pausa', { preserveScroll: true });
        } else if (accion === 'finalizar') {
            finalizarForm.transform(() => payload);
            finalizarForm.post('/fichar/finalizar', { preserveScroll: true });
        }
    };

    const errorMsg = errors?.error ?? null;

    const isLoading = iniciarForm.processing || pausaForm.processing || finalizarForm.processing;

    const estado = fichajeActivo?.estado ?? null;
    const elapsedMostrado = !fichajeActivo || fichajeActivo.estado === 'finalizada' ? 0 : elapsed;

    const accionLabels: Record<NonNullable<AccionPendiente>, { titulo: string; descripcion: string; colorHora: string }> = {
        iniciar: {
            titulo: 'Iniciar Jornada',
            descripcion: 'Se registrará el inicio de tu jornada a las:',
            colorHora: 'text-green-600 dark:text-green-400',
        },
        pausa: {
            titulo: estado === 'pausa' ? 'Reanudar Jornada' : 'Iniciar Pausa',
            descripcion: estado === 'pausa' ? 'Se registrará la reanudación a las:' : 'Se registrará el inicio de la pausa a las:',
            colorHora: 'text-yellow-600 dark:text-yellow-400',
        },
        finalizar: {
            titulo: 'Finalizar Jornada',
            descripcion: 'Se registrará el fin de tu jornada a las:',
            colorHora: 'text-red-600 dark:text-red-400',
        },
    };

    const pausaActiva = fichajeActivo?.pausas?.find((p) => !p.fin_pausa) ?? null;
    const [pausaTimer, setPausaTimer] = useState(0);
    useEffect(() => {
        if (estado !== 'pausa' || !pausaActiva) {
            return;
        }

        const calcPausaElapsed = () =>
            Math.floor((Date.now() - new Date(pausaActiva.inicio_pausa).getTime()) / 1000);

        const initTimeout = setTimeout(() => {
            setPausaTimer(calcPausaElapsed());
        }, 0);
        const interval = setInterval(() => {
            setPausaTimer(calcPausaElapsed());
        }, 1000);
        return () => {
            clearTimeout(initTimeout);
            clearInterval(interval);
        };
    }, [estado, pausaActiva]);
    const pausaTimerMostrado = estado !== 'pausa' || !pausaActiva ? 0 : pausaTimer;

    const stateConfig = {
        null: {
            bg: 'bg-muted/30',
            label: 'Sin fichar',
            icon: <Clock className="h-12 w-12 text-muted-foreground" />,
        },
        activa: {
            bg: 'bg-green-50 dark:bg-green-950/30',
            label: 'Jornada activa',
            icon: <LogIn className="h-12 w-12 text-green-600" />,
        },
        pausa: {
            bg: 'bg-yellow-50 dark:bg-yellow-950/30',
            label: 'En pausa',
            icon: <Coffee className="h-12 w-12 text-yellow-600" />,
        },
        finalizada: {
            bg: 'bg-muted/30',
            label: 'Jornada finalizada',
            icon: <CheckCircle2 className="h-12 w-12 text-muted-foreground" />,
        },
    } as const;

    const currentState = stateConfig[estado ?? 'null'] ?? stateConfig['null'];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Fichar" />

            <div className="flex flex-col gap-6 p-4">
                {/* Sin perfil de empleado */}
                {!employee && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{setupMessage ?? 'No tienes un perfil de empleado asignado.'}</AlertDescription>
                    </Alert>
                )}

                {employee && (
                    <>
                        {/* Aviso de ubicación */}
                        {!employee.remoto && (
                            <Alert className={geoError ? 'border-yellow-500' : 'border-green-500'}>
                                {location ? (
                                    <MapPin className="h-4 w-4 text-green-600" />
                                ) : (
                                    <Wifi className="h-4 w-4 text-yellow-600" />
                                )}
                                <AlertDescription>
                                    {geoLoading && 'Obteniendo ubicación...'}
                                    {!geoLoading && location && `Ubicación detectada (${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}) ±${Math.round(location.accuracy)} m`}
                                    {!geoLoading && !location && (geoError ?? 'Ubicación no disponible. Se verificará por IP.')}
                                    {!geoLoading && !location && (
                                        <button
                                            onClick={requestLocation}
                                            className="ml-2 underline text-sm"
                                        >
                                            Reintentar
                                        </button>
                                    )}
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Error de acción */}
                        {errorMsg && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{errorMsg}</AlertDescription>
                            </Alert>
                        )}

                        {clockDriftMinutes !== null && (
                            <Alert className="border-yellow-500">
                                <AlertCircle className="h-4 w-4 text-yellow-600" />
                                <AlertDescription>
                                    La hora de este dispositivo difiere {Math.abs(clockDriftMinutes)} min de la hora del servidor.
                                    La hora oficial usada para fichar es {workCenterTimeZoneLabel}.
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Panel de estado */}
                        <div className={`rounded-2xl border p-8 text-center transition-colors ${currentState.bg}`}>
                            <div className="flex flex-col items-center gap-4">
                                {currentState.icon}

                                <div>
                                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                        {currentState.label}
                                    </p>
                                    {fichajeActivo && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Inicio: {formatDateTimeInTimeZone(fichajeActivo.inicio_jornada, workCenterTimeZone)}
                                        </p>
                                    )}
                                </div>

                                {/* Temporizador */}
                                {estado === 'activa' && (
                                    <div className="text-5xl font-mono font-bold tabular-nums text-green-700 dark:text-green-400">
                                        {formatSeconds(elapsedMostrado)}
                                    </div>
                                )}
                                {estado === 'pausa' && (
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="text-5xl font-mono font-bold tabular-nums text-yellow-700 dark:text-yellow-400">
                                            {formatSeconds(pausaTimerMostrado)}
                                        </div>
                                        <p className="text-xs text-muted-foreground">Tiempo en pausa</p>
                                        <p className="text-sm text-muted-foreground">
                                            Tiempo trabajado: <span className="font-semibold">{formatSeconds(elapsedMostrado)}</span>
                                        </p>
                                    </div>
                                )}

                                {/* Botones */}
                                <div className="flex flex-wrap justify-center gap-3 mt-2">
                                    {!estado && (
                                        <Button
                                            size="lg"
                                            disabled={isLoading}
                                            onClick={handleIniciar}
                                            className="gap-2"
                                        >
                                            <LogIn className="h-5 w-5" />
                                            Iniciar Jornada
                                        </Button>
                                    )}

                                    {estado === 'activa' && (
                                        <>
                                            <Button
                                                size="lg"
                                                variant="outline"
                                                disabled={isLoading}
                                                onClick={handlePausa}
                                                className="gap-2"
                                            >
                                                <Coffee className="h-5 w-5" />
                                                Iniciar Pausa
                                            </Button>
                                            <Button
                                                size="lg"
                                                variant="destructive"
                                                disabled={isLoading}
                                                onClick={handleFinalizar}
                                                className="gap-2"
                                            >
                                                <LogOut className="h-5 w-5" />
                                                Finalizar Jornada
                                            </Button>
                                        </>
                                    )}

                                    {estado === 'pausa' && (
                                        <Button
                                            size="lg"
                                            disabled={isLoading}
                                            onClick={handlePausa}
                                            className="gap-2 bg-yellow-600 hover:bg-yellow-700"
                                        >
                                            <LogIn className="h-5 w-5" />
                                            Reanudar
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Info del centro */}
                        {employee.work_center && (
                            <p className="text-sm text-center text-muted-foreground">
                                Centro: <span className="font-medium">{employee.work_center.nombre}</span>
                                <span className="ml-2 text-xs">{workCenterTimeZoneLabel}</span>
                                {employee.remoto && (
                                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                        <Wifi className="h-3 w-3" /> Remoto
                                    </span>
                                )}
                            </p>
                        )}

                        {/* Historial */}
                        {historial.length > 0 && (
                            <div className="rounded-xl border">
                                <div className="px-4 py-3 border-b">
                                    <h2 className="font-semibold text-sm">Últimas jornadas</h2>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b bg-muted/20">
                                                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Fecha</th>
                                                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Entrada</th>
                                                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Salida</th>
                                                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Pausas</th>
                                                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Trabajado</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {historial.map((f, i) => {
                                                const totalPausas = (f.pausas ?? []).reduce(
                                                    (acc, p) => acc + (p.duracion_pausa ?? 0), 0
                                                );
                                                return (
                                                    <tr
                                                        key={f.id}
                                                        className={`border-b last:border-0 ${i % 2 === 0 ? '' : 'bg-muted/10'}`}
                                                    >
                                                        <td className="px-4 py-2">{formatDateValue(f.fecha)}</td>
                                                        <td className="px-4 py-2">{formatTimeInTimeZone(f.inicio_jornada, workCenterTimeZone)}</td>
                                                        <td className="px-4 py-2">
                                                            {f.fin_jornada ? formatTimeInTimeZone(f.fin_jornada, workCenterTimeZone) : '—'}
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            {(f.pausas ?? []).length > 0
                                                                ? `${(f.pausas ?? []).length} (${formatSeconds(totalPausas)})`
                                                                : '—'}
                                                        </td>
                                                        <td className="px-4 py-2 text-right font-mono">
                                                            {f.duracion_jornada != null
                                                                ? formatSeconds(f.duracion_jornada)
                                                                : '—'}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
            {/* Modal de confirmación */}
            <Dialog open={accionPendiente !== null} onOpenChange={(open) => !open && setAccionPendiente(null)}>
                <DialogContent className="sm:max-w-xs text-center">
                    {accionPendiente && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-center">
                                    {accionLabels[accionPendiente].titulo}
                                </DialogTitle>
                            </DialogHeader>

                            <div className="py-4 flex flex-col items-center gap-2">
                                <p className="text-sm text-muted-foreground">
                                    {accionLabels[accionPendiente].descripcion}
                                </p>
                                <p className={`text-4xl font-mono font-bold tabular-nums ${accionLabels[accionPendiente].colorHora}`}>
                                    {horaConfirmacion}
                                </p>
                                <p className="text-xs text-muted-foreground">{workCenterTimeZoneLabel}</p>
                            </div>

                            <DialogFooter className="flex-row justify-center gap-2 sm:justify-center">
                                <Button variant="outline" onClick={() => setAccionPendiente(null)}>
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={confirmarAccion}
                                    disabled={isLoading}
                                    className={
                                        accionPendiente === 'finalizar'
                                            ? 'bg-destructive hover:bg-destructive/90'
                                            : accionPendiente === 'pausa'
                                              ? 'bg-yellow-600 hover:bg-yellow-700'
                                              : ''
                                    }
                                >
                                    Confirmar
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
