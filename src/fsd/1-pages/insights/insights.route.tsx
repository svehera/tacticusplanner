import { RouteObject } from 'react-router-dom';

export const insightsLazyRoute: RouteObject = {
    path: 'learn/insights',
    handle: {
        section: 'Library',
        title: 'Insights',
        description: 'Analytics about your roster growth and goal completion over time.',
    },
    async lazy() {
        const { Insights } = await import('./insights');
        return { Component: Insights };
    },
};
