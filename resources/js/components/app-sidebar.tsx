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
    configNavItems,
    getHomeHref,
    getVisibleMainNavItems,
    isEmployeeRole,
} from '@/lib/app-navigation';
import type { Auth } from '@/types';

export function AppSidebar() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const isEmployee = isEmployeeRole(auth.user);
    const homeHref = getHomeHref(auth.user);
    const visibleMainNavItems = getVisibleMainNavItems(auth.user);

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
