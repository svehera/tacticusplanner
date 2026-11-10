import { describe, expect, it } from 'vitest';

import type { IProductCalendar } from '@/fsd/4-entities/calendars';

import { isKnownCalendarRewardType, summarizeFreeRewards } from './product-calendar.models';

// Eagerly import every calendar JSON — new files are picked up automatically.
const calendarModules = import.meta.glob<{ default: IProductCalendar }>('../../4-entities/calendars/data/*.json', {
    eager: true,
});

function rewardType(reward: string): string {
    const colonIndex = reward.indexOf(':');
    return colonIndex === -1 ? reward : reward.slice(0, colonIndex);
}

function collectRewardTypes(calendars: IProductCalendar[]): Set<string> {
    const types = new Set<string>();
    for (const calendar of calendars) {
        for (const day of calendar.days) {
            for (const offer of day.offers) {
                for (const reward of offer.rewards) {
                    types.add(rewardType(reward));
                }
            }
        }
    }
    return types;
}

const allCalendars = Object.values(calendarModules).map(module_ => module_.default);
const allRewardTypes = collectRewardTypes(allCalendars);

describe('product calendar reward icons', () => {
    it('at least one calendar with rewards is loaded', () => {
        expect(allCalendars.length).toBeGreaterThan(0);
        expect(allRewardTypes.size).toBeGreaterThan(0);
    });

    it.each([...allRewardTypes])('reward type "%s" has a dedicated UI icon', type => {
        expect(isKnownCalendarRewardType(type)).toBe(true);
    });
});

const offer = (variant: string, title: string, free: boolean, rewards: string[]) => ({
    variant,
    title,
    banner: '',
    free,
    priceCents: free ? 0 : 999,
    rewards,
});

describe('summarizeFreeRewards', () => {
    it('sums free rewards across days and ignores paid offers', () => {
        const calendar: IProductCalendar = {
            calendar: 'calendar_seasonal_event_test_2026',
            days: [
                {
                    day: 1,
                    offers: [
                        offer('free', 'A', true, ['gems:50', 'stamina:30']),
                        offer('paid', 'B', false, ['gems:999']),
                    ],
                },
                { day: 2, offers: [offer('free', 'A', true, ['gems:25', 'raidTicket:5'])] },
            ],
        };
        const { totals, daysWithAlternatives } = summarizeFreeRewards(calendar);
        expect(totals).toEqual([
            { type: 'gems', qty: 75 },
            { type: 'stamina', qty: 30 },
            { type: 'raidTicket', qty: 5 },
        ]);
        expect(daysWithAlternatives).toBe(0);
    });

    it('counts only the first of several free variants of the same offer', () => {
        const calendar: IProductCalendar = {
            calendar: 'calendar_seasonal_event_test_2026',
            days: [
                {
                    day: 1,
                    offers: [
                        offer('free', 'Gifts', true, ['crusadeCurrency:50']),
                        offer('free_alt', 'Gifts', true, ['gems:50']),
                    ],
                },
            ],
        };
        const { totals, daysWithAlternatives } = summarizeFreeRewards(calendar);
        expect(totals).toEqual([{ type: 'crusadeCurrency', qty: 50 }]);
        expect(daysWithAlternatives).toBe(1);
    });

    it('reports nothing for the Blackstone-priced calendar, where every offer is flagged free', () => {
        const calendar: IProductCalendar = {
            calendar: 'calendar_blackstone_week',
            days: [{ day: 1, offers: [offer('x', 'A', true, ['gems:50'])] }],
        };
        expect(summarizeFreeRewards(calendar).totals).toEqual([]);
    });
});
