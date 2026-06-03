import { useSyncExternalStore } from 'react';

const LOCAL_STORAGE_KEY = 'tp-debug-mode';

function getSnapshot(): boolean {
    return localStorage.getItem(LOCAL_STORAGE_KEY) === 'true';
}

function subscribe(callback: () => void): () => void {
    globalThis.addEventListener('storage', callback);
    return () => globalThis.removeEventListener('storage', callback);
}

export function useDebugMode(): boolean {
    return useSyncExternalStore(subscribe, getSnapshot);
}

export function setDebugMode(enabled: boolean): void {
    localStorage.setItem(LOCAL_STORAGE_KEY, String(enabled));
    // Native storage event only fires in other tabs/windows, so dispatch manually.
    globalThis.dispatchEvent(new Event('storage'));
}
