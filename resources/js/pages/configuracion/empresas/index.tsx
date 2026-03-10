import { Head, router, useForm } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
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
import { Spinner } from '@/components/ui/spinner';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, Company } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard() },
    { title: 'Configuración', href: '/configuracion/empresas' },
    { title: 'Empresas', href: '/configuracion/empresas' },
];

interface Props {
    companies: Company[];
}

type EmpresaFormData = {
    nombre: string;
    cif: string;
    pais: string;
    ciudad: string;
    direccion: string;
    cp: string;
};

const emptyForm: EmpresaFormData = {
    nombre: '',
    cif: '',
    pais: '',
    ciudad: '',
    direccion: '',
    cp: '',
};

function EmpresaForm({
    data,
    setData,
    errors,
    processing,
    onSubmit,
    onCancel,
    submitLabel,
}: {
    data: EmpresaFormData;
    setData: (field: keyof EmpresaFormData, value: string) => void;
    errors: Partial<EmpresaFormData>;
    processing: boolean;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
    submitLabel: string;
}) {
    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="grid gap-2">
                <Label htmlFor="nombre">Nombre</Label>
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
                <Label htmlFor="cif">CIF / NIF</Label>
                <Input
                    id="cif"
                    value={data.cif}
                    onChange={(e) => setData('cif', e.target.value)}
                    required
                />
                <InputError message={errors.cif} />
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
                <Label htmlFor="ciudad">Ciudad</Label>
                <Input
                    id="ciudad"
                    value={data.ciudad}
                    onChange={(e) => setData('ciudad', e.target.value)}
                    required
                />
                <InputError message={errors.ciudad} />
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

export default function EmpresasIndex({ companies }: Props) {
    const [createOpen, setCreateOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Company | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);

    const createForm = useForm<EmpresaFormData>(emptyForm);
    const editForm = useForm<EmpresaFormData>(emptyForm);

    function openEdit(company: Company) {
        editForm.setData({
            nombre: company.nombre,
            cif: company.cif,
            pais: company.pais,
            ciudad: company.ciudad,
            direccion: company.direccion,
            cp: company.cp,
        });
        setEditTarget(company);
    }

    function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        createForm.post('/configuracion/empresas', {
            onSuccess: () => {
                setCreateOpen(false);
                createForm.reset();
            },
        });
    }

    function handleEdit(e: React.FormEvent) {
        e.preventDefault();
        if (!editTarget) return;
        editForm.put(`/configuracion/empresas/${editTarget.id}`, {
            onSuccess: () => setEditTarget(null),
        });
    }

    function handleDelete() {
        if (!deleteTarget) return;
        router.delete(`/configuracion/empresas/${deleteTarget.id}`, {
            onSuccess: () => setDeleteTarget(null),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Empresas" />

            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Empresas</h1>
                        <p className="text-sm text-muted-foreground">
                            Gestiona las empresas de tu cuenta
                        </p>
                    </div>
                    <Button onClick={() => setCreateOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nueva empresa
                    </Button>
                </div>

                <div className="overflow-hidden rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">Nombre</th>
                                <th className="px-4 py-3 text-left font-medium">CIF/NIF</th>
                                <th className="px-4 py-3 text-left font-medium">País</th>
                                <th className="px-4 py-3 text-left font-medium">Ciudad</th>
                                <th className="px-4 py-3 text-left font-medium">Dirección</th>
                                <th className="px-4 py-3 text-left font-medium">CP</th>
                                <th className="px-4 py-3 text-right font-medium">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {companies.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-4 py-8 text-center text-muted-foreground"
                                    >
                                        No hay empresas registradas
                                    </td>
                                </tr>
                            ) : (
                                companies.map((company) => (
                                    <tr key={company.id} className="hover:bg-muted/30">
                                        <td className="px-4 py-3 font-medium">{company.nombre}</td>
                                        <td className="px-4 py-3">{company.cif}</td>
                                        <td className="px-4 py-3">{company.pais}</td>
                                        <td className="px-4 py-3">{company.ciudad}</td>
                                        <td className="px-4 py-3">{company.direccion}</td>
                                        <td className="px-4 py-3">{company.cp}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => openEdit(company)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => setDeleteTarget(company)}
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nueva empresa</DialogTitle>
                    </DialogHeader>
                    <EmpresaForm
                        data={createForm.data}
                        setData={createForm.setData}
                        errors={createForm.errors}
                        processing={createForm.processing}
                        onSubmit={handleCreate}
                        onCancel={() => setCreateOpen(false)}
                        submitLabel="Crear empresa"
                    />
                </DialogContent>
            </Dialog>

            {/* Dialog: Editar */}
            <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar empresa</DialogTitle>
                    </DialogHeader>
                    <EmpresaForm
                        data={editForm.data}
                        setData={editForm.setData}
                        errors={editForm.errors}
                        processing={editForm.processing}
                        onSubmit={handleEdit}
                        onCancel={() => setEditTarget(null)}
                        submitLabel="Guardar cambios"
                    />
                </DialogContent>
            </Dialog>

            {/* Dialog: Confirmar eliminación */}
            <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Eliminar empresa</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        ¿Estás seguro de que quieres eliminar{' '}
                        <strong>{deleteTarget?.nombre}</strong>? Esta acción también eliminará todos
                        sus centros de trabajo y no se puede deshacer.
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
