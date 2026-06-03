import { RouteObject } from 'react-router-dom';

export const cesRoute: RouteObject = {
    path: 'plan/ces',
    handle: {
        section: 'Plan',
        title: 'CES',
        description: 'Track your progress and rewards across Champion Extermination Squad events.',
    },
    async lazy() {
        const { CEs } = await import('./ces');
        return { Component: CEs };
    },
};
