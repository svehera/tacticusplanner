import { RouteObject } from 'react-router-dom';

export const warDefense2Route: RouteObject = {
    path: 'plan/wardefense2',
    handle: {
        section: 'Plan',
        title: 'Guild War',
        subtitle: 'Defense',
        description: 'Assign characters to your guild war defense zones.',
    },
    async lazy() {
        const { WarDefense2 } = await import('./war-defense2');
        return { Component: WarDefense2 };
    },
};
