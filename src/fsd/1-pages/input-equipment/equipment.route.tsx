import { RouteObject } from 'react-router-dom';

export const equipmentLazyRoute: RouteObject = {
    path: 'input/equipment',
    handle: { section: 'My Game', title: 'Equipment' },
    async lazy() {
        const { Equipment } = await import('./equipment');
        return { Component: Equipment };
    },
};
