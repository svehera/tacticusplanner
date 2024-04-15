import { RouteObject } from 'react-router-dom';

export const guildInsightsLazyRoute: RouteObject = {
    path: 'learn/guildInsights',
    async lazy() {
        const { GuildInsights } = await import('./guild-insights');
        return { Component: GuildInsights };
    },
};
