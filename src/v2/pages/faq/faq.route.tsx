import { RouteObject } from 'react-router-dom';

export const faqLazyRoute: RouteObject = {
    path: 'faq',
    async lazy() {
        const { Faq } = await import('./faq');
        return { Component: Faq };
    },
};
