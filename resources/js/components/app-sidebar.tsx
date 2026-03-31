import { Link, usePage } from '@inertiajs/react';
import { Settings2 } from 'lucide-react';
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
import {
    getHomeHref,
    getVisibleConfigNavItems,
    getVisibleMainNavItems,
    isEmployeeRole,
} from '@/lib/app-navigation';
import { useIsNativeApp } from '@/hooks/use-native-app';
import type { Auth } from '@/types';

export function AppSidebar() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const isNativeApp = useIsNativeApp();
    const isEmployee = isEmployeeRole(auth.user);
    const homeHref = getHomeHref(auth.user, auth.access);
    const visibleMainNavItems = getVisibleMainNavItems(
        auth.user,
        auth.access,
        isNativeApp,
    );
    const visibleConfigNavItems = getVisibleConfigNavItems(auth.access);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader className="px-2.5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-1.5 md:pt-2.5">
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
                {!isEmployee && visibleConfigNavItems.length > 0 && (
                    <NavCollapsible
                        title="Configuracion"
                        icon={Settings2}
                        items={visibleConfigNavItems}
                    />
                )}
            </SidebarContent>

            <SidebarFooter className="px-2.5 pt-1 pb-2.5">
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
