import { RouteObject } from 'react-router-dom';

export const equipmentLazyRoute: RouteObject = {
    path: 'input/equipment',
    handle: {
        section: 'My Game',
        title: 'Equipment',
        description: 'Track which equipment pieces your characters have equipped and their current forge levels.',
    },
    async lazy() {
        const { Equipment } = await import('./equipment');
        return { Component: Equipment };
    },
};
