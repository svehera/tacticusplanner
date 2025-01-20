import React from 'react';
import ReactDOM from 'react-dom/client';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-material.css';
import 'react-medium-image-zoom/dist/styles.css';
import './index.scss';

import reportWebVitals from './reportWebVitals';

import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './contexts/auth.provider';
import { closeSnackbar, SnackbarOrigin, SnackbarProvider } from 'notistack';
import { isMobile } from 'react-device-detect';
import { routes } from './app-routing';
import { TitleProvider } from 'src/contexts/title.provider';
import { StoreProvider } from 'src/reducers/store.provider2';

const webSnackbarOrigin: SnackbarOrigin = { vertical: 'bottom', horizontal: 'right' };
const mobileSnackbarOrigin: SnackbarOrigin = { vertical: 'top', horizontal: 'center' };

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
    // <React.StrictMode>
    <AuthProvider>
        <TitleProvider>
            <SnackbarProvider
                autoHideDuration={5000}
                anchorOrigin={isMobile ? mobileSnackbarOrigin : webSnackbarOrigin}
                onEntered={(node, isAppearing, key) => (node.onclick = () => closeSnackbar(key))}
            />
            <StoreProvider>
                <RouterProvider router={routes} />
            </StoreProvider>
        </TitleProvider>
    </AuthProvider>
    // </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
