import { RouteObject } from 'react-router-dom';

export const warOffense2Route: RouteObject = {
    path: 'plan/waroffense2',
    handle: {
        section: 'Plan',
        title: 'War Offense',
        description: 'Plan your attack teams and target assignments for the current guild war.',
    },
    async lazy() {
        const { WarOffense2 } = await import('./war-offense2');
        return { Component: WarOffense2 };
    },
};
