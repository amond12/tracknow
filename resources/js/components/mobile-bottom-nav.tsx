import { Link, usePage } from '@inertiajs/react';
import { Grid2x2Plus } from 'lucide-react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { getMobileTabItems, type MobileTabItem } from '@/lib/app-navigation';
import { cn } from '@/lib/utils';
import type { Auth } from '@/types';
import { useSidebar } from './ui/sidebar';

function isActiveTab(
    item: MobileTabItem,
    isCurrentOrParentUrl: (href: string) => boolean,
): boolean {
    if (item.href === '/fichar') {
        return isCurrentOrParentUrl('/fichar');
    }

    return isCurrentOrParentUrl(item.href);
}

export function MobileBottomNav() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const { isCurrentOrParentUrl } = useCurrentUrl();
    const { setOpenMobile } = useSidebar();
    const items = getMobileTabItems(auth.user);
    const isMoreActive = !items.some((item) =>
        isActiveTab(item, isCurrentOrParentUrl),
    );

    return (
        <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 md:hidden">
            <div className="pointer-events-auto mx-4 mb-3">
                <div className="mobile-bottom-nav">
                    {items.map((item) => {
                        const active = isActiveTab(item, isCurrentOrParentUrl);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                prefetch
                                className={cn('mobile-bottom-nav__item', {
                                    'mobile-bottom-nav__item--active': active,
                                })}
                            >
                                <item.icon className="h-5 w-5" />
                                <span>{item.title}</span>
                            </Link>
                        );
                    })}

                    <button
                        type="button"
                        onClick={() => setOpenMobile(true)}
                        className={cn('mobile-bottom-nav__item', {
                            'mobile-bottom-nav__item--active': isMoreActive,
                        })}
                    >
                        <Grid2x2Plus className="h-5 w-5" />
                        <span>Mas</span>
                    </button>
                </div>
            </div>
        </nav>
    );
}
