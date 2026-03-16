import { Head, router } from '@inertiajs/react';
import {
    Building2,
    Calendar,
    Filter,
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
    FilterPill,
    FilterSelectTrigger,
    filterDropdownClassName,
    filterDropdownEmptyClassName,
    filterDropdownListClassName,
    filterDropdownOptionClassName,
} from '@/components/filter-panel';
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
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, Company, User, WorkCenter } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard() },
    { title: 'Horas Extra', href: '/horas-extra' },
];

const MESES = [
    { value: '1', label: 'Enero' },
    { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },
    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => currentYear - i);

interface RegistroDia {
    id: number;
    user_id: number;
    nombre: string;
    apellido: string;
    fecha: string;
    horas_extra: number;
    origen: string;
    admin_nombre: string | null;
}

interface Props {
    companies: Pick<Company, 'id' | 'nombre'>[];
    workCenters: (Pick<WorkCenter, 'id' | 'nombre'> & { company_id: number })[];
    employees: (Pick<User, 'id' | 'name' | 'apellido'> & {
        company_id: number;
        work_center_id: number;
    })[];
    registros: RegistroDia[];
    filters: { empresa_id?: string; centro_id?: string; empleado_id?: string };
    mes: number;
    anio: number;
}

function formatSeconds(seconds: number): string {
    const abs = Math.abs(seconds);
    const h = Math.floor(abs / 3600);
    const m = Math.floor((abs % 3600) / 60);
    const prefix = seconds < 0 ? '-' : '';
    return `${prefix}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatDate(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
    });
}

function parseHHMM(value: string): number {
    const negative = value.startsWith('-');
    const clean = value.replace(/^-/, '');
    const parts = clean.split(':');
    const h = parseInt(parts[0] ?? '0', 10) || 0;
    const m = parseInt(parts[1] ?? '0', 10) || 0;
    return (h * 3600 + m * 60) * (negative ? -1 : 1);
}

function ExtraCell({ seconds }: { seconds: number }) {
    if (seconds > 0) {
        return (
            <span className="font-semibold text-green-600 dark:text-green-400">
                +{formatSeconds(seconds)}
            </span>
        );
    }
    if (seconds < 0) {
        return (
            <span className="font-semibold text-amber-600 dark:text-amber-400">
                {formatSeconds(seconds)}
            </span>
        );
    }
    return (
        <span className="text-muted-foreground">{formatSeconds(seconds)}</span>
    );
}

export default function HorasExtraIndex({
    companies,
    workCenters,
    employees,
    registros,
    filters,
    mes,
    anio,
}: Props) {
    // ── Estado de filtros ───────────────────────────────────────────────────────
    const [empresaId, setEmpresaId] = useState(filters.empresa_id ?? 'all');
    const [centroId, setCentroId] = useState(filters.centro_id ?? 'all');
    const [empleadoId, setEmpleadoId] = useState(filters.empleado_id ?? 'all');
    const skipAutoFilterRef = useRef(true);

    const initialEmpleado = filters.empleado_id
        ? employees.find((e) => e.id === Number(filters.empleado_id))
        : null;
    const [empleadoSearch, setEmpleadoSearch] = useState(
        initialEmpleado
            ? `${initialEmpleado.name} ${initialEmpleado.apellido}`
            : '',
    );
    const [showEmpleadoDropdown, setShowEmpleadoDropdown] = useState(false);
    const empleadoRef = useRef<HTMLDivElement>(null);

    const [mesSeleccionado, setMesSeleccionado] = useState(String(mes));
    const [anioSeleccionado, setAnioSeleccionado] = useState(String(anio));

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

    const availableWorkCenters =
        empresaId === 'all'
            ? workCenters
            : workCenters.filter((wc) => wc.company_id === Number(empresaId));

    const availableEmployees =
        empresaId === 'all'
            ? employees
            : employees.filter((e) => e.company_id === Number(empresaId));

    const normalizedSearch = empleadoSearch.trim().toLocaleLowerCase('es-ES');
    const filteredEmployees =
        normalizedSearch.length === 0
            ? availableEmployees
            : availableEmployees.filter((e) =>
                  `${e.name} ${e.apellido}`
                      .toLocaleLowerCase('es-ES')
                      .includes(normalizedSearch),
              );

    function handleEmpresaChange(value: string) {
        setEmpresaId(value);
        setCentroId('all');
        setEmpleadoId('all');
        setEmpleadoSearch('');
    }

    function handleEmpleadoSearchChange(value: string) {
        setEmpleadoSearch(value);
        setEmpleadoId('all');
    }

    function handleReset() {
        setEmpresaId('all');
        setCentroId('all');
        setEmpleadoId('all');
        setEmpleadoSearch('');
        setMesSeleccionado(String(new Date().getMonth() + 1));
        setAnioSeleccionado(String(new Date().getFullYear()));
    }

    useEffect(() => {
        if (skipAutoFilterRef.current) {
            skipAutoFilterRef.current = false;
            return;
        }

        const params: Record<string, string> = {
            mes: mesSeleccionado,
            anio: anioSeleccionado,
        };
        if (empresaId !== 'all') params.empresa_id = empresaId;
        if (centroId !== 'all') params.centro_id = centroId;
        if (empleadoId !== 'all') params.empleado_id = empleadoId;

        router.get('/horas-extra', params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, [empresaId, centroId, empleadoId, mesSeleccionado, anioSeleccionado]);

    const hasActiveFilters =
        empresaId !== 'all' || centroId !== 'all' || empleadoId !== 'all';
    const mesLabel =
        MESES.find((m) => m.value === mesSeleccionado)?.label ?? '';

    // ── Diálogo añadir ──────────────────────────────────────────────────────────
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [addForm, setAddForm] = useState({
        user_id: '',
        fecha: '',
        horas_extra: '00:00',
    });

    function handleAdd() {
        router.post(
            '/horas-extra',
            {
                user_id: Number(addForm.user_id),
                fecha: addForm.fecha,
                horas_extra: parseHHMM(addForm.horas_extra),
            },
            {
                onSuccess: () => {
                    setShowAddDialog(false);
                    setAddForm({
                        user_id: '',
                        fecha: '',
                        horas_extra: '00:00',
                    });
                },
            },
        );
    }

    // ── Diálogo eliminar ────────────────────────────────────────────────────────
    const [deleteId, setDeleteId] = useState<number | null>(null);

    function handleDelete() {
        if (deleteId === null) return;
        router.delete(`/horas-extra/${deleteId}`, {
            onSuccess: () => setDeleteId(null),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Horas Extra" />

            <div className="flex flex-col gap-6 p-6">
                {/* Cabecera */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Horas Extra
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Registro de horas trabajadas y horas extra por
                            empleado
                        </p>
                    </div>
                    <Button
                        onClick={() => setShowAddDialog(true)}
                        className="gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Añadir horas extra
                    </Button>
                </div>

                {/* Filtros */}
                <FilterPanel
                    title="Filtros de horas extra"
                    description="Revisa horas extra por empresa, centro, empleado y periodo mensual con un único panel de control."
                    icon={Filter}
                    tone="amber"
                    meta={
                        <>
                            <FilterPill active={hasActiveFilters}>
                                {hasActiveFilters
                                    ? 'Filtros activos'
                                    : 'Sin filtros'}
                            </FilterPill>
                            <FilterPill>{`${registros.length} ${registros.length === 1 ? 'registro' : 'registros'}`}</FilterPill>
                        </>
                    }
                    footer={
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleReset}
                                    className="gap-2 rounded-xl"
                                >
                                    <X className="h-3.5 w-3.5" />
                                    Limpiar
                                </Button>
                                <span className="text-xs text-muted-foreground">
                                    Los filtros se aplican automáticamente.
                                </span>
                            </div>
                            <FilterPill>{`${mesLabel} ${anioSeleccionado}`}</FilterPill>
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
                                onValueChange={setCentroId}
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
                                                    'amber',
                                                )}
                                                onClick={() => {
                                                    setEmpleadoId('all');
                                                    setEmpleadoSearch('');
                                                    setShowEmpleadoDropdown(
                                                        false,
                                                    );
                                                }}
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
                                                    const empId = String(
                                                        employee.id,
                                                    );
                                                    return (
                                                        <button
                                                            key={employee.id}
                                                            type="button"
                                                            className={filterDropdownOptionClassName(
                                                                empleadoId ===
                                                                    empId,
                                                                'amber',
                                                            )}
                                                            onClick={() => {
                                                                setEmpleadoId(
                                                                    empId,
                                                                );
                                                                setEmpleadoSearch(
                                                                    `${employee.name} ${employee.apellido}`,
                                                                );
                                                                setShowEmpleadoDropdown(
                                                                    false,
                                                                );
                                                            }}
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
                            label="Mes"
                            htmlFor="mes_filter"
                            icon={Calendar}
                        >
                            <Select
                                value={mesSeleccionado}
                                onValueChange={setMesSeleccionado}
                            >
                                <FilterSelectTrigger id="mes_filter">
                                    <SelectValue />
                                </FilterSelectTrigger>
                                <SelectContent>
                                    {MESES.map((m) => (
                                        <SelectItem
                                            key={m.value}
                                            value={m.value}
                                        >
                                            {m.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField
                            label="Año"
                            htmlFor="anio_filter"
                            icon={Calendar}
                        >
                            <Select
                                value={anioSeleccionado}
                                onValueChange={setAnioSeleccionado}
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

                {/* Tabla */}
                <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    <div className="flex items-center border-b px-4 py-3">
                        <h2 className="text-sm font-semibold">
                            {registros.length > 0
                                ? `${registros.length} registro${registros.length !== 1 ? 's' : ''} — ${mesLabel} ${anioSeleccionado}`
                                : 'Registros'}
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/30">
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                        Día
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                        Empleado
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                        Horas extra
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                        Origen
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {registros.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-4 py-10 text-center text-muted-foreground"
                                        >
                                            No hay datos para los filtros
                                            seleccionados
                                        </td>
                                    </tr>
                                ) : (
                                    registros.map((r) => (
                                        <tr
                                            key={r.id}
                                            className="transition-colors hover:bg-muted/40"
                                        >
                                            <td className="px-4 py-3 font-mono text-sm">
                                                {formatDate(r.fecha)}
                                            </td>
                                            <td className="px-4 py-3 font-medium">
                                                {r.apellido}
                                                {r.apellido ? ', ' : ''}
                                                {r.nombre}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono">
                                                <ExtraCell
                                                    seconds={r.horas_extra}
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                {r.origen === 'manual' ? (
                                                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                                        Manual
                                                        {r.admin_nombre
                                                            ? ` · ${r.admin_nombre}`
                                                            : ''}
                                                    </span>
                                                ) : (
                                                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                                        Auto
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                                    onClick={() =>
                                                        setDeleteId(r.id)
                                                    }
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Diálogo — Añadir horas extra */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Añadir horas extra</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="grid gap-1.5">
                            <Label className="text-xs font-medium">
                                Empleado
                            </Label>
                            <Select
                                value={addForm.user_id}
                                onValueChange={(v) =>
                                    setAddForm((f) => ({ ...f, user_id: v }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar empleado" />
                                </SelectTrigger>
                                <SelectContent>
                                    {employees.map((e) => (
                                        <SelectItem
                                            key={e.id}
                                            value={String(e.id)}
                                        >
                                            {e.apellido} {e.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-1.5">
                            <Label className="text-xs font-medium">Fecha</Label>
                            <Input
                                type="date"
                                value={addForm.fecha}
                                onChange={(e) =>
                                    setAddForm((f) => ({
                                        ...f,
                                        fecha: e.target.value,
                                    }))
                                }
                            />
                        </div>

                        <div className="grid gap-1.5">
                            <Label className="text-xs font-medium">
                                Horas extra (HH:MM, negativo con -)
                            </Label>
                            <Input
                                type="text"
                                placeholder="01:30 o -00:30"
                                value={addForm.horas_extra}
                                onChange={(e) =>
                                    setAddForm((f) => ({
                                        ...f,
                                        horas_extra: e.target.value,
                                    }))
                                }
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowAddDialog(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleAdd}
                            disabled={!addForm.user_id || !addForm.fecha}
                        >
                            Guardar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Diálogo — Confirmar eliminación */}
            <Dialog
                open={deleteId !== null}
                onOpenChange={(open) => {
                    if (!open) setDeleteId(null);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Eliminar registro</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        ¿Estás seguro de que quieres eliminar este registro? La
                        acción quedará registrada para trazabilidad.
                    </p>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteId(null)}
                        >
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Eliminar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
