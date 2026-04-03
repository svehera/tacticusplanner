import { RouteObject } from 'react-router-dom';

export const cesRoute: RouteObject = {
    path: 'plan/ces',
    async lazy() {
        const { CEs } = await import('./ces');
        return { Component: CEs };
    },
};
