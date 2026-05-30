import { RouteObject } from 'react-router-dom';

export const xpIncomeLazyRoute: RouteObject = {
    path: 'input/xp-income',
    handle: {
        section: 'My Game',
        title: 'XP Income',
        description: 'Pick your codex rarity, then tell us how many you earn per day.',
    },
    async lazy() {
        const { XpIncome } = await import('./xp-income');
        return { Component: XpIncome };
    },
};
