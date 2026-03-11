import { Link, usePage } from '@inertiajs/react';
import { Building2, CalendarDays, ClipboardList, Clock, FileText, LayoutGrid, MapPin, Settings2, TrendingUp, Users } from 'lucide-react';
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
    const isEmployee = ['empleado', 'encargado'].includes(auth.user.role);
    const homeHref = isEmployee ? '/fichar' : DASHBOARD_URL;
    const visibleMainNavItems = isEmployee
        ? mainNavItems.filter((item) => item.href !== DASHBOARD_URL && item.href !== '/fichajes' && item.href !== '/pdfs' && item.href !== '/horas-extra')
        : mainNavItems;

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={homeHref} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={visibleMainNavItems} />
                {!isEmployee && (
                    <NavCollapsible title="Configuración" icon={Settings2} items={configNavItems} />
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
