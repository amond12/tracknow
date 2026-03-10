import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupLabel,
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

export function NavCollapsible({ title, icon: Icon, items }: NavCollapsibleProps) {
    const { isCurrentOrParentUrl } = useCurrentUrl();
    const isAnyChildActive = items.some((item) => isCurrentOrParentUrl(item.href));
    const [open, setOpen] = useState(isAnyChildActive);

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>{title}</SidebarGroupLabel>
            <SidebarMenu>
                <SidebarMenuItem>
                    <Collapsible open={open} onOpenChange={setOpen}>
                        <CollapsibleTrigger asChild>
                            <SidebarMenuButton tooltip={{ children: title }}>
                                <Icon />
                                <span>{title}</span>
                                <ChevronRight
                                    className={`ml-auto transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
                                />
                            </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <SidebarMenuSub>
                                {items.map((item) => (
                                    <SidebarMenuSubItem key={item.title}>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentOrParentUrl(item.href)}
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
