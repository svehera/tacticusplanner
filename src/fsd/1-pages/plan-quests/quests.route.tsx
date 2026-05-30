import { RouteObject } from 'react-router-dom';

export const questsRoute: RouteObject = {
    path: 'plan/quests',
    handle: {
        section: 'Plan',
        title: 'Quests',
        description: 'Browse hero quest tiers, battles, and loot requirements.',
    },
    async lazy() {
        const { Quests } = await import('./quests');
        return { Component: Quests };
    },
};
