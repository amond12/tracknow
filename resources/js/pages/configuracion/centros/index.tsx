import { Head, router, useForm } from '@inertiajs/react';
import {
    Building2,
    Info,
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
import { useSidebar } from '@/components/ui/sidebar';
import { Spinner } from '@/components/ui/spinner';
import AppLayout from '@/layouts/app-layout';
import type { MapboxAddressResult } from '@/lib/mapbox';
import {
    DEFAULT_WORK_CENTER_TIMEZONE,
    WORK_CENTER_TIMEZONE_OPTIONS,
} from '@/lib/timezones';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, Company, WorkCenter } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard() },
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

function Tooltip({ text, children }: { text: string; children: ReactNode }) {
    const [visible, setVisible] = useState(false);

    return (
        <span className="relative inline-flex items-center">
            <span
                onMouseEnter={() => setVisible(true)}
                onMouseLeave={() => setVisible(false)}
                className="cursor-help"
            >
                {children}
            </span>
            {visible && (
                <span
                    className="absolute bottom-full left-1/2 z-50 mb-2 w-72 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-left text-xs leading-relaxed text-white shadow-lg sm:w-80"
                    style={{ pointerEvents: 'none', whiteSpace: 'normal' }}
                >
                    {text}
                    <span
                        style={{
                            position: 'absolute',
                            top: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            borderWidth: 5,
                            borderStyle: 'solid',
                            borderColor:
                                '#111827 transparent transparent transparent',
                        }}
                    />
                </span>
            )}
        </span>
    );
}

function InfoChip({ text }: { text: string }) {
    return (
        <Tooltip text={text}>
            <span className="inline-flex cursor-help items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 transition-colors hover:border-blue-200 hover:bg-blue-100">
                <Info className="h-3 w-3" /> Para que sirve
            </span>
        </Tooltip>
    );
}

function FormSection({
    eyebrow,
    title,
    description,
    icon,
    className,
    children,
}: {
    eyebrow: string;
    title: string;
    description: string;
    icon?: ReactNode;
    className?: string;
    children: ReactNode;
}) {
    return (
        <section
            className={cn(
                'rounded-2xl border border-border/70 bg-background/90 p-4 shadow-sm',
                className,
            )}
        >
            <div className="mb-4 flex items-start gap-3">
                {icon && (
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                        {icon}
                    </div>
                )}
                <div className="space-y-1">
                    <p className="text-[11px] font-semibold tracking-[0.22em] text-blue-700/80 uppercase">
                        {eyebrow}
                    </p>
                    <div className="space-y-1">
                        <h3 className="text-sm font-semibold tracking-tight">
                            {title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {description}
                        </p>
                    </div>
                </div>
            </div>
            {children}
        </section>
    );
}

function CentroForm({
    data,
    setData,
    errors,
    processing,
    onSubmit,
    onCancel,
    submitLabel,
    companies,
    compactLayout = false,
}: {
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
    compactLayout?: boolean;
}) {
    const [showLocationEditor, setShowLocationEditor] = useState(false);
    const hasExactLocation = data.lat !== '' && data.lng !== '';

    function applyResolvedAddressFields(result: MapboxAddressResult) {
        setData('pais', result.pais || data.pais);
        setData('provincia', result.provincia || data.provincia);
        setData('poblacion', result.poblacion || data.poblacion);
        setData('cp', result.cp || data.cp);
        setData(
            'direccion',
            result.direccion || result.label || data.direccion,
        );
    }

    function applyResolvedAddressFromDireccion(result: MapboxAddressResult) {
        applyResolvedAddressFields(result);
        setData('lat', '');
        setData('lng', '');
    }

    function handleAddressFieldChange(
        field: 'pais' | 'provincia' | 'poblacion' | 'cp' | 'direccion',
        value: string,
    ) {
        setData(field, value);
        if (field === 'direccion') {
            setData('pais', '');
            setData('provincia', '');
            setData('poblacion', '');
            setData('cp', '');
        }
        setData('lat', '');
        setData('lng', '');
    }

    return (
        <form
            onSubmit={onSubmit}
            className={cn('flex flex-col', compactLayout ? 'gap-4' : 'gap-5')}
            autoComplete="off"
        >
            <div
                className={cn(
                    'grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.92fr)] 2xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]',
                    compactLayout &&
                        'xl:grid-cols-[minmax(0,1fr)_minmax(260px,0.88fr)] 2xl:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.9fr)]',
                )}
            >
                <FormSection
                    eyebrow="Base"
                    title="Datos del centro"
                    description="Define la empresa, el nombre y la dirección que se usarán como referencia oficial."
                    icon={<Building2 className="h-4 w-4" />}
                >
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
                                        setData('company_id', value)
                                    }
                                    required
                                >
                                    <SelectTrigger id="company_id">
                                        <SelectValue placeholder="Selecciona una empresa" />
                                    </SelectTrigger>
                                    <SelectContent>
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
                                <InputError message={errors.company_id} />
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
                                        setData('nombre', e.target.value)
                                    }
                                    placeholder="Ej: Oficina Madrid Centro"
                                    required
                                    autoFocus
                                />
                                <InputError message={errors.nombre} />
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
                                pais: errors.pais,
                                provincia: errors.provincia,
                                poblacion: errors.poblacion,
                                cp: errors.cp,
                                direccion: errors.direccion,
                            }}
                            onFieldChange={handleAddressFieldChange}
                            onAddressResolved={
                                applyResolvedAddressFromDireccion
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
                                    setData('timezone', value)
                                }
                            >
                                <SelectTrigger id="timezone">
                                    <SelectValue placeholder="Selecciona una zona horaria" />
                                </SelectTrigger>
                                <SelectContent>
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
                                Se usará como hora oficial del centro para
                                fichajes, registros y PDFs.
                            </p>
                            <InputError message={errors.timezone} />
                        </div>
                    </div>
                </FormSection>

                <FormSection
                    eyebrow="Acceso"
                    title="Validación de fichajes"
                    description="Configura solo lo necesario. El centro puede guardarse aunque no actives mapa ni red."
                    icon={<MapPin className="h-4 w-4" />}
                    className="h-full"
                >
                    <div className="grid gap-4">
                        <div className="rounded-xl border border-border/70 bg-muted/15 p-4">
                            <div className="mb-3 flex items-start justify-between gap-3">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm font-semibold">
                                        <MapPin className="h-4 w-4 text-blue-600" />
                                        Ubicación exacta
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Opcional. Fija el pin y el radio solo si
                                        quieres validar fichajes por proximidad.
                                    </p>
                                </div>
                                <InfoChip text="Si no configuras el mapa, el centro se guarda igualmente con su direccion postal. Solo hace falta si vas a validar fichajes por cercania." />
                            </div>

                            {!showLocationEditor ? (
                                <div className="flex flex-col gap-3">
                                    {hasExactLocation && (
                                        <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                                            Ubicación lista en{' '}
                                            <span className="font-mono">
                                                {Number(data.lat).toFixed(6)},{' '}
                                                {Number(data.lng).toFixed(6)}
                                            </span>
                                        </div>
                                    )}

                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            setShowLocationEditor(true)
                                        }
                                        className="w-full rounded-xl"
                                    >
                                        {hasExactLocation
                                            ? 'Editar ubicación en mapa'
                                            : 'Configurar ubicación en mapa'}
                                    </Button>
                                </div>
                            ) : (
                                <CentroLocalizador
                                    direccion={data.direccion}
                                    poblacion={data.poblacion}
                                    provincia={data.provincia}
                                    cp={data.cp}
                                    pais={data.pais}
                                    initialLat={
                                        data.lat ? Number(data.lat) : null
                                    }
                                    initialLng={
                                        data.lng ? Number(data.lng) : null
                                    }
                                    initialRadio={
                                        data.radio ? Number(data.radio) : 100
                                    }
                                    autoLocateOnMount={!hasExactLocation}
                                    onAddressResolved={
                                        applyResolvedAddressFields
                                    }
                                    onCoordenadas={(lat, lng, radio) => {
                                        setData('lat', String(lat));
                                        setData('lng', String(lng));
                                        setData('radio', String(radio));
                                    }}
                                    onRadioChange={(radio) =>
                                        setData('radio', String(radio))
                                    }
                                    onLimpiar={() => {
                                        setData('lat', '');
                                        setData('lng', '');
                                        setShowLocationEditor(false);
                                    }}
                                />
                            )}
                        </div>

                        <div className="rounded-xl border border-border/70 bg-muted/15 p-4">
                            <div className="mb-3 flex items-start justify-between gap-3">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm font-semibold">
                                        <Wifi className="h-4 w-4 text-blue-600" />
                                        IPs autorizadas
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Úsalo solo si quieres restringir el
                                        fichaje a la red Wi‑Fi del centro.
                                    </p>
                                </div>
                                <InfoChip text="Permite que los empleados solo puedan fichar cuando esten conectados a la red Wi-Fi del centro. Conectate primero a esa red antes de detectar la IP." />
                            </div>

                            <CentroIP
                                ipsIniciales={data.ips}
                                onIPs={(ips) => setData('ips', ips)}
                            />
                        </div>
                    </div>
                </FormSection>
            </div>

            <DialogFooter className="border-t border-border/70 pt-4 sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                    Puedes guardar el centro solo con su dirección postal. Mapa
                    e IPs son opcionales.
                </p>
                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        className="rounded-xl"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        disabled={processing}
                        className="rounded-xl px-5"
                    >
                        {processing && <Spinner />}
                        {submitLabel}
                    </Button>
                </div>
            </DialogFooter>
        </form>
    );
}

function CentrosPageContent({ workCenters, companies }: Props) {
    const { state: sidebarState, isMobile } = useSidebar();
    const [createOpen, setCreateOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<WorkCenterWithCompany | null>(
        null,
    );
    const [deleteTarget, setDeleteTarget] =
        useState<WorkCenterWithCompany | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState('');

    const createForm = useForm<CentroFormData>(emptyForm);
    const editForm = useForm<CentroFormData>(emptyForm);
    const compactDialogLayout = !isMobile && sidebarState === 'expanded';
    const centerDialogClassName = cn(
        'max-h-[92vh] w-[calc(100vw-1rem)] gap-0 overflow-y-auto border-border/70 p-0 shadow-2xl sm:w-[min(1040px,calc(100vw-2rem))] sm:max-w-[1040px] lg:overflow-hidden',
        compactDialogLayout &&
            'xl:left-[calc(50%+4.5rem)] xl:w-[min(940px,calc(100vw-18rem))] xl:max-w-[940px] 2xl:left-[calc(50%+4rem)] 2xl:w-[min(1000px,calc(100vw-19rem))] 2xl:max-w-[1000px]',
    );

    function openEdit(centro: WorkCenterWithCompany) {
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
        setEditTarget(centro);
    }

    function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        createForm.post('/configuracion/centros', {
            onSuccess: () => {
                setCreateOpen(false);
                createForm.reset();
            },
        });
    }

    function handleEdit(e: React.FormEvent) {
        e.preventDefault();
        if (!editTarget) return;

        editForm.put(`/configuracion/centros/${editTarget.id}`, {
            onSuccess: () => setEditTarget(null),
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
            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Centros de trabajo
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Gestiona los centros de trabajo de tus empresas
                        </p>
                    </div>
                    <Button
                        onClick={() => setCreateOpen(true)}
                        disabled={companies.length === 0}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo centro
                    </Button>
                </div>

                <div className="overflow-hidden rounded-lg border">
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
                                <th className="px-4 py-3 text-right font-medium">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {workCenters.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={8}
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
                                                        setDeleteTarget(centro)
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
            </div>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className={centerDialogClassName}>
                    <DialogHeader className="border-b border-border/70 bg-muted/15 px-4 py-4 pr-11 sm:px-6 sm:py-5 sm:pr-12">
                        <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-bold tracking-widest text-blue-700 uppercase">
                            <Building2 className="h-3 w-3" />
                            Centro de trabajo
                        </div>
                        <DialogTitle className="text-xl">
                            Nuevo centro
                        </DialogTitle>
                        <p className="text-sm text-muted-foreground">
                            Completa lo esencial y activa solo las validaciones
                            que realmente vayas a usar.
                        </p>
                    </DialogHeader>
                    <div className="overflow-hidden px-4 py-4 sm:px-6 sm:py-5">
                        <CentroForm
                            data={createForm.data}
                            setData={createForm.setData}
                            errors={createForm.errors}
                            processing={createForm.processing}
                            onSubmit={handleCreate}
                            onCancel={() => setCreateOpen(false)}
                            submitLabel="Crear centro"
                            companies={companies}
                            compactLayout={compactDialogLayout}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!editTarget}
                onOpenChange={(open) => !open && setEditTarget(null)}
            >
                <DialogContent className={centerDialogClassName}>
                    <DialogHeader className="border-b border-border/70 bg-muted/15 px-4 py-4 pr-11 sm:px-6 sm:py-5 sm:pr-12">
                        <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-bold tracking-widest text-blue-700 uppercase">
                            <Building2 className="h-3 w-3" />
                            Centro de trabajo
                        </div>
                        <DialogTitle className="text-xl">
                            Editar centro
                        </DialogTitle>
                        <p className="text-sm text-muted-foreground">
                            Ajusta los datos base, la ubicación exacta y las
                            restricciones de acceso del centro.
                        </p>
                    </DialogHeader>
                    <div className="overflow-hidden px-4 py-4 sm:px-6 sm:py-5">
                        <CentroForm
                            data={editForm.data}
                            setData={editForm.setData}
                            errors={editForm.errors}
                            processing={editForm.processing}
                            onSubmit={handleEdit}
                            onCancel={() => setEditTarget(null)}
                            submitLabel="Guardar cambios"
                            companies={companies}
                            compactLayout={compactDialogLayout}
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
