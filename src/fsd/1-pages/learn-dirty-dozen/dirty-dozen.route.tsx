import { RouteObject } from 'react-router-dom';

export const dirtyDozenLazyRoute: RouteObject = {
    path: 'learn/dirtyDozen',
    async lazy() {
        const { DirtyDozen } = await import('./dirty-dozen');
        return { Component: DirtyDozen };
    },
};
