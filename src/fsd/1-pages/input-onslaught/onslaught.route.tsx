import { RouteObject } from 'react-router-dom';

export const onslaughtLazyRoute: RouteObject = {
    path: 'input/onslaught',
    async lazy() {
        const { Onslaught } = await import('./onslaught');
        return { Component: Onslaught };
    },
};
