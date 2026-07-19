import { RouteObject } from 'react-router-dom';

export const guildBossReferenceLazyRoute: RouteObject = {
    path: 'learn/guildBossReference',
    handle: {
        section: 'Library',
        title: 'Guild Raid Season',
        description: 'Guild raid season view — all bosses and primes organized by tier within a season.',
    },
    async lazy() {
        const { GuildBossReference } = await import('./guild-boss-reference');
        return { Component: GuildBossReference };
    },
};
