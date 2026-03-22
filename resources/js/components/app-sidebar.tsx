import { Link, usePage } from '@inertiajs/react';
import {
    Building2,
    CalendarDays,
    ClipboardList,
    Clock,
    FileText,
    LayoutGrid,
    MapPin,
    Settings2,
    TrendingUp,
    Users,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavCollapsible } from '@/components/nav-collapsible';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { Auth, NavItem } from '@/types';

const DASHBOARD_URL = dashboard().url;

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: DASHBOARD_URL,
        icon: LayoutGrid,
    },
    {
        title: 'Fichar',
        href: '/fichar',
        icon: Clock,
    },
    {
        title: 'Registros',
        href: '/fichajes',
        icon: ClipboardList,
    },
    {
        title: 'PDFs',
        href: '/pdfs',
        icon: FileText,
    },
    {
        title: 'Horas Extra',
        href: '/horas-extra',
        icon: TrendingUp,
    },
    {
        title: 'Calendario',
        href: '/calendario',
        icon: CalendarDays,
    },
];

const configNavItems: Omit<NavItem, 'children'>[] = [
    {
        title: 'Empresas',
        href: '/configuracion/empresas',
        icon: Building2,
    },
    {
        title: 'Centros de trabajo',
        href: '/configuracion/centros',
        icon: MapPin,
    },
    {
        title: 'Empleados',
        href: '/configuracion/empleados',
        icon: Users,
    },
];

export function AppSidebar() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const isEmployee = auth.user.role === 'empleado';
    const homeHref = isEmployee ? '/fichar' : DASHBOARD_URL;
    const visibleMainNavItems = isEmployee
        ? mainNavItems.filter((item) => item.href !== DASHBOARD_URL)
        : mainNavItems;

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader className="px-2.5 pt-2.5 pb-1.5">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            asChild
                            className="h-auto rounded-2xl border border-sidebar-border/70 bg-white/75 px-2.5 py-2 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.38)] transition-all group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:p-0! hover:bg-white/95 hover:shadow-[0_22px_42px_-30px_rgba(15,23,42,0.45)] dark:bg-sidebar-accent/45 dark:hover:bg-sidebar-accent/65"
                        >
                            <Link href={homeHref} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="gap-4 px-2 pb-2">
                <NavMain items={visibleMainNavItems} />
                {!isEmployee && (
                    <NavCollapsible
                        title="Configuración"
                        icon={Settings2}
                        items={configNavItems}
                    />
                )}
            </SidebarContent>

            <SidebarFooter className="px-2.5 pt-1 pb-2.5">
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
