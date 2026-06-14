import { RouteObject } from 'react-router-dom';

export const guildPerformanceLazyRoute: RouteObject = {
    path: 'learn/guildPerformance',
    handle: {
        section: 'Library',
        title: 'Guild Performance',
        description: 'Analyse guild raid performance — damage, leaderboards, loops, and token usage per season.',
    },
    async lazy() {
        const { GuildPerformance } = await import('./guild-performance');
        return { Component: GuildPerformance };
    },
};
