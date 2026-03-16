import { Head, router, useForm } from '@inertiajs/react';
import { Building2, Info, Pencil, Plus, Trash2 } from 'lucide-react';
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
import { Spinner } from '@/components/ui/spinner';
import AppLayout from '@/layouts/app-layout';
import type { MapboxAddressResult } from '@/lib/mapbox';
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
            <span className="inline-flex cursor-help items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground/70 transition-colors hover:bg-violet-50 hover:text-violet-600">
                <Info className="h-3 w-3" /> Para que sirve
            </span>
        </Tooltip>
    );
}

function SectionDivider({ label }: { label: string }) {
    return (
        <div className="my-1 flex items-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] font-bold tracking-widest text-muted-foreground/60 uppercase">
                {label}
            </span>
            <div className="h-px flex-1 bg-border" />
        </div>
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
}) {
    const [showLocationEditor, setShowLocationEditor] = useState(false);
    const hasExactLocation = data.lat !== '' && data.lng !== '';

    function applyResolvedAddressFields(result: MapboxAddressResult) {
        setData('pais', result.pais);
        setData('provincia', result.provincia);
        setData('poblacion', result.poblacion);
        setData('cp', result.cp);
        setData('direccion', result.direccion || result.label);
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
            className="flex flex-col gap-4"
            autoComplete="off"
        >
            <div className="grid gap-1.5">
                <Label
                    htmlFor="company_id"
                    className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase"
                >
                    Empresa
                </Label>
                <Select
                    value={data.company_id ? String(data.company_id) : ''}
                    onValueChange={(value) => setData('company_id', value)}
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
                    onChange={(e) => setData('nombre', e.target.value)}
                    placeholder="Ej: Oficina Madrid Centro"
                    required
                    autoFocus
                />
                <InputError message={errors.nombre} />
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
                onAddressResolved={applyResolvedAddressFromDireccion}
            />

            <SectionDivider label="Control de presencia" />

            <div className="rounded-xl border bg-muted/20 p-4">
                <div className="mb-1 flex items-center gap-2 text-sm font-semibold">
                    Ubicacion exacta para fichajes (opcional)
                    <InfoChip text="Solo hace falta si quieres validar fichajes por proximidad. Si no configuras el mapa, el centro se guarda igualmente con su direccion postal." />
                </div>
                {!showLocationEditor ? (
                    <div className="flex flex-col gap-3">
                        <p className="text-xs text-muted-foreground">
                            Puedes guardar el centro solo con la direccion. Abre
                            el mapa unicamente si quieres fijar la ubicacion
                            exacta y el radio de validacion.
                        </p>

                        {hasExactLocation && (
                            <div className="rounded-lg border bg-background px-3 py-2 text-xs text-muted-foreground">
                                Ubicacion configurada en{' '}
                                <span className="font-mono">
                                    {Number(data.lat).toFixed(6)},{' '}
                                    {Number(data.lng).toFixed(6)}
                                </span>
                                .
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowLocationEditor(true)}
                            >
                                {hasExactLocation
                                    ? 'Editar ubicacion en el mapa'
                                    : 'Configurar ubicacion en el mapa'}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        <p className="text-xs text-muted-foreground">
                            Ajusta el pin solo si quieres usar validacion por
                            proximidad para este centro.
                        </p>

                        <CentroLocalizador
                            direccion={data.direccion}
                            poblacion={data.poblacion}
                            provincia={data.provincia}
                            cp={data.cp}
                            pais={data.pais}
                            initialLat={data.lat ? Number(data.lat) : null}
                            initialLng={data.lng ? Number(data.lng) : null}
                            initialRadio={data.radio ? Number(data.radio) : 100}
                            autoLocateOnMount={!hasExactLocation}
                            onAddressResolved={applyResolvedAddressFields}
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
                    </div>
                )}
            </div>

            <div className="rounded-xl border bg-muted/20 p-4">
                <div className="mb-1 flex items-center gap-2 text-sm font-semibold">
                    IPs autorizadas
                    <InfoChip text="Permite que los empleados solo puedan fichar cuando esten conectados a la red Wi-Fi del centro. Conectate primero a esa red antes de detectar la IP." />
                </div>
                <p className="mb-3 text-xs text-muted-foreground">
                    Restringe el fichaje a la red Wi-Fi de este centro.
                    Conectate primero a esa red.
                </p>
                <CentroIP
                    ipsIniciales={data.ips}
                    onIPs={(ips) => setData('ips', ips)}
                />
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={processing}>
                    {processing && <Spinner />}
                    {submitLabel}
                </Button>
            </DialogFooter>
        </form>
    );
}

export default function CentrosIndex({ workCenters, companies }: Props) {
    const [createOpen, setCreateOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<WorkCenterWithCompany | null>(
        null,
    );
    const [deleteTarget, setDeleteTarget] =
        useState<WorkCenterWithCompany | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState('');

    const createForm = useForm<CentroFormData>(emptyForm);
    const editForm = useForm<CentroFormData>(emptyForm);

    function openEdit(centro: WorkCenterWithCompany) {
        editForm.setData({
            company_id: String(centro.company_id),
            nombre: centro.nombre,
            pais: centro.pais,
            provincia: centro.provincia,
            poblacion: centro.poblacion,
            direccion: centro.direccion,
            cp: centro.cp,
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
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Centros de trabajo" />

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
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <div className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full border border-violet-200 bg-violet-100 px-2.5 py-1 text-[10px] font-bold tracking-widest text-violet-700 uppercase">
                            <Building2 className="h-3 w-3" />
                            Centro de trabajo
                        </div>
                        <DialogTitle>Nuevo centro</DialogTitle>
                        <p className="text-sm text-muted-foreground">
                            Configura los datos y el acceso de esta ubicacion
                        </p>
                    </DialogHeader>
                    <CentroForm
                        data={createForm.data}
                        setData={createForm.setData}
                        errors={createForm.errors}
                        processing={createForm.processing}
                        onSubmit={handleCreate}
                        onCancel={() => setCreateOpen(false)}
                        submitLabel="Crear centro"
                        companies={companies}
                    />
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!editTarget}
                onOpenChange={(open) => !open && setEditTarget(null)}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <div className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full border border-violet-200 bg-violet-100 px-2.5 py-1 text-[10px] font-bold tracking-widest text-violet-700 uppercase">
                            <Building2 className="h-3 w-3" />
                            Centro de trabajo
                        </div>
                        <DialogTitle>Editar centro</DialogTitle>
                        <p className="text-sm text-muted-foreground">
                            Configura los datos y el acceso de esta ubicacion
                        </p>
                    </DialogHeader>
                    <CentroForm
                        data={editForm.data}
                        setData={editForm.setData}
                        errors={editForm.errors}
                        processing={editForm.processing}
                        onSubmit={handleEdit}
                        onCancel={() => setEditTarget(null)}
                        submitLabel="Guardar cambios"
                        companies={companies}
                    />
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
        </AppLayout>
    );
}
