import { Eye, EyeOff } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

type PasswordInputProps = Omit<React.ComponentProps<'input'>, 'type'>;

function PasswordInput({
    className,
    disabled,
    tabIndex,
    ...props
}: PasswordInputProps) {
    const [isVisible, setIsVisible] = React.useState(false);
    const Icon = isVisible ? EyeOff : Eye;

    return (
        <div className="relative">
            <Input
                type={isVisible ? 'text' : 'password'}
                className={cn('pr-11', className)}
                disabled={disabled}
                tabIndex={tabIndex}
                {...props}
            />
            <button
                type="button"
                onClick={() => setIsVisible((current) => !current)}
                className="absolute inset-y-0 right-0 flex h-full items-center justify-center px-3 text-slate-500 transition hover:text-slate-700 focus-visible:text-slate-700 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                disabled={disabled}
                aria-label={
                    isVisible ? 'Ocultar contrasena' : 'Mostrar contrasena'
                }
                aria-pressed={isVisible}
                tabIndex={tabIndex}
            >
                <Icon className="size-4" aria-hidden="true" />
            </button>
        </div>
    );
}

export { PasswordInput };
