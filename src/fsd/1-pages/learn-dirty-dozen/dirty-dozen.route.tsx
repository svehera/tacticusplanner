import { RouteObject } from 'react-router-dom';

export const dirtyDozenLazyRoute: RouteObject = {
    path: 'learn/dirtyDozen',
    handle: {
        section: 'Library',
        title: 'Dirty Dozen',
        description: 'The 12 characters most worth early investment, with reasoning.',
    },
    async lazy() {
        const { DirtyDozen } = await import('./dirty-dozen');
        return { Component: DirtyDozen };
    },
};
