import { RouteObject } from 'react-router-dom';

export const warOffense2Route: RouteObject = {
    path: 'plan/waroffense2',
    async lazy() {
        const { WarOffense2 } = await import('./war-offense2');
        return { Component: WarOffense2 };
    },
};
