import { RouteObject } from 'react-router-dom';

export const productCalendarLazyRoute: RouteObject = {
    path: 'learn/productCalendar',
    handle: {
        section: 'Library',
        title: 'Product Calendar',
        description: 'Browse daily shop offers grouped by type, see prices and contents at a glance.',
    },
    async lazy() {
        const { ProductCalendar } = await import('./product-calendar');
        return { Component: ProductCalendar };
    },
};
