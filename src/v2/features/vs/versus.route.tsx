import { RouteObject } from 'react-router-dom';

export const versusLazyRoute: RouteObject = {
    path: 'learn/versus',
    async lazy() {
        const { Versus } = await import('./versus');
        return { Component: Versus };
    },
};
