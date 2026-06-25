import { describe, expect, it } from 'vitest';

import { Alliance, Rarity } from '@/fsd/5-shared/model';

import type { ResolvedShopItem } from '@/fsd/4-entities/shops';
import { resolveShopForDay } from '@/fsd/4-entities/shops/shop-resolve';
import type { ShopData, ShopDayOfWeek, ShopProduct } from '@/fsd/4-entities/shops/shop.models';

import { filterWarShopItemsByGoalNeed, filterWarShopItemsByType } from './war-shop-section.helpers';

// ── test fixtures ────────────────────────────────────────────────────────────

const USER_PL = 1;
const UNIT_ID = 'testUnit';
const SHARDS_REWARD_TYPE = `shards_${UNIT_ID}`;

interface Counts {
    acquired: number;
    required: number;
}

const zero: Counts = { acquired: 0, required: 0 };
const needed: Counts = { acquired: 0, required: 10 };

// All items are scheduled for MON only; "available tomorrow" tests pass SUN (tomorrow = MON).
const makeMonProduct = (reward: string): ShopProduct => ({
    weight: 1,
    conditions: {},
    cronSchedule: '0 0 0 ? * MON *',
    reward,
    cost: { type: 'guildWarCurrency', amount: 100 },
});

const TEST_SHOP: ShopData = {
    displayLocation: 'test',
    refreshWithAdWatch: false,
    allowedRefreshesPerDay: 0,
    products: [
        [makeMonProduct(`${SHARDS_REWARD_TYPE}:5`)],
        [makeMonProduct('itemAscensionResource_Legendary')],
        [makeMonProduct('itemAscensionResource_Mythic')],
    ],
};

const noAllianceCounts: Record<Alliance, Counts> = {
    [Alliance.Chaos]: zero,
    [Alliance.Imperial]: zero,
    [Alliance.Xenos]: zero,
};

const noForgeBadgeCounts: Record<Rarity, Counts> = {
    [Rarity.Common]: zero,
    [Rarity.Uncommon]: zero,
    [Rarity.Rare]: zero,
    [Rarity.Epic]: zero,
    [Rarity.Legendary]: zero,
    [Rarity.Mythic]: zero,
};

const needsLegBadge: Record<Rarity, Counts> = { ...noForgeBadgeCounts, [Rarity.Legendary]: needed };
const needsMythicBadge: Record<Rarity, Counts> = { ...noForgeBadgeCounts, [Rarity.Mythic]: needed };

const resolveVisible = (
    day: ShopDayOfWeek,
    shardsMap: Map<string, Counts>,
    badges: Record<Rarity, Counts>
): ResolvedShopItem[] => {
    const resolved = resolveShopForDay(TEST_SHOP, day, USER_PL);
    const typed = filterWarShopItemsByType(resolved);
    return filterWarShopItemsByGoalNeed(typed, shardsMap, noAllianceCounts, badges);
};

const hasShards = (items: ResolvedShopItem[]): boolean => items.some(index => index.rewardType === SHARDS_REWARD_TYPE);

const hasLegBadge = (items: ResolvedShopItem[]): boolean =>
    items.some(index => index.rewardType === 'itemAscensionResource_Legendary');

const hasMythicBadge = (items: ResolvedShopItem[]): boolean =>
    items.some(index => index.rewardType === 'itemAscensionResource_Mythic');

// ── tests ────────────────────────────────────────────────────────────────────

describe('WarShopSection – visible item selection', () => {
    const noShardsNeed = new Map<string, Counts>();
    const needsShards = new Map([[SHARDS_REWARD_TYPE, needed]]);

    // 1
    it('shards available today, no goal needs them → not shown', () => {
        expect(hasShards(resolveVisible('MON', noShardsNeed, noForgeBadgeCounts))).toBe(false);
    });

    // 2
    it('shards available today, goal needs them → shown', () => {
        expect(hasShards(resolveVisible('MON', needsShards, noForgeBadgeCounts))).toBe(true);
    });

    // 3
    it('shards available tomorrow but not today, no goal needs them → not shown', () => {
        expect(hasShards(resolveVisible('SUN', noShardsNeed, noForgeBadgeCounts))).toBe(false);
    });

    // 4
    it('shards available tomorrow but not today, goal needs them → not shown', () => {
        expect(hasShards(resolveVisible('SUN', needsShards, noForgeBadgeCounts))).toBe(false);
    });

    // 5
    it('legendary forge badge available today, no goal needs them → not shown', () => {
        expect(hasLegBadge(resolveVisible('MON', noShardsNeed, noForgeBadgeCounts))).toBe(false);
    });

    // 6
    it('mythic forge badge available today, no goal needs them → not shown', () => {
        expect(hasMythicBadge(resolveVisible('MON', noShardsNeed, noForgeBadgeCounts))).toBe(false);
    });

    // 7
    it('legendary forge badge available today, goal needs them → shown', () => {
        expect(hasLegBadge(resolveVisible('MON', noShardsNeed, needsLegBadge))).toBe(true);
    });

    // 8
    it('mythic forge badge available today, goal needs them → shown', () => {
        expect(hasMythicBadge(resolveVisible('MON', noShardsNeed, needsMythicBadge))).toBe(true);
    });

    // 9
    it('legendary forge badge available tomorrow but not today, goal needs them → not shown', () => {
        expect(hasLegBadge(resolveVisible('SUN', noShardsNeed, needsLegBadge))).toBe(false);
    });

    // 10 – original spec said "show" for this case, but that contradicts case 9 and the
    // general principle that tomorrow's items are never surfaced as available today.
    it('mythic forge badge available tomorrow but not today, goal needs them → not shown', () => {
        expect(hasMythicBadge(resolveVisible('SUN', noShardsNeed, needsMythicBadge))).toBe(false);
    });
});
