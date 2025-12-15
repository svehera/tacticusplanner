import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';

import { LoginStatusDialog } from 'src/shared-components/user-menu/login-status-dialog';
import { LoginUserDialog } from 'src/shared-components/user-menu/login-user-dialog';
import { RegisterUserDialog } from 'src/shared-components/user-menu/register-user-dialog';

import { initI18n } from '@/fsd/5-shared/i18n';
import { useAuth, AppThemeProvider } from '@/fsd/5-shared/model';
import { LoaderWithText } from '@/fsd/5-shared/ui';
import { SearchParamsStateProvider, useLoader } from '@/fsd/5-shared/ui/contexts';

import { currentVersion } from '@/fsd/3-features/whats-new';

initI18n();

export const App = () => {
    const { isAuthenticated } = useAuth();
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
        <AppThemeProvider>
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
        </AppThemeProvider>
    );
};
