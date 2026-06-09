import { RouteObject } from 'react-router-dom';

export const guildInsightsLazyRoute: RouteObject = {
    path: 'learn/guildInsights',
    handle: {
        section: 'Library',
        title: 'Guild Insights',
        description: 'Performance breakdowns and contribution stats across your guild.',
    },
    async lazy() {
        const { GuildInsights } = await import('./guild-insights');
        return { Component: GuildInsights };
    },
};
