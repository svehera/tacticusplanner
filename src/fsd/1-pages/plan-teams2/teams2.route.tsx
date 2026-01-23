import { RouteObject } from 'react-router-dom';

export const teams2Route: RouteObject = {
    path: 'plan/teams2',
    async lazy() {
        const { Teams2 } = await import('./teams2');
        return { Component: Teams2 };
    },
};
