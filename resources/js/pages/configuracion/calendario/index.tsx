import { Head, router, usePage } from '@inertiajs/react';
import {
    Building2,
    CalendarDays,
    Download,
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
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import AppLayout from '@/layouts/app-layout';
import type { Auth, BreadcrumbItem, User } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Fichar', href: '/fichar' },
    { title: 'Calendario', href: '/calendario' },
];

// ─── Constantes ───────────────────────────────────────────────────────────────

const MESES_LABEL = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
];
const DIAS_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => currentYear - i);

// ─── Tipos ────────────────────────────────────────────────────────────────────

type TipoEvento = 'vacacion' | 'ausencia' | 'festivo';

interface Evento {
    id: number;
    fecha: string;
    tipo: TipoEvento;
    motivo: string | null;
    dia_completo: boolean;
    hora_inicio: string | null;
    hora_fin: string | null;
}

interface Centro {
    id: number;
    nombre: string;
    company_id: number;
}

interface Props {
    employees: Pick<User, 'id' | 'name' | 'apellido'>[];
    centros: Centro[];
    anio: number;
    empleadoId: number | null;
    eventos: Evento[];
    fichajes: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDaysInMonth(mes: number, anio: number): Date[] {
    const days: Date[] = [];
    const d = new Date(anio, mes - 1, 1);
    while (d.getMonth() === mes - 1) {
        days.push(new Date(d));
        d.setDate(d.getDate() + 1);
    }
    return days;
}

function toDateStr(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function getISODay(date: Date): number {
    return (date.getDay() + 6) % 7;
}

function getCsrfToken(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

// ─── Colores por tipo ─────────────────────────────────────────────────────────

const TIPO_COLORS: Record<TipoEvento, string> = {
    vacacion: 'bg-blue-100 border-blue-400 text-blue-800 hover:bg-blue-200',
    ausencia:
        'bg-yellow-100 border-yellow-400 text-yellow-800 hover:bg-yellow-200',
    festivo: 'bg-pink-100 border-pink-400 text-pink-800 hover:bg-pink-200',
};

const TIPO_LABELS: Record<TipoEvento, string> = {
    vacacion: 'Vacación',
    ausencia: 'Ausencia',
    festivo: 'Festivo',
};

// ─── Componente mini-mes ──────────────────────────────────────────────────────

interface MiniMesProps {
    mes: number;
    anio: number;
    eventosPorFecha: Map<string, Evento>;
    fichajesSet: Set<string>;
    onDayClick: (dateStr: string) => void;
}

function MiniMes({
    mes,
    anio,
    eventosPorFecha,
    fichajesSet,
    onDayClick,
}: MiniMesProps) {
    const days = getDaysInMonth(mes, anio);
    const offset = getISODay(days[0]);
    const todayStr = toDateStr(new Date());

    return (
        <div>
            <div className="mb-1.5 text-center text-xs font-bold tracking-wide text-foreground uppercase">
                {MESES_LABEL[mes - 1]}
            </div>
            <div className="mb-0.5 grid grid-cols-7">
                {DIAS_SEMANA.map((d) => (
                    <div
                        key={d}
                        className="py-0.5 text-center text-[10px] font-semibold text-muted-foreground"
                    >
                        {d}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-px">
                {Array.from({ length: offset }).map((_, i) => (
                    <div key={`b${i}`} />
                ))}
                {days.map((date) => {
                    const ds = toDateStr(date);
                    const evento = eventosPorFecha.get(ds);
                    const hasFichaje = fichajesSet.has(ds);
                    const isToday = ds === todayStr;

                    let cls =
                        'relative flex items-center justify-center rounded text-[11px] font-medium h-6 w-full cursor-pointer select-none transition-colors border ';

                    if (evento) {
                        cls += TIPO_COLORS[evento.tipo];
                    } else if (hasFichaje) {
                        cls +=
                            'bg-green-100 border-green-400 text-green-800 hover:bg-green-200';
                    } else {
                        cls +=
                            'bg-transparent border-transparent text-foreground hover:bg-muted/60';
                    }

                    if (isToday) {
                        cls += ' ring-2 ring-primary ring-offset-1';
                    }

                    return (
                        <button
                            key={ds}
                            type="button"
                            className={cls}
                            onClick={() => onDayClick(ds)}
                            title={
                                evento
                                    ? `${TIPO_LABELS[evento.tipo]}${evento.motivo ? ': ' + evento.motivo : ''}`
                                    : hasFichaje
                                      ? 'Día trabajado'
                                      : ds
                            }
                        >
                            {date.getDate()}
                            {evento && hasFichaje && (
                                <span className="absolute top-0 right-0 h-1.5 w-1.5 rounded-full bg-green-500" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Dialog de evento ─────────────────────────────────────────────────────────

interface EventoDialogProps {
    open: boolean;
    onClose: () => void;
    dateStr: string | null;
    empleadoId: number;
    existingEvento: Evento | null;
    hasFichaje: boolean;
    onSaved: (evento: Evento) => void;
    onDeleted: (fecha: string) => void;
    onRangoSaved: (eventos: Evento[]) => void;
}

function EventoDialog({
    open,
    onClose,
    dateStr,
    empleadoId,
    existingEvento,
    hasFichaje,
    onSaved,
    onDeleted,
    onRangoSaved,
}: EventoDialogProps) {
    const [tipo, setTipo] = useState<TipoEvento>('vacacion');
    const [motivo, setMotivo] = useState('');
    const [diaCompleto, setDiaCompleto] = useState(true);
    const [horaInicio, setHoraInicio] = useState('09:00');
    const [horaFin, setHoraFin] = useState('14:00');
    const [usarRango, setUsarRango] = useState(false);
    const [fechaRangoFin, setFechaRangoFin] = useState('');
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (open) {
            if (existingEvento) {
                setTipo(existingEvento.tipo);
                setMotivo(existingEvento.motivo ?? '');
                setDiaCompleto(existingEvento.dia_completo);
                setHoraInicio(existingEvento.hora_inicio ?? '09:00');
                setHoraFin(existingEvento.hora_fin ?? '14:00');
            } else {
                setTipo('vacacion');
                setMotivo('');
                setDiaCompleto(true);
                setHoraInicio('09:00');
                setHoraFin('14:00');
            }
            setUsarRango(false);
            setFechaRangoFin(dateStr ?? '');
            setError('');
        }
    }, [open, existingEvento, dateStr]);

    function handleTipoChange(t: TipoEvento) {
        setTipo(t);
        if (t !== 'vacacion') setUsarRango(false);
    }

    async function handleSave() {
        // Vacación en rango
        if (tipo === 'vacacion' && usarRango) {
            if (!fechaRangoFin || fechaRangoFin < (dateStr ?? '')) {
                setError(
                    'La fecha de fin debe ser igual o posterior al día seleccionado.',
                );
                return;
            }
            setSaving(true);
            setError('');
            try {
                const res = await fetch('/calendario/rango', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-XSRF-TOKEN': getCsrfToken(),
                        Accept: 'application/json',
                    },
                    body: JSON.stringify({
                        user_id: empleadoId,
                        fecha_inicio: dateStr,
                        fecha_fin: fechaRangoFin,
                    }),
                });
                const data = await res.json();
                if (!res.ok) {
                    setError(data.message ?? 'Error al guardar.');
                    return;
                }
                onRangoSaved(data.eventos);
                onClose();
            } catch {
                setError('Error de conexión.');
            } finally {
                setSaving(false);
            }
            return;
        }

        // Día único
        if (tipo === 'ausencia' && !motivo.trim()) {
            setError('El motivo es obligatorio para ausencias.');
            return;
        }
        if (!diaCompleto && (!horaInicio || !horaFin)) {
            setError('Las horas de inicio y fin son obligatorias.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            const res = await fetch('/calendario', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': getCsrfToken(),
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    user_id: empleadoId,
                    fecha: dateStr,
                    tipo,
                    motivo: motivo.trim() || null,
                    dia_completo: diaCompleto,
                    hora_inicio: diaCompleto ? null : horaInicio,
                    hora_fin: diaCompleto ? null : horaFin,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.message ?? 'Error al guardar.');
                return;
            }
            onSaved(data.evento);
            onClose();
        } catch {
            setError('Error de conexión.');
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!existingEvento) return;
        setDeleting(true);
        setError('');
        try {
            const res = await fetch(`/calendario/${existingEvento.id}`, {
                method: 'DELETE',
                headers: {
                    'X-XSRF-TOKEN': getCsrfToken(),
                    Accept: 'application/json',
                },
            });
            if (!res.ok) {
                setError('Error al eliminar.');
                return;
            }
            onDeleted(existingEvento.fecha);
            onClose();
        } catch {
            setError('Error de conexión.');
        } finally {
            setDeleting(false);
        }
    }

    const fechaLabel = dateStr
        ? new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
          })
        : '';

    const diasRango = (() => {
        if (!usarRango || !fechaRangoFin || !dateStr) return 0;
        const diff =
            new Date(fechaRangoFin).getTime() - new Date(dateStr).getTime();
        return diff < 0 ? 0 : Math.round(diff / 86400000) + 1;
    })();

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle className="capitalize">
                        {fechaLabel}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4 pt-1">
                    {/* Tipo */}
                    <div className="grid gap-1.5">
                        <Label className="text-xs font-medium">
                            Tipo de evento
                        </Label>
                        <div className="flex gap-1.5">
                            {(
                                [
                                    'vacacion',
                                    'ausencia',
                                    'festivo',
                                ] as TipoEvento[]
                            ).map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => handleTipoChange(t)}
                                    className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                                        tipo === t
                                            ? t === 'vacacion'
                                                ? 'border-blue-400 bg-blue-100 text-blue-800'
                                                : t === 'ausencia'
                                                  ? 'border-yellow-400 bg-yellow-100 text-yellow-800'
                                                  : 'border-pink-400 bg-pink-100 text-pink-800'
                                            : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/60'
                                    }`}
                                >
                                    {TIPO_LABELS[t]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Periodo (solo vacación nueva) */}
                    {tipo === 'vacacion' && !existingEvento && (
                        <div className="grid gap-1.5">
                            <Label className="text-xs font-medium">
                                Periodo
                            </Label>
                            <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1">
                                <button
                                    type="button"
                                    onClick={() => setUsarRango(false)}
                                    className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                                        !usarRango
                                            ? 'bg-white text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Solo este día
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUsarRango(true)}
                                    className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                                        usarRango
                                            ? 'bg-white text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Rango de fechas
                                </button>
                            </div>

                            {usarRango && (
                                <div className="mt-1 grid grid-cols-2 gap-3">
                                    <div className="grid gap-1">
                                        <Label className="text-xs text-muted-foreground">
                                            Desde
                                        </Label>
                                        <Input
                                            type="date"
                                            value={dateStr ?? ''}
                                            readOnly
                                            className="h-9 cursor-default bg-muted/30"
                                        />
                                    </div>
                                    <div className="grid gap-1">
                                        <Label className="text-xs text-muted-foreground">
                                            Hasta *
                                        </Label>
                                        <Input
                                            type="date"
                                            value={fechaRangoFin}
                                            min={dateStr ?? ''}
                                            onChange={(e) =>
                                                setFechaRangoFin(e.target.value)
                                            }
                                            className="h-9"
                                        />
                                    </div>
                                    {diasRango > 1 && (
                                        <p className="col-span-2 text-xs text-blue-600">
                                            {diasRango} días de vacaciones
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Motivo (ausencia / festivo) */}
                    {(tipo === 'ausencia' || tipo === 'festivo') && (
                        <div className="grid gap-1.5">
                            <Label
                                htmlFor="motivo"
                                className="text-xs font-medium"
                            >
                                {tipo === 'ausencia'
                                    ? 'Motivo *'
                                    : 'Nombre / descripción'}
                            </Label>
                            <Input
                                id="motivo"
                                value={motivo}
                                onChange={(e) => setMotivo(e.target.value)}
                                placeholder={
                                    tipo === 'ausencia'
                                        ? 'Ej: Médico, asuntos personales...'
                                        : 'Ej: Navidad, San José...'
                                }
                                className="h-9"
                            />
                        </div>
                    )}

                    {/* Día completo + horas (solo ausencia) */}
                    {tipo === 'ausencia' && (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="dia_completo"
                                    checked={diaCompleto}
                                    onCheckedChange={(v) =>
                                        setDiaCompleto(v === true)
                                    }
                                />
                                <Label
                                    htmlFor="dia_completo"
                                    className="cursor-pointer text-sm"
                                >
                                    Día completo
                                </Label>
                            </div>

                            {!diaCompleto && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-1.5">
                                        <Label
                                            htmlFor="hora_inicio"
                                            className="text-xs font-medium"
                                        >
                                            Hora inicio *
                                        </Label>
                                        <Input
                                            id="hora_inicio"
                                            type="time"
                                            value={horaInicio}
                                            onChange={(e) =>
                                                setHoraInicio(e.target.value)
                                            }
                                            className="h-9"
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label
                                            htmlFor="hora_fin"
                                            className="text-xs font-medium"
                                        >
                                            Hora fin *
                                        </Label>
                                        <Input
                                            id="hora_fin"
                                            type="time"
                                            value={horaFin}
                                            onChange={(e) =>
                                                setHoraFin(e.target.value)
                                            }
                                            className="h-9"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Info fichaje */}
                    {hasFichaje && (
                        <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
                            Este día tiene un fichaje registrado. El evento
                            quedará anotado en las observaciones del PDF.
                        </p>
                    )}

                    {error && (
                        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                            {error}
                        </p>
                    )}

                    {/* Botones */}
                    <div className="flex items-center gap-2 pt-1">
                        {existingEvento && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDelete}
                                disabled={deleting}
                                className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                {deleting ? 'Eliminando...' : 'Eliminar'}
                            </Button>
                        )}
                        <div className="ml-auto flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onClose}
                            >
                                Cancelar
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving
                                    ? 'Guardando...'
                                    : existingEvento
                                      ? 'Actualizar'
                                      : usarRango && diasRango > 0
                                        ? `Marcar ${diasRango} días`
                                        : 'Guardar'}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function CalendarioIndex({
    employees,
    centros,
    anio,
    empleadoId,
    eventos,
    fichajes,
}: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const canManage = auth.user.role !== 'empleado';
    const [anioSeleccionado, setAnioSeleccionado] = useState(String(anio));
    const [selectedEmpleadoId, setSelectedEmpleadoId] = useState<number | null>(
        empleadoId,
    );

    const initialEmpleado = empleadoId
        ? employees.find((e) => e.id === empleadoId)
        : null;
    const [empleadoSearch, setEmpleadoSearch] = useState(
        initialEmpleado
            ? `${initialEmpleado.name} ${initialEmpleado.apellido}`
            : '',
    );
    const [showDropdown, setShowDropdown] = useState(false);
    const empleadoRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                empleadoRef.current &&
                !empleadoRef.current.contains(e.target as Node)
            ) {
                setShowDropdown(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const [eventosPorFecha, setEventosPorFecha] = useState<Map<string, Evento>>(
        () => {
            const m = new Map<string, Evento>();
            eventos.forEach((e) => m.set(e.fecha, e));
            return m;
        },
    );

    useEffect(() => {
        const m = new Map<string, Evento>();
        eventos.forEach((e) => m.set(e.fecha, e));
        setEventosPorFecha(m);
    }, [eventos]);

    const fichajesSet = new Set(fichajes);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    function handleDayClick(ds: string) {
        if (!empleadoId || !canManage) return;
        setSelectedDate(ds);
        setDialogOpen(true);
    }

    function handleSaved(evento: Evento) {
        setEventosPorFecha((prev) => new Map(prev).set(evento.fecha, evento));
    }

    function handleDeleted(fecha: string) {
        setEventosPorFecha((prev) => {
            const next = new Map(prev);
            next.delete(fecha);
            return next;
        });
    }

    function handleRangoSaved(nuevos: Evento[]) {
        setEventosPorFecha((prev) => {
            const next = new Map(prev);
            nuevos.forEach((e) => next.set(e.fecha, e));
            return next;
        });
    }

    function navigateWithFilters(
        nextEmpleadoId: number | null,
        nextAnio: string,
    ) {
        const activeElement = document.activeElement;
        if (activeElement instanceof HTMLElement) {
            activeElement.blur();
        }

        const params: Record<string, string> = {
            anio: nextAnio,
        };

        if (nextEmpleadoId) {
            params.empleado_id = String(nextEmpleadoId);
        }

        router.get('/calendario', params, { preserveState: false });
    }

    // ── Centro de trabajo bulk apply ──────────────────────────────────────────
    const [centroDialogOpen, setCentroDialogOpen] = useState(false);
    const [centroId, setCentroId] = useState<string>('');
    const [centroTipo, setCentroTipo] = useState<'vacacion' | 'festivo'>(
        'festivo',
    );
    const [centroMotivo, setCentroMotivo] = useState('');
    const [centroDesde, setCentroDesde] = useState('');
    const [centroHasta, setCentroHasta] = useState('');
    const [centroSaving, setCentroSaving] = useState(false);
    const [centroResult, setCentroResult] = useState<string | null>(null);
    const [centroError, setCentroError] = useState('');

    async function handleStoreCentro() {
        if (!centroId || !centroDesde || !centroHasta) {
            setCentroError('Selecciona un centro y el rango de fechas.');
            return;
        }
        setCentroSaving(true);
        setCentroError('');
        setCentroResult(null);
        try {
            const res = await fetch('/calendario/centro', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': getCsrfToken(),
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    centro_id: Number(centroId),
                    tipo: centroTipo,
                    motivo: centroMotivo.trim() || null,
                    fecha_inicio: centroDesde,
                    fecha_fin: centroHasta,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setCentroError(data.message ?? 'Error al aplicar.');
                return;
            }
            setCentroDesde('');
            setCentroHasta('');
            setCentroMotivo('');
            setCentroDialogOpen(false);
            setCentroResult(
                `Aplicado a ${data.total_empleados} empleado(s) durante ${data.total_dias} día(s).`,
            );
        } catch {
            setCentroError('Error de conexión.');
        } finally {
            setCentroSaving(false);
        }
    }

    useEffect(() => {
        if (!centroResult) return;
        const t = setTimeout(() => setCentroResult(null), 3500);
        return () => clearTimeout(t);
    }, [centroResult]);

    const normalizedSearch = empleadoSearch.trim().toLocaleLowerCase('es-ES');
    const filteredEmployees =
        normalizedSearch.length === 0
            ? employees
            : employees.filter((e) =>
                  `${e.name} ${e.apellido}`
                      .toLocaleLowerCase('es-ES')
                      .includes(normalizedSearch),
              );

    function handleReset() {
        setSelectedEmpleadoId(null);
        setEmpleadoSearch('');
        setAnioSeleccionado(String(currentYear));
        setShowDropdown(false);
        router.get('/calendario', {}, { preserveState: false });
    }

    const empleadoActual = empleadoId
        ? employees.find((e) => e.id === empleadoId)
        : null;

    const totalVac = Array.from(eventosPorFecha.values()).filter(
        (e) => e.tipo === 'vacacion',
    ).length;
    const totalAus = Array.from(eventosPorFecha.values()).filter(
        (e) => e.tipo === 'ausencia',
    ).length;
    const totalFes = Array.from(eventosPorFecha.values()).filter(
        (e) => e.tipo === 'festivo',
    ).length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Calendario" />

            <div className="flex flex-col gap-6 p-6">
                {/* Header */}
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                        <CalendarDays className="h-6 w-6 text-primary" />
                        Calendario laboral
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Registra vacaciones, ausencias y festivos — se
                        imprimirán en la columna Observaciones del PDF de
                        jornada
                    </p>
                </div>

                {/* Filtros */}
                <FilterPanel
                    title="Selección de calendario"
                    description="Busca un empleado y cambia el año de consulta. El calendario se recarga automáticamente al seleccionar ambos filtros."
                    eyebrow="Planificación"
                    icon={CalendarDays}
                    tone="blue"
                    meta={
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleReset}
                            className="gap-2 rounded-xl"
                        >
                            <X className="h-3.5 w-3.5" />
                            Limpiar
                        </Button>
                    }
                    footer={
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                                {canManage && centros.length > 0 && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            setCentroResult(null);
                                            setCentroError('');
                                            setCentroDialogOpen(true);
                                        }}
                                        className="gap-2 rounded-xl"
                                    >
                                        <Building2 className="h-3.5 w-3.5" />
                                        Aplicar a centro de trabajo
                                    </Button>
                                )}
                            </div>
                        </div>
                    }
                >
                    <div className="grid gap-3 sm:grid-cols-3">
                        <FilterField
                            label="Empleado"
                            htmlFor="empleado_filter"
                            icon={Users}
                            className="sm:col-span-2"
                        >
                            <div className="relative" ref={empleadoRef}>
                                <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                <FilterInput
                                    id="empleado_filter"
                                    type="text"
                                    value={empleadoSearch}
                                    onChange={(e) => {
                                        setEmpleadoSearch(e.target.value);
                                        setSelectedEmpleadoId(null);
                                    }}
                                    placeholder="Buscar empleado..."
                                    className="pl-9"
                                    onFocus={() => setShowDropdown(true)}
                                />
                                {showDropdown && (
                                    <div className={filterDropdownClassName}>
                                        <div
                                            className={
                                                filterDropdownListClassName
                                            }
                                        >
                                            {filteredEmployees.length === 0 && (
                                                <p
                                                    className={
                                                        filterDropdownEmptyClassName
                                                    }
                                                >
                                                    Sin resultados
                                                </p>
                                            )}
                                            {filteredEmployees.map((emp) => (
                                                <button
                                                    key={emp.id}
                                                    type="button"
                                                    className={filterDropdownOptionClassName(
                                                        selectedEmpleadoId ===
                                                            emp.id,
                                                        'violet',
                                                    )}
                                                    onClick={() => {
                                                        setSelectedEmpleadoId(
                                                            emp.id,
                                                        );
                                                        setEmpleadoSearch(
                                                            `${emp.name} ${emp.apellido}`,
                                                        );
                                                        setShowDropdown(false);
                                                        navigateWithFilters(
                                                            emp.id,
                                                            anioSeleccionado,
                                                        );
                                                    }}
                                                >
                                                    {emp.name} {emp.apellido}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </FilterField>

                        <FilterField
                            label="Año"
                            htmlFor="anio_filter"
                            icon={CalendarDays}
                        >
                            <Select
                                value={anioSeleccionado}
                                onValueChange={(value) => {
                                    setAnioSeleccionado(value);
                                    navigateWithFilters(
                                        selectedEmpleadoId,
                                        value,
                                    );
                                }}
                            >
                                <FilterSelectTrigger id="anio_filter">
                                    <SelectValue />
                                </FilterSelectTrigger>
                                <SelectContent>
                                    {YEARS.map((y) => (
                                        <SelectItem key={y} value={String(y)}>
                                            {y}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FilterField>
                    </div>
                </FilterPanel>

                {/* Calendario */}
                {empleadoId ? (
                    <div className="rounded-xl border bg-card shadow-sm">
                        {/* Cabecera */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
                            <div className="flex items-center gap-2">
                                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                <h2 className="text-sm font-semibold">
                                    {empleadoActual
                                        ? `${empleadoActual.name} ${empleadoActual.apellido} — `
                                        : ''}
                                    {anio}
                                </h2>
                            </div>
                            {/* Resumen badges */}
                            <div className="flex flex-wrap gap-2 text-xs">
                                <span className="flex items-center gap-1 rounded-full border border-green-300 bg-green-100 px-2 py-0.5 text-green-700">
                                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                    {fichajes.length} trabajados
                                </span>
                                <span className="flex items-center gap-1 rounded-full border border-blue-300 bg-blue-100 px-2 py-0.5 text-blue-700">
                                    <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                                    {totalVac} vacaciones
                                </span>
                                <span className="flex items-center gap-1 rounded-full border border-yellow-300 bg-yellow-100 px-2 py-0.5 text-yellow-700">
                                    <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                                    {totalAus} ausencias
                                </span>
                                <span className="flex items-center gap-1 rounded-full border border-pink-300 bg-pink-100 px-2 py-0.5 text-pink-700">
                                    <span className="h-2 w-2 rounded-full bg-pink-500"></span>
                                    {totalFes} festivos
                                </span>
                            </div>
                            {empleadoId && (
                                <a
                                    href={`/calendario/${empleadoId}/pdf?anio=${anio}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-1.5"
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                        Descargar PDF
                                    </Button>
                                </a>
                            )}
                        </div>

                        {/* Leyenda */}
                        <div className="flex flex-wrap items-center gap-4 border-b bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                                <span className="inline-block h-3.5 w-5 rounded border border-green-400 bg-green-100"></span>{' '}
                                Trabajado
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="inline-block h-3.5 w-5 rounded border border-blue-400 bg-blue-100"></span>{' '}
                                Vacación
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="inline-block h-3.5 w-5 rounded border border-yellow-400 bg-yellow-100"></span>{' '}
                                Ausencia
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="inline-block h-3.5 w-5 rounded border border-pink-400 bg-pink-100"></span>{' '}
                                Festivo
                            </span>
                            <span className="ml-auto text-[10px] italic">
                                {canManage
                                    ? 'Click en cualquier día para añadir o editar'
                                    : 'Calendario en solo lectura'}
                            </span>
                        </div>

                        {/* Grid 12 meses */}
                        <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 lg:grid-cols-4">
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(
                                (m) => (
                                    <div
                                        key={m}
                                        className="rounded-lg border bg-white p-2.5 shadow-sm"
                                    >
                                        <MiniMes
                                            mes={m}
                                            anio={anio}
                                            eventosPorFecha={eventosPorFecha}
                                            fichajesSet={fichajesSet}
                                            onDayClick={handleDayClick}
                                        />
                                    </div>
                                ),
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="rounded-xl border bg-card shadow-sm">
                        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
                            <CalendarDays className="h-10 w-10 opacity-20" />
                            <p className="text-sm font-medium">
                                Selecciona un empleado para ver su calendario
                            </p>
                            <p className="text-xs">
                                Elige también el año y el calendario se cargará
                                automáticamente
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {canManage && (
                <Dialog
                    open={centroDialogOpen}
                    onOpenChange={(v) => {
                        if (!v) setCentroDialogOpen(false);
                    }}
                >
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                Aplicar a centro de trabajo
                            </DialogTitle>
                        </DialogHeader>

                        <div className="flex flex-col gap-4 pt-1">
                            {/* Centro */}
                            <div className="grid gap-1.5">
                                <Label className="text-xs font-medium">
                                    Centro de trabajo
                                </Label>
                                <Select
                                    value={centroId}
                                    onValueChange={(v) => {
                                        setCentroId(v);
                                        setCentroError('');
                                    }}
                                >
                                    <SelectTrigger className="h-9">
                                        <SelectValue placeholder="Seleccionar centro..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {centros.map((c) => (
                                            <SelectItem
                                                key={c.id}
                                                value={String(c.id)}
                                            >
                                                {c.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Tipo */}
                            <div className="grid gap-1.5">
                                <Label className="text-xs font-medium">
                                    Tipo
                                </Label>
                                <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1">
                                    <button
                                        type="button"
                                        onClick={() => setCentroTipo('festivo')}
                                        className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${centroTipo === 'festivo' ? 'bg-pink-100 text-pink-800 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        Festivo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCentroTipo('vacacion')
                                        }
                                        className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${centroTipo === 'vacacion' ? 'bg-blue-100 text-blue-800 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        Vacación
                                    </button>
                                </div>
                            </div>

                            {/* Motivo (festivo) */}
                            {centroTipo === 'festivo' && (
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-medium">
                                        Nombre del festivo (opcional)
                                    </Label>
                                    <Input
                                        value={centroMotivo}
                                        onChange={(e) =>
                                            setCentroMotivo(e.target.value)
                                        }
                                        placeholder="Ej: Navidad, Día de la Comunidad..."
                                        className="h-9"
                                    />
                                </div>
                            )}

                            {/* Fechas */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-medium">
                                        Desde *
                                    </Label>
                                    <Input
                                        type="date"
                                        value={centroDesde}
                                        onChange={(e) =>
                                            setCentroDesde(e.target.value)
                                        }
                                        className="h-9"
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-medium">
                                        Hasta *
                                    </Label>
                                    <Input
                                        type="date"
                                        value={centroHasta}
                                        min={centroDesde}
                                        onChange={(e) =>
                                            setCentroHasta(e.target.value)
                                        }
                                        className="h-9"
                                    />
                                </div>
                            </div>

                            {centroError && (
                                <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                                    {centroError}
                                </p>
                            )}

                            <div className="flex justify-end gap-2 pt-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCentroDialogOpen(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleStoreCentro}
                                    disabled={centroSaving}
                                    className="gap-1.5"
                                >
                                    <Building2 className="h-3.5 w-3.5" />
                                    {centroSaving
                                        ? 'Aplicando...'
                                        : 'Aplicar a todos'}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {centroResult && (
                <div className="fixed right-6 bottom-6 z-50 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg">
                    {centroResult}
                </div>
            )}

            {canManage && empleadoId && (
                <EventoDialog
                    open={dialogOpen}
                    onClose={() => setDialogOpen(false)}
                    dateStr={selectedDate}
                    empleadoId={empleadoId}
                    existingEvento={
                        selectedDate
                            ? (eventosPorFecha.get(selectedDate) ?? null)
                            : null
                    }
                    hasFichaje={
                        selectedDate ? fichajesSet.has(selectedDate) : false
                    }
                    onSaved={handleSaved}
                    onDeleted={handleDeleted}
                    onRangoSaved={handleRangoSaved}
                />
            )}
        </AppLayout>
    );
}
