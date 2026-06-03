import { RouteObject } from 'react-router-dom';

export const faqLazyRoute: RouteObject = {
    path: 'faq',
    handle: { title: 'FAQ', description: 'Answers to the most common questions about using Tacticus Planner.' },
    async lazy() {
        const { Faq } = await import('./faq');
        return { Component: Faq };
    },
};
