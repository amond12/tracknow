import { Head, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    Coffee,
    LogIn,
    LogOut,
    MapPin,
    ShieldCheck,
    Wifi,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { resolveClientPublicIp } from '@/lib/public-ip';
import {
    DEFAULT_WORK_CENTER_TIMEZONE,
    getTimeZoneLabel,
} from '@/lib/timezones';

type PublicEmployee = {
    id: number;
    name: string;
    apellido?: string | null;
    remoto?: boolean;
    work_center?: {
        timezone?: string | null;
    } | null;
};

type PublicFichaje = {
    id: number;
    estado: 'activa' | 'pausa' | 'finalizada';
    timezone?: string | null;
};

type FichajeAction = 'iniciar' | 'pausa' | 'finalizar';
type LocationState = { lat: number; lng: number; accuracy: number } | null;

function formatClockLabelInTimeZone(value: number, timeZone: string): string {
    return new Intl.DateTimeFormat('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone,
    }).format(value);
}

function getLocationErrorMessage(error?: GeolocationPositionError): string {
    if (!window.isSecureContext) {
        return 'La pagina debe abrirse en HTTPS para usar geolocalizacion.';
    }

    if (!error) {
        return 'No se pudo obtener la ubicacion actual.';
    }

    if (error.code === 1) {
        return 'La ubicacion esta bloqueada para esta pagina.';
    }

    if (error.code === 2) {
        return 'No se pudo obtener una ubicacion valida.';
    }

    if (error.code === 3) {
        return 'La solicitud de ubicacion ha tardado demasiado.';
    }

    return 'No se pudo obtener la ubicacion actual.';
}

function fetchCurrentLocation(): Promise<{
    error: string | null;
    location: LocationState;
}> {
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
            (position) =>
                resolve({
                    error: null,
                    location: {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                    },
                }),
            (error) =>
                resolve({
                    error: getLocationErrorMessage(error),
                    location: null,
                }),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
        );
    });
}

export default function PublicFicharPage() {
    const { props } = usePage<{
        identificador?: string;
        employee: PublicEmployee | null;
        fichajeActivo: PublicFichaje | null;
        lookupError?: string | null;
        successMessage?: string | null;
        errors: Record<string, string>;
        [key: string]: unknown;
    }>();

    const {
        identificador = '',
        employee,
        fichajeActivo,
        lookupError,
        successMessage,
        errors,
    } = props;

    const [inputValue, setInputValue] = useState(identificador);
    const [modalOpen, setModalOpen] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [executingAction, setExecutingAction] = useState<FichajeAction | null>(
        null,
    );
    const [localActionError, setLocalActionError] = useState<string | null>(
        null,
    );
    const [currentTime, setCurrentTime] = useState(() => Date.now());
    const [visibleSuccessMessage, setVisibleSuccessMessage] = useState<
        string | null
    >(successMessage ?? null);

    useEffect(() => {
        setInputValue(identificador);
    }, [identificador]);

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            setCurrentTime(Date.now());
        }, 1000);

        return () => window.clearInterval(intervalId);
    }, []);

    useEffect(() => {
        setVisibleSuccessMessage(successMessage ?? null);

        if (!successMessage) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setVisibleSuccessMessage(null);
        }, 2000);

        return () => window.clearTimeout(timeoutId);
    }, [successMessage]);

    useEffect(() => {
        if (employee && !successMessage) {
            setModalOpen(true);
            return;
        }

        setModalOpen(false);
    }, [employee, identificador, successMessage]);

    const timeZone =
        fichajeActivo?.timezone ??
        employee?.work_center?.timezone ??
        DEFAULT_WORK_CENTER_TIMEZONE;
    const currentTimeLabel = formatClockLabelInTimeZone(currentTime, timeZone);
    const currentTimeZoneLabel = getTimeZoneLabel(timeZone);
    const pageError =
        localActionError ??
        errors.error ??
        errors.identificador ??
        lookupError ??
        null;
    const isBusy = isSearching || executingAction !== null;

    const actionOptions = useMemo(() => {
        if (!employee) {
            return [];
        }

        if (!fichajeActivo || fichajeActivo.estado === 'finalizada') {
            return [
                {
                    action: 'iniciar' as const,
                    label: 'Fichar entrada',
                    icon: LogIn,
                    className:
                        'bg-emerald-600 text-white hover:bg-emerald-700',
                },
            ];
        }

        if (fichajeActivo.estado === 'pausa') {
            return [
                {
                    action: 'pausa' as const,
                    label: 'Reanudar jornada',
                    icon: LogIn,
                    className:
                        'bg-amber-500 text-slate-950 hover:bg-amber-400',
                },
                {
                    action: 'finalizar' as const,
                    label: 'Fichar salida',
                    icon: LogOut,
                    className: 'bg-red-600 text-white hover:bg-red-700',
                },
            ];
        }

        return [
            {
                action: 'pausa' as const,
                label: 'Fichar pausa',
                icon: Coffee,
                className: 'bg-amber-500 text-slate-950 hover:bg-amber-400',
            },
            {
                action: 'finalizar' as const,
                label: 'Fichar salida',
                icon: LogOut,
                className: 'bg-red-600 text-white hover:bg-red-700',
            },
        ];
    }, [employee, fichajeActivo]);

    const estadoLabel = !fichajeActivo || fichajeActivo.estado === 'finalizada'
        ? 'Sin jornada activa'
        : fichajeActivo.estado === 'activa'
          ? 'Jornada activa'
          : 'En pausa';

    function handleLookup(event: React.FormEvent) {
        event.preventDefault();
        setLocalActionError(null);
        setVisibleSuccessMessage(null);
        setIsSearching(true);

        router.post(
            '/fichar/publico/buscar',
            { identificador: inputValue },
            {
                preserveScroll: true,
                onFinish: () => setIsSearching(false),
            },
        );
    }

    async function handleAction(action: FichajeAction) {
        if (!employee) {
            return;
        }

        setLocalActionError(null);
        setVisibleSuccessMessage(null);
        setExecutingAction(action);

        let location: LocationState = null;
        let locationError: string | null = null;
        const ipPublica = await resolveClientPublicIp();

        if (employee.remoto) {
            const locationState = await fetchCurrentLocation();
            location = locationState.location;
            locationError = locationState.error;
        } else if (!ipPublica) {
            const locationState = await fetchCurrentLocation();
            location = locationState.location;
            locationError = locationState.error;
        }

        if (employee.remoto && !location) {
            setLocalActionError(
                locationError ??
                    'Debes permitir la geolocalizacion para fichar en remoto.',
            );
            setExecutingAction(null);
            return;
        }

        router.post(
            `/fichar/publico/${action}`,
            {
                identificador,
                lat: location ? String(location.lat) : '',
                lng: location ? String(location.lng) : '',
                accuracy: location ? String(Math.round(location.accuracy)) : '',
                ip_publica: ipPublica,
            },
            {
                preserveScroll: true,
                onFinish: () => setExecutingAction(null),
            },
        );
    }

    return (
        <>
            <Head title="Fichar publico" />

            <div
                className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.18),_transparent_35%),linear-gradient(180deg,_#faf6ee_0%,_#f2eadb_55%,_#e8dfd1_100%)]"
                style={{
                    paddingTop: 'max(1rem, env(safe-area-inset-top))',
                    paddingRight: 'max(1rem, env(safe-area-inset-right))',
                    paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
                    paddingLeft: 'max(1rem, env(safe-area-inset-left))',
                }}
            >
                <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[760px] items-center justify-center">
                    <section className="w-full rounded-[2rem] border border-white/75 bg-white/92 px-4 py-6 shadow-[0_28px_70px_-42px_rgba(68,46,12,0.42)] backdrop-blur sm:px-6 sm:py-8 md:px-8">
                        <div className="text-center">
                            <p className="text-[11px] font-semibold tracking-[0.24em] text-amber-800 uppercase">
                                Terminal de fichaje
                            </p>
                            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl md:text-4xl">
                                Fichaje publico
                            </h1>
                            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600 md:text-base">
                                Introduce el DNI o el codigo de empleado y pulsa
                                fichar para ver las acciones disponibles.
                            </p>
                        </div>

                        <div className="mt-8 rounded-[1.75rem] border border-slate-200 bg-slate-950 px-4 py-5 text-center text-white sm:px-6 sm:py-6">
                            <p className="text-[11px] font-semibold tracking-[0.22em] text-slate-300 uppercase">
                                Hora actual
                            </p>
                            <div className="mt-3 font-mono text-[clamp(3rem,14vw,6rem)] font-semibold tracking-tight tabular-nums">
                                {currentTimeLabel}
                            </div>
                            <p className="mt-2 text-sm text-slate-300">
                                {currentTimeZoneLabel}
                            </p>
                        </div>

                        <form onSubmit={handleLookup} className="mt-6">
                            <label
                                htmlFor="identificador"
                                className="text-[11px] font-semibold tracking-[0.22em] text-slate-600 uppercase"
                            >
                                DNI o codigo de empleado
                            </label>
                            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-stretch">
                                <Input
                                    id="identificador"
                                    value={inputValue}
                                    onChange={(event) => {
                                        setVisibleSuccessMessage(null);
                                        setInputValue(event.target.value);
                                    }}
                                    placeholder="12345678Z o 00421234"
                                    autoFocus
                                    autoComplete="off"
                                    className="h-14 flex-1 rounded-2xl border-slate-300 bg-white px-4 text-[16px] font-mono tracking-[0.12em] text-slate-950 placeholder:tracking-normal"
                                />
                                <Button
                                    type="submit"
                                    disabled={isBusy || inputValue.trim() === ''}
                                    className="h-14 w-full rounded-2xl bg-amber-500 text-base font-semibold text-slate-950 hover:bg-amber-400 sm:w-auto sm:min-w-40"
                                >
                                    Fichar
                                </Button>
                            </div>
                        </form>

                        <div className="mt-6 space-y-3">
                            {visibleSuccessMessage && (
                                <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
                                    <CheckCircle2 className="h-4 w-4" />
                                    <AlertDescription>
                                        {visibleSuccessMessage}
                                    </AlertDescription>
                                </Alert>
                            )}

                            {pageError && (
                                <Alert
                                    variant="destructive"
                                    className="border-red-200 bg-red-50 text-red-900"
                                >
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{pageError}</AlertDescription>
                                </Alert>
                            )}

                            <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                                <p className="flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 shrink-0 text-slate-500" />
                                    La validacion de red y geolocalizacion del
                                    centro se mantiene en cada accion.
                                </p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="overflow-y-auto p-0 sm:max-w-md">
                    <div className="px-4 py-5 sm:px-6">
                        <DialogHeader>
                            <DialogTitle className="text-left text-xl font-semibold">
                                {employee?.name} {employee?.apellido}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="mt-4 space-y-4">
                            <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4">
                                <p className="text-[11px] font-semibold tracking-[0.22em] text-slate-500 uppercase">
                                    Estado actual
                                </p>
                                <p className="mt-2 text-lg font-semibold text-slate-950">
                                    {estadoLabel}
                                </p>
                                <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                                    {employee?.remoto ? (
                                        <MapPin className="h-4 w-4 shrink-0" />
                                    ) : (
                                        <Wifi className="h-4 w-4 shrink-0" />
                                    )}
                                    {employee?.remoto
                                        ? 'Se solicitara la geolocalizacion del dispositivo.'
                                        : 'Se intentara validar primero la IP del centro y, si no estuviera disponible, se usara la ubicacion como respaldo.'}
                                </p>
                            </div>

                            {localActionError && (
                                <Alert
                                    variant="destructive"
                                    className="border-red-200 bg-red-50 text-red-900"
                                >
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        {localActionError}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="grid gap-3">
                                {actionOptions.map((option) => {
                                    const Icon = option.icon;

                                    return (
                                        <Button
                                            key={option.action}
                                            type="button"
                                            disabled={isBusy}
                                            className={`h-14 rounded-2xl text-sm font-semibold sm:text-base ${option.className}`}
                                            onClick={() =>
                                                void handleAction(option.action)
                                            }
                                        >
                                            <Icon className="mr-2 h-5 w-5" />
                                            {executingAction === option.action
                                                ? 'Procesando...'
                                                : option.label}
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>

                        <DialogFooter className="mt-5 sm:flex-row sm:justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                className="h-12 rounded-2xl"
                                onClick={() => setModalOpen(false)}
                                disabled={isBusy}
                            >
                                Cerrar
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
