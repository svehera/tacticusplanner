import { describe, expect, it } from 'vitest';

import type { IProductCalendar } from '@/fsd/4-entities/calendars';

import { isKnownCalendarRewardType } from './product-calendar.models';

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
