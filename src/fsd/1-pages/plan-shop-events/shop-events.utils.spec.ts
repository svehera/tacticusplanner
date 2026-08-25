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

function componentsOf(record: Partial<Record<Alliance, number>>): Record<Alliance, number> {
    return {
        [Alliance.Imperial]: 0,
        [Alliance.Xenos]: 0,
        [Alliance.Chaos]: 0,
        ...record,
    } as Record<Alliance, number>;
}

const noForgeBadgesNeeded = {} as Record<Rarity, number>;
const noComponentsNeeded = componentsOf({});

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
                noForgeBadgesNeeded,
                noComponentsNeeded
            )
        ).toBe(5);
    });

    it('resolves alliance-specific MoW component types against that alliance only', () => {
        const neededComponents = componentsOf({ [Alliance.Xenos]: 7 });

        expect(
            getNeededForRewardType(
                'mowComponent_Xenos',
                alliancesOf({}),
                alliancesOf({}),
                noForgeBadgesNeeded,
                neededComponents
            )
        ).toBe(7);
        expect(
            getNeededForRewardType(
                'mowComponent_Imperial',
                alliancesOf({}),
                alliancesOf({}),
                noForgeBadgesNeeded,
                neededComponents
            )
        ).toBe(0);
    });

    it('returns 0 for a raw draft type — draft resolution happens in computeCoverageRows, not here', () => {
        const neededOrbs = alliancesOf({ [Alliance.Imperial]: { [Rarity.Legendary]: 5 } });
        expect(
            getNeededForRewardType(
                'draft_ascensionOrbsLegendary',
                alliancesOf({}),
                neededOrbs,
                noForgeBadgesNeeded,
                noComponentsNeeded
            )
        ).toBe(0);
    });

    it('returns 0 for an unrecognized reward type', () => {
        expect(
            getNeededForRewardType('gold', alliancesOf({}), alliancesOf({}), noForgeBadgesNeeded, noComponentsNeeded)
        ).toBe(0);
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
    neededComponents: noComponentsNeeded,
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

    it('splits a draft orb type into 3 alliance-specific rows, each tracking its own deficit', () => {
        const neededOrbs = alliancesOf({
            [Alliance.Imperial]: { [Rarity.Legendary]: 5 },
            [Alliance.Xenos]: { [Rarity.Legendary]: 3 },
            // Chaos has no deficit — should not produce a row at all.
        });
        const rows = computeCoverageRows({
            ...baseCoverageParameters,
            neededOrbs,
            allWeekDayAvailability: availabilityOf('draft_ascensionOrbsLegendary'),
        });

        const draftRows = rows.filter(r => r.rewardType.startsWith('heroAscensionOrbLegendary_'));
        expect(draftRows).toHaveLength(2);
        expect(draftRows.find(r => r.rewardType === 'heroAscensionOrbLegendary_Imperial')?.needed).toBe(5);
        expect(draftRows.find(r => r.rewardType === 'heroAscensionOrbLegendary_Xenos')?.needed).toBe(3);
        expect(draftRows.find(r => r.rewardType === 'heroAscensionOrbLegendary_Chaos')).toBeUndefined();
    });

    it("a purchase tagged for one alliance only reduces that alliance's remaining, not another's", () => {
        const neededOrbs = alliancesOf({
            [Alliance.Imperial]: { [Rarity.Legendary]: 5 },
            [Alliance.Xenos]: { [Rarity.Legendary]: 5 },
        });
        const rows = computeCoverageRows({
            ...baseCoverageParameters,
            neededOrbs,
            allWeekDayAvailability: availabilityOf('draft_ascensionOrbsLegendary'),
            // 5 units bought and tagged as Imperial — should fully cover Imperial's deficit but leave
            // Xenos's deficit untouched, unlike the old aggregate-sum behavior this replaces.
            effectiveCartTotalsByType: { heroAscensionOrbLegendary_Imperial: 5 },
        });

        const imperial = rows.find(r => r.rewardType === 'heroAscensionOrbLegendary_Imperial');
        const xenos = rows.find(r => r.rewardType === 'heroAscensionOrbLegendary_Xenos');
        expect(imperial?.remaining).toBe(0);
        expect(xenos?.remaining).toBe(5);
    });

    it('splits a draft MoW-token type into 3 alliance-specific mowComponent rows', () => {
        const neededComponents = componentsOf({ [Alliance.Chaos]: 12 });
        const rows = computeCoverageRows({
            ...baseCoverageParameters,
            neededComponents,
            allWeekDayAvailability: availabilityOf('draft_machinesOfWarTokens'),
        });

        expect(rows.find(r => r.rewardType === 'mowComponent_Chaos')?.needed).toBe(12);
        expect(rows.find(r => r.rewardType === 'mowComponent_Imperial')).toBeUndefined();
        expect(rows.find(r => r.rewardType === 'mowComponent_Xenos')).toBeUndefined();
    });
});
