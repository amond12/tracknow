import { Head, router } from '@inertiajs/react';
import {
    Building2,
    Calendar,
    FileDown,
    Filter,
    Search,
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
    Select,
    SelectContent,
    SelectItem,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type {
    BreadcrumbItem,
    Company,
    Paginated,
    User,
    WorkCenter,
} from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard() },
    { title: 'Configuración', href: '/pdfs' },
    { title: 'Generación de PDFs', href: '/pdfs' },
];

// ─── Constantes ───────────────────────────────────────────────────────────────

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

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ResumenEmpleado {
    id: number;
    nombre: string;
    apellido: string;
    dni: string;
    total_segundos: number;
    total_dias: number;
    tiene_fichajes: boolean;
}

interface Props {
    companies: Pick<Company, 'id' | 'nombre'>[];
    workCenters: (Pick<WorkCenter, 'id' | 'nombre'> & { company_id: number })[];
    employees: (Pick<User, 'id' | 'name' | 'apellido' | 'remoto'> & {
        company_id: number;
        work_center_id: number;
    })[];
    resumen: Paginated<ResumenEmpleado>;
    filters: {
        empresa_id?: string;
        centro_id?: string;
        empleado_id?: string;
        mes?: string;
        anio?: string;
    };
    mes: number;
    anio: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSeconds(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function PdfsIndex({
    companies,
    workCenters,
    employees,
    resumen: resumenPage,
    filters,
    mes,
    anio,
}: Props) {
    const resumen = resumenPage.data;

    const [empresaId, setEmpresaId] = useState(filters.empresa_id ?? 'all');
    const [centroId, setCentroId] = useState(filters.centro_id ?? 'all');
    const [empleadoId, setEmpleadoId] = useState(filters.empleado_id ?? 'all');

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

    const [mesSeleccionado, setMesSeleccionado] = useState(String(mes));
    const [anioSeleccionado, setAnioSeleccionado] = useState(String(anio));

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

    function handleMesChange(value: string) {
        setMesSeleccionado(value);
    }

    function handleAnioChange(value: string) {
        setAnioSeleccionado(value);
    }

    function handleReset() {
        setEmpresaId('all');
        setCentroId('all');
        setEmpleadoId('all');
        setEmpleadoSearch('');
        setMesSeleccionado(String(new Date().getMonth() + 1));
        setAnioSeleccionado(String(new Date().getFullYear()));
    }

    function buildFilterParams(): Record<string, string> {
        const params: Record<string, string> = {
            mes: mesSeleccionado,
            anio: anioSeleccionado,
        };
        if (empresaId !== 'all') params.empresa_id = empresaId;
        if (centroId !== 'all') params.centro_id = centroId;
        if (empleadoId !== 'all') params.empleado_id = empleadoId;

        return params;
    }

    function handleApplyFilters() {
        const params = buildFilterParams();

        router.get('/pdfs', params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }

    function pdfUrl(id: number): string {
        return `/pdfs/${id}/download?mes=${mes}&anio=${anio}`;
    }

    const mesLabel = MESES.find((m) => m.value === String(mes))?.label ?? '';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Generación de PDFs" />

            <div className="flex flex-col gap-6 p-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Generación de PDFs
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Descarga el registro de jornada mensual de cada empleado
                        para su firma — conforme al RDL 8/2019
                    </p>
                </div>

                {/* Filtros */}
                <FilterPanel
                    title="Filtros de exportación"
                    description="Selecciona el alcance de empleados y el periodo del documento, y pulsa Actualizar para aplicar los cambios."
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
                                                    'emerald',
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
                                                                'emerald',
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
                            label="Mes"
                            htmlFor="mes_filter"
                            icon={Calendar}
                        >
                            <Select
                                value={mesSeleccionado}
                                onValueChange={handleMesChange}
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
                                onValueChange={handleAnioChange}
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

                {/* Tabla de empleados */}
                <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    <div className="flex items-center border-b px-4 py-3">
                        <h2 className="text-sm font-semibold">
                            {resumenPage.total > 0
                                ? `${resumenPage.total} empleado${resumenPage.total !== 1 ? 's' : ''} — ${mesLabel} ${anio}`
                                : 'Empleados'}
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/30">
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                        Empleado
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                        DNI
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                        Días registrados
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                        Total horas
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                        PDF
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {resumen.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-4 py-16 text-center"
                                        >
                                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                <FileDown className="h-8 w-8 opacity-30" />
                                                <p className="text-sm font-medium">
                                                    No hay empleados
                                                </p>
                                                <p className="text-xs">
                                                    Ajusta los filtros para ver
                                                    resultados
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    resumen.map((row) => (
                                        <tr
                                            key={row.id}
                                            className={`transition-colors ${row.tiene_fichajes ? 'hover:bg-muted/40' : 'opacity-60 hover:bg-muted/20'}`}
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                                        {[
                                                            row.nombre,
                                                            row.apellido,
                                                        ]
                                                            .filter(Boolean)
                                                            .map((s) => s[0])
                                                            .join('')
                                                            .toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">
                                                            {row.nombre}{' '}
                                                            {row.apellido}
                                                        </span>
                                                        {!row.tiene_fichajes && (
                                                            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                                                sin registros
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-sm text-muted-foreground">
                                                {row.dni || '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                {row.tiene_fichajes ? (
                                                    <span className="font-medium">
                                                        {row.total_dias}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        0
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-sm">
                                                {row.tiene_fichajes ? (
                                                    <span className="font-medium">
                                                        {formatSeconds(
                                                            row.total_segundos,
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        00:00:00
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <a
                                                    href={pdfUrl(row.id)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                                                >
                                                    <FileDown className="h-3.5 w-3.5" />
                                                    Descargar PDF
                                                </a>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <PaginationNav
                        path="/pdfs"
                        pagination={resumenPage}
                        query={{ ...filters, mes, anio }}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
