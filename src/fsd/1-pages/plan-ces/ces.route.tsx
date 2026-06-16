import { RouteObject } from 'react-router-dom';

export const cesRoute: RouteObject = {
    path: 'plan/ces',
    handle: {
        section: 'Plan',
        title: 'Campaign Events',
        description: 'Plan your character selections and track rewards across Campaign Events.',
    },
    async lazy() {
        const { CEs } = await import('./ces');
        return { Component: CEs };
    },
};
