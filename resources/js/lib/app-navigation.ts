import {
    Building2,
    CalendarDays,
    ClipboardList,
    Clock,
    FileText,
    MapPin,
    TrendingUp,
    Users
    
} from 'lucide-react';
import type {LucideIcon} from 'lucide-react';
import type { NavItem, User } from '@/types';

export const mainNavItems: NavItem[] = [
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

export const configNavItems: Omit<NavItem, 'children'>[] = [
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

export type MobileTabItem = {
    title: string;
    href: string;
    icon: LucideIcon;
};

export function isEmployeeRole(user: Pick<User, 'role'>): boolean {
    return user.role === 'empleado';
}

export function getHomeHref(): string {
    return '/fichar';
}

export function getVisibleMainNavItems(): NavItem[] {
    return mainNavItems;
}

export function getMobileTabItems(user: Pick<User, 'role'>): MobileTabItem[] {
    if (isEmployeeRole(user)) {
        return [
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
                title: 'Horas',
                href: '/horas-extra',
                icon: TrendingUp,
            },
            {
                title: 'Calendario',
                href: '/calendario',
                icon: CalendarDays,
            },
        ];
    }

    return [
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
            title: 'Calendario',
            href: '/calendario',
            icon: CalendarDays,
        },
    ];
}
