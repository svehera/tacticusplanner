import { RouteObject } from 'react-router-dom';

export const xpIncomeLazyRoute: RouteObject = {
    path: 'input/xp-income',
    async lazy() {
        const { XpIncome } = await import('./xp-income');
        return { Component: XpIncome };
    },
};
