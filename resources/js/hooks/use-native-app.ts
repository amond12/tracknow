import { useSyncExternalStore } from 'react';
import {
    getNativeAppServerSnapshot,
    isNativeAppPlatform,
} from '@/lib/native-app';

function subscribe(_onStoreChange: () => void): VoidFunction {
    return () => {};
}

export function useIsNativeApp(): boolean {
    return useSyncExternalStore(
        subscribe,
        isNativeAppPlatform,
        getNativeAppServerSnapshot,
    );
}
