import { Head, router, useForm } from '@inertiajs/react';
import { Building2, Clock, IdCard, Pencil, Plus, Shield, Trash2, User, Wifi } from 'lucide-react';
import { useMemo, useState } from 'react';
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
import { Switch } from '@/components/ui/switch';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, Company, User as UserType, WorkCenter } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard() },
    { title: 'Configuración', href: '/configuracion/empleados' },
    { title: 'Empleados', href: '/configuracion/empleados' },
];

interface Props {
    employees: UserType[];
    companies: Pick<Company, 'id' | 'nombre'>[];
    workCenters: (Pick<WorkCenter, 'id' | 'nombre'> & { company_id: number })[];
}

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

function EmpleadoForm({
    data,
    setData,
    errors,
    processing,
    onSubmit,
    onCancel,
    submitLabel,
    companies,
    workCenters,
    isEdit = false,
}: {
    data: EmpleadoFormData;
    setData: (field: keyof EmpleadoFormData, value: string | boolean) => void;
    errors: Partial<Record<keyof EmpleadoFormData, string>>;
    processing: boolean;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
    submitLabel: string;
    companies: Pick<Company, 'id' | 'nombre'>[];
    workCenters: (Pick<WorkCenter, 'id' | 'nombre'> & { company_id: number })[];
    isEdit?: boolean;
}) {
    const filteredCenters = data.company_id
        ? workCenters.filter((wc) => wc.company_id === Number(data.company_id))
        : [];

    function handleCompanyChange(value: string) {
        setData('company_id', value);
        setData('work_center_id', '');
    }

    const initials = [data.nombre, data.apellido]
        .filter(Boolean)
        .map((s) => s[0])
        .join('')
        .toUpperCase();

    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
            {/* Preview empleado */}
            {(data.nombre || data.apellido) && (
                <div className="flex items-center gap-3 rounded-xl bg-primary/5 px-4 py-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {initials}
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold leading-tight">{data.nombre} {data.apellido}</p>
                        {data.email && <p className="truncate text-xs text-muted-foreground">{data.email}</p>}
                    </div>
                    {data.remoto && (
                        <span className="ml-auto flex shrink-0 items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            <Wifi className="h-3 w-3" />
                            Remoto
                        </span>
                    )}
                </div>
            )}

            {/* Sección: Datos personales */}
            <div className="overflow-hidden rounded-xl border">
                <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-2.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Datos personales</span>
                </div>
                <div className="grid gap-3 p-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                            <Label htmlFor="nombre" className="text-xs font-medium">Nombre <span className="text-destructive">*</span></Label>
                            <Input
                                id="nombre"
                                value={data.nombre}
                                onChange={(e) => setData('nombre', e.target.value)}
                                className="h-9"
                                required
                                autoFocus
                            />
                            <InputError message={errors.nombre} />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="apellido" className="text-xs font-medium">Apellido <span className="text-destructive">*</span></Label>
                            <Input
                                id="apellido"
                                value={data.apellido}
                                onChange={(e) => setData('apellido', e.target.value)}
                                className="h-9"
                                required
                            />
                            <InputError message={errors.apellido} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                            <Label htmlFor="email" className="text-xs font-medium">Correo electrónico <span className="text-destructive">*</span></Label>
                            <Input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                className="h-9"
                                required
                            />
                            <InputError message={errors.email} />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="telefono" className="text-xs font-medium">Teléfono <span className="text-destructive">*</span></Label>
                            <Input
                                id="telefono"
                                value={data.telefono}
                                onChange={(e) => setData('telefono', e.target.value)}
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
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Identificación</span>
                </div>
                <div className="grid gap-3 p-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                            <Label htmlFor="dni" className="text-xs font-medium">DNI / NIE <span className="text-destructive">*</span></Label>
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
                            <Label htmlFor="nss" className="text-xs font-medium">Núm. Seg. Social <span className="text-destructive">*</span></Label>
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
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rol y modalidad</span>
                </div>
                <div className="grid gap-3 p-4 sm:grid-cols-2">
                    <div className="grid gap-1.5">
                        <Label htmlFor="rol" className="text-xs font-medium">Rol <span className="text-destructive">*</span></Label>
                        <Select value={data.rol} onValueChange={(v) => setData('rol', v)} required>
                            <SelectTrigger id="rol" className="h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="empleado">Empleado</SelectItem>
                                <SelectItem value="encargado">Encargado</SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.rol} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-xs font-medium">Trabajo remoto</Label>
                        <div className="flex h-9 items-center justify-between rounded-lg border bg-muted/20 px-3">
                            <div className="flex items-center gap-1.5 text-sm">
                                <Wifi className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>{data.remoto ? 'Activo' : 'No activo'}</span>
                            </div>
                            <Switch
                                id="remoto"
                                checked={data.remoto}
                                onCheckedChange={(checked) => setData('remoto', checked)}
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
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Empresa y centro</span>
                </div>
                <div className="grid gap-3 p-4 sm:grid-cols-2">
                    <div className="grid gap-1.5">
                        <Label htmlFor="company_id" className="text-xs font-medium">Empresa <span className="text-destructive">*</span></Label>
                        <Select value={data.company_id} onValueChange={handleCompanyChange} required>
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
                        <Label htmlFor="work_center_id" className="text-xs font-medium">Centro de trabajo <span className="text-destructive">*</span></Label>
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
                                    <SelectItem key={wc.id} value={String(wc.id)}>
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
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Horario semanal (horas por día)</span>
                </div>
                <div className="grid grid-cols-7 gap-2 p-4">
                    {([
                        { key: 'horario_lunes',     label: 'Lun' },
                        { key: 'horario_martes',    label: 'Mar' },
                        { key: 'horario_miercoles', label: 'Mié' },
                        { key: 'horario_jueves',    label: 'Jue' },
                        { key: 'horario_viernes',   label: 'Vie' },
                        { key: 'horario_sabado',    label: 'Sáb' },
                        { key: 'horario_domingo',   label: 'Dom' },
                    ] as { key: keyof EmpleadoFormData; label: string }[]).map(({ key, label }) => (
                        <div key={key} className="grid gap-1.5">
                            <Label className="text-center text-xs font-medium">{label}</Label>
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
                    Usa decimales para medias horas: 7.5 = 7 h 30 min. Introduce 0 para días no laborables.
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
        </form>
    );
}

export default function EmpleadosIndex({ employees, companies, workCenters }: Props) {
    const [createOpen, setCreateOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<UserType | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<UserType | null>(null);
    const [companyFilter, setCompanyFilter] = useState<string>('all');
    const [workCenterFilter, setWorkCenterFilter] = useState<string>('all');

    const createForm = useForm<EmpleadoFormData>(emptyForm);
    const editForm = useForm<EmpleadoFormData>(emptyForm);

    const availableWorkCenters = useMemo(() => {
        if (companyFilter === 'all') {
            return workCenters;
        }

        return workCenters.filter((workCenter) => workCenter.company_id === Number(companyFilter));
    }, [companyFilter, workCenters]);

    const filteredEmployees = useMemo(() => {
        return employees.filter((employee) => {
            const matchesCompany =
                companyFilter === 'all' || employee.company_id === Number(companyFilter);
            const matchesWorkCenter =
                workCenterFilter === 'all' ||
                employee.work_center_id === Number(workCenterFilter);

            return matchesCompany && matchesWorkCenter;
        });
    }, [employees, companyFilter, workCenterFilter]);

    function openEdit(emp: UserType) {
        editForm.setData({
            nombre: emp.name,
            apellido: emp.apellido ?? '',
            email: emp.email,
            telefono: emp.telefono ?? '',
            dni: emp.dni ?? '',
            nss: emp.nss ?? '',
            rol: (emp.role as string) === 'encargado' ? 'encargado' : 'empleado',
            remoto: emp.remoto ?? false,
            company_id: String(emp.company_id ?? ''),
            work_center_id: String(emp.work_center_id ?? ''),
            horario_lunes:     String(emp.horario_lunes     ?? 8),
            horario_martes:    String(emp.horario_martes    ?? 8),
            horario_miercoles: String(emp.horario_miercoles ?? 8),
            horario_jueves:    String(emp.horario_jueves    ?? 8),
            horario_viernes:   String(emp.horario_viernes   ?? 8),
            horario_sabado:    String(emp.horario_sabado    ?? 0),
            horario_domingo:   String(emp.horario_domingo   ?? 0),
        });
        setEditTarget(emp);
    }

    function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        createForm.post('/configuracion/empleados', {
            onSuccess: () => {
                setCreateOpen(false);
                createForm.reset();
            },
        });
    }

    function handleEdit(e: React.FormEvent) {
        e.preventDefault();
        if (!editTarget) return;
        editForm.put(`/configuracion/empleados/${editTarget.id}`, {
            onSuccess: () => setEditTarget(null),
        });
    }

    function handleDelete() {
        if (!deleteTarget) return;
        router.delete(`/configuracion/empleados/${deleteTarget.id}`, {
            onSuccess: () => setDeleteTarget(null),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Empleados" />

            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Empleados</h1>
                        <p className="text-sm text-muted-foreground">
                            Gestiona los empleados de tus empresas
                        </p>
                    </div>
                    <Button onClick={() => setCreateOpen(true)} disabled={companies.length === 0}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo empleado
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor="empresa_filter">Filtrar por empresa</Label>
                        <Select
                            value={companyFilter}
                            onValueChange={(value) => {
                                setCompanyFilter(value);
                                setWorkCenterFilter('all');
                            }}
                        >
                            <SelectTrigger id="empresa_filter">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas las empresas</SelectItem>
                                {companies.map((company) => (
                                    <SelectItem key={company.id} value={String(company.id)}>
                                        {company.nombre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="centro_filter">Filtrar por centro</Label>
                        <Select
                            value={workCenterFilter}
                            onValueChange={setWorkCenterFilter}
                            disabled={availableWorkCenters.length === 0}
                        >
                            <SelectTrigger id="centro_filter">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los centros</SelectItem>
                                {availableWorkCenters.map((workCenter) => (
                                    <SelectItem key={workCenter.id} value={String(workCenter.id)}>
                                        {workCenter.nombre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="overflow-hidden rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">Nombre</th>
                                <th className="px-4 py-3 text-left font-medium">Apellido</th>
                                <th className="px-4 py-3 text-left font-medium">Email</th>
                                <th className="px-4 py-3 text-left font-medium">Teléfono</th>
                                <th className="px-4 py-3 text-left font-medium">DNI</th>
                                <th className="px-4 py-3 text-left font-medium">NSS</th>
                                <th className="px-4 py-3 text-left font-medium">Rol</th>
                                <th className="px-4 py-3 text-left font-medium">Remoto</th>
                                <th className="px-4 py-3 text-right font-medium">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredEmployees.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={9}
                                        className="px-4 py-8 text-center text-muted-foreground"
                                    >
                                        {employees.length === 0
                                            ? 'No hay empleados registrados'
                                            : 'No hay empleados para los filtros seleccionados'}
                                    </td>
                                </tr>
                            ) : (
                                filteredEmployees.map((emp) => (
                                    <tr key={emp.id} className="hover:bg-muted/30">
                                        <td className="px-4 py-3 font-medium">{emp.name}</td>
                                        <td className="px-4 py-3">{emp.apellido}</td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {emp.email}
                                        </td>
                                        <td className="px-4 py-3">{emp.telefono}</td>
                                        <td className="px-4 py-3">{emp.dni}</td>
                                        <td className="px-4 py-3">{emp.nss}</td>
                                        <td className="px-4 py-3 capitalize">{emp.role}</td>
                                        <td className="px-4 py-3">
                                            {emp.remoto ? 'Sí' : 'No'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => openEdit(emp)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => setDeleteTarget(emp)}
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
                <DialogContent className="max-h-[90vh] w-full overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <div className="-mx-6 -mt-6 mb-2 flex items-center gap-3 rounded-t-lg border-b bg-muted/40 px-6 py-4">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                <Plus className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-semibold">Nuevo empleado</DialogTitle>
                                <p className="text-xs text-muted-foreground">Completa los datos para crear una cuenta de empleado</p>
                            </div>
                        </div>
                    </DialogHeader>
                    <EmpleadoForm
                        data={createForm.data}
                        setData={createForm.setData}
                        errors={createForm.errors}
                        processing={createForm.processing}
                        onSubmit={handleCreate}
                        onCancel={() => setCreateOpen(false)}
                        submitLabel="Crear empleado"
                        companies={companies}
                        workCenters={workCenters}
                    />
                </DialogContent>
            </Dialog>

            {/* Dialog: Editar */}
            <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
                <DialogContent className="max-h-[90vh] w-full overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <div className="-mx-6 -mt-6 mb-2 flex items-center gap-3 rounded-t-lg border-b bg-muted/40 px-6 py-4">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                                <Pencil className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-semibold">Editar empleado</DialogTitle>
                                <p className="text-xs text-muted-foreground">
                                    {editTarget ? `${editTarget.name} ${editTarget.apellido}` : 'Modifica los datos del empleado'}
                                </p>
                            </div>
                        </div>
                    </DialogHeader>
                    <EmpleadoForm
                        data={editForm.data}
                        setData={editForm.setData}
                        errors={editForm.errors}
                        processing={editForm.processing}
                        onSubmit={handleEdit}
                        onCancel={() => setEditTarget(null)}
                        submitLabel="Guardar cambios"
                        companies={companies}
                        workCenters={workCenters}
                        isEdit
                    />
                </DialogContent>
            </Dialog>

            {/* Dialog: Eliminar */}
            <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Eliminar empleado</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        ¿Estás seguro de que quieres eliminar a{' '}
                        <strong>
                            {deleteTarget?.name} {deleteTarget?.apellido}
                        </strong>
                        ? También se eliminará su cuenta de acceso. Esta acción no se puede
                        deshacer.
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
