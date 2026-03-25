import type { VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { buttonVariants } from '@/components/ui/button';
import {
    isNativePdfShareAvailable,
    shareRemoteFile,
} from '@/lib/native-file-share';
import { cn } from '@/lib/utils';

type ButtonVariantProps = VariantProps<typeof buttonVariants>;

type Props = {
    href: string;
    fallbackFileName: string;
    shareTitle?: string;
    className?: string;
    children: ReactNode;
    onError?: (message: string) => void;
    size?: ButtonVariantProps['size'];
    variant?: ButtonVariantProps['variant'];
};

export function PdfDownloadAction({
    href,
    fallbackFileName,
    shareTitle = 'Compartir PDF',
    className,
    children,
    onError,
    size = 'default',
    variant = 'default',
}: Props) {
    const [processing, setProcessing] = useState(false);
    const isNative = isNativePdfShareAvailable();

    async function handleNativeDownload() {
        if (!isNative || processing) {
            return;
        }

        setProcessing(true);

        try {
            await shareRemoteFile({
                url: href,
                fallbackFileName,
                title: shareTitle,
            });
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'No se pudo preparar el PDF.';

            if (onError) {
                onError(message);
            } else {
                window.alert(message);
            }
        } finally {
            setProcessing(false);
        }
    }

    if (!isNative) {
        return (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ size, variant }), className)}
            >
                {children}
            </a>
        );
    }

    return (
        <button
            type="button"
            onClick={() => void handleNativeDownload()}
            disabled={processing}
            aria-busy={processing}
            className={cn(buttonVariants({ size, variant }), className)}
        >
            {children}
        </button>
    );
}
