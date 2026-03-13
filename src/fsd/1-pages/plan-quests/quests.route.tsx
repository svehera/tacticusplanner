import { RouteObject } from 'react-router-dom';

export const questsRoute: RouteObject = {
    path: 'plan/quests',
    async lazy() {
        const { Quests } = await import('./quests');
        return { Component: Quests };
    },
};
