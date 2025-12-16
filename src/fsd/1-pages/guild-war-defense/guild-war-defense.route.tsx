import { RouteObject } from 'react-router-dom';

export const guildWarDefenseLazyRoute: RouteObject = {
    path: 'plan/guildWar/defense',
    async lazy() {
        const { GuildWarDefense } = await import('./guild-war-defense');
        return { Component: GuildWarDefense };
    },
};
