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
};

const emptyForm: EmpresaFormData = {
    nombre: '',
    cif: '',
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
    const [deleteConfirm, setDeleteConfirm] = useState('');

    const createForm = useForm<EmpresaFormData>(emptyForm);
    const editForm = useForm<EmpresaFormData>(emptyForm);

    function openEdit(company: Company) {
        editForm.setData({
            nombre: company.nombre,
            cif: company.cif,
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
        if (!deleteTarget || deleteConfirm !== 'ELIMINAR') return;
        router.delete(`/configuracion/empresas/${deleteTarget.id}`, {
            onSuccess: () => {
                setDeleteTarget(null);
                setDeleteConfirm('');
            },
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
                                <th className="px-4 py-3 text-right font-medium">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {companies.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={3}
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
                        <DialogTitle>Eliminar empresa</DialogTitle>
                    </DialogHeader>
                    <div className="rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
                        Antes de continuar, te recomendamos exportar los datos de esta empresa.
                        Una vez eliminada no podremos recuperarlos.
                    </div>
                    <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 space-y-1">
                        <p className="font-medium">Se eliminará permanentemente:</p>
                        <ul className="list-disc list-inside space-y-0.5">
                            <li>La empresa <strong>{deleteTarget?.nombre}</strong></li>
                            {(deleteTarget?.work_centers_count ?? 0) > 0 && (
                                <li>{deleteTarget?.work_centers_count} centro{deleteTarget?.work_centers_count !== 1 ? 's' : ''} de trabajo</li>
                            )}
                            {(deleteTarget?.empleados_count ?? 0) > 0 && (
                                <li>{deleteTarget?.empleados_count} empleado{deleteTarget?.empleados_count !== 1 ? 's' : ''}</li>
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
                        <Button variant="outline" onClick={() => { setDeleteTarget(null); setDeleteConfirm(''); }}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleteConfirm !== 'ELIMINAR'}>
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
