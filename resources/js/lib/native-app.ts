import { Capacitor } from '@capacitor/core';

export function isNativeAppPlatform(): boolean {
    return typeof window !== 'undefined' && Capacitor.isNativePlatform();
}

export function getNativeAppServerSnapshot(): boolean {
    return false;
}
