import { RouteObject } from 'react-router-dom';

export const teams2Route: RouteObject = {
    path: 'plan/teams2',
    handle: {
        section: 'Plan',
        title: 'Teams',
        description: 'Build, save, and compare team compositions for different game modes.',
    },
    async lazy() {
        const { Teams2 } = await import('./teams2');
        return { Component: Teams2 };
    },
};
