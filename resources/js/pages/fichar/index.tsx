import { Head, useForm, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    Coffee,
    LogIn,
    LogOut,
    MapPin,
    Wifi,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

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
type LocationState = { lat: number; lng: number; accuracy: number } | null;

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Fichar', href: '/fichar' }];

function formatSeconds(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    return [h, m, s].map((value) => String(value).padStart(2, '0')).join(':');
}

function getFichajeTimeZone(
    fichaje: Fichaje | null | undefined,
    fallbackTimeZone: string,
): string {
    return (
        fichaje?.timezone ?? fichaje?.work_center?.timezone ?? fallbackTimeZone
    );
}

async function fetchPublicIp(): Promise<string> {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 5000);

    try {
        const response = await fetch('https://api.ipify.org?format=json', {
            signal: controller.signal,
        });

        if (!response.ok) {
            return '';
        }

        const data = (await response.json()) as { ip?: string };

        return typeof data.ip === 'string' ? data.ip : '';
    } catch {
        return '';
    } finally {
        window.clearTimeout(timeoutId);
    }
}

function fetchCurrentLocation(): Promise<LocationState> {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve(null);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                });
            },
            () => resolve(null),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
        );
    });
}

export default function FicharPage() {
    const { props } = usePage<{
        employee: User | null;
        fichajeActivo: Fichaje | null;
        historial: Fichaje[];
        setupMessage?: string | null;
        errors: Record<string, string>;
        [key: string]: unknown;
    }>();

    const { employee, fichajeActivo, historial, errors, setupMessage } = props;
    const employeeTimeZone =
        employee?.work_center?.timezone ?? DEFAULT_WORK_CENTER_TIMEZONE;
    const workCenterTimeZoneLabel = getTimeZoneLabel(employeeTimeZone);
    const activeTimeZone = getFichajeTimeZone(fichajeActivo, employeeTimeZone);
    const activeTimeZoneLabel = getTimeZoneLabel(activeTimeZone);

    const iniciarForm = useForm({
        lat: '',
        lng: '',
        accuracy: '',
        ip_publica: '',
    });
    const pausaForm = useForm({
        lat: '',
        lng: '',
        accuracy: '',
        ip_publica: '',
    });
    const finalizarForm = useForm({
        lat: '',
        lng: '',
        accuracy: '',
        ip_publica: '',
    });

    const [elapsed, setElapsed] = useState(0);
    const [pausaTimer, setPausaTimer] = useState(0);
    const [accionPendiente, setAccionPendiente] =
        useState<AccionPendiente>(null);
    const [accionLocalError, setAccionLocalError] = useState<string | null>(
        null,
    );
    const [validandoContexto, setValidandoContexto] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        if (!fichajeActivo || fichajeActivo.estado === 'finalizada') {
            return;
        }

        const calcElapsed = () => {
            const now = Date.now();
            const start = new Date(fichajeActivo.inicio_jornada).getTime();
            const totalPausasMs = (fichajeActivo.pausas ?? []).reduce(
                (accumulator, pausa) =>
                    accumulator + (pausa.duracion_pausa ?? 0) * 1000,
                0,
            );

            let pausaActivaMs = 0;
            if (fichajeActivo.estado === 'pausa') {
                const pausaActiva = (fichajeActivo.pausas ?? []).find(
                    (pausa) => !pausa.fin_pausa,
                );
                if (pausaActiva) {
                    pausaActivaMs = Math.max(
                        0,
                        now - new Date(pausaActiva.inicio_pausa).getTime(),
                    );
                }
            }

            const totalMs = now - start;

            return Math.max(
                0,
                Math.floor((totalMs - totalPausasMs - pausaActivaMs) / 1000),
            );
        };

        const initTimeout = window.setTimeout(() => {
            setElapsed(calcElapsed());
        }, 0);
        timerRef.current = setInterval(() => setElapsed(calcElapsed()), 1000);

        return () => {
            window.clearTimeout(initTimeout);
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [fichajeActivo]);

    const pausaActiva =
        fichajeActivo?.pausas?.find((pausa) => !pausa.fin_pausa) ?? null;
    const estado = fichajeActivo?.estado ?? null;

    useEffect(() => {
        if (estado !== 'pausa' || !pausaActiva) {
            return;
        }

        const calcPausaElapsed = () =>
            Math.floor(
                (Date.now() - new Date(pausaActiva.inicio_pausa).getTime()) /
                    1000,
            );

        const initTimeout = window.setTimeout(() => {
            setPausaTimer(calcPausaElapsed());
        }, 0);
        const intervalId = window.setInterval(() => {
            setPausaTimer(calcPausaElapsed());
        }, 1000);

        return () => {
            window.clearTimeout(initTimeout);
            window.clearInterval(intervalId);
        };
    }, [estado, pausaActiva]);

    const submitPayload = (location: LocationState, publicIp: string) => ({
        lat: location ? String(location.lat) : '',
        lng: location ? String(location.lng) : '',
        accuracy: location ? String(Math.round(location.accuracy)) : '',
        ip_publica: publicIp,
    });

    const handleAccion = (accion: Exclude<AccionPendiente, null>) => {
        setAccionLocalError(null);
        setAccionPendiente(accion);
    };

    const confirmarAccion = async () => {
        const accion = accionPendiente;
        if (!accion || !employee) {
            return;
        }

        setAccionLocalError(null);
        setAccionPendiente(null);
        setValidandoContexto(true);

        const currentLocation = await fetchCurrentLocation();
        if (employee.remoto && !currentLocation) {
            setAccionLocalError(
                'Debes permitir la geolocalizacion para fichar en remoto.',
            );
            setValidandoContexto(false);
            return;
        }

        const ipPublica = await fetchPublicIp();
        const payload = submitPayload(currentLocation, ipPublica);
        const requestOptions = {
            preserveScroll: true,
            onFinish: () => setValidandoContexto(false),
        };

        if (accion === 'iniciar') {
            iniciarForm.transform(() => payload);
            iniciarForm.post('/fichar/iniciar', requestOptions);
            return;
        }

        if (accion === 'pausa') {
            pausaForm.transform(() => payload);
            pausaForm.post('/fichar/pausa', requestOptions);
            return;
        }

        finalizarForm.transform(() => payload);
        finalizarForm.post('/fichar/finalizar', requestOptions);
    };

    const isLoading =
        validandoContexto ||
        iniciarForm.processing ||
        pausaForm.processing ||
        finalizarForm.processing;
    const elapsedMostrado =
        !fichajeActivo || fichajeActivo.estado === 'finalizada' ? 0 : elapsed;
    const pausaTimerMostrado =
        estado !== 'pausa' || !pausaActiva ? 0 : pausaTimer;
    const errorMsg = accionLocalError ?? errors?.error ?? null;

    const accionLabels: Record<
        Exclude<AccionPendiente, null>,
        { titulo: string; descripcion: string }
    > = {
        iniciar: {
            titulo: 'Iniciar Jornada',
            descripcion: 'Se registrara con la hora oficial del centro.',
        },
        pausa: {
            titulo: estado === 'pausa' ? 'Reanudar Jornada' : 'Iniciar Pausa',
            descripcion:
                estado === 'pausa'
                    ? 'La reanudacion se registrara con la hora oficial del centro.'
                    : 'La pausa se registrara con la hora oficial del centro.',
        },
        finalizar: {
            titulo: 'Finalizar Jornada',
            descripcion:
                'El cierre se registrara con la hora oficial del centro.',
        },
    };

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

    const currentState = stateConfig[estado ?? 'null'] ?? stateConfig.null;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Fichar" />

            <div className="flex flex-col gap-6 p-4">
                {!employee && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            {setupMessage ??
                                'No tienes un perfil de empleado asignado.'}
                        </AlertDescription>
                    </Alert>
                )}

                {employee && (
                    <>
                        <Alert className="border-border">
                            {employee.remoto ? (
                                <MapPin className="h-4 w-4 text-blue-600" />
                            ) : (
                                <Wifi className="h-4 w-4 text-blue-600" />
                            )}
                            <AlertDescription>
                                {validandoContexto
                                    ? 'Comprobando ubicacion y red antes de registrar el fichaje...'
                                    : employee.remoto
                                      ? 'Se solicitara tu ubicacion al iniciar, pausar o finalizar.'
                                      : 'Se solicitaran tu ubicacion y la red del centro al iniciar, pausar o finalizar.'}
                            </AlertDescription>
                        </Alert>

                        {errorMsg && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{errorMsg}</AlertDescription>
                            </Alert>
                        )}

                        <div
                            className={`rounded-2xl border p-8 text-center transition-colors ${currentState.bg}`}
                        >
                            <div className="flex flex-col items-center gap-4">
                                {currentState.icon}

                                <div>
                                    <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                                        {currentState.label}
                                    </p>
                                    {fichajeActivo && (
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Inicio:{' '}
                                            {formatDateTimeInTimeZone(
                                                fichajeActivo.inicio_jornada,
                                                activeTimeZone,
                                            )}
                                        </p>
                                    )}
                                </div>

                                {estado === 'activa' && (
                                    <div className="font-mono text-5xl font-bold text-green-700 tabular-nums dark:text-green-400">
                                        {formatSeconds(elapsedMostrado)}
                                    </div>
                                )}

                                {estado === 'pausa' && (
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="font-mono text-5xl font-bold text-yellow-700 tabular-nums dark:text-yellow-400">
                                            {formatSeconds(pausaTimerMostrado)}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Tiempo en pausa
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Tiempo trabajado:{' '}
                                            <span className="font-semibold">
                                                {formatSeconds(elapsedMostrado)}
                                            </span>
                                        </p>
                                    </div>
                                )}

                                <div className="mt-2 flex flex-wrap justify-center gap-3">
                                    {!estado && (
                                        <Button
                                            size="lg"
                                            disabled={isLoading}
                                            onClick={() =>
                                                handleAccion('iniciar')
                                            }
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
                                                onClick={() =>
                                                    handleAccion('pausa')
                                                }
                                                className="gap-2"
                                            >
                                                <Coffee className="h-5 w-5" />
                                                Iniciar Pausa
                                            </Button>
                                            <Button
                                                size="lg"
                                                variant="destructive"
                                                disabled={isLoading}
                                                onClick={() =>
                                                    handleAccion('finalizar')
                                                }
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
                                            onClick={() =>
                                                handleAccion('pausa')
                                            }
                                            className="gap-2 bg-yellow-600 hover:bg-yellow-700"
                                        >
                                            <LogIn className="h-5 w-5" />
                                            Reanudar
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {employee.work_center && (
                            <p className="text-center text-sm text-muted-foreground">
                                Centro:{' '}
                                <span className="font-medium">
                                    {employee.work_center.nombre}
                                </span>
                                <span className="ml-2 text-xs">
                                    {workCenterTimeZoneLabel}
                                </span>
                                {employee.remoto && (
                                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                        <Wifi className="h-3 w-3" /> Remoto
                                    </span>
                                )}
                            </p>
                        )}

                        {historial.length > 0 && (
                            <div className="rounded-xl border">
                                <div className="border-b px-4 py-3">
                                    <h2 className="text-sm font-semibold">
                                        Ultimas jornadas
                                    </h2>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b bg-muted/20">
                                                <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                                                    Fecha
                                                </th>
                                                <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                                                    Entrada
                                                </th>
                                                <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                                                    Salida
                                                </th>
                                                <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                                                    Pausas
                                                </th>
                                                <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                                                    Trabajado
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {historial.map((fichaje, index) => {
                                                const totalPausas = (
                                                    fichaje.pausas ?? []
                                                ).reduce(
                                                    (accumulator, pausa) =>
                                                        accumulator +
                                                        (pausa.duracion_pausa ??
                                                            0),
                                                    0,
                                                );
                                                const timeZone =
                                                    getFichajeTimeZone(
                                                        fichaje,
                                                        employeeTimeZone,
                                                    );

                                                return (
                                                    <tr
                                                        key={fichaje.id}
                                                        className={`border-b last:border-0 ${index % 2 === 0 ? '' : 'bg-muted/10'}`}
                                                    >
                                                        <td className="px-4 py-2">
                                                            {formatDateValue(
                                                                fichaje.fecha,
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            {formatTimeInTimeZone(
                                                                fichaje.inicio_jornada,
                                                                timeZone,
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            {fichaje.fin_jornada
                                                                ? formatTimeInTimeZone(
                                                                      fichaje.fin_jornada,
                                                                      timeZone,
                                                                  )
                                                                : '-'}
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            {(
                                                                fichaje.pausas ??
                                                                []
                                                            ).length > 0
                                                                ? `${(fichaje.pausas ?? []).length} (${formatSeconds(totalPausas)})`
                                                                : '-'}
                                                        </td>
                                                        <td className="px-4 py-2 text-right font-mono">
                                                            {fichaje.duracion_jornada !=
                                                            null
                                                                ? formatSeconds(
                                                                      fichaje.duracion_jornada,
                                                                  )
                                                                : '-'}
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

            <Dialog
                open={accionPendiente !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setAccionPendiente(null);
                    }
                }}
            >
                <DialogContent className="text-center sm:max-w-xs">
                    {accionPendiente && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-center">
                                    {accionLabels[accionPendiente].titulo}
                                </DialogTitle>
                            </DialogHeader>

                            <div className="flex flex-col items-center gap-2 py-4">
                                <p className="text-sm text-muted-foreground">
                                    {accionLabels[accionPendiente].descripcion}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {activeTimeZoneLabel}
                                </p>
                            </div>

                            <DialogFooter className="flex-row justify-center gap-2 sm:justify-center">
                                <Button
                                    variant="outline"
                                    onClick={() => setAccionPendiente(null)}
                                >
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
