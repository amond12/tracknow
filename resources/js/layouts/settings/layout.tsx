import { Link, usePage } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { show } from '@/routes/two-factor';
import { edit as editPassword } from '@/routes/user-password';
import type { Auth, NavItem } from '@/types';

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const { isCurrentOrParentUrl } = useCurrentUrl();
    const isEmployee = auth.user.role === 'empleado';
    const isAdmin = auth.user.role === 'admin';
    const sidebarNavItems: NavItem[] = [
        ...(!isEmployee
            ? [
                  {
                      title: 'Profile',
                      href: edit(),
                      icon: null,
                  },
                  {
                      title: 'Trabajo',
                      href: '/settings/trabajo',
                      icon: null,
                  },
                  ...(isAdmin
                      ? [
                            {
                                title: 'Pricing',
                                href: '/settings/pricing',
                                icon: null,
                            },
                        ]
                      : []),
              ]
            : []),
        {
            title: 'Password',
            href: editPassword(),
            icon: null,
        },
        {
            title: 'Two-factor auth',
            href: show(),
            icon: null,
        },
        {
            title: 'Appearance',
            href: editAppearance(),
            icon: null,
        },
    ];

    // When server-side rendering, we only render the layout on the client...
    if (typeof window === 'undefined') {
        return null;
    }

    return (
        <div className="px-4 py-3 md:py-6">
            <Heading
                title="Settings"
                description="Manage your profile and account settings"
            />

            <div className="flex flex-col gap-5 lg:flex-row lg:space-x-12">
                <aside className="w-full max-w-xl lg:w-48">
                    <nav
                        className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:space-y-1 lg:space-x-0 lg:overflow-visible lg:pb-0"
                        aria-label="Settings"
                    >
                        {sidebarNavItems.map((item, index) => (
                            <Button
                                key={`${toUrl(item.href)}-${index}`}
                                size="sm"
                                variant="ghost"
                                asChild
                                className={cn(
                                    'h-10 shrink-0 rounded-2xl border border-slate-200/80 bg-white/75 px-4 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.3)] lg:w-full lg:justify-start lg:rounded-xl lg:border-transparent lg:bg-transparent lg:px-3 lg:shadow-none',
                                    {
                                        'border-blue-200 bg-blue-600 text-white shadow-[0_18px_36px_-26px_rgba(37,99,235,0.7)] lg:bg-muted lg:text-foreground lg:shadow-none':
                                            isCurrentOrParentUrl(item.href),
                                    },
                                )}
                            >
                                <Link href={item.href}>
                                    {item.icon && (
                                        <item.icon className="h-4 w-4" />
                                    )}
                                    {item.title}
                                </Link>
                            </Button>
                        ))}
                    </nav>
                </aside>

                <Separator className="my-6 lg:hidden" />

                <div className="flex-1 md:max-w-2xl">
                    <section className="mobile-surface max-w-xl space-y-8 p-4 md:space-y-12 md:border-none md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-none">
                        {children}
                    </section>
                </div>
            </div>
        </div>
    );
}
