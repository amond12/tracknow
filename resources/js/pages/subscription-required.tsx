import { Head, Link, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    CreditCard,
    FileText,
    Lock,
    ShieldCheck,
} from 'lucide-react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { Auth, BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Acceso limitado', href: '/subscription-required' },
];

function formatDate(value: string | null): string | null {
    if (!value) {
        return null;
    }

    return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    }).format(new Date(value));
}

export default function SubscriptionRequired() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const isAdmin = auth.user.role === 'admin';
    const trialEndsAt = formatDate(auth.access?.trialEndsAt ?? null);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Acceso limitado" />

            <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-4 md:py-8">
                <Heading
                    title="Acceso limitado por suscripcion"
                    description={
                        isAdmin
                            ? 'Tu prueba gratuita o tu suscripcion ha terminado. Activa un plan para volver a usar la aplicacion con normalidad.'
                            : 'La cuenta de tu empresa no tiene una suscripcion activa. Contacta con tu administrador para restaurar el acceso.'
                    }
                />

                <Card className="overflow-hidden border-slate-200/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(241,245,249,0.96))] shadow-[0_26px_56px_-34px_rgba(15,23,42,0.42)]">
                    <CardHeader className="gap-4 border-b border-slate-200/70 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))]">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-3">
                                <div className="rounded-2xl bg-slate-950 p-3 text-white shadow-[0_18px_40px_-28px_rgba(15,23,42,0.9)]">
                                    <Lock className="h-5 w-5" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <CardTitle className="text-2xl text-slate-950">
                                            {isAdmin
                                                ? 'Activa un plan para recuperar el acceso'
                                                : 'Tu empresa necesita reactivar la suscripcion'}
                                        </CardTitle>
                                        <Badge
                                            variant="outline"
                                            className="rounded-full border-amber-300 bg-amber-50 px-3 py-1 text-amber-700"
                                        >
                                            Acceso restringido
                                        </Badge>
                                    </div>
                                    <CardDescription className="max-w-2xl text-sm leading-6 text-slate-600">
                                        {isAdmin
                                            ? 'Mientras no haya un plan activo, la aplicacion queda bloqueada para todos los usuarios de tu cuenta. Los PDFs legales siguen disponibles para consulta y descarga.'
                                            : 'Mientras la suscripcion siga caducada, solo podras consultar y descargar los PDFs legales de jornada y calendario.'}
                                    </CardDescription>
                                </div>
                            </div>

                            {trialEndsAt && (
                                <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-600 shadow-sm">
                                    <p className="font-medium text-slate-900">
                                        Fin de prueba
                                    </p>
                                    <p>{trialEndsAt}</p>
                                </div>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="grid gap-4 px-6 py-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
                        <div className="space-y-4">
                            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                                <div className="flex items-start gap-3">
                                    <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-600" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold text-slate-950">
                                            Acceso legal disponible
                                        </p>
                                        <p className="text-sm text-slate-600">
                                            Puedes seguir descargando los documentos exigidos por ley mientras regularizas la suscripcion.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                {isAdmin && (
                                    <Button
                                        asChild
                                        className="h-11 rounded-2xl px-5"
                                    >
                                        <Link href="/settings/pricing">
                                            <CreditCard className="mr-2 h-4 w-4" />
                                            Ir a pricing
                                        </Link>
                                    </Button>
                                )}

                                <Button
                                    asChild
                                    variant="outline"
                                    className="h-11 rounded-2xl px-5"
                                >
                                    <Link href="/pdfs">
                                        <FileText className="mr-2 h-4 w-4" />
                                        Ver PDFs de jornada
                                    </Link>
                                </Button>

                                <Button
                                    asChild
                                    variant="outline"
                                    className="h-11 rounded-2xl px-5"
                                >
                                    <Link href="/calendario">
                                        <CalendarDays className="mr-2 h-4 w-4" />
                                        Ver calendario legal
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-slate-950 p-5 text-slate-100 shadow-[0_30px_70px_-42px_rgba(15,23,42,0.95)]">
                            <p className="text-sm font-semibold tracking-[0.18em] text-slate-400 uppercase">
                                Estado actual
                            </p>
                            <div className="mt-4 space-y-3">
                                <div>
                                    <p className="text-sm text-slate-400">
                                        Cuenta
                                    </p>
                                    <p className="text-base font-semibold">
                                        {auth.user.name}
                                        {auth.user.apellido
                                            ? ` ${auth.user.apellido}`
                                            : ''}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-400">
                                        Rol
                                    </p>
                                    <p className="text-base font-semibold capitalize">
                                        {auth.user.role}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-400">
                                        Acceso
                                    </p>
                                    <p className="text-base font-semibold capitalize">
                                        {auth.access?.state ?? 'desconocido'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
