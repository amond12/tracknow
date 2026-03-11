import { Head, router } from '@inertiajs/react';
import { CalendarDays, Download, Search, Trash2, Users, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, User } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard() },
    { title: 'Calendario', href: '/calendario' },
];

// ─── Constantes ───────────────────────────────────────────────────────────────

const MESES_LABEL = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
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

interface Props {
    employees: Pick<User, 'id' | 'name' | 'apellido'>[];
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
    ausencia:  'bg-yellow-100 border-yellow-400 text-yellow-800 hover:bg-yellow-200',
    festivo:   'bg-pink-100 border-pink-400 text-pink-800 hover:bg-pink-200',
};

const TIPO_LABELS: Record<TipoEvento, string> = {
    vacacion: 'Vacación',
    ausencia:  'Ausencia',
    festivo:   'Festivo',
};

// ─── Componente mini-mes ──────────────────────────────────────────────────────

interface MiniMesProps {
    mes: number;
    anio: number;
    eventosPorFecha: Map<string, Evento>;
    fichajesSet: Set<string>;
    onDayClick: (dateStr: string) => void;
}

function MiniMes({ mes, anio, eventosPorFecha, fichajesSet, onDayClick }: MiniMesProps) {
    const days = getDaysInMonth(mes, anio);
    const offset = getISODay(days[0]);
    const todayStr = toDateStr(new Date());

    return (
        <div>
            <div className="mb-1.5 text-center text-xs font-bold uppercase tracking-wide text-foreground">
                {MESES_LABEL[mes - 1]}
            </div>
            <div className="grid grid-cols-7 mb-0.5">
                {DIAS_SEMANA.map((d) => (
                    <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-0.5">
                        {d}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-px">
                {Array.from({ length: offset }).map((_, i) => <div key={`b${i}`} />)}
                {days.map((date) => {
                    const ds = toDateStr(date);
                    const evento = eventosPorFecha.get(ds);
                    const hasFichaje = fichajesSet.has(ds);
                    const isToday = ds === todayStr;

                    let cls = 'relative flex items-center justify-center rounded text-[11px] font-medium h-6 w-full cursor-pointer select-none transition-colors border ';

                    if (evento) {
                        cls += TIPO_COLORS[evento.tipo];
                    } else if (hasFichaje) {
                        cls += 'bg-green-100 border-green-400 text-green-800 hover:bg-green-200';
                    } else {
                        cls += 'bg-transparent border-transparent text-foreground hover:bg-muted/60';
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

function EventoDialog({ open, onClose, dateStr, empleadoId, existingEvento, hasFichaje, onSaved, onDeleted, onRangoSaved }: EventoDialogProps) {
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
                setError('La fecha de fin debe ser igual o posterior al día seleccionado.');
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
                        'Accept': 'application/json',
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
                    'Accept': 'application/json',
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
                    'Accept': 'application/json',
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
        ? new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
        : '';

    const diasRango = (() => {
        if (!usarRango || !fechaRangoFin || !dateStr) return 0;
        const diff = new Date(fechaRangoFin).getTime() - new Date(dateStr).getTime();
        return diff < 0 ? 0 : Math.round(diff / 86400000) + 1;
    })();

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle className="capitalize">{fechaLabel}</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4 pt-1">
                    {/* Tipo */}
                    <div className="grid gap-1.5">
                        <Label className="text-xs font-medium">Tipo de evento</Label>
                        <div className="flex gap-1.5">
                            {(['vacacion', 'ausencia', 'festivo'] as TipoEvento[]).map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => handleTipoChange(t)}
                                    className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                                        tipo === t
                                            ? t === 'vacacion'
                                                ? 'bg-blue-100 border-blue-400 text-blue-800'
                                                : t === 'ausencia'
                                                ? 'bg-yellow-100 border-yellow-400 text-yellow-800'
                                                : 'bg-pink-100 border-pink-400 text-pink-800'
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
                            <Label className="text-xs font-medium">Periodo</Label>
                            <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1">
                                <button
                                    type="button"
                                    onClick={() => setUsarRango(false)}
                                    className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                                        !usarRango ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Solo este día
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUsarRango(true)}
                                    className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                                        usarRango ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Rango de fechas
                                </button>
                            </div>

                            {usarRango && (
                                <div className="grid grid-cols-2 gap-3 mt-1">
                                    <div className="grid gap-1">
                                        <Label className="text-xs text-muted-foreground">Desde</Label>
                                        <Input
                                            type="date"
                                            value={dateStr ?? ''}
                                            readOnly
                                            className="h-9 bg-muted/30 cursor-default"
                                        />
                                    </div>
                                    <div className="grid gap-1">
                                        <Label className="text-xs text-muted-foreground">Hasta *</Label>
                                        <Input
                                            type="date"
                                            value={fechaRangoFin}
                                            min={dateStr ?? ''}
                                            onChange={(e) => setFechaRangoFin(e.target.value)}
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
                            <Label htmlFor="motivo" className="text-xs font-medium">
                                {tipo === 'ausencia' ? 'Motivo *' : 'Nombre / descripción'}
                            </Label>
                            <Input
                                id="motivo"
                                value={motivo}
                                onChange={(e) => setMotivo(e.target.value)}
                                placeholder={tipo === 'ausencia' ? 'Ej: Médico, asuntos personales...' : 'Ej: Navidad, San José...'}
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
                                    onCheckedChange={(v) => setDiaCompleto(v === true)}
                                />
                                <Label htmlFor="dia_completo" className="text-sm cursor-pointer">
                                    Día completo
                                </Label>
                            </div>

                            {!diaCompleto && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="hora_inicio" className="text-xs font-medium">Hora inicio *</Label>
                                        <Input
                                            id="hora_inicio"
                                            type="time"
                                            value={horaInicio}
                                            onChange={(e) => setHoraInicio(e.target.value)}
                                            className="h-9"
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="hora_fin" className="text-xs font-medium">Hora fin *</Label>
                                        <Input
                                            id="hora_fin"
                                            type="time"
                                            value={horaFin}
                                            onChange={(e) => setHoraFin(e.target.value)}
                                            className="h-9"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Info fichaje */}
                    {hasFichaje && (
                        <p className="rounded-md bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-700">
                            Este día tiene un fichaje registrado. El evento quedará anotado en las observaciones del PDF.
                        </p>
                    )}

                    {error && (
                        <p className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-xs text-destructive">
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
                                className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                {deleting ? 'Eliminando...' : 'Eliminar'}
                            </Button>
                        )}
                        <div className="ml-auto flex gap-2">
                            <Button variant="outline" size="sm" onClick={onClose}>
                                Cancelar
                            </Button>
                            <Button size="sm" onClick={handleSave} disabled={saving}>
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

export default function CalendarioIndex({ employees, anio, empleadoId, eventos, fichajes }: Props) {
    const [anioSeleccionado, setAnioSeleccionado] = useState(String(anio));
    const [selectedEmpleadoId, setSelectedEmpleadoId] = useState<number | null>(empleadoId);

    const initialEmpleado = empleadoId ? employees.find((e) => e.id === empleadoId) : null;
    const [empleadoSearch, setEmpleadoSearch] = useState(
        initialEmpleado ? `${initialEmpleado.name} ${initialEmpleado.apellido}` : '',
    );
    const [showDropdown, setShowDropdown] = useState(false);
    const empleadoRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (empleadoRef.current && !empleadoRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const [eventosPorFecha, setEventosPorFecha] = useState<Map<string, Evento>>(() => {
        const m = new Map<string, Evento>();
        eventos.forEach((e) => m.set(e.fecha, e));
        return m;
    });

    useEffect(() => {
        const m = new Map<string, Evento>();
        eventos.forEach((e) => m.set(e.fecha, e));
        setEventosPorFecha(m);
    }, [eventos]);

    const fichajesSet = new Set(fichajes);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    function handleDayClick(ds: string) {
        if (!selectedEmpleadoId) return;
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

    const normalizedSearch = empleadoSearch.trim().toLocaleLowerCase('es-ES');
    const filteredEmployees = normalizedSearch.length === 0
        ? employees
        : employees.filter((e) =>
            `${e.name} ${e.apellido}`.toLocaleLowerCase('es-ES').includes(normalizedSearch),
        );

    function handleReset() {
        setSelectedEmpleadoId(null);
        setEmpleadoSearch('');
        setAnioSeleccionado(String(currentYear));
        router.get('/calendario', {}, { preserveState: false });
    }

    const empleadoActual = selectedEmpleadoId ? employees.find((e) => e.id === selectedEmpleadoId) : null;

    const totalVac = Array.from(eventosPorFecha.values()).filter((e) => e.tipo === 'vacacion').length;
    const totalAus = Array.from(eventosPorFecha.values()).filter((e) => e.tipo === 'ausencia').length;
    const totalFes = Array.from(eventosPorFecha.values()).filter((e) => e.tipo === 'festivo').length;

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
                        Registra vacaciones, ausencias y festivos — se imprimirán en la columna Observaciones del PDF de jornada
                    </p>
                </div>

                {/* Filtros */}
                <div className="rounded-xl border bg-card shadow-sm">
                    <div className="flex items-center gap-2 border-b px-4 py-3">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <h2 className="text-sm font-semibold">Selección</h2>
                    </div>
                    <div className="p-4">
                        <div className="grid gap-4 sm:grid-cols-3">
                            {/* Empleado */}
                            <div className="grid gap-1.5 sm:col-span-2">
                                <Label className="flex items-center gap-1.5 text-xs font-medium">
                                    <Users className="h-3 w-3 text-muted-foreground" />
                                    Empleado
                                </Label>
                                <div className="relative" ref={empleadoRef}>
                                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        value={empleadoSearch}
                                        onChange={(e) => { setEmpleadoSearch(e.target.value); setSelectedEmpleadoId(null); }}
                                        placeholder="Buscar empleado..."
                                        className="h-9 pl-8"
                                        onFocus={() => setShowDropdown(true)}
                                    />
                                    {showDropdown && (
                                        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-md">
                                            <div className="max-h-44 overflow-y-auto">
                                                {filteredEmployees.length === 0 && (
                                                    <p className="px-3 py-2 text-sm text-muted-foreground">Sin resultados</p>
                                                )}
                                                {filteredEmployees.map((emp) => (
                                                    <button
                                                        key={emp.id}
                                                        type="button"
                                                        className={`w-full px-3 py-2 text-left text-sm hover:bg-muted/50 ${selectedEmpleadoId === emp.id ? 'bg-muted font-medium' : ''}`}
                                                        onClick={() => { setSelectedEmpleadoId(emp.id); setEmpleadoSearch(`${emp.name} ${emp.apellido}`); setShowDropdown(false); router.get('/calendario', { empleado_id: String(emp.id), anio: anioSeleccionado }, { preserveState: false }); }}
                                                    >
                                                        {emp.name} {emp.apellido}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Año */}
                            <div className="grid gap-1.5">
                                <Label className="text-xs font-medium">Año</Label>
                                <Select value={anioSeleccionado} onValueChange={(v) => { setAnioSeleccionado(v); if (selectedEmpleadoId) { router.get('/calendario', { empleado_id: String(selectedEmpleadoId), anio: v }, { preserveState: false }); } }}>
                                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {YEARS.map((y) => (
                                            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                            <Button size="sm" variant="outline" onClick={handleReset} className="gap-2">
                                <X className="h-3.5 w-3.5" />
                                Limpiar
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Calendario */}
                {selectedEmpleadoId ? (
                    <div className="rounded-xl border bg-card shadow-sm">
                        {/* Cabecera */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
                            <div className="flex items-center gap-2">
                                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                <h2 className="text-sm font-semibold">
                                    {empleadoActual ? `${empleadoActual.name} ${empleadoActual.apellido} — ` : ''}{anioSeleccionado}
                                </h2>
                            </div>
                            {/* Resumen badges */}
                            <div className="flex flex-wrap gap-2 text-xs">
                                <span className="flex items-center gap-1 rounded-full bg-green-100 border border-green-300 px-2 py-0.5 text-green-700">
                                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                    {fichajes.length} trabajados
                                </span>
                                <span className="flex items-center gap-1 rounded-full bg-blue-100 border border-blue-300 px-2 py-0.5 text-blue-700">
                                    <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                                    {totalVac} vacaciones
                                </span>
                                <span className="flex items-center gap-1 rounded-full bg-yellow-100 border border-yellow-300 px-2 py-0.5 text-yellow-700">
                                    <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                                    {totalAus} ausencias
                                </span>
                                <span className="flex items-center gap-1 rounded-full bg-pink-100 border border-pink-300 px-2 py-0.5 text-pink-700">
                                    <span className="h-2 w-2 rounded-full bg-pink-500"></span>
                                    {totalFes} festivos
                                </span>
                            </div>
                            {empleadoId && (
                                <a
                                    href={`/calendario/${empleadoId}/pdf?anio=${anioSeleccionado}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Button size="sm" variant="outline" className="gap-1.5">
                                        <Download className="h-3.5 w-3.5" />
                                        Descargar PDF
                                    </Button>
                                </a>
                            )}
                        </div>

                        {/* Leyenda */}
                        <div className="flex flex-wrap items-center gap-4 border-b bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                                <span className="inline-block h-3.5 w-5 rounded border bg-green-100 border-green-400"></span> Trabajado
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="inline-block h-3.5 w-5 rounded border bg-blue-100 border-blue-400"></span> Vacación
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="inline-block h-3.5 w-5 rounded border bg-yellow-100 border-yellow-400"></span> Ausencia
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="inline-block h-3.5 w-5 rounded border bg-pink-100 border-pink-400"></span> Festivo
                            </span>
                            <span className="ml-auto text-[10px] italic">Click en cualquier día para añadir o editar</span>
                        </div>

                        {/* Grid 12 meses */}
                        <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 lg:grid-cols-4">
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                <div key={m} className="rounded-lg border bg-white p-2.5 shadow-sm">
                                    <MiniMes
                                        mes={m}
                                        anio={Number(anioSeleccionado)}
                                        eventosPorFecha={eventosPorFecha}
                                        fichajesSet={fichajesSet}
                                        onDayClick={handleDayClick}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="rounded-xl border bg-card shadow-sm">
                        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
                            <CalendarDays className="h-10 w-10 opacity-20" />
                            <p className="text-sm font-medium">Selecciona un empleado para ver su calendario</p>
                            <p className="text-xs">Elige también el año y pulsa "Ver calendario"</p>
                        </div>
                    </div>
                )}
            </div>

            {selectedEmpleadoId && (
                <EventoDialog
                    open={dialogOpen}
                    onClose={() => setDialogOpen(false)}
                    dateStr={selectedDate}
                    empleadoId={selectedEmpleadoId}
                    existingEvento={selectedDate ? (eventosPorFecha.get(selectedDate) ?? null) : null}
                    hasFichaje={selectedDate ? fichajesSet.has(selectedDate) : false}
                    onSaved={handleSaved}
                    onDeleted={handleDeleted}
                    onRangoSaved={handleRangoSaved}
                />
            )}
        </AppLayout>
    );
}
