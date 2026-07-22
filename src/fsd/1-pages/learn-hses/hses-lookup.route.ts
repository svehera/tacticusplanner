import { RouteObject } from 'react-router-dom';

export const hsesLookupLazyRoute: RouteObject = {
    path: 'learn/hses',
    handle: {
        section: 'Library',
        title: 'HSEs',
        description: 'Browse Home-Screen Event reward tiers and see which tier your roster currently qualifies for.',
    },
    async lazy() {
        const { HsesLookup } = await import('./hses-lookup');
        return { Component: HsesLookup };
    },
};
