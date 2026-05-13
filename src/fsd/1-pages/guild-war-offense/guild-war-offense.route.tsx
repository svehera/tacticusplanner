import { RouteObject } from 'react-router-dom';

export const guildWarOffenseLazyRoute: RouteObject = {
    path: 'plan/guildWar/offense',
    async lazy() {
        const { GuildWarOffense } = await import('./guild-war-offense');
        return { Component: GuildWarOffense };
    },
};
