import { ThemeProvider } from '@mui/material';
import { FC, PropsWithChildren, useEffect, useState, useSyncExternalStore } from 'react';

import { AppThemeContext, darkTheme, lightTheme, Theme } from './theme';

const LOCAL_STORAGE_KEY = 'tp-theme';

export const AppThemeProvider: FC<PropsWithChildren> = ({ children }) => {
    const [deviceIsDarkMode, setDeviceIsDarkMode] = useState(
        () => globalThis.matchMedia('(prefers-color-scheme: dark)').matches
    );
    const userThemePreference = useSyncExternalStore(
        callback => {
            globalThis.addEventListener('storage', callback);
            return () => globalThis.removeEventListener('storage', callback);
        },
        () => {
            const stored = localStorage.getItem(LOCAL_STORAGE_KEY) as Theme;
            return stored && Object.values(Theme).includes(stored) ? stored : Theme.Device;
        }
    );
    const setUserThemePreference = (theme: Theme) => {
        localStorage.setItem(LOCAL_STORAGE_KEY, theme);
        // Native storage event only fires in other tabs/windows.
        globalThis.dispatchEvent(new Event('storage'));
    };
    const isDarkMode =
        {
            [Theme.Device]: deviceIsDarkMode,
            [Theme.Light]: false,
            [Theme.Dark]: true,
        }[userThemePreference] || false;

    // System theme detection
    useEffect(() => {
        const mediaQuery = globalThis.matchMedia('(prefers-color-scheme: dark)');
        const handler = ({ matches }: MediaQueryListEvent) => setDeviceIsDarkMode(matches);
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    // Apply dark class to html element
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            document.documentElement.dataset.agThemeMode = 'dark';
        } else {
            document.documentElement.classList.remove('dark');
            delete document.documentElement.dataset.agThemeMode;
        }
    }, [isDarkMode]);

    return (
        <AppThemeContext.Provider
            value={{ userThemePreference: userThemePreference, setUserThemePreference: setUserThemePreference }}>
            <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>{children}</ThemeProvider>
        </AppThemeContext.Provider>
    );
};
