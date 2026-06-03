import { RouteObject } from 'react-router-dom';

export const guildPerformanceLazyRoute: RouteObject = {
    path: 'learn/guildPerformance',
    async lazy() {
        const { GuildPerformance } = await import('./guild-performance');
        return { Component: GuildPerformance };
    },
};
