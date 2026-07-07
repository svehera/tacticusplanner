import { RouteObject } from 'react-router-dom';

export const guildBossDetailLazyRoute: RouteObject = {
    path: 'learn/guildBossDetail',
    handle: {
        section: 'Library',
        title: 'Guild Boss Detail',
        description: 'Stats, attacks, abilities, and field enemies for a specific guild raid boss or prime.',
    },
    async lazy() {
        const { GuildBossDetail } = await import('./guild-boss-detail');
        return { Component: GuildBossDetail };
    },
};
