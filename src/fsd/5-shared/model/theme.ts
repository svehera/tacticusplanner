import { createTheme } from '@mui/material';
import { createContext, useContext } from 'react';

export enum Theme {
    Device = 'DEVICE',
    Light = 'LIGHT',
    Dark = 'DARK',
}

export const AppThemeContext = createContext({
    userThemePreference: Theme.Device,
    setUserThemePreference: (_: Theme) => {},
});

export function useTheme() {
    return useContext(AppThemeContext);
}

export const lightTheme = createTheme({
    colorSchemes: {
        light: true,
    },
    palette: {
        mode: 'light', // Ensure the mode is set to dark for dark mode
    },
});

export const darkTheme = createTheme({
    colorSchemes: {
        dark: true,
    },
    palette: {
        mode: 'dark', // Ensure the mode is set to dark for dark mode
    },
    components: {
        MuiCard: {
            styleOverrides: {
                root: {
                    backgroundColor: 'var(--overlay)',
                },
            },
        },
        MuiAccordion: {
            styleOverrides: {
                root: {
                    backgroundColor: 'var(--secondary)',
                },
            },
        },
        MuiToolbar: {
            styleOverrides: {
                root: {
                    backgroundColor: 'var(--navbar)',
                },
            },
        },
    },
});
