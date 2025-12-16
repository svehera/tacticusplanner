import { RouteObject } from 'react-router-dom';

export const insightsLazyRoute: RouteObject = {
    path: 'learn/insights',
    async lazy() {
        const { Insights } = await import('./insights');
        return { Component: Insights };
    },
};
