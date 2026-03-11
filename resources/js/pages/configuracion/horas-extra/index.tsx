import { Head, router } from '@inertiajs/react';
import { ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
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
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, Company, User, WorkCenter } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard() },
    { title: 'Horas Extra', href: '/horas-extra' },
];

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

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => currentYear - i);

interface DiaResumen {
    fecha: string;
    horas_trabajadas: number;
    horas_extra: number;
}

interface EmpleadoResumen {
    user_id: number;
    nombre: string;
    apellido: string;
    total_trabajado: number;
    total_extra: number;
    dias: DiaResumen[];
}

interface Props {
    companies: Pick<Company, 'id' | 'nombre'>[];
    workCenters: (Pick<WorkCenter, 'id' | 'nombre'> & { company_id: number })[];
    employees: Pick<User, 'id' | 'name' | 'apellido'>[];
    resumenPorEmpleado: EmpleadoResumen[];
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
    return <span className="text-muted-foreground">{formatSeconds(seconds)}</span>;
}

export default function HorasExtraIndex({
    companies,
    workCenters,
    employees,
    resumenPorEmpleado,
    filters,
    mes,
    anio,
}: Props) {
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
    const filterTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [localFilters, setLocalFilters] = useState({
        empresa_id:  filters.empresa_id  ?? 'all',
        centro_id:   filters.centro_id   ?? 'all',
        empleado_id: filters.empleado_id ?? 'all',
        mes:         String(mes),
        anio:        String(anio),
    });

    useEffect(() => {
        if (filterTimeout.current) clearTimeout(filterTimeout.current);
        filterTimeout.current = setTimeout(() => {
            const params: Record<string, string> = {
                mes:  localFilters.mes,
                anio: localFilters.anio,
            };
            if (localFilters.empresa_id  !== 'all') params.empresa_id  = localFilters.empresa_id;
            if (localFilters.centro_id   !== 'all') params.centro_id   = localFilters.centro_id;
            if (localFilters.empleado_id !== 'all') params.empleado_id = localFilters.empleado_id;
            router.get('/horas-extra', params, { preserveState: true, replace: true });
        }, 300);
    }, [localFilters]);

    function toggleRow(userId: number) {
        setExpandedRows((prev) => {
            const next = new Set(prev);
            next.has(userId) ? next.delete(userId) : next.add(userId);
            return next;
        });
    }

    const totalExtra = resumenPorEmpleado.reduce((sum, e) => sum + e.total_extra, 0);

    const filteredWorkCenters = localFilters.empresa_id === 'all'
        ? workCenters
        : workCenters.filter((wc) => wc.company_id === Number(localFilters.empresa_id));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Horas Extra" />

            <div className="flex flex-col gap-6 p-6">
                {/* Cabecera */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            <h1 className="text-2xl font-semibold">Horas Extra</h1>
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Resumen de horas trabajadas y horas extra por empleado
                        </p>
                    </div>

                    {resumenPorEmpleado.length > 0 && (
                        <div className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                            totalExtra > 0
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : totalExtra < 0
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                                    : 'bg-muted text-muted-foreground'
                        }`}>
                            Total extra: {totalExtra > 0 ? '+' : ''}{formatSeconds(totalExtra)}
                        </div>
                    )}
                </div>

                {/* Filtros */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <div className="grid gap-1.5">
                        <Label className="text-xs">Empresa</Label>
                        <Select
                            value={localFilters.empresa_id}
                            onValueChange={(v) =>
                                setLocalFilters((f) => ({ ...f, empresa_id: v, centro_id: 'all' }))
                            }
                        >
                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas</SelectItem>
                                {companies.map((c) => (
                                    <SelectItem key={c.id} value={String(c.id)}>
                                        {c.nombre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-1.5">
                        <Label className="text-xs">Centro de trabajo</Label>
                        <Select
                            value={localFilters.centro_id}
                            onValueChange={(v) => setLocalFilters((f) => ({ ...f, centro_id: v }))}
                        >
                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {filteredWorkCenters.map((wc) => (
                                    <SelectItem key={wc.id} value={String(wc.id)}>
                                        {wc.nombre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-1.5">
                        <Label className="text-xs">Empleado</Label>
                        <Select
                            value={localFilters.empleado_id}
                            onValueChange={(v) => setLocalFilters((f) => ({ ...f, empleado_id: v }))}
                        >
                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {employees.map((e) => (
                                    <SelectItem key={e.id} value={String(e.id)}>
                                        {e.apellido} {e.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-1.5">
                        <Label className="text-xs">Mes</Label>
                        <Select
                            value={localFilters.mes}
                            onValueChange={(v) => setLocalFilters((f) => ({ ...f, mes: v }))}
                        >
                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {MESES.map((m) => (
                                    <SelectItem key={m.value} value={m.value}>
                                        {m.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-1.5">
                        <Label className="text-xs">Año</Label>
                        <Select
                            value={localFilters.anio}
                            onValueChange={(v) => setLocalFilters((f) => ({ ...f, anio: v }))}
                        >
                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {YEARS.map((y) => (
                                    <SelectItem key={y} value={String(y)}>
                                        {y}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Tabla */}
                <div className="overflow-hidden rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">Empleado</th>
                                <th className="px-4 py-3 text-right font-medium">Horas trabajadas</th>
                                <th className="px-4 py-3 text-right font-medium">Horas extra</th>
                                <th className="px-4 py-3 text-right font-medium">Detalle</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {resumenPorEmpleado.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                                        No hay datos para los filtros seleccionados
                                    </td>
                                </tr>
                            ) : (
                                resumenPorEmpleado.map((emp) => (
                                    <>
                                        <tr
                                            key={emp.user_id}
                                            className="hover:bg-muted/30"
                                        >
                                            <td className="px-4 py-3 font-medium">
                                                {emp.apellido}{emp.apellido ? ', ' : ''}{emp.nombre}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono">
                                                {formatSeconds(emp.total_trabajado)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono">
                                                <ExtraCell seconds={emp.total_extra} />
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => toggleRow(emp.user_id)}
                                                >
                                                    {expandedRows.has(emp.user_id)
                                                        ? <ChevronUp className="h-4 w-4" />
                                                        : <ChevronDown className="h-4 w-4" />
                                                    }
                                                </Button>
                                            </td>
                                        </tr>

                                        {expandedRows.has(emp.user_id) && emp.dias.map((dia) => (
                                            <tr key={`${emp.user_id}-${dia.fecha}`} className="bg-muted/20">
                                                <td className="py-2 pl-10 pr-4 text-xs text-muted-foreground">
                                                    {formatDate(dia.fecha)}
                                                </td>
                                                <td className="px-4 py-2 text-right text-xs font-mono">
                                                    {formatSeconds(dia.horas_trabajadas)}
                                                </td>
                                                <td className="px-4 py-2 text-right text-xs font-mono">
                                                    <ExtraCell seconds={dia.horas_extra} />
                                                </td>
                                                <td />
                                            </tr>
                                        ))}
                                    </>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
