import { RouteObject } from 'react-router-dom';

export const survivalLazyRoute: RouteObject = {
    path: 'plan/survival',
    handle: {
        section: 'Plan',
        title: 'Survival',
        description:
            'Build a team, scout enemy waves, and track milestone/chest rewards for the current Survival event.',
    },
    async lazy() {
        const { Survival } = await import('./survival');
        return { Component: Survival };
    },
};
