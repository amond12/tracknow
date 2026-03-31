import {
    Building2,
    CalendarDays,
    ClipboardList,
    Clock,
    CreditCard,
    FileText,
    MapPin,
    TrendingUp,
    Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { AuthAccess, NavItem, User } from '@/types';

const defaultMainNavItems: NavItem[] = [
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

const defaultConfigNavItems: Omit<NavItem, 'children'>[] = [
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

function isExpired(access?: AuthAccess | null): boolean {
    return access?.state === 'expired';
}

export function isEmployeeRole(user: Pick<User, 'role'>): boolean {
    return user.role === 'empleado';
}

export function getHomeHref(
    user?: Pick<User, 'role'>,
    access?: AuthAccess | null,
): string {
    if (user && isExpired(access)) {
        return '/subscription-required';
    }

    return '/fichar';
}

export function getVisibleMainNavItems(
    user: Pick<User, 'role'>,
    access?: AuthAccess | null,
    isNativeApp = false,
): NavItem[] {
    if (! isExpired(access)) {
        return defaultMainNavItems;
    }

    if (user.role === 'admin') {
        if (isNativeApp) {
            return [
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

        return [
            {
                title: 'Planes',
                href: '/settings/pricing',
                icon: CreditCard,
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

    return [
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

export function getVisibleConfigNavItems(
    access?: AuthAccess | null,
): Omit<NavItem, 'children'>[] {
    if (isExpired(access)) {
        return [];
    }

    return defaultConfigNavItems;
}

export function getMobileTabItems(
    user: Pick<User, 'role'>,
    access?: AuthAccess | null,
    isNativeApp = false,
): MobileTabItem[] {
    if (isExpired(access)) {
        if (user.role === 'admin') {
            if (isNativeApp) {
                return [
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

            return [
                {
                    title: 'Planes',
                    href: '/settings/pricing',
                    icon: CreditCard,
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

        return [
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
