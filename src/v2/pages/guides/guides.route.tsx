import { RouteObject } from 'react-router-dom';

export const guidesLazyRoute: RouteObject = {
    path: 'learn/guides',
    async lazy() {
        const { Guides } = await import('./guides');
        return { Component: Guides };
    },
};
