import { RouteObject } from 'react-router-dom';

export const armageddonLazyRoute: RouteObject = {
    path: 'plan/armageddon',
    handle: {
        section: 'Plan',
        title: 'Armageddon',
        description: 'Track Armageddon shop stock and plan which items to prioritize buying.',
    },
    async lazy() {
        const { Armageddon } = await import('./armageddon');
        return { Component: Armageddon };
    },
};
