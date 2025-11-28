import { SnackbarOrigin, SnackbarProvider, closeSnackbar } from 'notistack';
import React from 'react';
import { isMobile } from 'react-device-detect';
import { PopupProvider } from 'react-popup-manager';
import { RouterProvider } from 'react-router-dom';
import { AnalyticsProvider } from 'use-analytics';

import analytics from '../monitoring/analytics';
import { routes } from '../routing/app-routing';

const webSnackbarOrigin: SnackbarOrigin = { vertical: 'bottom', horizontal: 'right' };
const mobileSnackbarOrigin: SnackbarOrigin = { vertical: 'top', horizontal: 'center' };

// Wrapper component to work around TypeScript JSX component type issue
const PopupWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const Provider = PopupProvider as any;
    return <Provider>{children}</Provider>;
};

export const ThirdPartyProviders: React.FC = () => {
    return (
        <AnalyticsProvider instance={analytics}>
            <SnackbarProvider
                autoHideDuration={5000}
                anchorOrigin={isMobile ? mobileSnackbarOrigin : webSnackbarOrigin}
                onEntered={(node, _isAppearing, key) => (node.onclick = () => closeSnackbar(key))}
            />
            <PopupWrapper>
                <RouterProvider router={routes} />
            </PopupWrapper>
        </AnalyticsProvider>
    );
};
