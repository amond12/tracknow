import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    MapPin,
    Pencil,
    Plus,
    Trash2,
    Wifi,
} from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { CentroIP } from '@/components/centro-ip';
import { CentroLocalizador } from '@/components/centro-localizador';
import { DireccionFields } from '@/components/direccion-fields';
import InputError from '@/components/input-error';
import { MobilePageHeader } from '@/components/mobile-page-header';
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
import AppLayout from '@/layouts/app-layout';
import type { MapboxAddressResult } from '@/lib/mapbox';
import {
    DEFAULT_WORK_CENTER_TIMEZONE,
    WORK_CENTER_TIMEZONE_OPTIONS,
} from '@/lib/timezones';
import { cn } from '@/lib/utils';
import type { Auth, BreadcrumbItem, Company, WorkCenter } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Fichar', href: '/fichar' },
    { title: 'Configuracion', href: '/configuracion/centros' },
    { title: 'Centros de trabajo', href: '/configuracion/centros' },
];

type WorkCenterWithCompany = WorkCenter & {
    company: Pick<Company, 'id' | 'nombre'>;
};

interface Props {
    workCenters: WorkCenterWithCompany[];
    companies: Pick<Company, 'id' | 'nombre'>[];
}

type CentroFormData = {
    company_id: string;
    nombre: string;
    pais: string;
    provincia: string;
    poblacion: string;
    direccion: string;
    cp: string;
    timezone: string;
    lat: string;
    lng: string;
    radio: string;
    ips: string[];
};

const emptyForm: CentroFormData = {
    company_id: '',
    nombre: '',
    pais: '',
    provincia: '',
    poblacion: '',
    direccion: '',
    cp: '',
    timezone: DEFAULT_WORK_CENTER_TIMEZONE,
    lat: '',
    lng: '',
    radio: '100',
    ips: [],
};

function StepPanel({ children }: { children: ReactNode }) {
    return (
        <section className="rounded-3xl border border-border/70 bg-background/90 p-4 shadow-sm sm:p-5">
            {children}
        </section>
    );
}

function StepIndicator({ currentStep }: { currentStep: 1 | 2 }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-foreground">
                Paso {currentStep} de 2
            </span>
            <div className="flex items-center gap-2">
                <span
                    className={cn(
                        'h-2.5 w-2.5 rounded-full',
                        currentStep === 1 ? 'bg-slate-900' : 'bg-slate-300',
                    )}
                />
                <span
                    className={cn(
                        'h-2.5 w-2.5 rounded-full',
                        currentStep === 2 ? 'bg-slate-900' : 'bg-slate-300',
                    )}
                />
            </div>
        </div>
    );
}

function AccessOptionCard({
    title,
    description,
    actionLabel,
    open,
    icon,
    onToggle,
    children,
}: {
    title: string;
    description: string;
    actionLabel: string;
    open: boolean;
    icon: ReactNode;
    onToggle: () => void;
    children: ReactNode;
}) {
    return (
        <section className="rounded-2xl border border-border/70 bg-background p-4 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                        {icon}
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-sm font-semibold tracking-tight">
                            {title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            {description}
                        </p>
                    </div>
                </div>

                <Button
                    type="button"
                    variant="outline"
                    onClick={onToggle}
                    className="w-full rounded-xl sm:w-auto"
                >
                    {open ? 'Ocultar' : actionLabel}
                </Button>
            </div>

            {open && (
                <div className="mt-4 border-t border-border/70 pt-4">
                    {children}
                </div>
            )}
        </section>
    );
}

function CentroForm({
    mode,
    data,
    setData,
    errors,
    processing,
    onSubmit,
    onCancel,
    submitLabel,
    companies,
}: {
    mode: 'create' | 'edit';
    data: CentroFormData;
    setData: <K extends keyof CentroFormData>(
        field: K,
        value: CentroFormData[K],
    ) => void;
    errors: Partial<Record<keyof CentroFormData, string>>;
    processing: boolean;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
    submitLabel: string;
    companies: Pick<Company, 'id' | 'nombre'>[];
}) {
    const [currentStep, setCurrentStep] = useState<1 | 2>(1);
    const [showLocationEditor, setShowLocationEditor] = useState(
        mode === 'edit' && data.lat !== '' && data.lng !== '',
    );
    const [showIpEditor, setShowIpEditor] = useState(
        mode === 'edit' && data.ips.length > 0,
    );
    const [localErrors, setLocalErrors] = useState<
        Partial<Record<keyof CentroFormData, string>>
    >({});
    const [forceAddressFallback, setForceAddressFallback] = useState(false);
    const hasExactLocation = data.lat !== '' && data.lng !== '';
    const hasIpAccess = data.ips.length > 0;
    const mergedErrors = { ...localErrors, ...errors };

    function updateField<K extends keyof CentroFormData>(
        field: K,
        value: CentroFormData[K],
    ) {
        setData(field, value);
        setLocalErrors((currentErrors) => {
            if (!currentErrors[field]) return currentErrors;

            const nextErrors = { ...currentErrors };
            delete nextErrors[field];
            return nextErrors;
        });
    }

    function applyResolvedAddressFields(result: MapboxAddressResult) {
        updateField('pais', result.pais || data.pais);
        updateField('provincia', result.provincia || data.provincia);
        updateField('poblacion', result.poblacion || data.poblacion);
        updateField('cp', result.cp || data.cp);
        updateField(
            'direccion',
            result.direccion || result.label || data.direccion,
        );
        setForceAddressFallback(false);
    }

    function applyResolvedAddressFromDireccion(result: MapboxAddressResult) {
        applyResolvedAddressFields(result);
        updateField('lat', '');
        updateField('lng', '');
    }

    function handleAddressFieldChange(
        field: 'pais' | 'provincia' | 'poblacion' | 'cp' | 'direccion',
        value: string,
    ) {
        updateField(field, value);

        if (field === 'direccion') {
            setForceAddressFallback(false);
            updateField('pais', '');
            updateField('provincia', '');
            updateField('poblacion', '');
            updateField('cp', '');
        }

        updateField('lat', '');
        updateField('lng', '');
    }

    function validateStepOne() {
        const nextErrors: Partial<Record<keyof CentroFormData, string>> = {};

        if (!data.company_id.trim()) {
            nextErrors.company_id = 'Selecciona una empresa.';
        }

        if (!data.nombre.trim()) {
            nextErrors.nombre = 'Escribe el nombre del centro.';
        }

        if (!data.timezone.trim()) {
            nextErrors.timezone = 'Selecciona una zona horaria.';
        }

        if (!data.direccion.trim()) {
            nextErrors.direccion = 'Escribe la direccion del centro.';
        }

        if (!data.pais.trim()) {
            nextErrors.pais = 'Completa el pais.';
        }

        if (!data.provincia.trim()) {
            nextErrors.provincia = 'Completa la provincia.';
        }

        if (!data.poblacion.trim()) {
            nextErrors.poblacion = 'Completa la poblacion.';
        }

        if (!data.cp.trim()) {
            nextErrors.cp = 'Completa el codigo postal.';
        }

        if (
            nextErrors.pais ||
            nextErrors.provincia ||
            nextErrors.poblacion ||
            nextErrors.cp
        ) {
            setForceAddressFallback(true);
        }

        setLocalErrors(nextErrors);

        return Object.keys(nextErrors).length === 0;
    }

    function handleContinue() {
        if (!validateStepOne()) return;

        setCurrentStep(2);
    }

    function handleFormSubmit(e: React.FormEvent) {
        if (currentStep === 1) {
            e.preventDefault();
            handleContinue();
            return;
        }

        onSubmit(e);
    }

    return (
        <form
            onSubmit={handleFormSubmit}
            className="flex flex-col gap-5"
            autoComplete="off"
        >
            <StepIndicator currentStep={currentStep} />

            {currentStep === 1 ? (
                <StepPanel>
                    <div className="grid gap-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-1.5">
                                <Label
                                    htmlFor="company_id"
                                    className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase"
                                >
                                    Empresa
                                </Label>
                                <Select
                                    value={
                                        data.company_id
                                            ? String(data.company_id)
                                            : ''
                                    }
                                    onValueChange={(value) =>
                                        updateField('company_id', value)
                                    }
                                    required
                                >
                                    <SelectTrigger
                                        id="company_id"
                                        className="w-full"
                                    >
                                        <SelectValue placeholder="Selecciona una empresa" />
                                    </SelectTrigger>
                                    <SelectContent className="w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)]">
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
                                <InputError message={mergedErrors.company_id} />
                            </div>

                            <div className="grid gap-1.5">
                                <Label
                                    htmlFor="nombre"
                                    className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase"
                                >
                                    Nombre del centro
                                </Label>
                                <Input
                                    id="nombre"
                                    value={data.nombre}
                                    onChange={(e) =>
                                        updateField('nombre', e.target.value)
                                    }
                                    placeholder="Ej: Oficina Madrid Centro"
                                    required
                                    autoFocus
                                />
                                <InputError message={mergedErrors.nombre} />
                            </div>
                        </div>

                        <DireccionFields
                            values={{
                                pais: data.pais,
                                provincia: data.provincia,
                                poblacion: data.poblacion,
                                cp: data.cp,
                                direccion: data.direccion,
                            }}
                            errors={{
                                pais: mergedErrors.pais,
                                provincia: mergedErrors.provincia,
                                poblacion: mergedErrors.poblacion,
                                cp: mergedErrors.cp,
                                direccion: mergedErrors.direccion,
                            }}
                            onFieldChange={handleAddressFieldChange}
                            onAddressResolved={applyResolvedAddressFromDireccion}
                            deferDerivedFields
                            forceManualEntry={
                                forceAddressFallback ||
                                Boolean(
                                    mergedErrors.pais ||
                                        mergedErrors.provincia ||
                                        mergedErrors.poblacion ||
                                        mergedErrors.cp,
                                )
                            }
                        />

                        <div className="grid gap-1.5">
                            <Label
                                htmlFor="timezone"
                                className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase"
                            >
                                Zona horaria
                            </Label>
                            <Select
                                value={data.timezone}
                                onValueChange={(value) =>
                                    updateField('timezone', value)
                                }
                            >
                                <SelectTrigger
                                    id="timezone"
                                    className="w-full"
                                >
                                    <SelectValue placeholder="Selecciona una zona horaria" />
                                </SelectTrigger>
                                <SelectContent className="w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)]">
                                    {WORK_CENTER_TIMEZONE_OPTIONS.map(
                                        (option) => (
                                            <SelectItem
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </SelectItem>
                                        ),
                                    )}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Se usara como hora oficial del centro para
                                fichajes, registros y PDFs.
                            </p>
                            <InputError message={mergedErrors.timezone} />
                        </div>
                    </div>
                </StepPanel>
            ) : (
                <StepPanel>
                    <div className="grid gap-4">
                        <AccessOptionCard
                            title="Acceso con ubicacion"
                            description="Valida que el empleado este fisicamente cerca del centro en el momento de fichar."
                            actionLabel={
                                hasExactLocation
                                    ? 'Editar ubicacion'
                                    : 'Configurar ubicacion'
                            }
                            open={showLocationEditor}
                            icon={<MapPin className="h-4 w-4" />}
                            onToggle={() =>
                                setShowLocationEditor((current) => !current)
                            }
                        >
                            <CentroLocalizador
                                direccion={data.direccion}
                                poblacion={data.poblacion}
                                provincia={data.provincia}
                                cp={data.cp}
                                pais={data.pais}
                                initialLat={data.lat ? Number(data.lat) : null}
                                initialLng={data.lng ? Number(data.lng) : null}
                                initialRadio={
                                    data.radio ? Number(data.radio) : 100
                                }
                                autoLocateOnMount={!hasExactLocation}
                                onAddressResolved={applyResolvedAddressFields}
                                onCoordenadas={(lat, lng, radio) => {
                                    updateField('lat', String(lat));
                                    updateField('lng', String(lng));
                                    updateField('radio', String(radio));
                                }}
                                onRadioChange={(radio) =>
                                    updateField('radio', String(radio))
                                }
                                onLimpiar={() => {
                                    updateField('lat', '');
                                    updateField('lng', '');
                                }}
                            />
                        </AccessOptionCard>

                        <AccessOptionCard
                            title="Acceso con IP"
                            description="Valida que el empleado este conectado a la red o Wi-Fi del centro al registrar el fichaje."
                            actionLabel={
                                hasIpAccess ? 'Editar IP' : 'Configurar IP'
                            }
                            open={showIpEditor}
                            icon={<Wifi className="h-4 w-4" />}
                            onToggle={() =>
                                setShowIpEditor((current) => !current)
                            }
                        >
                            <CentroIP
                                ips={data.ips}
                                onIPs={(ips) => updateField('ips', ips)}
                            />
                        </AccessOptionCard>
                    </div>
                </StepPanel>
            )}

            <DialogFooter className="border-t border-border/70 pt-4 sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                    {currentStep === 1
                        ? 'Completa primero los datos base del centro.'
                        : 'Puedes guardar el centro solo con la direccion postal. Ubicacion e IP son opcionales.'}
                </p>
                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        className="w-full rounded-xl sm:w-auto"
                    >
                        Cancelar
                    </Button>
                    {currentStep === 1 ? (
                        <Button
                            type="button"
                            onClick={handleContinue}
                            className="w-full rounded-xl px-5 sm:w-auto"
                        >
                            Continuar
                        </Button>
                    ) : (
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCurrentStep(1)}
                                className="w-full rounded-xl sm:w-auto"
                            >
                                Volver
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="w-full rounded-xl px-5 sm:w-auto"
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

function CentrosPageContent({ workCenters, companies }: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const canManageCenters = auth.user.role === 'admin';
    const [createOpen, setCreateOpen] = useState(false);
    const [createSession, setCreateSession] = useState(0);
    const [editTarget, setEditTarget] = useState<WorkCenterWithCompany | null>(
        null,
    );
    const [editSession, setEditSession] = useState(0);
    const [deleteTarget, setDeleteTarget] =
        useState<WorkCenterWithCompany | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState('');

    const createForm = useForm<CentroFormData>(emptyForm);
    const editForm = useForm<CentroFormData>(emptyForm);
    const centerDialogClassName =
        'left-1/2 right-auto flex max-h-[92vh] w-[calc(100vw-1rem)] -translate-x-1/2 flex-col gap-0 overflow-hidden border-border/70 p-0 shadow-2xl sm:w-[min(680px,calc(100vw-2rem))] sm:max-w-[680px]';

    function hasStepOneErrors(
        formErrors: Partial<Record<keyof CentroFormData, string>>,
    ) {
        return Boolean(
            formErrors.company_id ||
                formErrors.nombre ||
                formErrors.timezone ||
                formErrors.direccion ||
                formErrors.pais ||
                formErrors.provincia ||
                formErrors.poblacion ||
                formErrors.cp,
        );
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

    function openEdit(centro: WorkCenterWithCompany) {
        editForm.resetAndClearErrors();
        editForm.setData({
            company_id: String(centro.company_id),
            nombre: centro.nombre,
            pais: centro.pais,
            provincia: centro.provincia,
            poblacion: centro.poblacion,
            direccion: centro.direccion,
            cp: centro.cp,
            timezone: centro.timezone,
            lat: centro.lat ? String(centro.lat) : '',
            lng: centro.lng ? String(centro.lng) : '',
            radio: centro.radio ? String(centro.radio) : '100',
            ips: centro.ips ?? [],
        });
        setEditSession((current) => current + 1);
        setEditTarget(centro);
    }

    function closeEditDialog() {
        setEditTarget(null);
        editForm.resetAndClearErrors();
    }

    function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        createForm.post('/configuracion/centros', {
            onSuccess: () => closeCreateDialog(),
            onError: (formErrors) => {
                if (hasStepOneErrors(formErrors)) {
                    setCreateSession((current) => current + 1);
                }
            },
        });
    }

    function handleEdit(e: React.FormEvent) {
        e.preventDefault();
        if (!editTarget) return;

        editForm.put(`/configuracion/centros/${editTarget.id}`, {
            onSuccess: () => closeEditDialog(),
            onError: (formErrors) => {
                if (hasStepOneErrors(formErrors)) {
                    setEditSession((current) => current + 1);
                }
            },
        });
    }

    function handleDelete() {
        if (!deleteTarget || deleteConfirm !== 'ELIMINAR') return;

        router.delete(`/configuracion/centros/${deleteTarget.id}`, {
            onSuccess: () => {
                setDeleteTarget(null);
                setDeleteConfirm('');
            },
        });
    }

    return (
        <>
            <div className="mobile-page-shell">
                <MobilePageHeader
                    title="Centros de trabajo"
                    description="Consulta sedes y valida direcciones con una navegacion mas natural en movil."
                    eyebrow="Ubicaciones"
                    action={
                        canManageCenters ? (
                            <Button
                                onClick={openCreateDialog}
                                disabled={companies.length === 0}
                                className="h-11 w-full justify-center rounded-2xl"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Nuevo centro
                            </Button>
                        ) : null
                    }
                />

                <div className="hidden items-center justify-between md:flex">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Centros de trabajo
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Gestiona los centros de trabajo de tus empresas
                        </p>
                    </div>
                    {canManageCenters && (
                        <Button
                            onClick={openCreateDialog}
                            disabled={companies.length === 0}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo centro
                        </Button>
                    )}
                </div>

                {workCenters.length === 0 ? (
                    <div className="mobile-surface px-4 py-10 text-center md:hidden">
                        <p className="text-sm font-medium text-slate-900">
                            No hay centros de trabajo registrados
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                            Crea un centro para empezar a validar fichajes y
                            horarios.
                        </p>
                    </div>
                ) : (
                    <div className="mobile-list-stack md:hidden">
                        {workCenters.map((centro) => (
                            <div key={centro.id} className="mobile-list-item">
                                <div className="mobile-list-item__header">
                                    <div>
                                        <p className="mobile-list-item__title">
                                            {centro.nombre}
                                        </p>
                                        <p className="mobile-list-item__subtitle">
                                            {centro.company.nombre}
                                        </p>
                                    </div>

                                    {canManageCenters && (
                                        <div className="flex gap-2">
                                            <Button
                                                size="icon"
                                                variant="outline"
                                                className="h-10 w-10 rounded-2xl"
                                                onClick={() => openEdit(centro)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="outline"
                                                className="h-10 w-10 rounded-2xl text-destructive"
                                                onClick={() =>
                                                    setDeleteTarget(centro)
                                                }
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                <div className="mobile-list-item__rows">
                                    <div className="mobile-list-item__row">
                                        <span className="mobile-list-item__label">
                                            Direccion
                                        </span>
                                        <span className="mobile-list-item__value">
                                            {centro.direccion}
                                        </span>
                                    </div>
                                    <div className="mobile-list-item__row">
                                        <span className="mobile-list-item__label">
                                            Poblacion
                                        </span>
                                        <span className="mobile-list-item__value">
                                            {centro.poblacion}
                                        </span>
                                    </div>
                                    <div className="mobile-list-item__row">
                                        <span className="mobile-list-item__label">
                                            Provincia
                                        </span>
                                        <span className="mobile-list-item__value">
                                            {centro.provincia}
                                        </span>
                                    </div>
                                    <div className="mobile-list-item__row">
                                        <span className="mobile-list-item__label">
                                            CP
                                        </span>
                                        <span className="mobile-list-item__value font-mono">
                                            {centro.cp}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="hidden overflow-hidden rounded-lg border md:block">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">
                                    Nombre
                                </th>
                                <th className="px-4 py-3 text-left font-medium">
                                    Empresa
                                </th>
                                <th className="px-4 py-3 text-left font-medium">
                                    Pais
                                </th>
                                <th className="px-4 py-3 text-left font-medium">
                                    Provincia
                                </th>
                                <th className="px-4 py-3 text-left font-medium">
                                    Poblacion
                                </th>
                                <th className="px-4 py-3 text-left font-medium">
                                    Direccion
                                </th>
                                <th className="px-4 py-3 text-left font-medium">
                                    CP
                                </th>
                                {canManageCenters && (
                                    <th className="px-4 py-3 text-right font-medium">
                                        Acciones
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {workCenters.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={canManageCenters ? 8 : 7}
                                        className="px-4 py-8 text-center text-muted-foreground"
                                    >
                                        No hay centros de trabajo registrados
                                    </td>
                                </tr>
                            ) : (
                                workCenters.map((centro) => (
                                    <tr
                                        key={centro.id}
                                        className="hover:bg-muted/30"
                                    >
                                        <td className="px-4 py-3 font-medium">
                                            {centro.nombre}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {centro.company.nombre}
                                        </td>
                                        <td className="px-4 py-3">
                                            {centro.pais}
                                        </td>
                                        <td className="px-4 py-3">
                                            {centro.provincia}
                                        </td>
                                        <td className="px-4 py-3">
                                            {centro.poblacion}
                                        </td>
                                        <td className="px-4 py-3">
                                            {centro.direccion}
                                        </td>
                                        <td className="px-4 py-3">
                                            {centro.cp}
                                        </td>
                                        {canManageCenters && (
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            openEdit(centro)
                                                        }
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="text-destructive hover:text-destructive"
                                                        onClick={() =>
                                                            setDeleteTarget(
                                                                centro,
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <Dialog
                open={createOpen}
                onOpenChange={(open) => !open && closeCreateDialog()}
            >
                <DialogContent className={centerDialogClassName}>
                    <DialogHeader className="border-b border-border/70 bg-muted/15 px-4 py-4 pr-11 sm:px-6 sm:py-5 sm:pr-12">
                        <DialogTitle className="text-xl">
                            Nuevo centro
                        </DialogTitle>
                    </DialogHeader>
                    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
                        <CentroForm
                            key={`create-${createSession}`}
                            mode="create"
                            data={createForm.data}
                            setData={createForm.setData}
                            errors={createForm.errors}
                            processing={createForm.processing}
                            onSubmit={handleCreate}
                            onCancel={closeCreateDialog}
                            submitLabel="Crear centro"
                            companies={companies}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!editTarget}
                onOpenChange={(open) => !open && closeEditDialog()}
            >
                <DialogContent className={centerDialogClassName}>
                    <DialogHeader className="border-b border-border/70 bg-muted/15 px-4 py-4 pr-11 sm:px-6 sm:py-5 sm:pr-12">
                        <DialogTitle className="text-xl">
                            Editar centro
                        </DialogTitle>
                    </DialogHeader>
                    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
                        <CentroForm
                            key={`edit-${editTarget?.id ?? 'none'}-${editSession}`}
                            mode="edit"
                            data={editForm.data}
                            setData={editForm.setData}
                            errors={editForm.errors}
                            processing={editForm.processing}
                            onSubmit={handleEdit}
                            onCancel={closeEditDialog}
                            submitLabel="Guardar cambios"
                            companies={companies}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!deleteTarget}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteTarget(null);
                        setDeleteConfirm('');
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Eliminar centro de trabajo</DialogTitle>
                    </DialogHeader>
                    <div className="rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
                        Antes de continuar, te recomendamos exportar los datos
                        de este centro. Una vez eliminado no podremos
                        recuperarlos.
                    </div>
                    <div className="space-y-1 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                        <p className="font-medium">
                            Se eliminara permanentemente:
                        </p>
                        <ul className="list-inside list-disc space-y-0.5">
                            <li>
                                El centro{' '}
                                <strong>{deleteTarget?.nombre}</strong>
                            </li>
                            {(deleteTarget?.users_count ?? 0) > 0 && (
                                <li>
                                    {deleteTarget?.users_count} empleado
                                    {deleteTarget?.users_count !== 1 ? 's' : ''}
                                </li>
                            )}
                        </ul>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="delete-confirm">
                            Escribe <strong>ELIMINAR</strong> para confirmar
                        </Label>
                        <Input
                            id="delete-confirm"
                            value={deleteConfirm}
                            onChange={(e) => setDeleteConfirm(e.target.value)}
                            placeholder="ELIMINAR"
                            autoComplete="off"
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setDeleteTarget(null);
                                setDeleteConfirm('');
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleteConfirm !== 'ELIMINAR'}
                        >
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default function CentrosIndex(props: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Centros de trabajo" />
            <CentrosPageContent {...props} />
        </AppLayout>
    );
}
