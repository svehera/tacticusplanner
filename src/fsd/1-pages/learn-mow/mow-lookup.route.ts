import { RouteObject } from 'react-router-dom';

export const mowLookupDesktopLazyRoute: RouteObject = {
    path: 'learn/mowLookup',
    async lazy() {
        const { MowLookup } = await import('./mow-lookup.desktop');
        return { Component: MowLookup };
    },
};
