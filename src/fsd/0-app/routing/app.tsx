import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';

import { initI18n } from '@/fsd/5-shared/i18n';
import { AppThemeProvider } from '@/fsd/5-shared/model';
import { LoaderWithText } from '@/fsd/5-shared/ui';
import { SearchParametersStateProvider, useLoader } from '@/fsd/5-shared/ui/contexts';

import { currentVersion } from '@/fsd/3-features/whats-new';

initI18n();

export const App = () => {
    const { loading, loadingText } = useLoader();

    useEffect(() => {
        localStorage.setItem('appVersion', currentVersion);
    }, [currentVersion]);

    return (
        <AppThemeProvider>
            <SearchParametersStateProvider>
                <Outlet />
            </SearchParametersStateProvider>
            <LoaderWithText loading={!!loading} loadingText={loadingText} />
        </AppThemeProvider>
    );
};
