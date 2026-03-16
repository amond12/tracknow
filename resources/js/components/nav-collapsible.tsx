import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

interface NavCollapsibleProps {
    title: string;
    icon: React.ElementType;
    items: Omit<NavItem, 'children'>[];
}

const navCollapsibleButtonClassName =
    'h-10 rounded-xl px-2.5 text-[13px] font-medium text-sidebar-foreground/80 transition-all hover:bg-sidebar-accent/75 hover:text-sidebar-foreground data-[active=true]:bg-white data-[active=true]:text-blue-600 data-[active=true]:shadow-[0_14px_32px_-26px_rgba(37,99,235,0.9)] dark:data-[active=true]:bg-sidebar-accent dark:data-[active=true]:text-blue-300 [&>svg]:size-[18px]';

export function NavCollapsible({
    title,
    icon: Icon,
    items,
}: NavCollapsibleProps) {
    const { isCurrentOrParentUrl } = useCurrentUrl();
    const isAnyChildActive = items.some((item) =>
        isCurrentOrParentUrl(item.href),
    );
    const [open, setOpen] = useState(isAnyChildActive);

    return (
        <SidebarGroup className="px-1 py-0">
            <SidebarMenu className="gap-1.5">
                <SidebarMenuItem>
                    <Collapsible open={open} onOpenChange={setOpen}>
                        <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                                className={`${navCollapsibleButtonClassName} ${isAnyChildActive ? 'bg-white text-blue-600 shadow-[0_14px_32px_-26px_rgba(37,99,235,0.9)] dark:bg-sidebar-accent dark:text-blue-300' : ''}`}
                                tooltip={{ children: title }}
                            >
                                <Icon />
                                <span>{title}</span>
                                <ChevronRight
                                    className={`ml-auto size-4 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
                                />
                            </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <SidebarMenuSub className="mt-1 ml-4 gap-1 border-sidebar-border/55 px-0 pl-2.5">
                                {items.map((item) => (
                                    <SidebarMenuSubItem key={item.title}>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentOrParentUrl(
                                                item.href,
                                            )}
                                            className="h-8 rounded-lg px-2 text-[12.5px] font-medium text-sidebar-foreground/72 hover:bg-sidebar-accent/65 hover:text-sidebar-foreground data-[active=true]:bg-white data-[active=true]:text-blue-600 dark:data-[active=true]:bg-sidebar-accent dark:data-[active=true]:text-blue-300"
                                        >
                                            <Link href={item.href} prefetch>
                                                {item.icon && <item.icon />}
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                ))}
                            </SidebarMenuSub>
                        </CollapsibleContent>
                    </Collapsible>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarGroup>
    );
}
