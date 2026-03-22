import { Transition } from '@headlessui/react';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
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
import SettingsLayout from '@/layouts/settings/layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Trabajo', href: '/settings/trabajo' },
];

const DIAS = [
    { key: 'horario_lunes', label: 'Lunes' },
    { key: 'horario_martes', label: 'Martes' },
    { key: 'horario_miercoles', label: 'Miércoles' },
    { key: 'horario_jueves', label: 'Jueves' },
    { key: 'horario_viernes', label: 'Viernes' },
    { key: 'horario_sabado', label: 'Sábado' },
    { key: 'horario_domingo', label: 'Domingo' },
] as const;

type DiaKey = (typeof DIAS)[number]['key'];

interface Trabajo {
    company_id: number | null;
    work_center_id: number | null;
    horario_lunes: number | null;
    horario_martes: number | null;
    horario_miercoles: number | null;
    horario_jueves: number | null;
    horario_viernes: number | null;
    horario_sabado: number | null;
    horario_domingo: number | null;
}

interface Props {
    companies: { id: number; nombre: string }[];
    workCenters: { id: number; company_id: number; nombre: string }[];
    trabajo: Trabajo;
}

export default function TrabajoSettings({
    companies,
    workCenters,
    trabajo,
}: Props) {
    const [companyId, setCompanyId] = useState<string>(
        trabajo.company_id ? String(trabajo.company_id) : 'none',
    );
    const [workCenterId, setWorkCenterId] = useState<string>(
        trabajo.work_center_id ? String(trabajo.work_center_id) : 'none',
    );
    const [horarios, setHorarios] = useState<Record<DiaKey, string>>({
        horario_lunes: String(trabajo.horario_lunes ?? 0),
        horario_martes: String(trabajo.horario_martes ?? 0),
        horario_miercoles: String(trabajo.horario_miercoles ?? 0),
        horario_jueves: String(trabajo.horario_jueves ?? 0),
        horario_viernes: String(trabajo.horario_viernes ?? 0),
        horario_sabado: String(trabajo.horario_sabado ?? 0),
        horario_domingo: String(trabajo.horario_domingo ?? 0),
    });

    const [errors, setErrors] = useState<{
        company_id?: string;
        work_center_id?: string;
    }>({});
    const [recentlySuccessful, setRecentlySuccessful] = useState(false);
    const [processing, setProcessing] = useState(false);

    const filteredWorkCenters =
        companyId === 'none'
            ? workCenters
            : workCenters.filter((wc) => wc.company_id === Number(companyId));

    function handleEmpresaChange(value: string) {
        setCompanyId(value);
        setWorkCenterId('none');
        setErrors((prev) => ({ ...prev, company_id: undefined }));
    }

    function handleHorarioChange(key: DiaKey, value: string) {
        // Only allow digits and up to one decimal separator
        const clean = value.replace(/[^0-9.,]/g, '').replace(',', '.');
        setHorarios((prev) => ({ ...prev, [key]: clean }));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        const newErrors: { company_id?: string; work_center_id?: string } = {};
        if (companyId === 'none')
            newErrors.company_id = 'La empresa es obligatoria.';
        if (workCenterId === 'none')
            newErrors.work_center_id = 'El centro de trabajo es obligatorio.';
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        setErrors({});
        setProcessing(true);

        const payload: Record<string, string | number | null> = {
            company_id: companyId !== 'none' ? Number(companyId) : null,
            work_center_id:
                workCenterId !== 'none' ? Number(workCenterId) : null,
        };

        for (const dia of DIAS) {
            const val = parseFloat(horarios[dia.key]);
            payload[dia.key] = isNaN(val) ? 0 : Math.min(24, Math.max(0, val));
        }

        router.patch('/settings/trabajo', payload, {
            preserveScroll: true,
            onSuccess: () => {
                setRecentlySuccessful(true);
                setTimeout(() => setRecentlySuccessful(false), 2000);
            },
            onFinish: () => setProcessing(false),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Configuración de trabajo" />

            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Configuración de trabajo"
                        description="Centro de trabajo y horario semanal previsto"
                    />

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Empresa */}
                        <div className="grid gap-2">
                            <Label>Empresa</Label>
                            <Select
                                value={companyId}
                                onValueChange={handleEmpresaChange}
                            >
                                <SelectTrigger
                                    className={
                                        errors.company_id
                                            ? 'border-destructive'
                                            : ''
                                    }
                                >
                                    <SelectValue placeholder="Sin empresa asignada" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">
                                        Sin empresa asignada
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
                            {errors.company_id && (
                                <p className="text-sm text-destructive">
                                    {errors.company_id}
                                </p>
                            )}
                        </div>

                        {/* Centro de trabajo */}
                        <div className="grid gap-2">
                            <Label>Centro de trabajo</Label>
                            <Select
                                value={workCenterId}
                                onValueChange={(value) => {
                                    setWorkCenterId(value);
                                    setErrors((prev) => ({
                                        ...prev,
                                        work_center_id: undefined,
                                    }));
                                }}
                                disabled={filteredWorkCenters.length === 0}
                            >
                                <SelectTrigger
                                    className={
                                        errors.work_center_id
                                            ? 'border-destructive'
                                            : ''
                                    }
                                >
                                    <SelectValue placeholder="Sin centro asignado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">
                                        Sin centro asignado
                                    </SelectItem>
                                    {filteredWorkCenters.map((wc) => (
                                        <SelectItem
                                            key={wc.id}
                                            value={String(wc.id)}
                                        >
                                            {wc.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.work_center_id && (
                                <p className="text-sm text-destructive">
                                    {errors.work_center_id}
                                </p>
                            )}
                        </div>

                        {/* Horario semanal */}
                        <div className="grid gap-3">
                            <Label>Horario semanal (horas por día)</Label>
                            <div className="overflow-hidden rounded-lg border">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                                                Día
                                            </th>
                                            <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                                                Horas
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {DIAS.map((dia) => (
                                            <tr key={dia.key}>
                                                <td className="px-4 py-2 font-medium">
                                                    {dia.label}
                                                </td>
                                                <td className="px-4 py-2 text-right">
                                                    <input
                                                        type="text"
                                                        inputMode="decimal"
                                                        value={
                                                            horarios[dia.key]
                                                        }
                                                        onChange={(e) =>
                                                            handleHorarioChange(
                                                                dia.key,
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="w-20 rounded-md border bg-background px-2 py-1 text-right text-sm focus:ring-1 focus:ring-ring focus:outline-none"
                                                        placeholder="0"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Introduce las horas diarias previstas (p. ej. 8,
                                7.5). Se usa para calcular las horas extra.
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <Button type="submit" disabled={processing}>
                                Guardar
                            </Button>

                            <Transition
                                show={recentlySuccessful}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm text-neutral-600">
                                    Guardado
                                </p>
                            </Transition>
                        </div>
                    </form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
