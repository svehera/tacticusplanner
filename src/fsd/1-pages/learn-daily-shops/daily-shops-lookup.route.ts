import { RouteObject } from 'react-router-dom';

export const dailyShopsLookupLazyRoute: RouteObject = {
    path: 'learn/daily-shops',
    handle: {
        section: 'Library',
        title: 'Daily Shops',
        description:
            'Browse what the Guild Shop, War Shop, Crusade Shop, and Rogue Trader can offer on any day of the week.',
    },
    async lazy() {
        const { DailyShopsLookup } = await import('./daily-shops-lookup');
        return { Component: DailyShopsLookup };
    },
};
