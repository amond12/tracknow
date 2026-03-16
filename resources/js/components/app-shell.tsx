import { usePage } from '@inertiajs/react';
import type { CSSProperties, ReactNode } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';

type Props = {
    children: ReactNode;
    variant?: 'header' | 'sidebar';
};

export function AppShell({ children, variant = 'header' }: Props) {
    const isOpen = usePage().props.sidebarOpen;
    const sidebarStyle = {
        '--sidebar-width': 'clamp(13.5rem, 16vw, 14.5rem)',
        '--sidebar-width-icon': '3.25rem',
    } as CSSProperties;

    if (variant === 'header') {
        return (
            <div className="flex min-h-screen w-full flex-col">{children}</div>
        );
    }

    return (
        <SidebarProvider defaultOpen={isOpen} style={sidebarStyle}>
            {children}
        </SidebarProvider>
    );
}
