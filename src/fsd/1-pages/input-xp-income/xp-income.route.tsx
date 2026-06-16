import { RouteObject } from 'react-router-dom';

export const xpIncomeLazyRoute: RouteObject = {
    path: 'input/xp-income',
    handle: {
        section: 'My Game',
        title: 'XP Income',
        description: 'Log your daily codex income to project character XP gain and level-up timelines.',
    },
    async lazy() {
        const { XpIncome } = await import('./xp-income');
        return { Component: XpIncome };
    },
};
