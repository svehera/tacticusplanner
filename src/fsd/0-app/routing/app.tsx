﻿import { createTheme, ThemeProvider } from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';

import { StoreContext } from 'src/reducers/store.provider';
import { LoginStatusDialog } from 'src/shared-components/user-menu/login-status-dialog';
import { LoginUserDialog } from 'src/shared-components/user-menu/login-user-dialog';
import { RegisterUserDialog } from 'src/shared-components/user-menu/register-user-dialog';

import { initI18n } from '@/fsd/5-shared/i18n';
import { useAuth } from '@/fsd/5-shared/model';
import { LoaderWithText } from '@/fsd/5-shared/ui';
import { SearchParamsStateProvider, useLoader } from '@/fsd/5-shared/ui/contexts';

import { currentVersion } from '@/fsd/3-features/whats-new';

initI18n();

const lightTheme = createTheme({
    colorSchemes: {
        light: true,
    },
    palette: {
        mode: 'light', // Ensure the mode is set to dark for dark mode
    },
});

const darkTheme = createTheme({
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

export const App = () => {
    const { isAuthenticated } = useAuth();
    const { viewPreferences } = useContext(StoreContext);
    const { loading, loadingText } = useLoader();

    const [showLoginStatus, setShowLoginStatus] = useState(false);
    const [showRegisterUser, setShowRegisterUser] = useState(false);
    const [showLoginUser, setShowLoginUser] = useState(false);

    useEffect(() => {
        localStorage.setItem('appVersion', currentVersion);
    }, [currentVersion]);

    useEffect(() => {
        const lastVisit = localStorage.getItem('lastVisit');
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        if (!lastVisit || Date.now() - new Date(lastVisit).getTime() > thirtyDays) {
            setShowLoginStatus(!isAuthenticated);
        }
    }, []);

    useEffect(() => {
        if (viewPreferences.theme === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.setAttribute('data-ag-theme-mode', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.removeAttribute('data-ag-theme-mode');
        }
    }, [viewPreferences.theme]);

    const handleContinue = () => {
        localStorage.setItem('lastVisit', new Date().toISOString());
        setShowLoginStatus(false);
    };

    const handleClose = () => {
        setShowLoginStatus(false);
    };

    const handleRegister = () => {
        setShowLoginStatus(false);
        setShowRegisterUser(true);
    };

    const handleLogin = () => {
        setShowLoginStatus(false);
        setShowLoginUser(true);
    };

    return (
        <ThemeProvider theme={viewPreferences.theme === 'dark' ? darkTheme : lightTheme}>
            {showLoginStatus && (
                <LoginStatusDialog
                    onClose={handleClose}
                    onContinue={handleContinue}
                    onRegister={handleRegister}
                    onLogin={handleLogin}
                />
            )}
            <RegisterUserDialog
                isOpen={showRegisterUser}
                onClose={success => {
                    setShowRegisterUser(false);
                    setShowLoginUser(success);
                }}
            />
            <LoginUserDialog isOpen={showLoginUser} onClose={() => setShowLoginUser(false)} />
            <SearchParamsStateProvider>
                <Outlet />
            </SearchParamsStateProvider>
            <LoaderWithText loading={!!loading} loadingText={loadingText} />
        </ThemeProvider>
    );
};
