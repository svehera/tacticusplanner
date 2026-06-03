import { RouteObject } from 'react-router-dom';

export const guidesLazyRoute: RouteObject = {
    path: 'learn/guides',
    handle: {
        section: 'Library',
        title: 'Guides',
        description: 'Community-written guides covering characters, teams, and game modes.',
    },
    async lazy() {
        const { Guides } = await import('./guides');
        return { Component: Guides };
    },
};
