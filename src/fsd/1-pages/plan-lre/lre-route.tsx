import { RouteObject } from 'react-router-dom';

export const lreLazyRoute: RouteObject = {
    path: 'plan/lre',
    async lazy() {
        const { Lre } = await import('./lre');
        return { Component: Lre };
    },
};
