import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
                <AppLogoIcon className="size-5 fill-current text-white" />
            </div>
            <div className="ml-1 grid flex-1 text-left">
                <span className="truncate text-[13px] font-semibold leading-tight tracking-tight text-gray-900">
                    TrackNow
                </span>
                <span className="truncate text-[10px] text-gray-400 leading-tight">
                    Control horario
                </span>
            </div>
        </>
    );
}
