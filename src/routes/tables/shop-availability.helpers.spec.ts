import { describe, expect, it } from 'vitest';

import type { ResolvedShopItem } from '@/fsd/4-entities/shops';

import { groupByAvailability } from './shop-availability.helpers';

const makeItem = (rewardType: string, isGuaranteed: boolean): ResolvedShopItem => ({
    rewardType,
    rewardQty: 1,
    costAmount: 100,
    maxPerDay: 1,
    isGuaranteed,
});

describe('groupByAvailability', () => {
    it('splits guaranteed and non-guaranteed items into separate groups', () => {
        const items = [makeItem('a', true), makeItem('b', false), makeItem('c', true), makeItem('d', false)];

        const { guaranteed, possible } = groupByAvailability(items, false);

        expect(guaranteed.map(index => index.rewardType)).toEqual(['a', 'c']);
        expect(possible.map(index => index.rewardType)).toEqual(['b', 'd']);
    });

    it('drops the possible group entirely when hideRandom is true', () => {
        const items = [makeItem('a', true), makeItem('b', false)];

        const { guaranteed, possible } = groupByAvailability(items, true);

        expect(guaranteed.map(index => index.rewardType)).toEqual(['a']);
        expect(possible).toEqual([]);
    });

    it('handles an all-guaranteed list', () => {
        const items = [makeItem('a', true), makeItem('b', true)];

        const { guaranteed, possible } = groupByAvailability(items, false);

        expect(guaranteed).toHaveLength(2);
        expect(possible).toHaveLength(0);
    });

    it('handles an all-random list', () => {
        const items = [makeItem('a', false), makeItem('b', false)];

        const { guaranteed, possible } = groupByAvailability(items, false);

        expect(guaranteed).toHaveLength(0);
        expect(possible).toHaveLength(2);
    });

    it('handles an empty list', () => {
        expect(groupByAvailability([], false)).toEqual({ guaranteed: [], possible: [] });
        expect(groupByAvailability([], true)).toEqual({ guaranteed: [], possible: [] });
    });
});
