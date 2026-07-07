import { RouteObject } from 'react-router-dom';

export const guildBossListLazyRoute: RouteObject = {
    path: 'learn/guildBosses',
    handle: {
        section: 'Library',
        title: 'Guild Bosses',
        description: 'All guild raid bosses and primes ordered by tier.',
    },
    async lazy() {
        const { GuildBossList } = await import('./guild-boss-list');
        return { Component: GuildBossList };
    },
};
