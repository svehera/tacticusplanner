import React from 'react';
import ReactDOM from 'react-dom/client';

import 'react-medium-image-zoom/dist/styles.css';
import './index.css';

import reportWebVitals from './monitoring/reportWebVitals';

import { RouterProvider } from 'react-router-dom';
import { AnalyticsProvider } from 'use-analytics';
import { AuthProvider } from './contexts/auth.provider';
import { closeSnackbar, SnackbarOrigin, SnackbarProvider } from 'notistack';
import { isMobile } from 'react-device-detect';
import { routes } from './app-routing';
import { PopupProvider } from 'react-popup-manager';
import { TitleProvider } from 'src/contexts/title.provider';
import { LoaderProvider } from 'src/contexts/loader.provider';
import { StoreProvider } from 'src/reducers/store.provider2';
import analytics from './monitoring/analytics';

const webSnackbarOrigin: SnackbarOrigin = { vertical: 'bottom', horizontal: 'right' };
const mobileSnackbarOrigin: SnackbarOrigin = { vertical: 'top', horizontal: 'center' };

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <AnalyticsProvider instance={analytics}>
        <AuthProvider>
            <TitleProvider>
                <LoaderProvider>
                    <SnackbarProvider
                        autoHideDuration={5000}
                        anchorOrigin={isMobile ? mobileSnackbarOrigin : webSnackbarOrigin}
                        onEntered={(node, isAppearing, key) => (node.onclick = () => closeSnackbar(key))}
                    />
                    <StoreProvider>
                        {/*// @ts-expect-error Ts being weird */}
                        <PopupProvider>
                            <RouterProvider router={routes} />
                        </PopupProvider>
                    </StoreProvider>
                </LoaderProvider>
            </TitleProvider>
        </AuthProvider>
    </AnalyticsProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(metric => {
    // console.log(`[Web Vitals] ${metric.name}:`, metric.value);
});
