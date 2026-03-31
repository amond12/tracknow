import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useIsNativeApp } from '@/hooks/use-native-app';

type Props = {
    isAdmin: boolean;
    userId: number;
    accessState: 'trial' | 'paid' | 'expired' | null;
    trialEndsAt: string | null;
};

function getDismissKey({
    userId,
    accessState,
    trialEndsAt,
}: Pick<Props, 'userId' | 'accessState' | 'trialEndsAt'>): string {
    return [
        'native-billing-required-modal',
        userId,
        accessState ?? 'unknown',
        trialEndsAt ?? 'none',
    ].join(':');
}

function hasBeenDismissed(key: string): boolean {
    try {
        return window.sessionStorage.getItem(key) === '1';
    } catch {
        return false;
    }
}

function markAsDismissed(key: string) {
    try {
        window.sessionStorage.setItem(key, '1');
    } catch {
        // Ignore storage failures and keep the modal dismissible.
    }
}

export function NativeBillingRequiredModal({
    isAdmin,
    userId,
    accessState,
    trialEndsAt,
}: Props) {
    const isNativeApp = useIsNativeApp();
    const [open, setOpen] = useState(false);
    const shouldShow = isNativeApp && isAdmin && accessState === 'expired';

    useEffect(() => {
        if (!shouldShow) {
            setOpen(false);
            return;
        }

        const dismissKey = getDismissKey({
            userId,
            accessState,
            trialEndsAt,
        });

        if (hasBeenDismissed(dismissKey)) {
            setOpen(false);
            return;
        }

        setOpen(true);
    }, [accessState, isAdmin, isNativeApp, shouldShow, trialEndsAt, userId]);

    if (!shouldShow) {
        return null;
    }

    function handleOpenChange(nextOpen: boolean) {
        if (!nextOpen) {
            markAsDismissed(
                getDismissKey({
                    userId,
                    accessState,
                    trialEndsAt,
                }),
            );
        }

        setOpen(nextOpen);
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                hideCloseButton={true}
                className="sm:max-w-md"
                onEscapeKeyDown={(event) => event.preventDefault()}
                onInteractOutside={(event) => event.preventDefault()}
                onPointerDownOutside={(event) => event.preventDefault()}
            >
                <DialogHeader className="space-y-3 text-left">
                    <DialogTitle className="text-xl text-slate-950">
                        Activa un plan desde la web
                    </DialogTitle>
                    <DialogDescription className="space-y-3 text-sm leading-6 text-slate-600">
                        <span className="block">
                            La prueba gratuita ha terminado y la facturacion no
                            se gestiona desde la app movil.
                        </span>
                        <span className="block">
                            Para recuperar el acceso completo, entra en{' '}
                            <span className="font-semibold text-slate-950">
                                horariodigital.es
                            </span>{' '}
                            y activa un plan desde la web.
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="sm:justify-start">
                    <Button
                        type="button"
                        className="h-11 rounded-2xl px-5"
                        onClick={() => handleOpenChange(false)}
                    >
                        Entendido
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
