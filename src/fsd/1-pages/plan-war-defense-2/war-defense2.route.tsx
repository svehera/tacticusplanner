import { RouteObject } from 'react-router-dom';

export const warDefense2Route: RouteObject = {
    path: 'plan/wardefense2',
    async lazy() {
        const { WarDefense2 } = await import('./war-defense2');
        return { Component: WarDefense2 };
    },
};
