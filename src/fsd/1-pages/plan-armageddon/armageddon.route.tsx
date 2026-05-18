import { RouteObject } from 'react-router-dom';

export const armageddonLazyRoute: RouteObject = {
    path: 'plan/armageddon',
    async lazy() {
        const { Armageddon } = await import('./armageddon');
        return { Component: Armageddon };
    },
};
