import { createBrowserRouter, redirect, useRouteError } from 'react-router-dom';

import { App } from './app';
import { appRoutes } from './desktop-routes';
import { mobileAppRoutes } from './mobile-routes';

export const routes = createBrowserRouter([
    {
        path: '',
        ErrorBoundary() {
            const error = useRouteError() as Error | undefined;
            if (!error?.message?.includes('dynamically imported module')) {
                throw error;
            }
            return (
                <>
                    <h1>Uh oh!</h1>
                    <p>Something went wrong! Probably the app was updated.</p>
                    <button onClick={() => globalThis.location.reload()}>Click here to reload the page</button>
                </>
            );
        },
        element: <App />,
        children: [
            ...appRoutes(),
            ...mobileAppRoutes(),
            // Fail-safe: any path that matches no route (e.g. stale link, removed page, or a
            // desktop<->mobile path with no counterpart) redirects home instead of crashing.
            // On a mobile device the home page then forwards to /mobile/home via DesktopApp.
            {
                path: '*',
                loader: () => redirect('/home'),
            },
        ],
    },
]);
