import { describe, expect, it } from 'vitest';

import { Alliance, Rarity } from '@/fsd/5-shared/model';

import { MYTHIC_UNCRAFTABLE_UPGRADES } from '@/fsd/4-entities/shops';

import { DAYS } from './shop-events.constants';
import type { Day } from './shop-events.constants';
import { computeCoverageRows, getNeededForRewardType } from './shop-events.utils';

function alliancesOf(
    record: Partial<Record<Alliance, Partial<Record<Rarity, number>>>>
): Record<Alliance, Record<Rarity, number>> {
    return {
        [Alliance.Imperial]: {},
        [Alliance.Xenos]: {},
        [Alliance.Chaos]: {},
        ...record,
    } as Record<Alliance, Record<Rarity, number>>;
}

const noForgeBadgesNeeded = {} as Record<Rarity, number>;

describe('getNeededForRewardType', () => {
    it('resolves alliance-specific orb types against that alliance only', () => {
        const neededOrbs = alliancesOf({
            [Alliance.Imperial]: { [Rarity.Legendary]: 5 },
            [Alliance.Xenos]: { [Rarity.Legendary]: 3 },
        });

        expect(
            getNeededForRewardType(
                'heroAscensionOrbLegendary_Imperial',
                alliancesOf({}),
                neededOrbs,
                noForgeBadgesNeeded
            )
        ).toBe(5);
    });

    it('sums draft orb types across every alliance', () => {
        const neededOrbs = alliancesOf({
            [Alliance.Imperial]: { [Rarity.Legendary]: 5 },
            [Alliance.Xenos]: { [Rarity.Legendary]: 3 },
            [Alliance.Chaos]: { [Rarity.Legendary]: 2 },
        });

        expect(
            getNeededForRewardType('draft_ascensionOrbsLegendary', alliancesOf({}), neededOrbs, noForgeBadgesNeeded)
        ).toBe(10);
    });

    it('sums draft badge types across every alliance', () => {
        const neededBadges = alliancesOf({
            [Alliance.Imperial]: { [Rarity.Rare]: 4 },
            [Alliance.Xenos]: { [Rarity.Rare]: 1 },
        });

        expect(
            getNeededForRewardType('draft_abilityTokensRare', neededBadges, alliancesOf({}), noForgeBadgesNeeded)
        ).toBe(5);
    });

    it('returns 0 for a draft type with no outstanding need in any alliance', () => {
        expect(
            getNeededForRewardType('draft_ascensionOrbsMythic', alliancesOf({}), alliancesOf({}), noForgeBadgesNeeded)
        ).toBe(0);
    });

    it('returns 0 for an unrecognized reward type', () => {
        expect(getNeededForRewardType('gold', alliancesOf({}), alliancesOf({}), noForgeBadgesNeeded)).toBe(0);
    });
});

function availabilityOf(...types: string[]): Map<string, Map<number, Set<Day>>> {
    const map = new Map<string, Map<number, Set<Day>>>();
    for (const type of types) {
        map.set(type, new Map([[1, new Set<Day>(['MON'])]]));
    }
    return map;
}

const baseCoverageParameters = {
    dayOrder: [...DAYS],
    allWeekDayAvailability: new Map<string, Map<number, Set<Day>>>(),
    neededBadges: alliancesOf({}),
    neededOrbs: alliancesOf({}),
    neededForgeBadges: noForgeBadgesNeeded,
    effectiveCartTotalsByType: {},
    neededXp: 0,
    pl: 0,
    hasBlueStarUnit: false,
    mythicMissingByUpgradeId: {},
    totalGold: 0,
    neededShardsByType: {},
    cheapestOptionByType: new Map(),
};

describe('computeCoverageRows', () => {
    it('omits gold when it is needed but not sold in this shop event', () => {
        const rows = computeCoverageRows({ ...baseCoverageParameters, totalGold: 1000 });

        expect(rows.find(r => r.rewardType === 'gold')).toBeUndefined();
    });

    it('includes gold when it is needed and sold in this shop event', () => {
        const rows = computeCoverageRows({
            ...baseCoverageParameters,
            totalGold: 1000,
            allWeekDayAvailability: availabilityOf('gold'),
        });

        expect(rows.find(r => r.rewardType === 'gold')?.needed).toBe(1000);
    });

    it('omits XP books when needed but not sold in this shop event', () => {
        const rows = computeCoverageRows({ ...baseCoverageParameters, neededXp: 10_000 });

        expect(rows.find(r => r.rewardType === 'xpRare')).toBeUndefined();
    });

    it('includes XP books when needed and sold in this shop event', () => {
        const rows = computeCoverageRows({
            ...baseCoverageParameters,
            neededXp: 10_000,
            allWeekDayAvailability: availabilityOf('xpRare'),
        });

        expect(rows.find(r => r.rewardType === 'xpRare')).toBeDefined();
    });

    it('omits mythic uncraftable materials when needed but not sold in this shop event', () => {
        const upgradeId = MYTHIC_UNCRAFTABLE_UPGRADES[0].id;
        const rows = computeCoverageRows({
            ...baseCoverageParameters,
            mythicMissingByUpgradeId: { [upgradeId]: 3 },
        });

        expect(rows.find(r => r.rewardType === upgradeId)).toBeUndefined();
    });

    it('includes mythic uncraftable materials when needed and sold in this shop event', () => {
        const upgradeId = MYTHIC_UNCRAFTABLE_UPGRADES[0].id;
        const rows = computeCoverageRows({
            ...baseCoverageParameters,
            mythicMissingByUpgradeId: { [upgradeId]: 3 },
            allWeekDayAvailability: availabilityOf(upgradeId),
        });

        expect(rows.find(r => r.rewardType === upgradeId)?.needed).toBe(3);
    });

    it('orders availability days according to the injected dayOrder, not calendar Monday-first order', () => {
        const wedFirstDayOrder: Day[] = ['WED', 'THU', 'FRI', 'SAT', 'SUN', 'MON', 'TUE'];
        const rows = computeCoverageRows({
            ...baseCoverageParameters,
            dayOrder: wedFirstDayOrder,
            totalGold: 1000,
            allWeekDayAvailability: new Map([['gold', new Map([[1, new Set<Day>(['MON', 'WED'])]])]]),
        });

        expect(rows.find(r => r.rewardType === 'gold')?.availability).toEqual([{ week: 1, days: ['WED', 'MON'] }]);
    });
});
