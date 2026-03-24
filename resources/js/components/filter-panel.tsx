import { ChevronDown } from 'lucide-react';
import type {
    ComponentProps,
    ElementType,
    HTMLAttributes,
    ReactNode,
} from 'react';
import {
    createContext,
    useContext,
    useState,
    useSyncExternalStore,
} from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectTrigger } from '@/components/ui/select';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

export type FilterTone =
    | 'slate'
    | 'sky'
    | 'blue'
    | 'emerald'
    | 'amber'
    | 'teal'
    | 'violet';

interface FilterPanelProps extends HTMLAttributes<HTMLElement> {
    title: string;
    description?: string;
    eyebrow?: string;
    icon?: ElementType;
    meta?: ReactNode;
    footer?: ReactNode;
    contentClassName?: string;
    tone?: FilterTone;
}

interface FilterFieldProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    htmlFor?: string;
    icon?: ElementType;
    hint?: ReactNode;
    tone?: FilterTone;
}

interface FilterPillProps extends HTMLAttributes<HTMLSpanElement> {
    active?: boolean;
    tone?: FilterTone;
}

interface FilterPanelContextValue {
    compact: boolean;
    tone: FilterTone;
}

export const filterControlClassName =
    'w-full border-border/60 bg-background shadow-none transition-colors disabled:bg-muted/30 disabled:text-muted-foreground';

export const filterDropdownClassName =
    'absolute z-[70] mt-1.5 w-full overflow-hidden rounded-xl border border-border/60 bg-popover shadow-[0_18px_36px_-28px_rgba(15,23,42,0.45)]';

export const filterDropdownListClassName = 'max-h-44 overflow-y-auto p-1';

export const filterDropdownEmptyClassName =
    'px-2.5 py-2 text-xs text-muted-foreground';

const COMPACT_FILTER_BREAKPOINT = 1680;

const compactFilterMql =
    typeof window === 'undefined'
        ? undefined
        : window.matchMedia(`(max-width: ${COMPACT_FILTER_BREAKPOINT}px)`);

const filterPanelContext = createContext<FilterPanelContextValue>({
    compact: false,
    tone: 'blue',
});

function compactFilterListener(callback: (event: MediaQueryListEvent) => void) {
    if (!compactFilterMql) {
        return () => {};
    }

    compactFilterMql.addEventListener('change', callback);

    return () => {
        compactFilterMql.removeEventListener('change', callback);
    };
}

function isCompactFilterViewport(): boolean {
    return compactFilterMql?.matches ?? false;
}

function getCompactFilterViewportServerSnapshot(): boolean {
    return false;
}

function useCompactFilterViewport(): boolean {
    return useSyncExternalStore(
        compactFilterListener,
        isCompactFilterViewport,
        getCompactFilterViewportServerSnapshot,
    );
}

const filterToneStyles: Record<
    FilterTone,
    {
        panel: string;
        topLine: string;
        glowPrimary: string;
        glowSecondary: string;
        iconWrap: string;
        icon: string;
        eyebrow: string;
        field: string;
        labelIcon: string;
        control: string;
        activePill: string;
        inactivePill: string;
        optionActive: string;
    }
> = {
    slate: {
        panel: 'border-slate-200/70 bg-gradient-to-br from-background via-background to-slate-100/55 dark:border-slate-800/70 dark:from-background dark:via-background dark:to-slate-900/35',
        topLine: 'via-slate-400/45',
        glowPrimary: 'bg-slate-400/14',
        glowSecondary: 'bg-slate-300/16 dark:bg-slate-700/18',
        iconWrap:
            'border-slate-200/80 bg-slate-500/8 dark:border-slate-800/60 dark:bg-slate-500/12',
        icon: 'text-slate-700 dark:text-slate-300',
        eyebrow: 'text-slate-700/80 dark:text-slate-300/80',
        field: 'border-slate-200/80 bg-white/82 dark:border-slate-800/60 dark:bg-slate-950/35',
        labelIcon: 'text-slate-500 dark:text-slate-300/80',
        control:
            'hover:border-slate-300 focus-visible:border-slate-300/60 focus-visible:ring-slate-300/20 dark:hover:border-slate-700 dark:focus-visible:border-slate-600 dark:focus-visible:ring-slate-700/30',
        activePill:
            'border-slate-300/80 bg-slate-500/10 text-slate-700 dark:border-slate-700/70 dark:bg-slate-500/15 dark:text-slate-200',
        inactivePill:
            'border-slate-200/80 bg-white/72 text-slate-600 dark:border-slate-800/60 dark:bg-slate-950/35 dark:text-slate-300',
        optionActive:
            'bg-slate-500/10 text-slate-800 hover:bg-slate-500/15 dark:bg-slate-500/15 dark:text-slate-200',
    },
    sky: {
        panel: 'border-sky-200/70 bg-gradient-to-br from-sky-50/90 via-background to-cyan-50/85 dark:border-sky-900/55 dark:from-sky-950/18 dark:via-background dark:to-cyan-950/12',
        topLine: 'via-sky-400/65',
        glowPrimary: 'bg-sky-400/18',
        glowSecondary: 'bg-cyan-300/18 dark:bg-cyan-500/16',
        iconWrap:
            'border-sky-200/80 bg-sky-500/10 dark:border-sky-800/60 dark:bg-sky-500/16',
        icon: 'text-sky-700 dark:text-sky-300',
        eyebrow: 'text-sky-700/85 dark:text-sky-300/85',
        field: 'border-sky-100/90 bg-white/86 dark:border-sky-900/40 dark:bg-slate-950/35',
        labelIcon: 'text-sky-600/85 dark:text-sky-300/85',
        control:
            'hover:border-sky-300 focus-visible:border-sky-300/70 focus-visible:ring-sky-300/22 dark:hover:border-sky-700 dark:focus-visible:border-sky-600 dark:focus-visible:ring-sky-700/30',
        activePill:
            'border-sky-200 bg-sky-500/12 text-sky-700 dark:border-sky-800/60 dark:bg-sky-500/16 dark:text-sky-300',
        inactivePill:
            'border-sky-100/80 bg-sky-50/70 text-sky-700/80 dark:border-sky-900/40 dark:bg-slate-950/35 dark:text-sky-200/85',
        optionActive:
            'bg-sky-500/12 text-sky-800 hover:bg-sky-500/18 dark:bg-sky-500/18 dark:text-sky-200',
    },
    blue: {
        panel: 'border-blue-200/70 bg-gradient-to-br from-blue-50/90 via-background to-indigo-50/80 dark:border-blue-900/55 dark:from-blue-950/16 dark:via-background dark:to-indigo-950/12',
        topLine: 'via-blue-600/65',
        glowPrimary: 'bg-blue-600/18',
        glowSecondary: 'bg-indigo-400/16 dark:bg-indigo-500/16',
        iconWrap:
            'border-blue-200/80 bg-blue-600/10 dark:border-blue-800/60 dark:bg-blue-600/16',
        icon: 'text-blue-600 dark:text-blue-300',
        eyebrow: 'text-blue-700/85 dark:text-blue-300/85',
        field: 'border-blue-100/90 bg-white/86 dark:border-blue-900/40 dark:bg-slate-950/35',
        labelIcon: 'text-blue-600/85 dark:text-blue-300/85',
        control:
            'hover:border-blue-300 focus-visible:border-blue-300/70 focus-visible:ring-blue-300/22 dark:hover:border-blue-700 dark:focus-visible:border-blue-600 dark:focus-visible:ring-blue-700/30',
        activePill:
            'border-blue-200 bg-blue-600/12 text-blue-700 dark:border-blue-800/60 dark:bg-blue-600/16 dark:text-blue-300',
        inactivePill:
            'border-blue-100/80 bg-blue-50/70 text-blue-700/80 dark:border-blue-900/40 dark:bg-slate-950/35 dark:text-blue-200/85',
        optionActive:
            'bg-blue-600/12 text-blue-800 hover:bg-blue-600/18 dark:bg-blue-600/18 dark:text-blue-200',
    },
    emerald: {
        panel: 'border-emerald-200/70 bg-gradient-to-br from-emerald-50/92 via-background to-lime-50/80 dark:border-emerald-900/55 dark:from-emerald-950/16 dark:via-background dark:to-lime-950/10',
        topLine: 'via-emerald-500/65',
        glowPrimary: 'bg-emerald-400/18',
        glowSecondary: 'bg-lime-300/16 dark:bg-lime-500/12',
        iconWrap:
            'border-emerald-200/80 bg-emerald-500/10 dark:border-emerald-800/60 dark:bg-emerald-500/16',
        icon: 'text-emerald-700 dark:text-emerald-300',
        eyebrow: 'text-emerald-700/85 dark:text-emerald-300/85',
        field: 'border-emerald-100/90 bg-white/86 dark:border-emerald-900/40 dark:bg-slate-950/35',
        labelIcon: 'text-emerald-600/85 dark:text-emerald-300/85',
        control:
            'hover:border-emerald-300 focus-visible:border-emerald-300/70 focus-visible:ring-emerald-300/22 dark:hover:border-emerald-700 dark:focus-visible:border-emerald-600 dark:focus-visible:ring-emerald-700/30',
        activePill:
            'border-emerald-200 bg-emerald-500/12 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-500/16 dark:text-emerald-300',
        inactivePill:
            'border-emerald-100/80 bg-emerald-50/70 text-emerald-700/80 dark:border-emerald-900/40 dark:bg-slate-950/35 dark:text-emerald-200/85',
        optionActive:
            'bg-emerald-500/12 text-emerald-800 hover:bg-emerald-500/18 dark:bg-emerald-500/18 dark:text-emerald-200',
    },
    amber: {
        panel: 'border-amber-200/70 bg-gradient-to-br from-amber-50/92 via-background to-orange-50/85 dark:border-amber-900/55 dark:from-amber-950/18 dark:via-background dark:to-orange-950/10',
        topLine: 'via-amber-500/65',
        glowPrimary: 'bg-amber-400/18',
        glowSecondary: 'bg-orange-300/16 dark:bg-orange-500/12',
        iconWrap:
            'border-amber-200/80 bg-amber-500/10 dark:border-amber-800/60 dark:bg-amber-500/16',
        icon: 'text-amber-700 dark:text-amber-300',
        eyebrow: 'text-amber-700/85 dark:text-amber-300/85',
        field: 'border-amber-100/90 bg-white/86 dark:border-amber-900/40 dark:bg-slate-950/35',
        labelIcon: 'text-amber-600/85 dark:text-amber-300/85',
        control:
            'hover:border-amber-300 focus-visible:border-amber-300/70 focus-visible:ring-amber-300/22 dark:hover:border-amber-700 dark:focus-visible:border-amber-600 dark:focus-visible:ring-amber-700/30',
        activePill:
            'border-amber-200 bg-amber-500/12 text-amber-700 dark:border-amber-800/60 dark:bg-amber-500/16 dark:text-amber-300',
        inactivePill:
            'border-amber-100/80 bg-amber-50/70 text-amber-700/80 dark:border-amber-900/40 dark:bg-slate-950/35 dark:text-amber-200/85',
        optionActive:
            'bg-amber-500/12 text-amber-800 hover:bg-amber-500/18 dark:bg-amber-500/18 dark:text-amber-200',
    },
    teal: {
        panel: 'border-teal-200/70 bg-gradient-to-br from-teal-50/90 via-background to-emerald-50/80 dark:border-teal-900/55 dark:from-teal-950/18 dark:via-background dark:to-emerald-950/10',
        topLine: 'via-teal-500/65',
        glowPrimary: 'bg-teal-400/18',
        glowSecondary: 'bg-emerald-300/16 dark:bg-emerald-500/12',
        iconWrap:
            'border-teal-200/80 bg-teal-500/10 dark:border-teal-800/60 dark:bg-teal-500/16',
        icon: 'text-teal-700 dark:text-teal-300',
        eyebrow: 'text-teal-700/85 dark:text-teal-300/85',
        field: 'border-teal-100/90 bg-white/86 dark:border-teal-900/40 dark:bg-slate-950/35',
        labelIcon: 'text-teal-600/85 dark:text-teal-300/85',
        control:
            'hover:border-teal-300 focus-visible:border-teal-300/70 focus-visible:ring-teal-300/22 dark:hover:border-teal-700 dark:focus-visible:border-teal-600 dark:focus-visible:ring-teal-700/30',
        activePill:
            'border-teal-200 bg-teal-500/12 text-teal-700 dark:border-teal-800/60 dark:bg-teal-500/16 dark:text-teal-300',
        inactivePill:
            'border-teal-100/80 bg-teal-50/70 text-teal-700/80 dark:border-teal-900/40 dark:bg-slate-950/35 dark:text-teal-200/85',
        optionActive:
            'bg-teal-500/12 text-teal-800 hover:bg-teal-500/18 dark:bg-teal-500/18 dark:text-teal-200',
    },
    violet: {
        panel: 'border-violet-200/70 bg-gradient-to-br from-violet-50/90 via-background to-fuchsia-50/80 dark:border-violet-900/55 dark:from-violet-950/18 dark:via-background dark:to-fuchsia-950/10',
        topLine: 'via-violet-500/65',
        glowPrimary: 'bg-violet-400/18',
        glowSecondary: 'bg-fuchsia-300/16 dark:bg-fuchsia-500/12',
        iconWrap:
            'border-violet-200/80 bg-violet-500/10 dark:border-violet-800/60 dark:bg-violet-500/16',
        icon: 'text-violet-700 dark:text-violet-300',
        eyebrow: 'text-violet-700/85 dark:text-violet-300/85',
        field: 'border-violet-100/90 bg-white/86 dark:border-violet-900/40 dark:bg-slate-950/35',
        labelIcon: 'text-violet-600/85 dark:text-violet-300/85',
        control:
            'hover:border-violet-300 focus-visible:border-violet-300/70 focus-visible:ring-violet-300/22 dark:hover:border-violet-700 dark:focus-visible:border-violet-600 dark:focus-visible:ring-violet-700/30',
        activePill:
            'border-violet-200 bg-violet-500/12 text-violet-700 dark:border-violet-800/60 dark:bg-violet-500/16 dark:text-violet-300',
        inactivePill:
            'border-violet-100/80 bg-violet-50/70 text-violet-700/80 dark:border-violet-900/40 dark:bg-slate-950/35 dark:text-violet-200/85',
        optionActive:
            'bg-violet-500/12 text-violet-800 hover:bg-violet-500/18 dark:bg-violet-500/18 dark:text-violet-200',
    },
};

function getFilterToneStyles(tone: FilterTone) {
    return filterToneStyles[tone] ?? filterToneStyles.blue;
}

export function filterDropdownOptionClassName(
    active = false,
    tone: FilterTone = 'blue',
): string {
    const toneStyles = getFilterToneStyles(tone);

    return cn(
        'w-full rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors hover:bg-muted/70',
        active && ['font-medium', toneStyles.optionActive],
    );
}

export function FilterPanel({
    title,
    description,
    eyebrow = 'Filtros',
    icon: Icon,
    meta,
    footer,
    className,
    contentClassName,
    tone = 'blue',
    children,
    ...props
}: FilterPanelProps) {
    const { isMobile } = useSidebar();
    const compactViewport = useCompactFilterViewport();
    const toneStyles = getFilterToneStyles(tone);
    const compact = !isMobile && compactViewport;
    const [mobileOpen, setMobileOpen] = useState(false);
    const showPanelBody = !isMobile || mobileOpen;

    return (
        <filterPanelContext.Provider value={{ compact, tone }}>
            <section
                className={cn(
                    'relative overflow-visible border border-border/70 bg-card/95 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.22)]',
                    isMobile &&
                        'rounded-[1.75rem] border-white/70 bg-white/88 shadow-[0_26px_52px_-36px_rgba(15,23,42,0.38)] backdrop-blur',
                    compact ? 'rounded-[1.125rem]' : 'rounded-[1.375rem]',
                    className,
                )}
                {...props}
            >
                <div
                    className={cn(
                        'relative',
                        compact ? 'p-3.5 sm:p-4' : 'p-4 sm:p-5',
                    )}
                >
                    {isMobile ? (
                        <>
                            <button
                                type="button"
                                onClick={() => setMobileOpen((open) => !open)}
                                className={cn(
                                    'flex w-full items-start justify-between gap-3 text-left',
                                    showPanelBody &&
                                        'border-b border-border/60 pb-4',
                                )}
                            >
                                <div className="flex min-w-0 items-start gap-2.5">
                                    {Icon && (
                                        <div
                                            className={cn(
                                                'flex size-10 shrink-0 items-center justify-center rounded-2xl border bg-background/80',
                                                toneStyles.iconWrap,
                                            )}
                                        >
                                            <Icon
                                                className={cn(
                                                    'h-4 w-4',
                                                    toneStyles.icon,
                                                )}
                                            />
                                        </div>
                                    )}

                                    <div className="min-w-0 space-y-1">
                                        <p
                                            className={cn(
                                                'text-[10px] font-semibold tracking-[0.18em] uppercase',
                                                toneStyles.eyebrow,
                                            )}
                                        >
                                            {eyebrow}
                                        </p>
                                        <div className="space-y-0.5">
                                            <h2 className="truncate text-[15px] font-semibold tracking-tight sm:text-base">
                                                {title}
                                            </h2>
                                            <p className="text-xs leading-5 text-muted-foreground">
                                                {mobileOpen
                                                    ? (description ??
                                                      'Oculta los filtros cuando termines.')
                                                    : 'Toca para desplegar los filtros.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex shrink-0 items-center gap-2 pt-1">
                                    <span className="rounded-full border border-border/70 bg-background/80 px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                                        {mobileOpen ? 'Ocultar' : 'Abrir'}
                                    </span>
                                    <ChevronDown
                                        className={cn(
                                            'h-4 w-4 text-muted-foreground transition-transform duration-200',
                                            mobileOpen && 'rotate-180',
                                        )}
                                    />
                                </div>
                            </button>

                            {showPanelBody && (
                                <>
                                    <div
                                        className={cn('mt-4', contentClassName)}
                                    >
                                        {children}
                                    </div>

                                    {meta && (
                                        <div className="mt-4 border-t border-border/60 pt-4">
                                            <div className="flex flex-col gap-2 [&>button]:w-full [&>div]:flex [&>div]:w-full [&>div]:flex-col [&>div]:gap-2 [&>div>*]:w-full">
                                                {meta}
                                            </div>
                                        </div>
                                    )}

                                    {footer && (
                                        <div className="mt-4 border-t border-border/60 pt-3">
                                            {footer}
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    ) : (
                        <>
                            <div
                                className={cn(
                                    'flex flex-col border-b border-border/60 lg:flex-row lg:items-center lg:justify-between',
                                    compact ? 'gap-2.5 pb-3' : 'gap-3 pb-4',
                                )}
                            >
                                <div className="flex min-w-0 items-start gap-2.5">
                                    {Icon && (
                                        <div
                                            className={cn(
                                                'flex shrink-0 items-center justify-center rounded-xl border bg-background/80',
                                                compact ? 'size-8' : 'size-9',
                                                toneStyles.iconWrap,
                                            )}
                                        >
                                            <Icon
                                                className={cn(
                                                    compact
                                                        ? 'h-3.5 w-3.5'
                                                        : 'h-4 w-4',
                                                    toneStyles.icon,
                                                )}
                                            />
                                        </div>
                                    )}

                                    <div className="min-w-0 space-y-1">
                                        {!compact && (
                                            <p
                                                className={cn(
                                                    'text-[10px] font-semibold tracking-[0.18em] uppercase',
                                                    toneStyles.eyebrow,
                                                )}
                                            >
                                                {eyebrow}
                                            </p>
                                        )}
                                        <div
                                            className={
                                                compact
                                                    ? 'space-y-0'
                                                    : 'space-y-0.5'
                                            }
                                        >
                                            <h2
                                                className={cn(
                                                    'truncate font-semibold tracking-tight',
                                                    compact
                                                        ? 'text-sm'
                                                        : 'text-[15px] sm:text-base',
                                                )}
                                            >
                                                {title}
                                            </h2>
                                            {description && !compact && (
                                                <p className="max-w-2xl text-xs leading-5 text-muted-foreground sm:text-sm">
                                                    {description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {meta && (
                                    <div
                                        className={cn(
                                            'flex flex-wrap items-center lg:justify-end',
                                            compact ? 'gap-1.5' : 'gap-2',
                                        )}
                                    >
                                        {meta}
                                    </div>
                                )}
                            </div>

                            <div
                                className={cn(
                                    compact ? 'mt-3' : 'mt-4',
                                    contentClassName,
                                )}
                            >
                                {children}
                            </div>

                            {footer && (
                                <div
                                    className={cn(
                                        'border-t border-border/60',
                                        compact ? 'mt-3 pt-2.5' : 'mt-4 pt-3',
                                    )}
                                >
                                    {footer}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>
        </filterPanelContext.Provider>
    );
}

export function FilterField({
    label,
    htmlFor,
    icon: Icon,
    hint,
    className,
    tone,
    children,
    ...props
}: FilterFieldProps) {
    const { compact, tone: inheritedTone } = useContext(filterPanelContext);
    const toneStyles = getFilterToneStyles(tone ?? inheritedTone);

    return (
        <div
            className={cn(
                'flex h-full min-w-0 flex-col',
                compact ? 'gap-1.5' : 'gap-2',
                className,
            )}
            {...props}
        >
            <div className={compact ? 'space-y-0.5' : 'space-y-1'}>
                <Label
                    htmlFor={htmlFor}
                    className={cn(
                        'flex items-center gap-1.5 font-semibold text-muted-foreground uppercase',
                        compact
                            ? 'text-[10px] tracking-[0.14em]'
                            : 'text-[10px] tracking-[0.16em]',
                    )}
                >
                    {Icon && (
                        <Icon
                            className={cn(
                                compact ? 'h-3 w-3' : 'h-3.5 w-3.5',
                                toneStyles.labelIcon,
                            )}
                        />
                    )}
                    <span>{label}</span>
                </Label>

                {hint && (
                    <p
                        className={cn(
                            'text-muted-foreground',
                            compact
                                ? 'text-[11px] leading-4'
                                : 'text-[11px] leading-4',
                        )}
                    >
                        {hint}
                    </p>
                )}
            </div>

            <div className="min-w-0 flex-1">{children}</div>
        </div>
    );
}

export function FilterInput({
    className,
    ...props
}: ComponentProps<typeof Input>) {
    const { compact, tone } = useContext(filterPanelContext);
    const toneStyles = getFilterToneStyles(tone);

    return (
        <Input
            className={cn(
                filterControlClassName,
                compact
                    ? 'h-8 rounded-lg px-2.5 text-[13px]'
                    : 'h-9 rounded-lg px-3 text-sm',
                toneStyles.control,
                className,
            )}
            {...props}
        />
    );
}

export function FilterSelectTrigger({
    className,
    ...props
}: ComponentProps<typeof SelectTrigger>) {
    const { compact, tone } = useContext(filterPanelContext);
    const toneStyles = getFilterToneStyles(tone);

    return (
        <SelectTrigger
            className={cn(
                filterControlClassName,
                compact
                    ? 'h-8 rounded-lg px-2.5 text-[13px]'
                    : 'h-9 rounded-lg px-3 text-sm',
                toneStyles.control,
                className,
            )}
            {...props}
        />
    );
}

export function FilterPill({
    active = false,
    className,
    tone,
    ...props
}: FilterPillProps) {
    const { compact, tone: inheritedTone } = useContext(filterPanelContext);
    const toneStyles = getFilterToneStyles(tone ?? inheritedTone);

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border font-medium',
                compact
                    ? 'px-2 py-0.5 text-[10px]'
                    : 'px-2.5 py-0.5 text-[11px]',
                active ? toneStyles.activePill : toneStyles.inactivePill,
                className,
            )}
            {...props}
        />
    );
}
