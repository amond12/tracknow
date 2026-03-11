import { Head, router } from '@inertiajs/react';
import { CalendarDays, Save, Search, Umbrella, Users, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, User } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard() },
    { title: 'Vacaciones', href: '/vacaciones' },
];

// ─── Constantes ───────────────────────────────────────────────────────────────

const MESES = [
    { value: '1',  label: 'Enero' },
    { value: '2',  label: 'Febrero' },
    { value: '3',  label: 'Marzo' },
    { value: '4',  label: 'Abril' },
    { value: '5',  label: 'Mayo' },
    { value: '6',  label: 'Junio' },
    { value: '7',  label: 'Julio' },
    { value: '8',  label: 'Agosto' },
    { value: '9',  label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
];

const DIAS_SEMANA_CORTO = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => currentYear - i);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDaysInMonth(mes: number, anio: number): Date[] {
    const days: Date[] = [];
    const date = new Date(anio, mes - 1, 1);
    while (date.getMonth() === mes - 1) {
        days.push(new Date(date));
        date.setDate(date.getDate() + 1);
    }
    return days;
}

function toDateStr(date: Date): string {
    return date.toISOString().slice(0, 10);
}

function getISODayOfWeek(date: Date): number {
    return (date.getDay() + 6) % 7;
}

// ─── Componente mini-calendario ───────────────────────────────────────────────

interface MiniCalendarProps {
    mes: number;
    anio: number;
    selectedDays: Set<string>;
    fichajesDelMes: string[];
    onToggle: (dateStr: string) => void;
    compact?: boolean;
}

function MiniCalendar({ mes, anio, selectedDays, fichajesDelMes, onToggle, compact = false }: MiniCalendarProps) {
    const daysInMonth = getDaysInMonth(mes, anio);
    const firstDayOffset = getISODayOfWeek(daysInMonth[0]);
    const mesLabel = MESES.find((m) => m.value === String(mes))?.label ?? '';
    const todayStr = toDateStr(new Date());

    return (
        <div>
            {compact && (
                <div className="mb-2 text-center text-xs font-semibold text-foreground uppercase tracking-wide">
                    {mesLabel}
                </div>
            )}
            <div className="grid grid-cols-7 mb-0.5">
                {DIAS_SEMANA_CORTO.map((d) => (
                    <div key={d} className={`text-center font-semibold text-muted-foreground ${compact ? 'text-[10px] py-0.5' : 'text-xs py-1'}`}>
                        {d}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
                {Array.from({ length: firstDayOffset }).map((_, i) => (
                    <div key={`blank-${i}`} />
                ))}
                {daysInMonth.map((date) => {
                    const dateStr = toDateStr(date);
                    const isVacacion = selectedDays.has(dateStr);
                    const hasFichaje = fichajesDelMes.includes(dateStr);
                    const isToday = todayStr === dateStr;

                    let cellClass = `flex items-center justify-center rounded font-medium transition-colors select-none relative
                        ${compact ? 'h-6 text-[11px]' : 'h-9 text-sm'} `;

                    if (hasFichaje) {
                        cellClass += 'bg-muted text-muted-foreground cursor-not-allowed';
                    } else if (isVacacion) {
                        cellClass += 'bg-teal-100 border border-teal-500 text-teal-800 cursor-pointer hover:bg-teal-200';
                    } else {
                        cellClass += 'bg-white border border-border text-foreground cursor-pointer hover:bg-muted/50';
                    }

                    if (isToday && !hasFichaje && !isVacacion) {
                        cellClass += ' ring-2 ring-primary ring-offset-1';
                    }

                    return (
                        <button
                            key={dateStr}
                            type="button"
                            className={cellClass}
                            onClick={() => onToggle(dateStr)}
                            disabled={hasFichaje}
                            title={
                                hasFichaje
                                    ? 'Día con fichaje registrado'
                                    : isVacacion
                                    ? 'Click para quitar vacaciones'
                                    : 'Click para marcar como vacaciones'
                            }
                        >
                            {date.getDate()}
                            {isVacacion && (
                                <span className="absolute top-0 right-0 h-1.5 w-1.5 rounded-full bg-teal-500" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Props {
    employees: Pick<User, 'id' | 'name' | 'apellido'>[];
    mes: number;
    anio: number;
    modo: 'mes' | 'anio';
    empleadoId: number | null;
    vacaciones: string[];
    fichajesDelMes: string[];
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function VacacionesIndex({
    employees,
    mes,
    anio,
    modo,
    empleadoId,
    vacaciones,
    fichajesDelMes,
}: Props) {
    const [mesSeleccionado, setMesSeleccionado] = useState(String(mes));
    const [anioSeleccionado, setAnioSeleccionado] = useState(String(anio));
    const [modoVista, setModoVista] = useState<'mes' | 'anio'>(modo);
    const [selectedEmpleadoId, setSelectedEmpleadoId] = useState<number | null>(empleadoId);

    const initialEmpleado = empleadoId ? employees.find((e) => e.id === empleadoId) : null;
    const [empleadoSearch, setEmpleadoSearch] = useState(
        initialEmpleado ? `${initialEmpleado.name} ${initialEmpleado.apellido}` : '',
    );
    const [showEmpleadoDropdown, setShowEmpleadoDropdown] = useState(false);
    const empleadoRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (empleadoRef.current && !empleadoRef.current.contains(e.target as Node)) {
                setShowEmpleadoDropdown(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set(vacaciones));
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setSelectedDays(new Set(vacaciones));
    }, [vacaciones]);

    const normalizedSearch = empleadoSearch.trim().toLocaleLowerCase('es-ES');
    const filteredEmployees = normalizedSearch.length === 0
        ? employees
        : employees.filter((e) =>
            `${e.name} ${e.apellido}`.toLocaleLowerCase('es-ES').includes(normalizedSearch),
        );

    function handleEmpleadoSelect(employee: Pick<User, 'id' | 'name' | 'apellido'>) {
        setSelectedEmpleadoId(employee.id);
        setEmpleadoSearch(`${employee.name} ${employee.apellido}`);
        setShowEmpleadoDropdown(false);
    }

    function handleFilter() {
        const params: Record<string, string> = {
            anio: anioSeleccionado,
            modo: modoVista,
        };
        if (modoVista === 'mes') params.mes = mesSeleccionado;
        if (selectedEmpleadoId) params.empleado_id = String(selectedEmpleadoId);
        router.get('/vacaciones', params, { preserveState: false });
    }

    function handleReset() {
        setSelectedEmpleadoId(null);
        setEmpleadoSearch('');
        setMesSeleccionado(String(new Date().getMonth() + 1));
        setAnioSeleccionado(String(new Date().getFullYear()));
        setModoVista('mes');
        router.get('/vacaciones', {}, { preserveState: false });
    }

    function toggleDay(dateStr: string) {
        if (fichajesDelMes.includes(dateStr)) return;
        setSelectedDays((prev) => {
            const next = new Set(prev);
            if (next.has(dateStr)) {
                next.delete(dateStr);
            } else {
                next.add(dateStr);
            }
            return next;
        });
    }

    function handleSave() {
        if (!selectedEmpleadoId) return;
        setSaving(true);
        const payload: Record<string, unknown> = {
            user_id: selectedEmpleadoId,
            anio: Number(anioSeleccionado),
            fechas: Array.from(selectedDays),
        };
        if (modoVista === 'mes') {
            payload.mes = Number(mesSeleccionado);
        }
        router.post('/vacaciones', payload, {
            onFinish: () => setSaving(false),
            preserveScroll: true,
        });
    }

    const mesNum  = Number(mesSeleccionado);
    const anioNum = Number(anioSeleccionado);
    const mesLabel = MESES.find((m) => m.value === mesSeleccionado)?.label ?? '';
    const empleadoActual = selectedEmpleadoId ? employees.find((e) => e.id === selectedEmpleadoId) : null;
    const isDirty = JSON.stringify(Array.from(selectedDays).sort()) !== JSON.stringify([...vacaciones].sort());
    const totalVac = selectedDays.size;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Vacaciones" />

            <div className="flex flex-col gap-6 p-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                        <Umbrella className="h-6 w-6 text-teal-600" />
                        Vacaciones
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Marca los días de vacaciones de cada empleado — aparecerán justificados en el PDF de jornada
                    </p>
                </div>

                {/* Filtros */}
                <div className="rounded-xl border bg-card shadow-sm">
                    <div className="flex items-center gap-2 border-b px-4 py-3">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        <h2 className="text-sm font-semibold">Selección</h2>
                    </div>
                    <div className="p-4">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {/* Empleado */}
                            <div className="grid gap-1.5 lg:col-span-2">
                                <Label className="flex items-center gap-1.5 text-xs font-medium">
                                    <Users className="h-3 w-3 text-muted-foreground" />
                                    Empleado
                                </Label>
                                <div className="relative" ref={empleadoRef}>
                                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        value={empleadoSearch}
                                        onChange={(e) => {
                                            setEmpleadoSearch(e.target.value);
                                            setSelectedEmpleadoId(null);
                                        }}
                                        placeholder="Buscar empleado..."
                                        className="h-9 pl-8"
                                        onFocus={() => setShowEmpleadoDropdown(true)}
                                    />
                                    {showEmpleadoDropdown && (
                                        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-md">
                                            <div className="max-h-44 overflow-y-auto">
                                                {employees.length === 0 && (
                                                    <p className="px-3 py-2 text-sm text-muted-foreground">No hay empleados</p>
                                                )}
                                                {filteredEmployees.length === 0 && employees.length > 0 && (
                                                    <p className="px-3 py-2 text-sm text-muted-foreground">Sin resultados</p>
                                                )}
                                                {filteredEmployees.map((employee) => (
                                                    <button
                                                        key={employee.id}
                                                        type="button"
                                                        className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50 ${
                                                            selectedEmpleadoId === employee.id ? 'bg-muted font-medium' : ''
                                                        }`}
                                                        onClick={() => handleEmpleadoSelect(employee)}
                                                    >
                                                        {employee.name} {employee.apellido}
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
                                <Select value={anioSeleccionado} onValueChange={setAnioSeleccionado}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {YEARS.map((y) => (
                                            <SelectItem key={y} value={String(y)}>
                                                {y}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Mes (solo en modo mes) */}
                            <div className="grid gap-1.5">
                                <Label className="text-xs font-medium">Mes</Label>
                                <Select
                                    value={mesSeleccionado}
                                    onValueChange={setMesSeleccionado}
                                    disabled={modoVista === 'anio'}
                                >
                                    <SelectTrigger className="h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MESES.map((m) => (
                                            <SelectItem key={m.value} value={m.value}>
                                                {m.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Toggle modo + botones */}
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                            {/* Toggle Mes / Año */}
                            <div className="flex items-center rounded-lg border bg-muted/40 p-1 gap-1">
                                <button
                                    type="button"
                                    onClick={() => setModoVista('mes')}
                                    className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                                        modoVista === 'mes'
                                            ? 'bg-white shadow-sm text-foreground'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Por mes
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setModoVista('anio')}
                                    className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                                        modoVista === 'anio'
                                            ? 'bg-white shadow-sm text-foreground'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Año completo
                                </button>
                            </div>

                            <Button size="sm" onClick={handleFilter} className="gap-2">
                                <Search className="h-3.5 w-3.5" />
                                Ver calendario
                            </Button>
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
                        <div className="flex items-center justify-between border-b px-4 py-3">
                            <div className="flex items-center gap-2">
                                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                <h2 className="text-sm font-semibold">
                                    {empleadoActual
                                        ? `${empleadoActual.name} ${empleadoActual.apellido} — ${modoVista === 'anio' ? anioSeleccionado : `${mesLabel} ${anioSeleccionado}`}`
                                        : modoVista === 'anio' ? anioSeleccionado : `${mesLabel} ${anioSeleccionado}`}
                                </h2>
                                {totalVac > 0 && (
                                    <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700">
                                        {totalVac} día{totalVac !== 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                            {isDirty && (
                                <Button
                                    size="sm"
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="gap-2 bg-teal-600 hover:bg-teal-700 text-white"
                                >
                                    <Save className="h-3.5 w-3.5" />
                                    {saving ? 'Guardando...' : 'Guardar'}
                                </Button>
                            )}
                        </div>

                        <div className="p-4">
                            {/* Leyenda */}
                            <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                    <span className="inline-block h-4 w-4 rounded border bg-teal-100 border-teal-400"></span>
                                    Vacaciones
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="inline-block h-4 w-4 rounded border bg-muted border-muted-foreground/30"></span>
                                    Con fichaje (no editable)
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="inline-block h-4 w-4 rounded border bg-white border-border"></span>
                                    Libre (click para marcar)
                                </span>
                            </div>

                            {/* Vista: por mes */}
                            {modoVista === 'mes' && (
                                <div className="max-w-sm">
                                    <MiniCalendar
                                        mes={mesNum}
                                        anio={anioNum}
                                        selectedDays={selectedDays}
                                        fichajesDelMes={fichajesDelMes}
                                        onToggle={toggleDay}
                                    />
                                </div>
                            )}

                            {/* Vista: año completo */}
                            {modoVista === 'anio' && (
                                <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                        <div key={m} className="rounded-lg border bg-muted/20 p-3">
                                            <MiniCalendar
                                                mes={m}
                                                anio={anioNum}
                                                selectedDays={selectedDays}
                                                fichajesDelMes={fichajesDelMes}
                                                onToggle={toggleDay}
                                                compact
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {isDirty && (
                                <div className="mt-6 flex justify-end">
                                    <Button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="gap-2 bg-teal-600 hover:bg-teal-700 text-white"
                                    >
                                        <Save className="h-4 w-4" />
                                        {saving ? 'Guardando...' : 'Guardar cambios'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="rounded-xl border bg-card shadow-sm">
                        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
                            <Umbrella className="h-10 w-10 opacity-20" />
                            <p className="text-sm font-medium">Selecciona un empleado para ver su calendario</p>
                            <p className="text-xs">Elige el año (y mes si usas vista mensual), luego pulsa "Ver calendario"</p>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
