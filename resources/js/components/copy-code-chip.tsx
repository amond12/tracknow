import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useClipboard } from '@/hooks/use-clipboard';
import { cn } from '@/lib/utils';

type CopyCodeChipProps = {
    value: string;
    className?: string;
};

export function CopyCodeChip({ value, className }: CopyCodeChipProps) {
    const [copiedText, copy] = useClipboard();

    return (
        <div
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100',
                className,
            )}
        >
            <span className="font-mono text-[11px] font-semibold tracking-[0.18em]">
                {value}
            </span>
            <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-5 w-5 rounded-full"
                onClick={() => void copy(value)}
            >
                {copiedText === value ? (
                    <Check className="h-3.5 w-3.5" />
                ) : (
                    <Copy className="h-3.5 w-3.5" />
                )}
            </Button>
        </div>
    );
}
