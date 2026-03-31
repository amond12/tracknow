import { Head, router, useForm } from '@inertiajs/react';
import {
    Building2,
    Clock,
    IdCard,
    Info,
    Pencil,
    Plus,
    Search,
    Shield,
    Trash2,
    User,
    Users,
    Wifi,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CopyCodeChip } from '@/components/copy-code-chip';
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
import InputError from '@/components/input-error';
import { MobilePageHeader } from '@/components/mobile-page-header';
import { PaginationNav } from '@/components/pagination-nav';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
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
import { Switch } from '@/components/ui/switch';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import type {
    BreadcrumbItem,
    Company,
    Paginated,
    User as UserType,
    WorkCenter,
} from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Fichar', href: '/fichar' },
    { title: 'Configuración', href: '/configuracion/empleados' },
    { title: 'Empleados', href: '/configuracion/empleados' },
];

interface Props {
    employees: Paginated<UserType>;
    employeeOptions: EmployeeFilterOption[];
    companies: Pick<Company, 'id' | 'nombre'>[];
    workCenters: (Pick<WorkCenter, 'id' | 'nombre'> & { company_id: number })[];
    filters: {
        empresa_id?: string;
        centro_id?: string;
        trabajador?: string;
    };
}

type EmployeeFilterOption = Pick<UserType, 'id' | 'name' | 'apellido'> & {
    company_id: number | null;
    work_center_id: number | null;
};

type EmpleadoFormData = {
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    dni: string;
    nss: string;
    rol: string;
    remoto: boolean;
    company_id: string;
    work_center_id: string;
    horario_lunes: string;
    horario_martes: string;
    horario_miercoles: string;
    horario_jueves: string;
    horario_viernes: string;
    horario_sabado: string;
    horario_domingo: string;
};

const emptyForm: EmpleadoFormData = {
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    dni: '',
    nss: '',
    rol: 'empleado',
    remoto: false,
    company_id: '',
    work_center_id: '',
    horario_lunes: '8',
    horario_martes: '8',
    horario_miercoles: '8',
    horario_jueves: '8',
    horario_viernes: '8',
    horario_sabado: '0',
    horario_domingo: '0',
};

const STEP_ONE_FIELDS: (keyof EmpleadoFormData)[] = [
    'company_id',
    'work_center_id',
    'rol',
    'remoto',
];

const STEP_TWO_FIELDS: (keyof EmpleadoFormData)[] = [
    'nombre',
    'apellido',
    'email',
    'telefono',
    'dni',
    'nss',
    'horario_lunes',
    'horario_martes',
    'horario_miercoles',
    'horario_jueves',
    'horario_viernes',
    'horario_sabado',
    'horario_domingo',
];

const WEEKLY_HOURS_FIELDS: { key: keyof EmpleadoFormData; label: string }[] = [
    { key: 'horario_lunes', label: 'Lun' },
    { key: 'horario_martes', label: 'Mar' },
    { key: 'horario_miercoles', label: 'Mie' },
    { key: 'horario_jueves', label: 'Jue' },
    { key: 'horario_viernes', label: 'Vie' },
    { key: 'horario_sabado', label: 'Sab' },
    { key: 'horario_domingo', label: 'Dom' },
];

const selectContentClassName =
    'w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)]';

function StepIndicator({ currentStep }: { currentStep: 1 | 2 }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-foreground">
                Paso {currentStep} de 2
            </span>
            <div className="flex items-center gap-2">
                <span
                    className={`h-2.5 w-2.5 rounded-full ${
                        currentStep === 1 ? 'bg-foreground' : 'bg-border'
                    }`}
                />
                <span
                    className={`h-2.5 w-2.5 rounded-full ${
                        currentStep === 2 ? 'bg-foreground' : 'bg-border'
                    }`}
                />
            </div>
        </div>
    );
}

function hasAnyFieldError(
    errors: Partial<Record<keyof EmpleadoFormData, string>>,
    fields: (keyof EmpleadoFormData)[],
) {
    return fields.some((field) => Boolean(errors[field]));
}

function EmpleadoForm({
    mode,
    data,
    setData,
    errors,
    processing,
    onSubmit,
    onCancel,
    submitLabel,
    companies,
    workCenters,
}: {
    mode: 'create' | 'edit';
    data: EmpleadoFormData;
    setData: <K extends keyof EmpleadoFormData>(
        field: K,
        value: EmpleadoFormData[K],
    ) => void;
    errors: Partial<Record<keyof EmpleadoFormData, string>>;
    processing: boolean;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
    submitLabel: string;
    companies: Pick<Company, 'id' | 'nombre'>[];
    workCenters: (Pick<WorkCenter, 'id' | 'nombre'> & { company_id: number })[];
}) {
    const [activeStep, setActiveStep] = useState<1 | 2>(1);
    const [localErrors, setLocalErrors] = useState<
        Partial<Record<keyof EmpleadoFormData, string>>
    >({});
    const filteredCenters = data.company_id
        ? workCenters.filter((wc) => wc.company_id === Number(data.company_id))
        : [];
    const mergedErrors = { ...localErrors, ...errors };
    const currentStep: 1 | 2 = hasAnyFieldError(errors, STEP_ONE_FIELDS)
        ? 1
        : hasAnyFieldError(errors, STEP_TWO_FIELDS)
          ? 2
          : activeStep;

    function updateField<K extends keyof EmpleadoFormData>(
        field: K,
        value: EmpleadoFormData[K],
    ) {
        setData(field, value);
        setLocalErrors((currentErrors) => {
            if (!currentErrors[field]) return currentErrors;

            const nextErrors = { ...currentErrors };
            delete nextErrors[field];
            return nextErrors;
        });
    }

    function handleCompanyChange(value: string) {
        updateField('company_id', value);
        updateField('work_center_id', '');
    }

    function validateStepOne() {
        const nextErrors: Partial<Record<keyof EmpleadoFormData, string>> = {};

        if (!data.company_id.trim()) {
            nextErrors.company_id = 'Selecciona una empresa.';
        }

        if (!data.work_center_id.trim()) {
            nextErrors.work_center_id = data.company_id
                ? 'Selecciona un centro de trabajo.'
                : 'Selecciona primero una empresa.';
        }

        setLocalErrors(nextErrors);

        return Object.keys(nextErrors).length === 0;
    }

    function handleContinue() {
        if (!validateStepOne()) return;

        setActiveStep(2);
    }

    function handleFormSubmit(e: React.FormEvent) {
        if (currentStep === 1) {
            e.preventDefault();
            handleContinue();
            return;
        }

        onSubmit(e);
    }

    const isEdit = mode === 'edit';
    const renderLegacySections = false;

    return (
        <form
            onSubmit={handleFormSubmit}
            className="flex min-h-0 flex-1 flex-col"
            autoComplete="off"
        >
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
                <div className="grid gap-4">
                    <StepIndicator currentStep={currentStep} />

                    {currentStep === 1 ? (
                        <section className="rounded-2xl border border-border/70 bg-background/90 p-4 shadow-sm sm:p-5">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="grid gap-1.5">
                                    <Label
                                        htmlFor="company_id"
                                        className="text-xs font-medium"
                                    >
                                        Empresa{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <Select
                                        value={data.company_id}
                                        onValueChange={handleCompanyChange}
                                        required
                                    >
                                        <SelectTrigger
                                            id="company_id"
                                            className="w-full"
                                        >
                                            <SelectValue placeholder="Selecciona una empresa" />
                                        </SelectTrigger>
                                        <SelectContent
                                            className={selectContentClassName}
                                        >
                                            {companies.map((company) => (
                                                <SelectItem
                                                    key={company.id}
                                                    value={String(company.id)}
                                                >
                                                    {company.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError
                                        message={mergedErrors.company_id}
                                    />
                                </div>

                                <div className="grid gap-1.5">
                                    <Label
                                        htmlFor="work_center_id"
                                        className="text-xs font-medium"
                                    >
                                        Centro de trabajo{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <Select
                                        value={data.work_center_id}
                                        onValueChange={(value) =>
                                            updateField(
                                                'work_center_id',
                                                value,
                                            )
                                        }
                                        disabled={!data.company_id}
                                        required
                                    >
                                        <SelectTrigger
                                            id="work_center_id"
                                            className="w-full"
                                        >
                                            <SelectValue
                                                placeholder={
                                                    data.company_id
                                                        ? 'Selecciona un centro'
                                                        : 'Selecciona primero una empresa'
                                                }
                                            />
                                        </SelectTrigger>
                                        <SelectContent
                                            className={selectContentClassName}
                                        >
                                            {filteredCenters.map((workCenter) => (
                                                <SelectItem
                                                    key={workCenter.id}
                                                    value={String(workCenter.id)}
                                                >
                                                    {workCenter.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError
                                        message={mergedErrors.work_center_id}
                                    />
                                </div>

                                <div className="grid gap-1.5">
                                    <Label
                                        htmlFor="rol"
                                        className="text-xs font-medium"
                                    >
                                        Rol{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <Select
                                        value={data.rol}
                                        onValueChange={(value) =>
                                            updateField('rol', value)
                                        }
                                        required
                                    >
                                        <SelectTrigger
                                            id="rol"
                                            className="w-full"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent
                                            className={selectContentClassName}
                                        >
                                            <SelectItem value="empleado">
                                                Empleado
                                            </SelectItem>
                                            <SelectItem value="encargado">
                                                Encargado
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={mergedErrors.rol} />
                                </div>

                                <div className="grid gap-1.5">
                                    <Label
                                        htmlFor="remoto"
                                        className="inline-flex items-center gap-1.5 text-xs font-medium"
                                    >
                                        Trabajo remoto
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button
                                                    type="button"
                                                    aria-label="Informacion sobre trabajo remoto"
                                                    className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
                                                >
                                                    <Info className="h-3.5 w-3.5" />
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-60">
                                                <p>
                                                    Activalo si el empleado va
                                                    a fichar fuera del centro.
                                                    Asi la app le pedira
                                                    ubicacion al registrar la
                                                    jornada.
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </Label>
                                    <div className="flex min-h-10 items-center justify-between rounded-lg border px-3">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Wifi className="h-4 w-4 text-muted-foreground" />
                                            <span>
                                                {data.remoto
                                                    ? 'Activo'
                                                    : 'No activo'}
                                            </span>
                                        </div>
                                        <Switch
                                            id="remoto"
                                            checked={data.remoto}
                                            onCheckedChange={(checked) =>
                                                updateField(
                                                    'remoto',
                                                    checked,
                                                )
                                            }
                                        />
                                    </div>
                                    <InputError message={mergedErrors.remoto} />
                                </div>
                            </div>
                        </section>
                    ) : (
                        <div className="grid gap-4">
                            <section className="rounded-2xl border border-border/70 bg-background/90 p-4 shadow-sm sm:p-5">
                                <div className="grid gap-3">
                                    <p className="text-sm font-medium">
                                        Datos personales
                                    </p>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <div className="grid gap-1.5">
                                            <Label
                                                htmlFor="nombre"
                                                className="text-xs font-medium"
                                            >
                                                Nombre{' '}
                                                <span className="text-destructive">
                                                    *
                                                </span>
                                            </Label>
                                            <Input
                                                id="nombre"
                                                value={data.nombre}
                                                onChange={(e) =>
                                                    updateField(
                                                        'nombre',
                                                        e.target.value,
                                                    )
                                                }
                                                required
                                            />
                                            <InputError
                                                message={mergedErrors.nombre}
                                            />
                                        </div>

                                        <div className="grid gap-1.5">
                                            <Label
                                                htmlFor="apellido"
                                                className="text-xs font-medium"
                                            >
                                                Apellido{' '}
                                                <span className="text-destructive">
                                                    *
                                                </span>
                                            </Label>
                                            <Input
                                                id="apellido"
                                                value={data.apellido}
                                                onChange={(e) =>
                                                    updateField(
                                                        'apellido',
                                                        e.target.value,
                                                    )
                                                }
                                                required
                                            />
                                            <InputError
                                                message={mergedErrors.apellido}
                                            />
                                        </div>

                                        <div className="grid gap-1.5">
                                            <Label
                                                htmlFor="email"
                                                className="text-xs font-medium"
                                            >
                                                Correo electronico{' '}
                                                <span className="text-destructive">
                                                    *
                                                </span>
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={data.email}
                                                onChange={(e) =>
                                                    updateField(
                                                        'email',
                                                        e.target.value,
                                                    )
                                                }
                                                required
                                            />
                                            <InputError
                                                message={mergedErrors.email}
                                            />
                                        </div>

                                        <div className="grid gap-1.5">
                                            <Label
                                                htmlFor="telefono"
                                                className="text-xs font-medium"
                                            >
                                                Telefono{' '}
                                                <span className="text-destructive">
                                                    *
                                                </span>
                                            </Label>
                                            <Input
                                                id="telefono"
                                                value={data.telefono}
                                                onChange={(e) =>
                                                    updateField(
                                                        'telefono',
                                                        e.target.value,
                                                    )
                                                }
                                                required
                                            />
                                            <InputError
                                                message={mergedErrors.telefono}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="rounded-2xl border border-border/70 bg-background/90 p-4 shadow-sm sm:p-5">
                                <div className="grid gap-3">
                                    <p className="text-sm font-medium">
                                        Identificacion
                                    </p>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <div className="grid gap-1.5">
                                            <Label
                                                htmlFor="dni"
                                                className="text-xs font-medium"
                                            >
                                                DNI / NIE{' '}
                                                <span className="text-destructive">
                                                    *
                                                </span>
                                            </Label>
                                            <Input
                                                id="dni"
                                                value={data.dni}
                                                onChange={(e) =>
                                                    updateField(
                                                        'dni',
                                                        e.target.value,
                                                    )
                                                }
                                                required
                                            />
                                            <InputError
                                                message={mergedErrors.dni}
                                            />
                                        </div>

                                        <div className="grid gap-1.5">
                                            <Label
                                                htmlFor="nss"
                                                className="text-xs font-medium"
                                            >
                                                Num. Seg. Social{' '}
                                                <span className="text-destructive">
                                                    *
                                                </span>
                                            </Label>
                                            <Input
                                                id="nss"
                                                value={data.nss}
                                                onChange={(e) =>
                                                    updateField(
                                                        'nss',
                                                        e.target.value,
                                                    )
                                                }
                                                required
                                            />
                                            <InputError
                                                message={mergedErrors.nss}
                                            />
                                        </div>
                                    </div>

                                    {mode === 'create' && (
                                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <Shield className="h-3.5 w-3.5 shrink-0" />
                                            La contrasena inicial del empleado
                                            sera su DNI.
                                        </p>
                                    )}
                                </div>
                            </section>

                            <section className="rounded-2xl border border-border/70 bg-background/90 p-4 shadow-sm sm:p-5">
                                <div className="grid gap-3">
                                    <div className="space-y-1">
                                        <p className="inline-flex items-center gap-1.5 text-sm font-medium">
                                            Horario semanal
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <button
                                                        type="button"
                                                        aria-label="Informacion sobre horario semanal"
                                                        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
                                                    >
                                                        <Info className="h-3.5 w-3.5" />
                                                    </button>
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-60">
                                                    <p>
                                                        Sirve para definir las
                                                        horas previstas de cada
                                                        día y usarlas para calcular
                                                        horas extras automáticas.
                                                    </p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Usa decimales para medias horas: 7.5
                                            = 7 h 30 min. Introduce 0 para dias
                                            no laborables.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 md:grid-cols-7">
                                        {WEEKLY_HOURS_FIELDS.map(
                                            ({ key, label }) => (
                                                <div
                                                    key={key}
                                                    className="grid gap-1.5"
                                                >
                                                    <Label className="text-xs font-medium md:text-center">
                                                        {label}
                                                    </Label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        max="24"
                                                        step="0.5"
                                                        value={
                                                            data[key] as string
                                                        }
                                                        onChange={(e) =>
                                                            updateField(
                                                                key,
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="text-center"
                                                    />
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                    {renderLegacySections && (
                        <>

            {/* Sección: Datos personales */}
            <div className="overflow-hidden rounded-xl border">
                <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-2.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Datos personales
                    </span>
                </div>
                <div className="grid gap-3 p-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                            <Label
                                htmlFor="nombre"
                                className="text-xs font-medium"
                            >
                                Nombre{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="nombre"
                                value={data.nombre}
                                onChange={(e) =>
                                    setData('nombre', e.target.value)
                                }
                                className="h-9"
                                required
                                autoFocus
                            />
                            <InputError message={errors.nombre} />
                        </div>
                        <div className="grid gap-1.5">
                            <Label
                                htmlFor="apellido"
                                className="text-xs font-medium"
                            >
                                Apellido{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="apellido"
                                value={data.apellido}
                                onChange={(e) =>
                                    setData('apellido', e.target.value)
                                }
                                className="h-9"
                                required
                            />
                            <InputError message={errors.apellido} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                            <Label
                                htmlFor="email"
                                className="text-xs font-medium"
                            >
                                Correo electrónico{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(e) =>
                                    setData('email', e.target.value)
                                }
                                className="h-9"
                                required
                            />
                            <InputError message={errors.email} />
                        </div>
                        <div className="grid gap-1.5">
                            <Label
                                htmlFor="telefono"
                                className="text-xs font-medium"
                            >
                                Teléfono{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="telefono"
                                value={data.telefono}
                                onChange={(e) =>
                                    setData('telefono', e.target.value)
                                }
                                className="h-9"
                                required
                            />
                            <InputError message={errors.telefono} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Sección: Identificación */}
            <div className="overflow-hidden rounded-xl border">
                <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-2.5">
                    <IdCard className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Identificación
                    </span>
                </div>
                <div className="grid gap-3 p-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                            <Label
                                htmlFor="dni"
                                className="text-xs font-medium"
                            >
                                DNI / NIE{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="dni"
                                value={data.dni}
                                onChange={(e) => setData('dni', e.target.value)}
                                className="h-9"
                                required
                            />
                            <InputError message={errors.dni} />
                        </div>
                        <div className="grid gap-1.5">
                            <Label
                                htmlFor="nss"
                                className="text-xs font-medium"
                            >
                                Núm. Seg. Social{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="nss"
                                value={data.nss}
                                onChange={(e) => setData('nss', e.target.value)}
                                className="h-9"
                                required
                            />
                            <InputError message={errors.nss} />
                        </div>
                    </div>
                    {!isEdit && (
                        <p className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                            <Shield className="h-3 w-3 shrink-0" />
                            La contraseña inicial del empleado será su DNI.
                        </p>
                    )}
                </div>
            </div>

            {/* Sección: Rol y modalidad */}
            <div className="overflow-hidden rounded-xl border">
                <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-2.5">
                    <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Rol y modalidad
                    </span>
                </div>
                <div className="grid gap-3 p-4 sm:grid-cols-2">
                    <div className="grid gap-1.5">
                        <Label htmlFor="rol" className="text-xs font-medium">
                            Rol <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={data.rol}
                            onValueChange={(v) => setData('rol', v)}
                            required
                        >
                            <SelectTrigger id="rol" className="h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="empleado">
                                    Empleado
                                </SelectItem>
                                <SelectItem value="encargado">
                                    Encargado
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.rol} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-xs font-medium">
                            Trabajo remoto
                        </Label>
                        <div className="flex h-9 items-center justify-between rounded-lg border bg-muted/20 px-3">
                            <div className="flex items-center gap-1.5 text-sm">
                                <Wifi className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>
                                    {data.remoto ? 'Activo' : 'No activo'}
                                </span>
                            </div>
                            <Switch
                                id="remoto"
                                checked={data.remoto}
                                onCheckedChange={(checked) =>
                                    setData('remoto', checked)
                                }
                            />
                        </div>
                        <InputError message={errors.remoto} />
                    </div>
                </div>
            </div>

            {/* Sección: Empresa y centro */}
            <div className="overflow-hidden rounded-xl border">
                <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-2.5">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Empresa y centro
                    </span>
                </div>
                <div className="grid gap-3 p-4 sm:grid-cols-2">
                    <div className="grid gap-1.5">
                        <Label
                            htmlFor="company_id"
                            className="text-xs font-medium"
                        >
                            Empresa <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={data.company_id}
                            onValueChange={handleCompanyChange}
                            required
                        >
                            <SelectTrigger id="company_id" className="h-9">
                                <SelectValue placeholder="Selecciona una empresa" />
                            </SelectTrigger>
                            <SelectContent>
                                {companies.map((c) => (
                                    <SelectItem key={c.id} value={String(c.id)}>
                                        {c.nombre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.company_id} />
                    </div>
                    <div className="grid gap-1.5">
                        <Label
                            htmlFor="work_center_id"
                            className="text-xs font-medium"
                        >
                            Centro de trabajo{' '}
                            <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={data.work_center_id}
                            onValueChange={(v) => setData('work_center_id', v)}
                            disabled={!data.company_id}
                            required
                        >
                            <SelectTrigger id="work_center_id" className="h-9">
                                <SelectValue
                                    placeholder={
                                        data.company_id
                                            ? 'Selecciona un centro'
                                            : 'Selecciona primero una empresa'
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {filteredCenters.map((wc) => (
                                    <SelectItem
                                        key={wc.id}
                                        value={String(wc.id)}
                                    >
                                        {wc.nombre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.work_center_id} />
                    </div>
                </div>
            </div>

            {/* Sección: Horario semanal */}
            <div className="overflow-hidden rounded-xl border">
                <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-2.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Horario semanal (horas por día)
                    </span>
                </div>
                <div className="grid grid-cols-7 gap-2 p-4">
                    {(
                        [
                            { key: 'horario_lunes', label: 'Lun' },
                            { key: 'horario_martes', label: 'Mar' },
                            { key: 'horario_miercoles', label: 'Mié' },
                            { key: 'horario_jueves', label: 'Jue' },
                            { key: 'horario_viernes', label: 'Vie' },
                            { key: 'horario_sabado', label: 'Sáb' },
                            { key: 'horario_domingo', label: 'Dom' },
                        ] as { key: keyof EmpleadoFormData; label: string }[]
                    ).map(({ key, label }) => (
                        <div key={key} className="grid gap-1.5">
                            <Label className="text-center text-xs font-medium">
                                {label}
                            </Label>
                            <Input
                                type="number"
                                min="0"
                                max="24"
                                step="0.5"
                                value={data[key] as string}
                                onChange={(e) => setData(key, e.target.value)}
                                className="h-9 text-center"
                            />
                        </div>
                    ))}
                </div>
                <p className="px-4 pb-3 text-xs text-muted-foreground">
                    Usa decimales para medias horas: 7.5 = 7 h 30 min. Introduce
                    0 para días no laborables.
                </p>
            </div>

            <DialogFooter className="pt-1">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={processing} className="gap-2">
                    {processing && <Spinner />}
                    {submitLabel}
                </Button>
            </DialogFooter>
                        </>
                    )}
                </div>
            </div>

            <DialogFooter className="border-t border-border/70 px-4 py-4 sm:px-6 sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                    {currentStep === 1
                        ? 'Primero asigna empresa, centro, rol y modalidad.'
                        : 'Completa los datos personales, la identificacion y el horario semanal.'}
                </p>
                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        className="w-full sm:w-auto"
                    >
                        Cancelar
                    </Button>
                    {currentStep === 1 ? (
                        <Button
                            type="button"
                            onClick={handleContinue}
                            className="w-full sm:w-auto"
                        >
                            Continuar
                        </Button>
                    ) : (
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setActiveStep(1)}
                                className="w-full sm:w-auto"
                            >
                                Volver
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="w-full gap-2 sm:w-auto"
                            >
                                {processing && <Spinner />}
                                {submitLabel}
                            </Button>
                        </>
                    )}
                </div>
            </DialogFooter>
        </form>
    );
}

export default function EmpleadosIndex({
    employees: employeesPage,
    employeeOptions,
    companies,
    workCenters,
    filters,
}: Props) {
    const employees = employeesPage.data;
    const [createOpen, setCreateOpen] = useState(false);
    const [createSession, setCreateSession] = useState(0);
    const [editTarget, setEditTarget] = useState<UserType | null>(null);
    const [editSession, setEditSession] = useState(0);
    const [deleteTarget, setDeleteTarget] = useState<UserType | null>(null);
    const [companyFilter, setCompanyFilter] = useState<string>(
        filters.empresa_id ?? 'all',
    );
    const [workCenterFilter, setWorkCenterFilter] = useState<string>(
        filters.centro_id ?? 'all',
    );
    const [employeeSearch, setEmployeeSearch] = useState(
        filters.trabajador ?? '',
    );
    const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
    const employeeFilterRef = useRef<HTMLDivElement>(null);

    const createForm = useForm<EmpleadoFormData>(emptyForm);
    const editForm = useForm<EmpleadoFormData>(emptyForm);
    const employeeDialogClassName =
        'left-1/2 right-auto flex max-h-[92vh] w-[calc(100vw-1rem)] -translate-x-1/2 flex-col gap-0 overflow-hidden border-border/70 p-0 shadow-2xl sm:w-[min(680px,calc(100vw-2rem))] sm:max-w-[680px]';

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                employeeFilterRef.current &&
                !employeeFilterRef.current.contains(event.target as Node)
            ) {
                setShowEmployeeDropdown(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);

        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const availableWorkCenters = useMemo(() => {
        if (companyFilter === 'all') {
            return workCenters;
        }

        return workCenters.filter(
            (workCenter) => workCenter.company_id === Number(companyFilter),
        );
    }, [companyFilter, workCenters]);

    const availableEmployeeOptions = useMemo(() => {
        return employeeOptions.filter((employee) => {
            const matchesCompany =
                companyFilter === 'all' ||
                employee.company_id === Number(companyFilter);
            const matchesWorkCenter =
                workCenterFilter === 'all' ||
                employee.work_center_id === Number(workCenterFilter);

            return matchesCompany && matchesWorkCenter;
        });
    }, [employeeOptions, companyFilter, workCenterFilter]);

    const normalizedEmployeeSearch = employeeSearch
        .trim()
        .toLocaleLowerCase('es-ES');

    const filteredEmployeeOptions = useMemo(() => {
        if (normalizedEmployeeSearch.length === 0) {
            return availableEmployeeOptions;
        }

        return availableEmployeeOptions.filter((employee) =>
            `${employee.name} ${employee.apellido ?? ''}`
                .trim()
                .toLocaleLowerCase('es-ES')
                .includes(normalizedEmployeeSearch),
        );
    }, [availableEmployeeOptions, normalizedEmployeeSearch]);

    const hasActiveFilters =
        companyFilter !== 'all' ||
        workCenterFilter !== 'all' ||
        normalizedEmployeeSearch.length > 0;
    const emptyStateMessage = hasActiveFilters
        ? 'No hay empleados para los filtros seleccionados'
        : 'No hay empleados registrados';

    function handleCompanyFilterChange(value: string) {
        setCompanyFilter(value);
        setWorkCenterFilter('all');
        setEmployeeSearch('');
        setShowEmployeeDropdown(false);
    }

    function handleWorkCenterFilterChange(value: string) {
        setWorkCenterFilter(value);
        setEmployeeSearch('');
        setShowEmployeeDropdown(false);
    }

    function handleEmployeeSearchChange(value: string) {
        setEmployeeSearch(value);
    }

    function handleEmployeeReset() {
        setEmployeeSearch('');
        setShowEmployeeDropdown(false);
    }

    function handleEmployeeSelect(employee: EmployeeFilterOption) {
        setEmployeeSearch(`${employee.name} ${employee.apellido ?? ''}`.trim());
        setShowEmployeeDropdown(false);
    }

    function buildFilterParams(): Record<string, string> {
        const params: Record<string, string> = {};

        if (companyFilter !== 'all') {
            params.empresa_id = companyFilter;
        }

        if (workCenterFilter !== 'all') {
            params.centro_id = workCenterFilter;
        }

        if (employeeSearch.trim() !== '') {
            params.trabajador = employeeSearch.trim();
        }

        return params;
    }

    function handleApplyFilters() {
        router.get('/configuracion/empleados', buildFilterParams(), {
            preserveScroll: true,
            replace: true,
        });
    }

    function openCreateDialog() {
        createForm.resetAndClearErrors();
        setCreateSession((current) => current + 1);
        setCreateOpen(true);
    }

    function closeCreateDialog() {
        setCreateOpen(false);
        createForm.resetAndClearErrors();
    }

    function openEdit(emp: UserType) {
        editForm.resetAndClearErrors();
        editForm.setData({
            nombre: emp.name,
            apellido: emp.apellido ?? '',
            email: emp.email,
            telefono: emp.telefono ?? '',
            dni: emp.dni ?? '',
            nss: emp.nss ?? '',
            rol:
                (emp.role as string) === 'encargado' ? 'encargado' : 'empleado',
            remoto: emp.remoto ?? false,
            company_id: String(emp.company_id ?? ''),
            work_center_id: String(emp.work_center_id ?? ''),
            horario_lunes: String(emp.horario_lunes ?? 8),
            horario_martes: String(emp.horario_martes ?? 8),
            horario_miercoles: String(emp.horario_miercoles ?? 8),
            horario_jueves: String(emp.horario_jueves ?? 8),
            horario_viernes: String(emp.horario_viernes ?? 8),
            horario_sabado: String(emp.horario_sabado ?? 0),
            horario_domingo: String(emp.horario_domingo ?? 0),
        });
        setEditSession((current) => current + 1);
        setEditTarget(emp);
    }

    function closeEditDialog() {
        setEditTarget(null);
        editForm.resetAndClearErrors();
    }

    function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        createForm.post('/configuracion/empleados', {
            onSuccess: () => closeCreateDialog(),
        });
    }

    function handleEdit(e: React.FormEvent) {
        e.preventDefault();
        if (!editTarget) return;
        editForm.put(`/configuracion/empleados/${editTarget.id}`, {
            onSuccess: () => closeEditDialog(),
        });
    }

    function handleDelete() {
        if (!deleteTarget) return;
        router.delete(`/configuracion/empleados/${deleteTarget.id}`, {
            onSuccess: () => setDeleteTarget(null),
        });
    }

    function handleResetFilters() {
        setCompanyFilter('all');
        setWorkCenterFilter('all');
        setEmployeeSearch('');
        setShowEmployeeDropdown(false);

        router.get('/configuracion/empleados', {}, {
            preserveScroll: true,
            replace: true,
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Empleados" />

            <div className="mobile-page-shell">
                <MobilePageHeader
                    title="Empleados"
                    description="Gestiona la plantilla con una vista tipo app pensada para movil."
                    eyebrow="Equipo"
                    action={
                        <Button
                            onClick={openCreateDialog}
                            disabled={companies.length === 0}
                            className="h-11 w-full justify-center rounded-2xl"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo empleado
                        </Button>
                    }
                />

                <div className="hidden items-center justify-between md:flex">
                    <div>
                        <h1 className="text-2xl font-semibold">Empleados</h1>
                        <p className="text-sm text-muted-foreground">
                            Gestiona los empleados de tus empresas
                        </p>
                    </div>
                    <Button
                        onClick={openCreateDialog}
                        disabled={companies.length === 0}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo empleado
                    </Button>
                </div>

                <FilterPanel
                    title="Filtros de plantilla"
                    description="Acota la lista por empresa, centro o trabajador y pulsa Actualizar para aplicar los cambios."
                    eyebrow="Organización"
                    icon={Building2}
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
                                onClick={handleResetFilters}
                                className="gap-2 rounded-xl"
                            >
                                <X className="h-3.5 w-3.5" />
                                Limpiar
                            </Button>
                        </div>
                    }
                >
                    <div className="grid gap-3 md:grid-cols-3">
                        <FilterField
                            label="Empresa"
                            htmlFor="empresa_filter"
                            icon={Building2}
                        >
                            <Select
                                value={companyFilter}
                                onValueChange={handleCompanyFilterChange}
                            >
                                <FilterSelectTrigger id="empresa_filter">
                                    <SelectValue />
                                </FilterSelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Todas las empresas
                                    </SelectItem>
                                    {companies.map((company) => (
                                        <SelectItem
                                            key={company.id}
                                            value={String(company.id)}
                                        >
                                            {company.nombre}
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
                                value={workCenterFilter}
                                onValueChange={handleWorkCenterFilterChange}
                                disabled={availableWorkCenters.length === 0}
                            >
                                <FilterSelectTrigger id="centro_filter">
                                    <SelectValue />
                                </FilterSelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Todos los centros
                                    </SelectItem>
                                    {availableWorkCenters.map((workCenter) => (
                                        <SelectItem
                                            key={workCenter.id}
                                            value={String(workCenter.id)}
                                        >
                                            {workCenter.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField
                            label="Trabajador"
                            htmlFor="trabajador_filter"
                            icon={Users}
                        >
                            <div className="relative" ref={employeeFilterRef}>
                                <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                <FilterInput
                                    id="trabajador_filter"
                                    type="text"
                                    value={employeeSearch}
                                    onChange={(e) =>
                                        handleEmployeeSearchChange(
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Todos los trabajadores"
                                    disabled={
                                        availableEmployeeOptions.length === 0
                                    }
                                    className="pl-9"
                                    onFocus={() =>
                                        setShowEmployeeDropdown(true)
                                    }
                                />
                                {showEmployeeDropdown && (
                                    <div className={filterDropdownClassName}>
                                        <div
                                            className={
                                                filterDropdownListClassName
                                            }
                                        >
                                            <button
                                                type="button"
                                                className={filterDropdownOptionClassName(
                                                    normalizedEmployeeSearch.length ===
                                                        0,
                                                    'blue',
                                                )}
                                                onClick={handleEmployeeReset}
                                            >
                                                Todos los trabajadores
                                            </button>
                                            {availableEmployeeOptions.length ===
                                                0 && (
                                                <p
                                                    className={
                                                        filterDropdownEmptyClassName
                                                    }
                                                >
                                                    No hay trabajadores
                                                    disponibles
                                                </p>
                                            )}
                                            {availableEmployeeOptions.length >
                                                0 &&
                                                filteredEmployeeOptions.length ===
                                                    0 && (
                                                    <p
                                                        className={
                                                            filterDropdownEmptyClassName
                                                        }
                                                    >
                                                        Sin resultados
                                                    </p>
                                                )}
                                            {filteredEmployeeOptions.map(
                                                (employee) => (
                                                    <button
                                                        key={employee.id}
                                                        type="button"
                                                        className={filterDropdownOptionClassName(
                                                            normalizedEmployeeSearch ===
                                                                `${employee.name} ${employee.apellido ?? ''}`
                                                                    .trim()
                                                                    .toLocaleLowerCase(
                                                                        'es-ES',
                                                                    ),
                                                            'blue',
                                                        )}
                                                        onClick={() =>
                                                            handleEmployeeSelect(
                                                                employee,
                                                            )
                                                        }
                                                    >
                                                        {employee.name}{' '}
                                                        {employee.apellido}
                                                    </button>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </FilterField>
                    </div>
                </FilterPanel>

                {employees.length === 0 ? (
                    <div className="mobile-surface px-4 py-10 text-center md:hidden">
                        <p className="text-sm font-medium text-slate-900">
                            {emptyStateMessage}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                            Ajusta los filtros o crea un empleado nuevo.
                        </p>
                    </div>
                ) : (
                    <div className="mobile-list-stack md:hidden">
                        {employees.map((emp) => (
                            <div key={emp.id} className="mobile-list-item">
                                <div className="mobile-list-item__header">
                                    <div>
                                        <p className="mobile-list-item__title">
                                            {emp.name} {emp.apellido}
                                        </p>
                                        <p className="mobile-list-item__subtitle">
                                            {emp.email}
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            className="h-10 w-10 rounded-2xl"
                                            onClick={() => openEdit(emp)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            className="h-10 w-10 rounded-2xl text-destructive"
                                            onClick={() => setDeleteTarget(emp)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 capitalize">
                                        {emp.role}
                                    </span>
                                    {emp.remoto && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-medium text-blue-700">
                                            <Wifi className="h-3 w-3" />
                                            Remoto
                                        </span>
                                    )}
                                </div>

                                <div className="mobile-list-item__rows">
                                    <div className="mobile-list-item__row">
                                        <span className="mobile-list-item__label">
                                            Telefono
                                        </span>
                                        <span className="mobile-list-item__value">
                                            {emp.telefono || '-'}
                                        </span>
                                    </div>
                                    <div className="mobile-list-item__row">
                                        <span className="mobile-list-item__label">
                                            DNI
                                        </span>
                                        <span className="mobile-list-item__value font-mono">
                                            {emp.dni || '-'}
                                        </span>
                                    </div>
                                    <div className="mobile-list-item__row">
                                        <span className="mobile-list-item__label">
                                            NSS
                                        </span>
                                        <span className="mobile-list-item__value font-mono">
                                            {emp.nss || '-'}
                                        </span>
                                    </div>
                                    <div className="mobile-list-item__row">
                                        <span className="mobile-list-item__label">
                                            Codigo
                                        </span>
                                        <span className="mobile-list-item__value">
                                            {emp.clock_code ? (
                                                <CopyCodeChip
                                                    value={emp.clock_code}
                                                />
                                            ) : (
                                                '-'
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {employeesPage.last_page > 1 && (
                    <div className="overflow-hidden rounded-lg border bg-card md:hidden">
                        <PaginationNav
                            path="/configuracion/empleados"
                            pagination={employeesPage}
                            query={filters}
                        />
                    </div>
                )}

                <div className="hidden overflow-hidden rounded-lg border bg-card md:block">
                    <div className="flex items-center justify-between border-b px-4 py-3">
                        <h2 className="text-sm font-semibold">
                            {employeesPage.total > 0
                                ? `${employeesPage.total} empleado${employeesPage.total !== 1 ? 's' : ''}`
                                : 'Empleados'}
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1120px] text-sm">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Nombre
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Apellido
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Email
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Teléfono
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        DNI
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        NSS
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Codigo
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Rol
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        Remoto
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {employees.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={10}
                                            className="px-4 py-8 text-center text-muted-foreground"
                                        >
                                            {emptyStateMessage}
                                        </td>
                                    </tr>
                                ) : (
                                    employees.map((emp) => (
                                        <tr
                                            key={emp.id}
                                            className="hover:bg-muted/30"
                                        >
                                            <td className="px-4 py-3 font-medium">
                                                {emp.name}
                                            </td>
                                            <td className="px-4 py-3">
                                                {emp.apellido}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {emp.email}
                                            </td>
                                            <td className="px-4 py-3">
                                                {emp.telefono}
                                            </td>
                                            <td className="px-4 py-3">
                                                {emp.dni}
                                            </td>
                                            <td className="px-4 py-3">
                                                {emp.nss}
                                            </td>
                                            <td className="px-4 py-3">
                                                {emp.clock_code ? (
                                                    <CopyCodeChip
                                                        value={emp.clock_code}
                                                    />
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                            <td className="px-4 py-3 capitalize">
                                                {emp.role}
                                            </td>
                                            <td className="px-4 py-3">
                                                {emp.remoto ? 'Sí' : 'No'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            openEdit(emp)
                                                        }
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="text-destructive hover:text-destructive"
                                                        onClick={() =>
                                                            setDeleteTarget(emp)
                                                        }
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <PaginationNav
                        path="/configuracion/empleados"
                        pagination={employeesPage}
                        query={filters}
                    />
                </div>
            </div>

            {/* Dialog: Crear */}
            <Dialog
                open={createOpen}
                onOpenChange={(open) => !open && closeCreateDialog()}
            >
                <DialogContent className={employeeDialogClassName}>
                    <DialogHeader className="border-b border-border/70 px-4 py-4 sm:px-6">
                        <DialogTitle className="text-base font-semibold">
                            Nuevo empleado
                        </DialogTitle>
                    </DialogHeader>
                    <EmpleadoForm
                        key={`create-${createSession}`}
                        mode="create"
                        data={createForm.data}
                        setData={createForm.setData}
                        errors={createForm.errors}
                        processing={createForm.processing}
                        onSubmit={handleCreate}
                        onCancel={closeCreateDialog}
                        submitLabel="Crear empleado"
                        companies={companies}
                        workCenters={workCenters}
                    />
                </DialogContent>
            </Dialog>

            {/* Dialog: Editar */}
            <Dialog
                open={!!editTarget}
                onOpenChange={(open) => !open && closeEditDialog()}
            >
                <DialogContent className={employeeDialogClassName}>
                    <DialogHeader className="border-b border-border/70 px-4 py-4 sm:px-6">
                        <DialogTitle className="text-base font-semibold">
                            Editar empleado
                        </DialogTitle>
                    </DialogHeader>
                    <EmpleadoForm
                        key={`edit-${editSession}-${editTarget?.id ?? 'none'}`}
                        mode="edit"
                        data={editForm.data}
                        setData={editForm.setData}
                        errors={editForm.errors}
                        processing={editForm.processing}
                        onSubmit={handleEdit}
                        onCancel={closeEditDialog}
                        submitLabel="Guardar cambios"
                        companies={companies}
                        workCenters={workCenters}
                    />
                </DialogContent>
            </Dialog>

            {/* Dialog: Eliminar */}
            <Dialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Eliminar empleado</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        ¿Estás seguro de que quieres eliminar a{' '}
                        <strong>
                            {deleteTarget?.name} {deleteTarget?.apellido}
                        </strong>
                        ? También se eliminará su cuenta de acceso. Esta acción
                        no se puede deshacer.
                    </p>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteTarget(null)}
                        >
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
