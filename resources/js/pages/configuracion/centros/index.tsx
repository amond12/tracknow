import { Head, router, useForm } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CentroIP } from '@/components/centro-ip';
import { CentroLocalizador } from '@/components/centro-localizador';
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
import { dashboard } from '@/routes';
import type { BreadcrumbItem, Company, WorkCenter } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard() },
    { title: 'Configuración', href: '/configuracion/centros' },
    { title: 'Centros de trabajo', href: '/configuracion/centros' },
];

type WorkCenterWithCompany = WorkCenter & { company: Pick<Company, 'id' | 'nombre'> };

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
    setData: <K extends keyof CentroFormData>(field: K, value: CentroFormData[K]) => void;
    errors: Partial<CentroFormData>;
    processing: boolean;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
    submitLabel: string;
    companies: Pick<Company, 'id' | 'nombre'>[];
}) {
    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="grid gap-2">
                <Label htmlFor="company_id">Empresa</Label>
                <Select
                    value={data.company_id ? String(data.company_id) : ''}
                    onValueChange={(v) => setData('company_id', v)}
                    required
                >
                    <SelectTrigger id="company_id">
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
            <div className="grid gap-2">
                <Label htmlFor="nombre">Nombre del centro</Label>
                <Input
                    id="nombre"
                    value={data.nombre}
                    onChange={(e) => setData('nombre', e.target.value)}
                    required
                    autoFocus
                />
                <InputError message={errors.nombre} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="pais">País</Label>
                <Input
                    id="pais"
                    value={data.pais}
                    onChange={(e) => setData('pais', e.target.value)}
                    required
                />
                <InputError message={errors.pais} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="provincia">Provincia / Estado</Label>
                <Input
                    id="provincia"
                    value={data.provincia}
                    onChange={(e) => setData('provincia', e.target.value)}
                    required
                />
                <InputError message={errors.provincia} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="poblacion">Población</Label>
                <Input
                    id="poblacion"
                    value={data.poblacion}
                    onChange={(e) => setData('poblacion', e.target.value)}
                    required
                />
                <InputError message={errors.poblacion} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                    id="direccion"
                    value={data.direccion}
                    onChange={(e) => setData('direccion', e.target.value)}
                    required
                />
                <InputError message={errors.direccion} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="cp">Código postal</Label>
                <Input
                    id="cp"
                    value={data.cp}
                    onChange={(e) => setData('cp', e.target.value)}
                    required
                />
                <InputError message={errors.cp} />
            </div>
            <div className="grid gap-2">
                <Label>Localización en el mapa</Label>
                <CentroLocalizador
                    direccion={[data.direccion, data.poblacion, data.provincia, data.cp, data.pais].filter(Boolean).join(', ')}
                    onCoordenadas={(lat, lng, radio) => {
                        setData('lat', String(lat));
                        setData('lng', String(lng));
                        setData('radio', String(radio));
                    }}
                />
            </div>
            <div className="grid gap-2">
                <Label>IPs autorizadas</Label>
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
    const [editTarget, setEditTarget] = useState<WorkCenterWithCompany | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<WorkCenterWithCompany | null>(null);

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
        if (!deleteTarget) return;
        router.delete(`/configuracion/centros/${deleteTarget.id}`, {
            onSuccess: () => setDeleteTarget(null),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Centros de trabajo" />

            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Centros de trabajo</h1>
                        <p className="text-sm text-muted-foreground">
                            Gestiona los centros de trabajo de tus empresas
                        </p>
                    </div>
                    <Button onClick={() => setCreateOpen(true)} disabled={companies.length === 0}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo centro
                    </Button>
                </div>

                <div className="overflow-hidden rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">Nombre</th>
                                <th className="px-4 py-3 text-left font-medium">Empresa</th>
                                <th className="px-4 py-3 text-left font-medium">País</th>
                                <th className="px-4 py-3 text-left font-medium">Provincia</th>
                                <th className="px-4 py-3 text-left font-medium">Población</th>
                                <th className="px-4 py-3 text-left font-medium">Dirección</th>
                                <th className="px-4 py-3 text-left font-medium">CP</th>
                                <th className="px-4 py-3 text-right font-medium">Acciones</th>
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
                                    <tr key={centro.id} className="hover:bg-muted/30">
                                        <td className="px-4 py-3 font-medium">{centro.nombre}</td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {centro.company.nombre}
                                        </td>
                                        <td className="px-4 py-3">{centro.pais}</td>
                                        <td className="px-4 py-3">{centro.provincia}</td>
                                        <td className="px-4 py-3">{centro.poblacion}</td>
                                        <td className="px-4 py-3">{centro.direccion}</td>
                                        <td className="px-4 py-3">{centro.cp}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => openEdit(centro)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => setDeleteTarget(centro)}
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

            {/* Dialog: Crear */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Nuevo centro de trabajo</DialogTitle>
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

            {/* Dialog: Editar */}
            <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Editar centro de trabajo</DialogTitle>
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

            {/* Dialog: Confirmar eliminación */}
            <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Eliminar centro de trabajo</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        ¿Estás seguro de que quieres eliminar{' '}
                        <strong>{deleteTarget?.nombre}</strong>? Esta acción no se puede deshacer.
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)}>
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
