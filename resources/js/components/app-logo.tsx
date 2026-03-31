import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-9 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-500 text-sidebar-primary-foreground shadow-[0_14px_28px_-18px_rgba(37,99,235,0.85)] ring-1 ring-white/70">
                <AppLogoIcon className="size-5 fill-current text-white" />
            </div>
            <div className="ml-0.5 grid min-w-0 flex-1 text-left leading-none">
                <span className="truncate text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                    Horario Digital
                </span>

            </div>
        </>
    );
}
