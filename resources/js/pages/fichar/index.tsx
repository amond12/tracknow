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
type LocationFetchResult = {
    error: string | null;
    location: LocationState;
};

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

function formatDateLabelInTimeZone(value: number, timeZone: string): string {
    const formatted = new Intl.DateTimeFormat('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        timeZone,
    }).format(value);

    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatClockLabelInTimeZone(value: number, timeZone: string): string {
    return new Intl.DateTimeFormat('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone,
    }).format(value);
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

function getLocationErrorMessage(error?: GeolocationPositionError): string {
    if (!window.isSecureContext) {
        return 'La app no se ha abierto en HTTPS. Safari no muestra el permiso de ubicacion en URLs inseguras o IPs locales sin certificado.';
    }

    if (!error) {
        return 'No se pudo obtener tu ubicacion actual.';
    }

    if (error.code === 1) {
        return 'Safari tiene bloqueada la ubicacion para esta web. Revisa los permisos del sitio o borra los datos del sitio y vuelve a abrir la app.';
    }

    if (error.code === 2) {
        return 'No se pudo obtener una ubicacion valida. Activa GPS, Wi-Fi o datos moviles y vuelve a intentarlo.';
    }

    if (error.code === 3) {
        return 'La solicitud de ubicacion ha tardado demasiado. Prueba otra vez con mejor cobertura o desde el exterior.';
    }

    return 'No se pudo obtener tu ubicacion actual.';
}

function fetchCurrentLocation(): Promise<LocationFetchResult> {
    return new Promise((resolve) => {
        if (!window.isSecureContext) {
            resolve({
                error: getLocationErrorMessage(),
                location: null,
            });
            return;
        }

        if (!navigator.geolocation) {
            resolve({
                error: 'Este navegador no permite obtener la ubicacion.',
                location: null,
            });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    error: null,
                    location: {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                    },
                });
            },
            (error) =>
                resolve({
                    error: getLocationErrorMessage(error),
                    location: null,
                }),
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

    const [centerNow, setCenterNow] = useState(() => Date.now());
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
        const intervalId = window.setInterval(() => {
            setCenterNow(Date.now());
        }, 1000);

        return () => {
            window.clearInterval(intervalId);
        };
    }, []);

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

        const { error: locationError, location: currentLocation } =
            await fetchCurrentLocation();
        if (employee.remoto && !currentLocation) {
            setAccionLocalError(
                locationError ??
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
    const inicioLabel = fichajeActivo
        ? formatTimeInTimeZone(fichajeActivo.inicio_jornada, activeTimeZone)
        : '--:--';
    const salidaLabel = fichajeActivo?.fin_jornada
        ? formatTimeInTimeZone(fichajeActivo.fin_jornada, activeTimeZone)
        : '--:--';
    const fechaCentroLabel = formatDateLabelInTimeZone(
        centerNow,
        activeTimeZone,
    );
    const horaCentroLabel = formatClockLabelInTimeZone(
        centerNow,
        activeTimeZone,
    );
    const centroNombre = employee?.work_center?.nombre ?? 'Sin centro';
    const contextoAccionLabel = validandoContexto
        ? 'Comprobando ubicacion y red antes de registrar el fichaje...'
        : employee?.remoto
          ? 'Se pedira tu ubicacion al marcar entrada, pausa o salida.'
          : 'Se validaran ubicacion y red del centro al marcar entrada, pausa o salida.';
    const puedePausar = estado === 'activa' || estado === 'pausa';

    const accionLabels: Record<
        Exclude<AccionPendiente, null>,
        { titulo: string; descripcion: string }
    > = {
        iniciar: {
            titulo: 'Marcar entrada',
            descripcion:
                'La entrada se registrara con la hora oficial del centro.',
        },
        pausa: {
            titulo: estado === 'pausa' ? 'Reanudar jornada' : 'Iniciar pausa',
            descripcion:
                estado === 'pausa'
                    ? 'La reanudacion se registrara con la hora oficial del centro.'
                    : 'La pausa se registrara con la hora oficial del centro.',
        },
        finalizar: {
            titulo: 'Marcar salida',
            descripcion:
                'La salida se registrara con la hora oficial del centro.',
        },
    };

    const desktopStateConfig = {
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

    const mobileStateConfig = {
        null: {
            badge: 'Listo para fichar',
            title: 'Marca tu jornada con un toque',
            description:
                'Esta vista movil se centra solo en entrada, pausa y salida.',
            icon: <Clock className="h-7 w-7" />,
            iconWrap:
                'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        },
        activa: {
            badge: 'Jornada activa',
            title: 'Tu jornada esta en marcha',
            description:
                'Todo esta corriendo bien. Usa pausa o salida cuando lo necesites.',
            icon: <LogIn className="h-7 w-7" />,
            iconWrap:
                'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
        },
        pausa: {
            badge: 'Pausa activa',
            title: 'Estas en pausa',
            description:
                'Reanuda desde aqui cuando vuelvas al trabajo o cierra la jornada.',
            icon: <Coffee className="h-7 w-7" />,
            iconWrap:
                'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
        },
        finalizada: {
            badge: 'Jornada cerrada',
            title: 'La salida ya esta registrada',
            description:
                'Si quieres revisar la jornada completa, la tienes en Registros.',
            icon: <CheckCircle2 className="h-7 w-7" />,
            iconWrap:
                'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        },
    } as const;

    const desktopState =
        desktopStateConfig[estado ?? 'null'] ?? desktopStateConfig.null;
    const mobileState =
        mobileStateConfig[estado ?? 'null'] ?? mobileStateConfig.null;
    const mobilePrimaryValue =
        estado === 'activa'
            ? formatSeconds(elapsedMostrado)
            : estado === 'pausa'
              ? formatSeconds(pausaTimerMostrado)
              : estado === 'finalizada'
                ? salidaLabel
                : horaCentroLabel;
    const mobilePrimaryLabel =
        estado === 'activa'
            ? 'Tiempo trabajado'
            : estado === 'pausa'
              ? 'Tiempo en pausa'
              : estado === 'finalizada'
                ? 'Salida registrada'
                : 'Hora oficial';
    const mobileSecondaryLabel =
        estado === 'activa'
            ? `Entrada ${inicioLabel}`
            : estado === 'pausa'
              ? `Trabajado ${formatSeconds(elapsedMostrado)}`
              : estado === 'finalizada'
                ? fichajeActivo?.duracion_jornada != null
                    ? `Total ${formatSeconds(fichajeActivo.duracion_jornada)}`
                    : 'Jornada cerrada'
                : `${centroNombre} - ${workCenterTimeZoneLabel}`;
    const mainActionLabel = !estado
        ? 'Iniciar jornada'
        : estado === 'finalizada'
          ? 'Jornada cerrada'
          : 'Finalizar jornada';
    const mainActionIcon = !estado ? (
        <LogIn className="h-5 w-5" />
    ) : estado === 'finalizada' ? (
        <CheckCircle2 className="h-5 w-5" />
    ) : (
        <LogOut className="h-5 w-5" />
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Fichar" />

            <div className="mobile-page-shell !gap-3 !pb-0 md:!gap-6 md:!pb-6">
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
                        {errorMsg && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{errorMsg}</AlertDescription>
                            </Alert>
                        )}

                        <div className="md:hidden">
                            <section className="flex flex-col justify-between rounded-[2rem] border border-slate-200/80 bg-white p-5 shadow-[0_24px_48px_-34px_rgba(15,23,42,0.28)] dark:border-slate-700/60 dark:bg-slate-950/84">
                                <div>
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium tracking-[0.18em] text-slate-600 uppercase dark:bg-slate-800 dark:text-slate-300">
                                                {mobileState.badge}
                                            </span>
                                            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                                                {fechaCentroLabel}
                                            </p>
                                        </div>
                                        <div
                                            className={`${mobileState.iconWrap} flex size-13 shrink-0 items-center justify-center rounded-[1.2rem]`}
                                        >
                                            {mobileState.icon}
                                        </div>
                                    </div>

                                    <div className="mt-10 text-center">
                                        <p className="text-[11px] font-medium tracking-[0.22em] text-slate-500 uppercase dark:text-slate-400">
                                            {mobilePrimaryLabel}
                                        </p>
                                        <div className="mt-3 font-mono text-[3.1rem] font-semibold tracking-tight text-slate-950 tabular-nums dark:text-slate-50">
                                            {mobilePrimaryValue}
                                        </div>
                                        <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                                            {mobileSecondaryLabel}
                                        </p>
                                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                            {employee.remoto
                                                ? 'Remoto'
                                                : 'Centro'}{' '}
                                            - {activeTimeZoneLabel}
                                        </p>
                                    </div>

                                    <div className="mt-8 rounded-[1.3rem] border border-slate-200/80 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300">
                                        <div className="flex items-center gap-2">
                                            {employee.remoto ? (
                                                <MapPin className="h-4 w-4 shrink-0" />
                                            ) : (
                                                <Wifi className="h-4 w-4 shrink-0" />
                                            )}
                                            <span>{contextoAccionLabel}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-5">
                                    <Button
                                        size="lg"
                                        disabled={
                                            isLoading || estado === 'finalizada'
                                        }
                                        onClick={() => {
                                            if (!estado) {
                                                handleAccion('iniciar');
                                                return;
                                            }

                                            if (estado !== 'finalizada') {
                                                handleAccion('finalizar');
                                            }
                                        }}
                                        className={`h-16 w-full rounded-[1.45rem] text-base font-semibold ${
                                            !estado
                                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                                : estado === 'finalizada'
                                                  ? 'bg-slate-200 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                                                  : 'bg-rose-600 text-white hover:bg-rose-700'
                                        }`}
                                    >
                                        {mainActionIcon}
                                        {mainActionLabel}
                                    </Button>

                                    <Button
                                        size="lg"
                                        variant="outline"
                                        disabled={isLoading || !puedePausar}
                                        onClick={() => handleAccion('pausa')}
                                        className={`h-15 w-full rounded-[1.45rem] text-base font-semibold ${
                                            puedePausar
                                                ? estado === 'pausa'
                                                    ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200'
                                                    : 'border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'
                                                : ''
                                        }`}
                                    >
                                        {estado === 'pausa' ? (
                                            <LogIn className="h-5 w-5" />
                                        ) : (
                                            <Coffee className="h-5 w-5" />
                                        )}
                                        {estado === 'pausa'
                                            ? 'Reanudar jornada'
                                            : 'Pausas'}
                                    </Button>
                                </div>
                            </section>
                        </div>

                        <div className="hidden space-y-4 md:block">
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

                            <div
                                className={`rounded-[1.85rem] border border-white/70 p-6 text-center shadow-[0_24px_48px_-34px_rgba(15,23,42,0.3)] transition-colors md:rounded-2xl md:p-8 md:shadow-none ${desktopState.bg}`}
                            >
                                <div className="flex flex-col items-center gap-4">
                                    {desktopState.icon}

                                    <div>
                                        <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                                            {desktopState.label}
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
                                                {formatSeconds(
                                                    pausaTimerMostrado,
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Tiempo en pausa
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Tiempo trabajado:{' '}
                                                <span className="font-semibold">
                                                    {formatSeconds(
                                                        elapsedMostrado,
                                                    )}
                                                </span>
                                            </p>
                                        </div>
                                    )}

                                    <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
                                        {!estado && (
                                            <Button
                                                size="lg"
                                                disabled={isLoading}
                                                onClick={() =>
                                                    handleAccion('iniciar')
                                                }
                                                className="h-12 w-full gap-2 rounded-2xl sm:w-auto"
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
                                                    className="h-12 w-full gap-2 rounded-2xl sm:w-auto"
                                                >
                                                    <Coffee className="h-5 w-5" />
                                                    Iniciar Pausa
                                                </Button>
                                                <Button
                                                    size="lg"
                                                    variant="destructive"
                                                    disabled={isLoading}
                                                    onClick={() =>
                                                        handleAccion(
                                                            'finalizar',
                                                        )
                                                    }
                                                    className="h-12 w-full gap-2 rounded-2xl sm:w-auto"
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
                                                className="h-12 w-full gap-2 rounded-2xl bg-yellow-600 hover:bg-yellow-700 sm:w-auto"
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
                        </div>

                        {historial.length > 0 && (
                            <div className="hidden space-y-3 md:block">
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
                                                {historial.map(
                                                    (fichaje, index) => {
                                                        const totalPausas = (
                                                            fichaje.pausas ?? []
                                                        ).reduce(
                                                            (
                                                                accumulator,
                                                                pausa,
                                                            ) =>
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
                                                    },
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
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
