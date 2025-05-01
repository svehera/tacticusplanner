import React from 'react';
import { createBrowserRouter, useRouteError } from 'react-router-dom';
import { appRoutes } from './desktop-routes';
import { mobileAppRoutes } from './mobile-routes';
import { App } from './app';

export const routes = createBrowserRouter([
    {
        path: '',
        ErrorBoundary() {
            const error = useRouteError() as Error;
            if (!error.message.includes('dynamically imported module')) {
                throw error;
            }
            return (
                <>
                    <h1>Uh oh!</h1>
                    <p>Something went wrong! Probably the app was updated.</p>
                    <button onClick={() => window.location.reload()}>Click here to reload the page</button>
                </>
            );
        },
        element: <App />,
        children: [...appRoutes(), ...mobileAppRoutes()],
    },
]);
