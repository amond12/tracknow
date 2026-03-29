import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-9 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-500 text-sidebar-primary-foreground shadow-[0_14px_28px_-18px_rgba(37,99,235,0.85)] ring-1 ring-white/70">
                <AppLogoIcon className="size-5 fill-current text-white" />
            </div>
            <div className="ml-0.5 grid min-w-0 flex-1 text-left leading-none">
                <span className="truncate text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                    TrackNow
                </span>
                <span className="pt-1 text-[9px] leading-[1.2] font-medium tracking-[0.12em] whitespace-normal text-slate-400 uppercase dark:text-slate-400 xl:text-[10px] xl:tracking-[0.14em]">
                    Control horario
                </span>
            </div>
        </>
    );
}
