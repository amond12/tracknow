import { Head, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    Building2,
    Calendar,
    ChevronDown,
    ChevronUp,
    Clock,
    Coffee,
    Filter,
    LogOut,
    MapPin,
    Pencil,
    Plus,
    Search,
    Trash2,
    Users,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
    FilterField,
    FilterInput,
    FilterPanel,
    FilterSelectTrigger,
    filterDropdownClassName,
    filterDropdownEmptyClassName,
    filterDropdownListClassName,
    filterDropdownOptionClassName,
} from '@/components/filter-panel';
import { PaginationNav } from '@/components/pagination-nav';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import AppLayout from '@/layouts/app-layout';
import {
    DEFAULT_WORK_CENTER_TIMEZONE,
    formatDateTimeInTimeZone,
    formatDateValue,
    formatTimeInTimeZone,
    getCurrentDateKeyInTimeZone,
    getDateKeyInTimeZone,
    getTimeInputValueInTimeZone,
    getTimeZoneLabel,
} from '@/lib/timezones';
import { dashboard } from '@/routes';
import type {
    BreadcrumbItem,
    Company,
    EdicionFichaje,
    Fichaje,
    Paginated,
    Pausa,
    User,
    WorkCenter,
} from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard() },
    { title: 'Configuración', href: '/fichajes' },
    { title: 'Registros', href: '/fichajes' },
];

// ─── Tipos locales ────────────────────────────────────────────────────────────

type FichajeConRelaciones = Fichaje & {
    user: Pick<User, 'id' | 'name' | 'apellido' | 'remoto'>;
    work_center: Pick<WorkCenter, 'id' | 'nombre' | 'timezone'>;
    pausas: Pausa[];
    ediciones: EdicionFichaje[];
};

interface Props {
    fichajes: Paginated<FichajeConRelaciones>;
    companies: Pick<Company, 'id' | 'nombre'>[];
    workCenters: (Pick<WorkCenter, 'id' | 'nombre'> & { company_id: number })[];
    employees: (Pick<User, 'id' | 'name' | 'apellido' | 'remoto'> & {
        company_id: number;
        work_center_id: number;
        work_center?: Pick<WorkCenter, 'id' | 'nombre' | 'timezone'>;
    })[];
    filters: {
        empresa_id?: string;
        centro_id?: string;
        empleado_id?: string;
        fecha_desde?: string;
        fecha_hasta?: string;
    };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSeconds(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

function campoLabel(campo: string): string {
    const map: Record<string, string> = {
        inicio_jornada: 'Entrada',
        fin_jornada: 'Salida',
        inicio_pausa: 'Inicio pausa',
        fin_pausa: 'Fin pausa',
        finalizacion_admin: 'Finalización (admin)',
        creacion_admin: 'Creación manual (admin)',
        creacion_pausa: 'Pausa añadida (admin)',
        eliminacion_pausa: 'Pausa eliminada (admin)',
        eliminacion: 'Eliminación (admin)',
    };
    return map[campo] ?? campo;
}

// ─── Subcomponentes del modal ─────────────────────────────────────────────────

function MapLink({
    lat,
    lng,
    label,
}: {
    lat: number;
    lng: number;
    label: string;
}) {
    return (
        <a
            href={`https://www.google.com/maps?q=${lat},${lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400"
        >
            <MapPin className="h-3 w-3" />
            <span className="text-xs">{label}</span>
        </a>
    );
}

function HoraEditable({
    label,
    valor,
    urlPut,
    campo,
    fecha,
    timeZone,
    onSuccess,
}: {
    label: string;
    valor: string | null | undefined;
    urlPut: string;
    campo: string;
    fecha: string;
    timeZone: string;
    onSuccess: () => void;
}) {
    const [editing, setEditing] = useState(false);
    const [hora, setHora] = useState(
        valor ? getTimeInputValueInTimeZone(valor, timeZone) : '',
    );
    const [motivo, setMotivo] = useState('');
    const [processing, setProcessing] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    function handleSave(e: React.FormEvent) {
        e.preventDefault();
        const baseDate = valor ? getDateKeyInTimeZone(valor, timeZone) : fecha;
        const localIso = `${baseDate}T${hora}:00`;

        setProcessing(true);
        router.put(
            urlPut,
            { campo, datetime: localIso, motivo },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setEditing(false);
                    setMotivo('');
                    setFieldErrors({});
                    onSuccess();
                },
                onError: (errs) => setFieldErrors(errs),
                onFinish: () => setProcessing(false),
            },
        );
    }

    return (
        <div className="flex flex-col gap-1">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {label}
            </span>
            {!editing ? (
                <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-medium">
                        {valor ? formatTimeInTimeZone(valor, timeZone) : '—'}
                    </span>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 hover:bg-primary/10 hover:text-primary"
                        onClick={() => {
                            setHora(
                                valor
                                    ? getTimeInputValueInTimeZone(
                                          valor,
                                          timeZone,
                                      )
                                    : '',
                            );
                            setEditing(true);
                        }}
                        title={valor ? 'Editar' : 'Añadir hora'}
                    >
                        <Pencil className="h-3 w-3" />
                    </Button>
                </div>
            ) : (
                <form
                    onSubmit={handleSave}
                    className="flex flex-col gap-2 rounded-xl border bg-muted/20 p-4"
                >
                    <div className="grid gap-1">
                        <Label htmlFor={`hora-${campo}`} className="text-xs">
                            Nueva hora
                        </Label>
                        <Input
                            id={`hora-${campo}`}
                            type="time"
                            value={hora}
                            onChange={(e) => setHora(e.target.value)}
                            className="h-9 w-32 text-sm"
                            required
                        />
                        {fieldErrors.hora && (
                            <p className="text-xs text-destructive">
                                {fieldErrors.hora}
                            </p>
                        )}
                    </div>
                    <div className="grid gap-1">
                        <Label htmlFor={`motivo-${campo}`} className="text-xs">
                            Motivo (obligatorio)
                        </Label>
                        <textarea
                            id={`motivo-${campo}`}
                            value={motivo}
                            onChange={(e) => setMotivo(e.target.value)}
                            className="min-h-[60px] w-full resize-none rounded-md border bg-background px-3 py-2 text-xs"
                            placeholder="Indica el motivo de la modificación..."
                            required
                        />
                        {fieldErrors.motivo && (
                            <p className="text-xs text-destructive">
                                {fieldErrors.motivo}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button type="submit" size="sm" disabled={processing}>
                            {processing && <Spinner />}
                            Guardar
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                                setEditing(false);
                                setMotivo('');
                                setFieldErrors({});
                            }}
                        >
                            Cancelar
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
}

function FinalizarSection({
    fichaje,
    onSuccess,
}: {
    fichaje: FichajeConRelaciones;
    onSuccess: () => void;
}) {
    const { data, setData, post, processing, errors } = useForm({ motivo: '' });

    function handleFinalizar(e: React.FormEvent) {
        e.preventDefault();
        post(`/fichajes/${fichaje.id}/finalizar`, {
            preserveScroll: true,
            onSuccess,
        });
    }

    return (
        <div className="overflow-hidden rounded-xl border border-orange-200 bg-orange-50/50 dark:border-orange-900/40 dark:bg-orange-900/10">
            <div className="flex items-center gap-2 border-b border-orange-200/60 bg-orange-100/50 px-4 py-3 dark:border-orange-900/30 dark:bg-orange-900/20">
                <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <h4 className="text-sm font-semibold text-orange-700 dark:text-orange-400">
                    Finalizar jornada
                </h4>
            </div>
            <div className="p-4">
                {fichaje.estado === 'pausa' && (
                    <p className="mb-3 text-xs text-muted-foreground">
                        El fichaje está en pausa. Al finalizar se cerrará la
                        pausa activa y la jornada a la misma hora.
                    </p>
                )}
                <form
                    onSubmit={handleFinalizar}
                    className="flex flex-col gap-2"
                >
                    <div className="grid gap-1">
                        <Label className="text-xs">Motivo (obligatorio)</Label>
                        <textarea
                            value={data.motivo}
                            onChange={(e) => setData('motivo', e.target.value)}
                            className="min-h-[60px] w-full resize-none rounded-md border bg-background px-3 py-2 text-xs"
                            placeholder="Indica el motivo de la finalización..."
                            required
                        />
                        {errors.motivo && (
                            <p className="text-xs text-destructive">
                                {errors.motivo}
                            </p>
                        )}
                    </div>
                    <Button
                        type="submit"
                        variant="destructive"
                        size="sm"
                        disabled={processing}
                        className="w-fit gap-2"
                    >
                        {processing ? (
                            <Spinner />
                        ) : (
                            <LogOut className="h-3.5 w-3.5" />
                        )}
                        Finalizar jornada
                    </Button>
                </form>
            </div>
        </div>
    );
}

function TrazabilidadSection({
    ediciones,
    timeZone,
}: {
    ediciones: EdicionFichaje[];
    timeZone: string;
}) {
    const [open, setOpen] = useState(false);

    if (ediciones.length === 0) return null;

    return (
        <div className="overflow-hidden rounded-xl border">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/40"
            >
                <span>
                    Trazabilidad ({ediciones.length}{' '}
                    {ediciones.length === 1 ? 'modificación' : 'modificaciones'}
                    )
                </span>
                {open ? (
                    <ChevronUp className="h-4 w-4" />
                ) : (
                    <ChevronDown className="h-4 w-4" />
                )}
            </button>
            {open && (
                <div className="divide-y border-t">
                    {ediciones.map((ed) => {
                        const esCampoHora = [
                            'inicio_jornada',
                            'fin_jornada',
                            'inicio_pausa',
                            'fin_pausa',
                            'finalizacion_admin',
                        ].includes(ed.campo);
                        const fmtValor = (v: string | null | undefined) =>
                            esCampoHora && v
                                ? formatTimeInTimeZone(v, timeZone)
                                : (v ?? '—');
                        return (
                            <div key={ed.id} className="px-4 py-3 text-xs">
                                <div className="mb-1.5 flex items-center justify-between gap-2">
                                    <span className="rounded bg-muted px-1.5 py-0.5 font-mono font-semibold">
                                        {campoLabel(ed.campo)}
                                    </span>
                                    <span className="text-muted-foreground">
                                        {formatDateTimeInTimeZone(
                                            ed.created_at,
                                            timeZone,
                                        )}
                                    </span>
                                </div>
                                {ed.valor_anterior ? (
                                    <p className="text-muted-foreground">
                                        <span className="line-through">
                                            {fmtValor(ed.valor_anterior)}
                                        </span>
                                        {' → '}
                                        <span className="font-semibold text-foreground">
                                            {fmtValor(ed.valor_nuevo)}
                                        </span>
                                    </p>
                                ) : (
                                    <p className="text-muted-foreground">
                                        Valor:{' '}
                                        <span className="font-semibold text-foreground">
                                            {fmtValor(ed.valor_nuevo)}
                                        </span>
                                    </p>
                                )}
                                <p className="mt-1">
                                    <span className="text-muted-foreground">
                                        Motivo:{' '}
                                    </span>
                                    {ed.motivo}
                                </p>
                                {ed.user && (
                                    <p className="mt-0.5 text-muted-foreground">
                                        Por: {ed.user.name}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function EliminarSection({
    fichaje,
    onDeleted,
}: {
    fichaje: FichajeConRelaciones;
    onDeleted: () => void;
}) {
    const [motivo, setMotivo] = useState('');
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [open, setOpen] = useState(false);

    function handleEliminar(e: React.FormEvent) {
        e.preventDefault();
        setProcessing(true);
        router.delete(`/fichajes/${fichaje.id}`, {
            data: { motivo },
            preserveScroll: true,
            onSuccess: onDeleted,
            onError: (errs) => setErrors(errs),
            onFinish: () => setProcessing(false),
        });
    }

    return (
        <div className="overflow-hidden rounded-xl border border-destructive/20">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5"
            >
                <span className="flex items-center gap-2">
                    <Trash2 className="h-3.5 w-3.5" />
                    Eliminar fichaje
                </span>
                {open ? (
                    <ChevronUp className="h-4 w-4" />
                ) : (
                    <ChevronDown className="h-4 w-4" />
                )}
            </button>
            {open && (
                <div className="border-t bg-destructive/5 p-4">
                    <p className="mb-3 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                        El fichaje quedará eliminado pero su registro
                        permanecerá en la base de datos para cumplimiento legal
                        (Ley 10/2021).
                    </p>
                    <form
                        onSubmit={handleEliminar}
                        className="flex flex-col gap-2"
                    >
                        <div className="grid gap-1">
                            <Label className="text-xs">
                                Motivo de eliminación (obligatorio)
                            </Label>
                            <textarea
                                value={motivo}
                                onChange={(e) => setMotivo(e.target.value)}
                                className="min-h-[60px] w-full resize-none rounded-md border bg-background px-3 py-2 text-xs"
                                placeholder="Indica el motivo de la eliminación..."
                                required
                            />
                            {errors.motivo && (
                                <p className="text-xs text-destructive">
                                    {errors.motivo}
                                </p>
                            )}
                        </div>
                        <Button
                            type="submit"
                            variant="destructive"
                            size="sm"
                            disabled={processing}
                            className="w-fit gap-2"
                        >
                            {processing ? (
                                <Spinner />
                            ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                            )}
                            Confirmar eliminación
                        </Button>
                    </form>
                </div>
            )}
        </div>
    );
}

type PausaForm = { inicio_pausa: string; fin_pausa: string };

function NuevoFichajeModal({
    employees,
    empresaId,
    onClose,
}: {
    employees: Props['employees'];
    empresaId: string;
    onClose: () => void;
}) {
    const availableEmployees =
        empresaId === 'all'
            ? employees
            : employees.filter((e) => e.company_id === Number(empresaId));
    const initialDate = getCurrentDateKeyInTimeZone(
        DEFAULT_WORK_CENTER_TIMEZONE,
    );

    const [data, setData] = useState({
        employee_id: '',
        fecha: initialDate,
        inicio_jornada: '',
        fin_jornada: '',
        motivo: '',
    });
    const [pausas, setPausas] = useState<PausaForm[]>([]);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    function update(field: keyof typeof data, value: string) {
        setData((prev) => ({ ...prev, [field]: value }));
    }

    function addPausa() {
        setPausas((prev) => [...prev, { inicio_pausa: '', fin_pausa: '' }]);
    }

    function removePausa(idx: number) {
        setPausas((prev) => prev.filter((_, i) => i !== idx));
    }

    function updatePausa(idx: number, field: keyof PausaForm, value: string) {
        setPausas((prev) =>
            prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)),
        );
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (processing) return;
        setProcessing(true);

        const toLocalIso = (time: string) => `${data.fecha}T${time}:00`;

        const payload = {
            employee_id: data.employee_id,
            fecha: data.fecha,
            inicio_jornada: toLocalIso(data.inicio_jornada),
            fin_jornada: data.fin_jornada ? toLocalIso(data.fin_jornada) : null,
            motivo: data.motivo,
            pausas: pausas.map((p) => ({
                inicio_pausa: toLocalIso(p.inicio_pausa),
                fin_pausa: p.fin_pausa ? toLocalIso(p.fin_pausa) : null,
            })),
        };

        router.post('/fichajes', payload, {
            preserveScroll: true,
            onSuccess: () => {
                setData({
                    employee_id: '',
                    fecha: initialDate,
                    inicio_jornada: '',
                    fin_jornada: '',
                    motivo: '',
                });
                setPausas([]);
                setErrors({});
                onClose();
            },
            onError: (errs) => setErrors(errs),
            onFinish: () => setProcessing(false),
        });
    }

    const selectedEmployee = availableEmployees.find(
        (e) => String(e.id) === data.employee_id,
    );
    const selectedTimeZone =
        selectedEmployee?.work_center?.timezone ?? DEFAULT_WORK_CENTER_TIMEZONE;

    return (
        <DialogContent className="max-h-[90vh] w-full overflow-y-auto sm:max-w-lg">
            <DialogHeader>
                <div className="-mx-6 -mt-6 mb-2 flex items-center gap-3 rounded-t-lg border-b bg-muted/40 px-6 py-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Plus className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <DialogTitle className="text-base font-semibold">
                            Nuevo fichaje manual
                        </DialogTitle>
                        <p className="text-xs text-muted-foreground">
                            Crea un fichaje con fecha y horas personalizadas
                        </p>
                    </div>
                </div>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Sección: Empleado y fecha */}
                <div className="overflow-hidden rounded-xl border">
                    <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-2.5">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                            Empleado y fecha
                        </span>
                    </div>
                    <div className="grid gap-4 p-4 sm:grid-cols-2">
                        <div className="grid gap-1.5 sm:col-span-2">
                            <Label className="text-xs font-medium">
                                Empleado
                            </Label>
                            <Select
                                value={data.employee_id}
                                onValueChange={(value) => {
                                    const employee = availableEmployees.find(
                                        (item) => String(item.id) === value,
                                    );
                                    const timeZone =
                                        employee?.work_center?.timezone ??
                                        DEFAULT_WORK_CENTER_TIMEZONE;
                                    setData((prev) => ({
                                        ...prev,
                                        employee_id: value,
                                        fecha: getCurrentDateKeyInTimeZone(
                                            timeZone,
                                        ),
                                    }));
                                }}
                            >
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Selecciona un empleado" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableEmployees.map((e) => (
                                        <SelectItem
                                            key={e.id}
                                            value={String(e.id)}
                                        >
                                            {e.name} {e.apellido}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.employee_id && (
                                <p className="text-xs text-destructive">
                                    {errors.employee_id}
                                </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Hora oficial del centro:{' '}
                                {getTimeZoneLabel(selectedTimeZone)}
                            </p>
                        </div>

                        {selectedEmployee && (
                            <div className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2 text-sm sm:col-span-2">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                    {[
                                        selectedEmployee.name,
                                        selectedEmployee.apellido,
                                    ]
                                        .map((value) => value?.[0] ?? '')
                                        .join('')
                                        .toUpperCase()}
                                </div>
                                <span className="font-medium text-foreground">
                                    {selectedEmployee.name}{' '}
                                    {selectedEmployee.apellido}
                                </span>
                                {selectedEmployee.work_center && (
                                    <span className="text-xs text-muted-foreground">
                                        {selectedEmployee.work_center.nombre}
                                    </span>
                                )}
                                {selectedEmployee.remoto && (
                                    <span className="ml-auto rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                        Remoto
                                    </span>
                                )}
                            </div>
                        )}

                        <div className="grid gap-1.5 sm:col-span-2">
                            <Label
                                htmlFor="modal-fecha"
                                className="flex items-center gap-1.5 text-xs font-medium"
                            >
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                Fecha
                            </Label>
                            <Input
                                id="modal-fecha"
                                type="date"
                                value={data.fecha}
                                onChange={(e) =>
                                    update('fecha', e.target.value)
                                }
                                className="h-9"
                                required
                            />
                            {errors.fecha && (
                                <p className="text-xs text-destructive">
                                    {errors.fecha}
                                </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                La fecha y las horas se interpretan con la zona
                                del centro seleccionado.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Sección: Horario */}
                <div className="overflow-hidden rounded-xl border">
                    <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-2.5">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                            Horario de jornada
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 p-4">
                        <div className="grid gap-1.5">
                            <Label className="text-xs font-medium">
                                Entrada{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                type="time"
                                value={data.inicio_jornada}
                                onChange={(e) =>
                                    update('inicio_jornada', e.target.value)
                                }
                                className="h-9"
                                required
                            />
                            {errors.inicio_jornada && (
                                <p className="text-xs text-destructive">
                                    {errors.inicio_jornada}
                                </p>
                            )}
                        </div>
                        <div className="grid gap-1.5">
                            <Label className="text-xs font-medium text-muted-foreground">
                                Salida{' '}
                                <span className="text-xs font-normal">
                                    (opcional)
                                </span>
                            </Label>
                            <Input
                                type="time"
                                value={data.fin_jornada}
                                onChange={(e) =>
                                    update('fin_jornada', e.target.value)
                                }
                                className="h-9"
                            />
                            {errors.fin_jornada && (
                                <p className="text-xs text-destructive">
                                    {errors.fin_jornada}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sección: Pausas */}
                <div className="overflow-hidden rounded-xl border">
                    <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2.5">
                        <div className="flex items-center gap-2">
                            <Coffee className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                Pausas
                            </span>
                            {pausas.length > 0 && (
                                <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium">
                                    {pausas.length}
                                </span>
                            )}
                        </div>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1 text-xs"
                            onClick={addPausa}
                        >
                            <Plus className="h-3 w-3" />
                            Añadir
                        </Button>
                    </div>
                    {pausas.length === 0 ? (
                        <p className="px-4 py-3 text-xs text-muted-foreground">
                            Sin pausas. Pulsa "Añadir" para incluir una.
                        </p>
                    ) : (
                        <div className="flex flex-col divide-y">
                            {pausas.map((p, idx) => (
                                <div
                                    key={idx}
                                    className="grid grid-cols-[1fr_1fr_auto] items-end gap-3 px-4 py-3"
                                >
                                    <div className="grid gap-1.5">
                                        <Label className="text-xs font-medium">
                                            <span className="mr-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
                                                {idx + 1}
                                            </span>
                                            Inicio
                                        </Label>
                                        <Input
                                            type="time"
                                            value={p.inicio_pausa}
                                            onChange={(e) =>
                                                updatePausa(
                                                    idx,
                                                    'inicio_pausa',
                                                    e.target.value,
                                                )
                                            }
                                            required
                                            className="h-8 text-sm"
                                        />
                                        {(errors as Record<string, string>)[
                                            `pausas.${idx}.inicio_pausa`
                                        ] && (
                                            <p className="text-xs text-destructive">
                                                {
                                                    (
                                                        errors as Record<
                                                            string,
                                                            string
                                                        >
                                                    )[
                                                        `pausas.${idx}.inicio_pausa`
                                                    ]
                                                }
                                            </p>
                                        )}
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label className="text-xs text-muted-foreground">
                                            Fin{' '}
                                            <span className="text-xs">
                                                (opcional)
                                            </span>
                                        </Label>
                                        <Input
                                            type="time"
                                            value={p.fin_pausa}
                                            onChange={(e) =>
                                                updatePausa(
                                                    idx,
                                                    'fin_pausa',
                                                    e.target.value,
                                                )
                                            }
                                            className="h-8 text-sm"
                                        />
                                        {(errors as Record<string, string>)[
                                            `pausas.${idx}.fin_pausa`
                                        ] && (
                                            <p className="text-xs text-destructive">
                                                {
                                                    (
                                                        errors as Record<
                                                            string,
                                                            string
                                                        >
                                                    )[
                                                        `pausas.${idx}.fin_pausa`
                                                    ]
                                                }
                                            </p>
                                        )}
                                    </div>
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        className="mb-0.5 h-8 w-8 shrink-0 text-destructive hover:bg-destructive/10"
                                        onClick={() => removePausa(idx)}
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sección: Motivo */}
                <div className="overflow-hidden rounded-xl border">
                    <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-2.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                            Motivo de creación
                        </span>
                    </div>
                    <div className="p-4">
                        <textarea
                            value={data.motivo}
                            onChange={(e) => update('motivo', e.target.value)}
                            className="min-h-[72px] w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:outline-none"
                            placeholder="Indica el motivo por el que se crea este fichaje manualmente..."
                            required
                        />
                        {errors.motivo && (
                            <p className="mt-1 text-xs text-destructive">
                                {errors.motivo}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex gap-2 pt-1">
                    <Button
                        type="submit"
                        disabled={processing}
                        className="flex-1 gap-2 sm:flex-none"
                    >
                        {processing ? (
                            <Spinner />
                        ) : (
                            <Plus className="h-4 w-4" />
                        )}
                        Crear fichaje
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="flex-1 sm:flex-none"
                    >
                        Cancelar
                    </Button>
                </div>
            </form>
        </DialogContent>
    );
}

function EliminarPausaButton({
    fichaje,
    pausa,
    onSuccess,
}: {
    fichaje: FichajeConRelaciones;
    pausa: Pausa;
    onSuccess: () => void;
}) {
    const [open, setOpen] = useState(false);
    const [motivo, setMotivo] = useState('');
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    function handleEliminar(e: React.FormEvent) {
        e.preventDefault();
        setProcessing(true);
        router.delete(`/fichajes/${fichaje.id}/pausas/${pausa.id}`, {
            data: { motivo },
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                setMotivo('');
                setErrors({});
                onSuccess();
            },
            onError: (errs) => setErrors(errs),
            onFinish: () => setProcessing(false),
        });
    }

    if (!open) {
        return (
            <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-6 w-6 shrink-0 text-destructive"
                title="Eliminar pausa"
                onClick={() => setOpen(true)}
            >
                <Trash2 className="h-3.5 w-3.5" />
            </Button>
        );
    }

    return (
        <form
            onSubmit={handleEliminar}
            className="col-span-2 flex flex-col gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3"
        >
            <p className="text-xs font-medium text-destructive">
                Confirmar eliminación de pausa
            </p>
            <div className="grid gap-1">
                <Label className="text-xs">Motivo (obligatorio)</Label>
                <textarea
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    className="min-h-[50px] w-full resize-none rounded-md border bg-background px-3 py-2 text-xs"
                    placeholder="Indica el motivo de la eliminación..."
                    required
                />
                {errors.motivo && (
                    <p className="text-xs text-destructive">{errors.motivo}</p>
                )}
            </div>
            <div className="flex gap-2">
                <Button
                    type="submit"
                    size="sm"
                    variant="destructive"
                    disabled={processing}
                    className="gap-2"
                >
                    {processing && <Spinner />}
                    Eliminar
                </Button>
                <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                        setOpen(false);
                        setMotivo('');
                        setErrors({});
                    }}
                >
                    Cancelar
                </Button>
            </div>
        </form>
    );
}

function AnadirPausaSection({
    fichaje,
    fecha,
    timeZone,
    onSuccess,
}: {
    fichaje: FichajeConRelaciones;
    fecha: string;
    timeZone: string;
    onSuccess: () => void;
}) {
    const [open, setOpen] = useState(false);
    const [inicioPausa, setInicioPausa] = useState('');
    const [finPausa, setFinPausa] = useState('');
    const [motivo, setMotivo] = useState('');
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (processing) return;
        setProcessing(true);

        const toLocalIso = (time: string) =>
            `${fecha.substring(0, 10)}T${time}:00`;

        router.post(
            `/fichajes/${fichaje.id}/pausas`,
            {
                inicio_pausa: toLocalIso(inicioPausa),
                fin_pausa: finPausa ? toLocalIso(finPausa) : null,
                motivo,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setInicioPausa('');
                    setFinPausa('');
                    setMotivo('');
                    setErrors({});
                    setOpen(false);
                    onSuccess();
                },
                onError: (errs) => setErrors(errs),
                onFinish: () => setProcessing(false),
            },
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/40"
            >
                <span className="flex items-center gap-2">
                    <Plus className="h-3.5 w-3.5 text-primary" />
                    Añadir pausa
                </span>
                {open ? (
                    <ChevronUp className="h-4 w-4" />
                ) : (
                    <ChevronDown className="h-4 w-4" />
                )}
            </button>
            {open && (
                <div className="border-t p-4">
                    <p className="mb-3 text-xs text-muted-foreground">
                        Hora oficial del centro: {getTimeZoneLabel(timeZone)}
                    </p>
                    <form
                        onSubmit={handleSubmit}
                        className="flex flex-col gap-3"
                    >
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-1">
                                <Label className="text-xs">Inicio pausa</Label>
                                <Input
                                    type="time"
                                    value={inicioPausa}
                                    onChange={(e) =>
                                        setInicioPausa(e.target.value)
                                    }
                                    className="h-8 text-sm"
                                    required
                                />
                                {errors.inicio_pausa && (
                                    <p className="text-xs text-destructive">
                                        {errors.inicio_pausa}
                                    </p>
                                )}
                            </div>
                            <div className="grid gap-1">
                                <Label className="text-xs">
                                    Fin pausa (opcional)
                                </Label>
                                <Input
                                    type="time"
                                    value={finPausa}
                                    onChange={(e) =>
                                        setFinPausa(e.target.value)
                                    }
                                    className="h-8 text-sm"
                                />
                                {errors.fin_pausa && (
                                    <p className="text-xs text-destructive">
                                        {errors.fin_pausa}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="grid gap-1">
                            <Label className="text-xs">
                                Motivo (obligatorio)
                            </Label>
                            <textarea
                                value={motivo}
                                onChange={(e) => setMotivo(e.target.value)}
                                className="min-h-[60px] w-full resize-none rounded-md border bg-background px-3 py-2 text-xs"
                                placeholder="Indica el motivo por el que se añade esta pausa..."
                                required
                            />
                            {errors.motivo && (
                                <p className="text-xs text-destructive">
                                    {errors.motivo}
                                </p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                type="submit"
                                size="sm"
                                disabled={processing}
                                className="gap-2"
                            >
                                {processing && <Spinner />}
                                Guardar pausa
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => setOpen(false)}
                            >
                                Cancelar
                            </Button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

function FichajeModal({
    fichaje,
    onClose,
}: {
    fichaje: FichajeConRelaciones;
    onClose: () => void;
}) {
    const estadoBadge = {
        activa: {
            label: 'Activa',
            className:
                'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
            dotClass: 'bg-green-500',
        },
        pausa: {
            label: 'En pausa',
            className:
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
            dotClass: 'bg-yellow-500',
        },
        finalizada: {
            label: 'Finalizada',
            className: 'bg-muted text-muted-foreground',
            dotClass: 'bg-muted-foreground/50',
        },
    } as const;

    const estado = estadoBadge[fichaje.estado];
    const urlJornada = `/fichajes/${fichaje.id}/jornada`;
    const timeZone =
        fichaje.timezone ??
        fichaje.work_center?.timezone ??
        DEFAULT_WORK_CENTER_TIMEZONE;

    function reload() {
        router.reload({ only: ['fichajes'] });
    }

    function reloadAndClose() {
        router.reload({ only: ['fichajes'] });
        onClose();
    }

    const initials = [fichaje.user?.name, fichaje.user?.apellido]
        .filter(Boolean)
        .map((s) => s![0])
        .join('')
        .toUpperCase();

    return (
        <DialogContent className="max-h-[90vh] w-full overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
                <div className="-mx-6 -mt-6 mb-4 flex items-center justify-between gap-3 rounded-t-lg border-b bg-muted/40 px-6 py-4">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                            {initials}
                        </div>
                        <div className="min-w-0">
                            <DialogTitle className="text-lg leading-tight font-semibold">
                                {fichaje.user?.name} {fichaje.user?.apellido}
                            </DialogTitle>
                            <p className="text-sm text-muted-foreground">
                                {formatDateValue(fichaje.fecha)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {getTimeZoneLabel(timeZone)}
                            </p>
                        </div>
                    </div>
                    <span
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${estado.className}`}
                    >
                        <span
                            className={`h-2 w-2 rounded-full ${estado.dotClass}`}
                        />
                        {estado.label}
                    </span>
                </div>
            </DialogHeader>

            <div className="flex flex-col gap-4">
                {/* Jornada */}
                <div className="overflow-hidden rounded-xl border">
                    <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <h4 className="text-sm font-semibold">Jornada</h4>
                    </div>
                    <div className="p-4">
                        <div className="grid grid-cols-2 gap-4">
                            <HoraEditable
                                label="Entrada"
                                valor={fichaje.inicio_jornada}
                                urlPut={urlJornada}
                                campo="inicio_jornada"
                                fecha={fichaje.fecha}
                                timeZone={timeZone}
                                onSuccess={reload}
                            />
                            <HoraEditable
                                label="Salida"
                                valor={fichaje.fin_jornada ?? undefined}
                                urlPut={urlJornada}
                                campo="fin_jornada"
                                fecha={fichaje.fecha}
                                timeZone={timeZone}
                                onSuccess={reload}
                            />
                        </div>
                        {fichaje.duracion_jornada != null && (
                            <div className="mt-4">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                    <Clock className="h-3 w-3" />
                                    {formatSeconds(
                                        fichaje.duracion_jornada,
                                    )}{' '}
                                    trabajados
                                </span>
                            </div>
                        )}
                        {fichaje.user?.remoto && (
                            <div className="mt-3 flex gap-3">
                                {fichaje.lat_inicio && fichaje.lng_inicio && (
                                    <MapLink
                                        lat={fichaje.lat_inicio}
                                        lng={fichaje.lng_inicio}
                                        label="Ubicación entrada"
                                    />
                                )}
                                {fichaje.lat_fin && fichaje.lng_fin && (
                                    <MapLink
                                        lat={fichaje.lat_fin}
                                        lng={fichaje.lng_fin}
                                        label="Ubicación salida"
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Pausas */}
                {fichaje.pausas.length > 0 && (
                    <div className="overflow-hidden rounded-xl border">
                        <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-3">
                            <Coffee className="h-4 w-4 text-muted-foreground" />
                            <h4 className="text-sm font-semibold">Pausas</h4>
                        </div>
                        <div className="flex flex-col gap-3 p-4">
                            {fichaje.pausas.map((pausa, idx) => {
                                const urlPausa = `/fichajes/${fichaje.id}/pausas/${pausa.id}`;
                                return (
                                    <div
                                        key={pausa.id}
                                        className="rounded-lg border bg-muted/20 p-3"
                                    >
                                        <div className="mb-2 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-medium">
                                                    {idx + 1}
                                                </span>
                                                {pausa.duracion_pausa !=
                                                    null && (
                                                    <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs">
                                                        {formatSeconds(
                                                            pausa.duracion_pausa,
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                            <EliminarPausaButton
                                                fichaje={fichaje}
                                                pausa={pausa}
                                                onSuccess={reload}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <HoraEditable
                                                label="Inicio"
                                                valor={pausa.inicio_pausa}
                                                urlPut={urlPausa}
                                                campo="inicio_pausa"
                                                fecha={fichaje.fecha}
                                                timeZone={timeZone}
                                                onSuccess={reload}
                                            />
                                            <HoraEditable
                                                label="Fin"
                                                valor={
                                                    pausa.fin_pausa ?? undefined
                                                }
                                                urlPut={urlPausa}
                                                campo="fin_pausa"
                                                fecha={fichaje.fecha}
                                                timeZone={timeZone}
                                                onSuccess={reload}
                                            />
                                        </div>
                                        {(pausa.lat_inicio != null &&
                                            pausa.lng_inicio != null) ||
                                        (pausa.lat_fin != null &&
                                            pausa.lng_fin != null) ? (
                                            <div className="mt-3 flex flex-wrap gap-3">
                                                {pausa.lat_inicio != null &&
                                                    pausa.lng_inicio !=
                                                        null && (
                                                        <MapLink
                                                            lat={
                                                                pausa.lat_inicio
                                                            }
                                                            lng={
                                                                pausa.lng_inicio
                                                            }
                                                            label="Ubicación inicio pausa"
                                                        />
                                                    )}
                                                {pausa.lat_fin != null &&
                                                    pausa.lng_fin != null && (
                                                        <MapLink
                                                            lat={pausa.lat_fin}
                                                            lng={pausa.lng_fin}
                                                            label="Ubicación fin pausa"
                                                        />
                                                    )}
                                            </div>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Añadir pausa */}
                <AnadirPausaSection
                    fichaje={fichaje}
                    fecha={fichaje.fecha}
                    timeZone={timeZone}
                    onSuccess={reload}
                />

                {/* Finalizar */}
                {fichaje.estado !== 'finalizada' && (
                    <FinalizarSection fichaje={fichaje} onSuccess={reload} />
                )}

                {/* Trazabilidad */}
                <TrazabilidadSection
                    ediciones={fichaje.ediciones ?? []}
                    timeZone={timeZone}
                />

                {/* Eliminar */}
                <EliminarSection fichaje={fichaje} onDeleted={reloadAndClose} />
            </div>
        </DialogContent>
    );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function FichajesIndex({
    fichajes,
    companies,
    workCenters,
    employees,
    filters,
}: Props) {
    const [empresaId, setEmpresaId] = useState(filters.empresa_id ?? 'all');
    const [centroId, setCentroId] = useState(filters.centro_id ?? 'all');
    const [empleadoId, setEmpleadoId] = useState(filters.empleado_id ?? 'all');
    const initialEmpleado = filters.empleado_id
        ? employees.find(
              (employee) => employee.id === Number(filters.empleado_id),
          )
        : null;
    const [empleadoSearch, setEmpleadoSearch] = useState(
        initialEmpleado
            ? `${initialEmpleado.name} ${initialEmpleado.apellido}`
            : '',
    );
    const [showEmpleadoDropdown, setShowEmpleadoDropdown] = useState(false);
    const empleadoRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                empleadoRef.current &&
                !empleadoRef.current.contains(e.target as Node)
            ) {
                setShowEmpleadoDropdown(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const today = getCurrentDateKeyInTimeZone(DEFAULT_WORK_CENTER_TIMEZONE);
    const [fechaDesde, setFechaDesde] = useState(filters.fecha_desde ?? today);
    const [fechaHasta, setFechaHasta] = useState(filters.fecha_hasta ?? today);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [nuevoOpen, setNuevoOpen] = useState(false);

    const availableWorkCenters =
        empresaId === 'all'
            ? workCenters
            : workCenters.filter((wc) => wc.company_id === Number(empresaId));

    const availableEmployees = employees.filter((employee) => {
        const matchesCompany =
            empresaId === 'all' || employee.company_id === Number(empresaId);
        const matchesWorkCenter =
            centroId === 'all' || employee.work_center_id === Number(centroId);

        return matchesCompany && matchesWorkCenter;
    });
    const normalizedEmpleadoSearch = empleadoSearch
        .trim()
        .toLocaleLowerCase('es-ES');
    const filteredEmployees =
        normalizedEmpleadoSearch.length === 0
            ? availableEmployees
            : availableEmployees.filter((employee) =>
                  `${employee.name} ${employee.apellido}`
                      .toLocaleLowerCase('es-ES')
                      .includes(normalizedEmpleadoSearch),
              );

    function handleEmpresaChange(value: string) {
        setEmpresaId(value);
        setCentroId('all');
        setEmpleadoId('all');
        setEmpleadoSearch('');
        setShowEmpleadoDropdown(false);
    }

    function handleCentroChange(value: string) {
        setCentroId(value);
        setEmpleadoId('all');
        setEmpleadoSearch('');
        setShowEmpleadoDropdown(false);
    }

    function handleEmpleadoSearchChange(value: string) {
        setEmpleadoSearch(value);
        setEmpleadoId('all');
    }

    function handleEmpleadoReset() {
        setEmpleadoId('all');
        setEmpleadoSearch('');
        setShowEmpleadoDropdown(false);
    }

    function handleEmpleadoSelect(employee: (typeof employees)[number]) {
        setEmpleadoId(String(employee.id));
        setEmpleadoSearch(`${employee.name} ${employee.apellido}`);
        setShowEmpleadoDropdown(false);
    }

    function handleFechaDesdeChange(value: string) {
        setFechaDesde(value);
    }

    function handleFechaHastaChange(value: string) {
        setFechaHasta(value);
    }

    function handleReset() {
        setEmpresaId('all');
        setCentroId('all');
        setEmpleadoId('all');
        setEmpleadoSearch('');
        setFechaDesde('');
        setFechaHasta('');
    }

    function buildFilterParams(): Record<string, string> {
        const params: Record<string, string> = {};
        if (empresaId !== 'all') params.empresa_id = empresaId;
        if (centroId !== 'all') params.centro_id = centroId;
        if (empleadoId !== 'all') params.empleado_id = empleadoId;
        if (fechaDesde) params.fecha_desde = fechaDesde;
        if (fechaHasta) params.fecha_hasta = fechaHasta;

        return params;
    }

    function handleApplyFilters() {
        const params = buildFilterParams();

        router.get('/fichajes', params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }

    const fichajeSeleccionado =
        selectedId != null
            ? (fichajes.data.find((f) => f.id === selectedId) ?? null)
            : null;

    const estadoBadge = {
        activa: {
            label: 'Activa',
            className:
                'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
            dot: 'bg-green-500',
        },
        pausa: {
            label: 'En pausa',
            className:
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
            dot: 'bg-yellow-500',
        },
        finalizada: {
            label: 'Finalizada',
            className: 'bg-muted text-muted-foreground',
            dot: 'bg-muted-foreground/50',
        },
    } as const;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Registros de fichajes" />

            <div className="flex flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Registros de fichajes
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Consulta y edita los fichajes de tus empleados
                        </p>
                    </div>
                    <Button
                        className="shrink-0 gap-2"
                        onClick={() => setNuevoOpen(true)}
                    >
                        <Plus className="h-4 w-4" />
                        Nuevo fichaje
                    </Button>
                </div>

                {/* Filtros */}
                <FilterPanel
                    title="Filtros de registros"
                    description="Ajusta empresa, centro, empleado y rango de fechas, y pulsa Actualizar para aplicar los cambios."
                    icon={Filter}
                    tone="blue"
                    meta={
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                onClick={handleApplyFilters}
                                className="gap-2 rounded-xl"
                            >
                                <Search className="h-3.5 w-3.5" />
                                Actualizar
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleReset}
                                className="gap-2 rounded-xl"
                            >
                                <X className="h-3.5 w-3.5" />
                                Limpiar
                            </Button>
                        </div>
                    }
                >
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                        <FilterField
                            label="Empresa"
                            htmlFor="empresa_filter"
                            icon={Building2}
                        >
                            <Select
                                value={empresaId}
                                onValueChange={handleEmpresaChange}
                            >
                                <FilterSelectTrigger id="empresa_filter">
                                    <SelectValue />
                                </FilterSelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Todas las empresas
                                    </SelectItem>
                                    {companies.map((c) => (
                                        <SelectItem
                                            key={c.id}
                                            value={String(c.id)}
                                        >
                                            {c.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField
                            label="Centro de trabajo"
                            htmlFor="centro_filter"
                            icon={Building2}
                            hint={
                                availableWorkCenters.length === 0
                                    ? 'Selecciona una empresa con centros disponibles.'
                                    : undefined
                            }
                        >
                            <Select
                                value={centroId}
                                onValueChange={handleCentroChange}
                                disabled={availableWorkCenters.length === 0}
                            >
                                <FilterSelectTrigger id="centro_filter">
                                    <SelectValue />
                                </FilterSelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Todos los centros
                                    </SelectItem>
                                    {availableWorkCenters.map((wc) => (
                                        <SelectItem
                                            key={wc.id}
                                            value={String(wc.id)}
                                        >
                                            {wc.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField
                            label="Empleado"
                            htmlFor="empleado_filter"
                            icon={Users}
                            hint={
                                availableEmployees.length === 0
                                    ? 'No hay empleados disponibles para esta selección.'
                                    : undefined
                            }
                        >
                            <div className="relative" ref={empleadoRef}>
                                <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                <FilterInput
                                    id="empleado_filter"
                                    type="text"
                                    value={empleadoSearch}
                                    onChange={(e) =>
                                        handleEmpleadoSearchChange(
                                            e.target.value,
                                        )
                                    }
                                    placeholder={
                                        empleadoId === 'all'
                                            ? 'Todos los empleados'
                                            : 'Buscar empleado...'
                                    }
                                    disabled={availableEmployees.length === 0}
                                    className="pl-9"
                                    onFocus={() =>
                                        setShowEmpleadoDropdown(true)
                                    }
                                />
                                {showEmpleadoDropdown && (
                                    <div className={filterDropdownClassName}>
                                        <div
                                            className={
                                                filterDropdownListClassName
                                            }
                                        >
                                            <button
                                                type="button"
                                                className={filterDropdownOptionClassName(
                                                    empleadoId === 'all',
                                                    'sky',
                                                )}
                                                onClick={handleEmpleadoReset}
                                            >
                                                Todos los empleados
                                            </button>
                                            {availableEmployees.length ===
                                                0 && (
                                                <p
                                                    className={
                                                        filterDropdownEmptyClassName
                                                    }
                                                >
                                                    No hay empleados disponibles
                                                </p>
                                            )}
                                            {availableEmployees.length > 0 &&
                                                filteredEmployees.length ===
                                                    0 && (
                                                    <p
                                                        className={
                                                            filterDropdownEmptyClassName
                                                        }
                                                    >
                                                        Sin resultados
                                                    </p>
                                                )}
                                            {filteredEmployees.map(
                                                (employee) => {
                                                    const employeeId = String(
                                                        employee.id,
                                                    );
                                                    return (
                                                        <button
                                                            key={employee.id}
                                                            type="button"
                                                            className={filterDropdownOptionClassName(
                                                                empleadoId ===
                                                                    employeeId,
                                                                'sky',
                                                            )}
                                                            onClick={() =>
                                                                handleEmpleadoSelect(
                                                                    employee,
                                                                )
                                                            }
                                                        >
                                                            {employee.name}{' '}
                                                            {employee.apellido}
                                                        </button>
                                                    );
                                                },
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </FilterField>

                        <FilterField
                            label="Desde"
                            htmlFor="fecha_desde"
                            icon={Calendar}
                        >
                            <FilterInput
                                id="fecha_desde"
                                type="date"
                                value={fechaDesde}
                                onChange={(e) =>
                                    handleFechaDesdeChange(e.target.value)
                                }
                            />
                        </FilterField>

                        <FilterField
                            label="Hasta"
                            htmlFor="fecha_hasta"
                            icon={Calendar}
                        >
                            <FilterInput
                                id="fecha_hasta"
                                type="date"
                                value={fechaHasta}
                                onChange={(e) =>
                                    handleFechaHastaChange(e.target.value)
                                }
                            />
                        </FilterField>
                    </div>
                </FilterPanel>

                {/* Tabla */}
                <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    <div className="flex items-center border-b px-4 py-3">
                        <h2 className="text-sm font-semibold">
                            {fichajes.total > 0
                                ? `${fichajes.total} registro${fichajes.total !== 1 ? 's' : ''}`
                                : 'Registros'}
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/30">
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                        Fecha
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                        Empleado
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                        Entrada
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                        Salida
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                        Pausas
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                        Trabajado
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                        Estado
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                        Ubicación
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {fichajes.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="px-4 py-16 text-center"
                                        >
                                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                <Clock className="h-8 w-8 opacity-30" />
                                                <p className="text-sm font-medium">
                                                    No hay registros
                                                </p>
                                                <p className="text-xs">
                                                    No hay fichajes para los
                                                    filtros seleccionados
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    fichajes.data.map((f) => {
                                        const totalPausas = f.pausas.reduce(
                                            (acc, p) =>
                                                acc + (p.duracion_pausa ?? 0),
                                            0,
                                        );
                                        const estado =
                                            estadoBadge[f.estado] ??
                                            estadoBadge.finalizada;
                                        const timeZone =
                                            f.timezone ??
                                            f.work_center?.timezone ??
                                            DEFAULT_WORK_CENTER_TIMEZONE;

                                        return (
                                            <tr
                                                key={f.id}
                                                className="cursor-pointer transition-colors hover:bg-muted/40"
                                                onClick={() =>
                                                    setSelectedId(f.id)
                                                }
                                            >
                                                <td className="px-4 py-3 font-medium">
                                                    {formatDateValue(f.fecha)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                                            {[
                                                                f.user?.name,
                                                                f.user
                                                                    ?.apellido,
                                                            ]
                                                                .filter(Boolean)
                                                                .map(
                                                                    (s) =>
                                                                        s![0],
                                                                )
                                                                .join('')
                                                                .toUpperCase()}
                                                        </div>
                                                        <span className="font-medium">
                                                            {f.user?.name}{' '}
                                                            {f.user?.apellido}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 font-mono text-sm">
                                                    {formatTimeInTimeZone(
                                                        f.inicio_jornada,
                                                        timeZone,
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-sm">
                                                    {f.fin_jornada ? (
                                                        formatTimeInTimeZone(
                                                            f.fin_jornada,
                                                            timeZone,
                                                        )
                                                    ) : (
                                                        <span className="text-muted-foreground">
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {f.pausas.length > 0 ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                                                            <Coffee className="h-3 w-3" />
                                                            {f.pausas.length} (
                                                            {formatSeconds(
                                                                totalPausas,
                                                            )}
                                                            )
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-sm font-medium">
                                                    {f.duracion_jornada !=
                                                    null ? (
                                                        formatSeconds(
                                                            f.duracion_jornada,
                                                        )
                                                    ) : (
                                                        <span className="font-normal text-muted-foreground">
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${estado.className}`}
                                                    >
                                                        <span
                                                            className={`h-1.5 w-1.5 rounded-full ${estado.dot}`}
                                                        />
                                                        {estado.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {f.user?.remoto ? (
                                                        <div className="flex flex-col gap-1">
                                                            {f.lat_inicio &&
                                                            f.lng_inicio ? (
                                                                <MapLink
                                                                    lat={
                                                                        f.lat_inicio
                                                                    }
                                                                    lng={
                                                                        f.lng_inicio
                                                                    }
                                                                    label="Entrada"
                                                                />
                                                            ) : null}
                                                            {f.lat_fin &&
                                                            f.lng_fin ? (
                                                                <MapLink
                                                                    lat={
                                                                        f.lat_fin
                                                                    }
                                                                    lng={
                                                                        f.lng_fin
                                                                    }
                                                                    label="Salida"
                                                                />
                                                            ) : null}
                                                            {!f.lat_inicio &&
                                                                !f.lat_fin && (
                                                                    <span className="text-xs text-muted-foreground">
                                                                        —
                                                                    </span>
                                                                )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                    <PaginationNav
                        path="/fichajes"
                        pagination={fichajes}
                        query={filters}
                    />
                </div>
            </div>

            {/* Modal de detalle */}
            <Dialog
                open={fichajeSeleccionado !== null}
                onOpenChange={(open) => {
                    if (!open) setSelectedId(null);
                }}
            >
                {fichajeSeleccionado && (
                    <FichajeModal
                        fichaje={fichajeSeleccionado}
                        onClose={() => setSelectedId(null)}
                    />
                )}
            </Dialog>

            {/* Modal nuevo fichaje */}
            <Dialog
                open={nuevoOpen}
                onOpenChange={(open) => {
                    if (!open) setNuevoOpen(false);
                }}
            >
                {nuevoOpen && (
                    <NuevoFichajeModal
                        employees={employees}
                        empresaId={empresaId}
                        onClose={() => setNuevoOpen(false)}
                    />
                )}
            </Dialog>
        </AppLayout>
    );
}
