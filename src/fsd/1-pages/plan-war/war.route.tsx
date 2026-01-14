import { RouteObject } from 'react-router-dom';

export const warRoute: RouteObject = {
    path: 'plan/war',
    async lazy() {
        const { War } = await import('./war');
        return { Component: War };
    },
};
