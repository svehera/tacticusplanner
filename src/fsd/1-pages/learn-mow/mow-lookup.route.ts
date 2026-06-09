import { RouteObject } from 'react-router-dom';

export const mowLookupDesktopLazyRoute: RouteObject = {
    path: 'learn/mowLookup',
    handle: {
        section: 'Library',
        title: 'MoW Lookup',
        description: 'Browse Machines of War stats, abilities, components, and upgrade costs.',
    },
    async lazy() {
        const { MowLookup } = await import('./mow-lookup.desktop');
        return { Component: MowLookup };
    },
};
