import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

const navButtonClassName =
    'h-10 rounded-xl px-2.5 text-[13px] font-medium text-sidebar-foreground/80 transition-all hover:bg-sidebar-accent/75 hover:text-sidebar-foreground data-[active=true]:bg-white data-[active=true]:text-blue-600 data-[active=true]:shadow-[0_14px_32px_-26px_rgba(37,99,235,0.9)] dark:data-[active=true]:bg-sidebar-accent dark:data-[active=true]:text-blue-300 [&>svg]:size-[18px]';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <SidebarGroup className="px-1 py-0">
            <SidebarGroupLabel className="px-2.5 pb-1 text-[10px] font-semibold tracking-[0.18em] text-sidebar-foreground/45 uppercase">
                Principal
            </SidebarGroupLabel>
            <SidebarMenu className="gap-1.5">
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={isCurrentUrl(item.href)}
                            className={navButtonClassName}
                            tooltip={{ children: item.title }}
                        >
                            <Link href={item.href} prefetch>
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
