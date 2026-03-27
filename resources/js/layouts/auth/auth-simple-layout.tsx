import { Link, usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { cn } from '@/lib/utils';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

const widthClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
} as const;

export default function AuthSimpleLayout({
    children,
    title,
    description,
    maxWidth = 'sm',
}: AuthLayoutProps) {
    const { name } = usePage<{ name?: string }>().props;
    const brandName = name || 'TrackNow';

    return (
        <div className="min-h-svh bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.16),transparent_30%),linear-gradient(180deg,#f8fbff_0%,#eef4ff_55%,#f8fafc_100%)]">
            <div className="mx-auto flex min-h-svh w-full items-center justify-center px-4 py-4 sm:px-6">
                <section
                    className={cn(
                        'relative w-full overflow-hidden rounded-[28px] border border-slate-200/90 bg-white/95 p-5 shadow-[0_24px_60px_-32px_rgba(37,99,235,0.25)] sm:p-6',
                        widthClasses[maxWidth],
                    )}
                >
                    <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#93c5fd_0%,#2563eb_45%,#1d4ed8_100%)]" />

                    <div className="relative flex flex-col gap-5">
                        <div className="flex flex-wrap items-center gap-3">
                            <Link
                                href={home()}
                                className="inline-flex items-center gap-3"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
                                    <AppLogoIcon className="size-5 fill-current" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold tracking-[0.24em] text-blue-700 uppercase">
                                        {brandName}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        Acceso
                                    </p>
                                </div>
                            </Link>
                        </div>

                        <div className="space-y-1">
                            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
                                {title}
                            </h1>
                            <p className="text-sm leading-6 text-slate-600">
                                {description}
                            </p>
                        </div>

                        {children}
                    </div>
                </section>
            </div>
        </div>
    );
}
