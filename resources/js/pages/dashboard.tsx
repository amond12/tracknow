import { Head } from '@inertiajs/react';
import { MobilePageHeader } from '@/components/mobile-page-header';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
];

export default function Dashboard() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="mobile-page-shell">
                <MobilePageHeader
                    title="Dashboard"
                    description="Vista principal con espaciado y superficies adaptadas a movil."
                    eyebrow="Inicio"
                />
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div className="relative aspect-video overflow-hidden rounded-[1.5rem] border border-white/70 bg-white/80 shadow-[0_18px_42px_-30px_rgba(15,23,42,0.24)] md:rounded-xl md:border-sidebar-border/70 md:bg-transparent md:shadow-none dark:border-sidebar-border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                    <div className="relative aspect-video overflow-hidden rounded-[1.5rem] border border-white/70 bg-white/80 shadow-[0_18px_42px_-30px_rgba(15,23,42,0.24)] md:rounded-xl md:border-sidebar-border/70 md:bg-transparent md:shadow-none dark:border-sidebar-border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                    <div className="relative aspect-video overflow-hidden rounded-[1.5rem] border border-white/70 bg-white/80 shadow-[0_18px_42px_-30px_rgba(15,23,42,0.24)] md:rounded-xl md:border-sidebar-border/70 md:bg-transparent md:shadow-none dark:border-sidebar-border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                </div>
                <div className="relative min-h-[60vh] flex-1 overflow-hidden rounded-[1.6rem] border border-white/70 bg-white/80 shadow-[0_18px_42px_-30px_rgba(15,23,42,0.24)] md:min-h-min md:rounded-xl md:border-sidebar-border/70 md:bg-transparent md:shadow-none dark:border-sidebar-border">
                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                </div>
            </div>
        </AppLayout>
    );
}
