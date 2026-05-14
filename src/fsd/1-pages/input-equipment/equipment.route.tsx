import { RouteObject } from 'react-router-dom';

export const equipmentLazyRoute: RouteObject = {
    path: 'input/equipment',
    async lazy() {
        const { Equipment } = await import('./equipment');
        return { Component: Equipment };
    },
};
