import { RouteObject } from 'react-router-dom';

export const guildWarLazyRoute: RouteObject = {
    path: 'plan/guildWar',
    async lazy() {
        const { GuildWar } = await import('./guild-war');
        return { Component: GuildWar };
    },
};
