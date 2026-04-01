import { Head, router, usePage } from '@inertiajs/react';
import { AlertCircle, CreditCard, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import Heading from '@/components/heading';
import TextLink from '@/components/text-link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useIsNativeApp } from '@/hooks/use-native-app';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit as editProfile } from '@/routes/profile';
import type { Auth, BreadcrumbItem } from '@/types';

type Plan = {
    slug: 'inicio' | 'equipo' | 'empresa';
    name: string;
    employeeLimit: number;
    monthly: { amount: number };
    yearly: { amount: number };
    isAllowedForCurrentUsage: boolean;
};

type CurrentSubscription = {
    status: string | null;
    planSlug: Plan['slug'] | null;
    interval: 'monthly' | 'yearly' | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    hasPaymentIssue: boolean;
    isCustomPlan: boolean;
};

type Usage = {
    activeEmployees: number;
    currentPlanLimit: number | null;
};

type Props = {
    plans: Plan[];
    currentSubscription: CurrentSubscription;
    usage: Usage;
};

type PageErrors = {
    billing?: string;
    interval?: string;
    plan?: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Planes', href: '/settings/pricing' },
];

export default function PricingSettings({
    plans,
    currentSubscription,
    usage,
}: Props) {
    const { auth, errors } = usePage<{ auth: Auth; errors: PageErrors }>().props;
    const isNativeApp = useIsNativeApp();
    const defaultPlan =
        (currentSubscription.planSlug &&
            plans.find((plan) => plan.slug === currentSubscription.planSlug)) ||
        plans.find((plan) => plan.isAllowedForCurrentUsage) ||
        plans[0];

    const [monthlyPlan, setMonthlyPlan] = useState<string>(defaultPlan?.slug ?? 'inicio');
    const [yearlyPlan, setYearlyPlan] = useState<string>(defaultPlan?.slug ?? 'inicio');
    const [processingKey, setProcessingKey] = useState<string | null>(null);

    const currentPlan = currentSubscription.planSlug
        ? plans.find((plan) => plan.slug === currentSubscription.planSlug) ?? null
        : null;
    const manageOnly =
        currentSubscription.hasPaymentIssue || currentSubscription.isCustomPlan;
    const hasActiveSubscription = currentSubscription.status !== null;
    const currentPlanName = currentPlan?.name ?? 'Plan personalizado';
    const shouldRedirectToProfile = isNativeApp && auth.user.role === 'admin';

    useEffect(() => {
        if (!shouldRedirectToProfile) {
            return;
        }

        router.get(
            editProfile.url(),
            {},
            {
                preserveScroll: true,
                replace: true,
            },
        );
    }, [shouldRedirectToProfile]);

    if (shouldRedirectToProfile) {
        return null;
    }

    function formatMoney(amount: number) {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
        }).format(amount / 100);
    }

    function formatDate(value: string | null) {
        if (!value) {
            return 'Pendiente de sincronizar';
        }

        return new Intl.DateTimeFormat('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        }).format(new Date(value));
    }

    function statusLabel(status: string | null) {
        switch (status) {
            case 'active':
                return 'Activo';
            case 'trialing':
                return 'Prueba';
            case 'past_due':
                return 'Pago pendiente';
            case 'incomplete':
                return 'Cobro pendiente';
            case 'unpaid':
                return 'Impagada';
            case 'canceled':
                return 'Cancelada';
            default:
                return 'Sin suscripcion';
        }
    }

    function planLabel(plan: Plan) {
        return `${plan.name} - hasta ${plan.employeeLimit} empleados`;
    }

    function selectedPlan(interval: 'monthly' | 'yearly') {
        const slug = interval === 'monthly' ? monthlyPlan : yearlyPlan;

        return plans.find((plan) => plan.slug === slug) ?? plans[0];
    }

    function canSelectPlan(plan: Plan) {
        return plan.isAllowedForCurrentUsage || currentSubscription.planSlug === plan.slug;
    }

    function primaryAction(interval: 'monthly' | 'yearly', plan: Plan) {
        if (manageOnly) {
            return { label: 'Gestionar facturacion', disabled: false };
        }

        if (
            currentSubscription.planSlug === plan.slug &&
            currentSubscription.interval === interval
        ) {
            return { label: 'Plan actual', disabled: true };
        }

        if (!canSelectPlan(plan)) {
            return { label: 'No disponible', disabled: true };
        }

        if (currentSubscription.planSlug) {
            return { label: 'Actualizar', disabled: false };
        }

        return { label: 'Pagar', disabled: false };
    }

    function startManagePortal() {
        setProcessingKey('manage');

        router.post(
            '/settings/pricing/manage',
            {},
            {
                preserveScroll: true,
                onFinish: () => setProcessingKey(null),
            },
        );
    }

    function startCancelPortal() {
        setProcessingKey('cancel');

        router.post(
            '/settings/pricing/cancel',
            {},
            {
                preserveScroll: true,
                onFinish: () => setProcessingKey(null),
            },
        );
    }

    function startPrimaryAction(interval: 'monthly' | 'yearly') {
        const plan = selectedPlan(interval);
        const action = primaryAction(interval, plan);

        if (action.disabled) {
            return;
        }

        if (manageOnly) {
            startManagePortal();
            return;
        }

        const key = `${interval}:${plan.slug}`;
        setProcessingKey(key);

        router.post(
            currentSubscription.planSlug
                ? '/settings/pricing/change'
                : '/settings/pricing/checkout',
            {
                plan: plan.slug,
                interval,
            },
            {
                preserveScroll: true,
                onFinish: () => setProcessingKey(null),
            },
        );
    }

    function renderCard(interval: 'monthly' | 'yearly') {
        const plan = selectedPlan(interval);
        const price = interval === 'monthly' ? plan.monthly.amount : plan.yearly.amount;
        const action = primaryAction(interval, plan);
        const key = `${interval}:${plan.slug}`;
        const cadence = interval === 'monthly' ? 'mes' : 'anio';

        return (
            <Card className="h-full overflow-hidden border-slate-200/80 bg-white shadow-[0_24px_50px_-32px_rgba(15,23,42,0.28)]">
                <CardHeader className="space-y-5 border-b border-slate-100 bg-[linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,0.7))]">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <CardTitle className="text-xl text-slate-950">
                                {interval === 'monthly' ? 'Mensual' : 'Anual'}
                            </CardTitle>
                        </div>
                        <Badge variant="outline" className="rounded-full px-3 py-1">
                            Hasta {plan.employeeLimit}
                        </Badge>
                    </div>
                    <div className="space-y-2">
                        <div className="text-4xl font-semibold tracking-tight text-slate-950">
                            {formatMoney(price)}
                            <span className="ml-2 text-base font-medium text-slate-500">
                                /{cadence}
                            </span>
                        </div>
                        <p className="text-sm text-slate-600">
                            Plan <span className="font-medium text-slate-900">{plan.name}</span>
                        </p>
                    </div>
                </CardHeader>
                <CardContent className="space-y-5 px-6 py-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-800">
                            Tipo de plan
                        </label>
                        <Select
                            disabled={manageOnly}
                            value={plan.slug}
                            onValueChange={(value) => {
                                if (interval === 'monthly') {
                                    setMonthlyPlan(value);
                                    return;
                                }

                                setYearlyPlan(value);
                            }}
                        >
                            <SelectTrigger className="h-11 rounded-xl">
                                <SelectValue placeholder="Selecciona un plan" />
                            </SelectTrigger>
                            <SelectContent>
                                {plans.map((option) => (
                                    <SelectItem
                                        key={`${interval}-${option.slug}`}
                                        value={option.slug}
                                        disabled={!canSelectPlan(option)}
                                    >
                                        {planLabel(option)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {!canSelectPlan(plan) && (
                        <p className="text-sm text-amber-700">
                            No disponible para tus {usage.activeEmployees} empleados activos.
                        </p>
                    )}
                </CardContent>
                <CardFooter className="flex-col items-start gap-3 border-t border-slate-100 px-6 py-5">
                    <Button
                        type="button"
                        className="h-11 w-full rounded-2xl"
                        disabled={action.disabled || processingKey !== null}
                        onClick={() => startPrimaryAction(interval)}
                    >
                        {processingKey === key ? 'Redirigiendo...' : action.label}
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Planes" />

            <SettingsLayout>
                <div className="space-y-8">
                    <Heading
                        variant="small"
                        title="Planes"
                        description="Elige el plan que mejor encaja con tu cuenta y gestiona la facturacion desde Stripe."
                    />

                    {errors.billing && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>No se pudo continuar</AlertTitle>
                            <AlertDescription>{errors.billing}</AlertDescription>
                        </Alert>
                    )}

                    {currentSubscription.hasPaymentIssue && (
                        <Alert variant="destructive">
                            <ShieldAlert className="h-4 w-4" />
                            <AlertTitle>Hay un problema de cobro</AlertTitle>
                            <AlertDescription>
                                Resuelve el pago desde el portal principal antes de cambiar de plan.
                            </AlertDescription>
                        </Alert>
                    )}

                    {currentSubscription.isCustomPlan && (
                        <Alert>
                            <CreditCard className="h-4 w-4" />
                            <AlertTitle>Plan personalizado detectado</AlertTitle>
                            <AlertDescription>
                                Esta pagina queda en modo lectura. Gestiona la suscripcion desde el portal principal.
                            </AlertDescription>
                        </Alert>
                    )}

                    {currentSubscription.cancelAtPeriodEnd && (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Suscripcion con finalizacion programada</AlertTitle>
                            <AlertDescription>
                                El acceso actual termina el {formatDate(currentSubscription.currentPeriodEnd)}.
                            </AlertDescription>
                        </Alert>
                    )}

                    {hasActiveSubscription && (
                        <Card className="overflow-hidden border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] shadow-[0_24px_52px_-34px_rgba(15,23,42,0.34)]">
                            <CardHeader className="space-y-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <CardTitle className="text-2xl text-slate-950">
                                            Plan de {currentPlanName}
                                        </CardTitle>
                                        {!currentSubscription.cancelAtPeriodEnd && (
                                            <CardDescription className="mt-1 text-sm text-slate-600">
                                                Gestiona la suscripcion y la facturacion desde los accesos directos de Stripe.
                                            </CardDescription>
                                        )}
                                    </div>
                                    <Badge
                                        variant={
                                            currentSubscription.hasPaymentIssue
                                                ? 'destructive'
                                                : 'outline'
                                        }
                                        className="rounded-full px-3 py-1"
                                    >
                                        {statusLabel(currentSubscription.status)}
                                    </Badge>
                                </div>
                                <div className="flex flex-col gap-3 sm:w-auto sm:flex-row">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-11 rounded-2xl border-slate-300 px-5"
                                        disabled={
                                            currentSubscription.cancelAtPeriodEnd ||
                                            processingKey !== null
                                        }
                                        onClick={startCancelPortal}
                                    >
                                        {processingKey === 'cancel'
                                            ? 'Redirigiendo...'
                                            : currentSubscription.cancelAtPeriodEnd
                                              ? 'Cancelacion programada'
                                              : 'Cancelar suscripcion'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-11 rounded-2xl px-5"
                                        disabled={processingKey !== null}
                                        onClick={startManagePortal}
                                    >
                                        {processingKey === 'manage'
                                            ? 'Redirigiendo...'
                                            : 'Gestionar facturacion'}
                                    </Button>
                                </div>
                            </CardHeader>
                        </Card>
                    )}

                    <div className="grid gap-5 xl:grid-cols-2">
                        {renderCard('monthly')}
                        {renderCard('yearly')}
                    </div>

                    <Card className="border-slate-200/80 bg-slate-50/80 shadow-[0_24px_50px_-32px_rgba(15,23,42,0.2)]">
                        <CardHeader className="space-y-2">
                            <CardTitle className="text-lg text-slate-950">
                                Documentación legal
                            </CardTitle>
                            <CardDescription className="text-sm text-slate-600">
                                Consulta aquí la documentación legal aplicable a
                                la suscripción y al uso del servicio.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
                                <TextLink href="/aviso-legal">Aviso legal</TextLink>
                                <TextLink href="/politica-de-cookies">
                                    Política de cookies
                                </TextLink>
                                <TextLink href="/terminos-y-condiciones">
                                    Términos y condiciones
                                </TextLink>
                                <TextLink href="/politica-de-privacidad">
                                    Política de privacidad
                                </TextLink>
                                <TextLink href="/encargo-del-tratamiento">
                                    Encargo del tratamiento
                                </TextLink>
                                <TextLink href="/anexo-de-subencargados">
                                    Anexo de subencargados
                                </TextLink>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
