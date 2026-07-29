import { describe, expect, it } from 'vitest';

import type { ShopEventData } from '@/fsd/4-entities/shops';

import { buildEventDateIndex, getEventDate, getEventDayOrder } from './shop-events.dates';

function eventStartingOn(startUtc: number, weekCount = 1): ShopEventData {
    return {
        id: 'test',
        displayName: 'Test',
        currencyType: 'testCurrency',
        startUtc,
        weeks: Array.from({ length: weekCount }, () => ({ products: [] })),
    };
}

describe('getEventDayOrder', () => {
    it('returns the identity order for a Monday-start event', () => {
        const event = eventStartingOn(Date.UTC(2026, 5, 22)); // Mon, Jun 22 2026
        expect(getEventDayOrder(event)).toEqual(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']);
    });

    it('rotates the order to start at the actual weekday for a non-Monday-start event', () => {
        const event = eventStartingOn(Date.UTC(2026, 7, 5)); // Wed, Aug 5 2026
        expect(getEventDayOrder(event)).toEqual(['WED', 'THU', 'FRI', 'SAT', 'SUN', 'MON', 'TUE']);
    });
});

describe('getEventDate / buildEventDateIndex with a non-Monday-start event', () => {
    const event = eventStartingOn(Date.UTC(2026, 7, 5), 2); // Wed, Aug 5 2026

    it('resolves the actual start date under the actual start weekday label', () => {
        expect(getEventDate(event, 1, 'WED')).toBe('August 05');
        expect(getEventDate(event, 1, 'TUE')).toBe('August 11'); // last day of week 1
        expect(getEventDate(event, 2, 'WED')).toBe('August 12'); // first day of week 2
    });

    it('builds allDates using the event-relative weekday order, not calendar Monday-first order', () => {
        const { allDates } = buildEventDateIndex(event);
        expect(allDates[0]).toEqual({ week: 1, day: 'WED' });
        expect(allDates.slice(0, 7).map(entry => entry.day)).toEqual(['WED', 'THU', 'FRI', 'SAT', 'SUN', 'MON', 'TUE']);
    });
});
