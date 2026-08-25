import { RarityStars } from '@/fsd/5-shared/model';

import type { ResolvedShopItem, ResolvedShopSlot, ShopData, ShopDayOfWeek, ShopProduct } from './shop.models';

export const DOW_MAP: ShopDayOfWeek[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

/** "Max legendary" = first blue star or higher (this also covers all of Mythic rarity). */
const MAX_LEGENDARY_STARS_THRESHOLD = RarityStars.OneBlueStar;

const BP_SEASON_40_START_MS = Date.UTC(2026, 7, 2); // 2026-08-02T00:00:00Z
const BP_SEASON_DURATION_MS = 35 * 86_400_000; // exactly 5 weeks

/** Rogue Trader's featured-legendary rotation boundary: Trajann is featured until this date, then Lucius. */
const ELDER_SHOP_FEATURED_ROTATION_MS = Date.UTC(2026, 8, 6); // 2026-09-06T00:00:00Z

export function bpSeasonStartMs(season: number): number {
    return BP_SEASON_40_START_MS + (season - 40) * BP_SEASON_DURATION_MS;
}

export function lockIsActive(lockId: string | undefined, nowMs = Date.now(), hasBlueStarUnit = false): boolean {
    if (!lockId) return true;
    const until = /^lock_valid_until_bp_season_(\d+)_start$/.exec(lockId);
    if (until) return nowMs < bpSeasonStartMs(Number(until[1]));
    const after = /^lock_valid_after_bp_season_(\d+)_start$/.exec(lockId);
    if (after) return nowMs >= bpSeasonStartMs(Number(after[1]));
    if (lockId === 'lock_crusade_shop_owns_unit_at_mythic') return hasBlueStarUnit;
    if (lockId === 'lock_crusade_shop_does_not_own_unit_at_mythic') return !hasBlueStarUnit;
    return false;
}

/** Roster/power-level tier context used to resolve event-shop lockIds (mythic-tier gating, per-unit legendary thresholds). */
export interface ShopLockContext {
    tier?: 'low' | 'medium' | 'high';
    /** snowprintId -> current RarityStars value, merged across characters and MoWs. */
    starsByUnitId?: Record<string, number>;
}

/**
 * True unless `rewardType` is a character-shard reward that shouldn't be offered given the
 * roster's current progress on that character: plain `shards_X` once already blue-star-or-above
 * (Legendary blue star, or Mythic — no further use for legendary shards), or `mythicShards_X`
 * before reaching blue star (you can't buy mythic shards for a character you haven't legendary
 * blue-starred yet). Non-shard reward types always pass.
 */
export function shardRewardEligible(rewardType: string, context: ShopLockContext): boolean {
    const starsByUnitId = context.starsByUnitId ?? {};

    if (rewardType.startsWith('mythicShards_')) {
        const stars = starsByUnitId[rewardType.slice('mythicShards_'.length)];
        return stars !== undefined && stars >= MAX_LEGENDARY_STARS_THRESHOLD;
    }
    if (rewardType.startsWith('shards_')) {
        const stars = starsByUnitId[rewardType.slice('shards_'.length)];
        return stars === undefined || stars < MAX_LEGENDARY_STARS_THRESHOLD;
    }
    return true;
}

/**
 * Resolves event-shop lockIds (roster/tier vocabulary: `lock_mythic_shop_tier_*`,
 * `lock_below_max_legendary_*`, `lock_max_legendary_*`, `lock_not_unlocked_*`), falling back to the
 * bp-season vocabulary understood by `lockIsActive`. Unlike `lockIsActive`, unrecognized lockIds
 * default to `true` (show the product) — this matches the Armageddon page's historical behavior.
 */
export function resolveEventLockId(lockId: string | undefined, context: ShopLockContext, nowMs = Date.now()): boolean {
    if (!lockId) return true;

    const until = /^lock_valid_until_bp_season_(\d+)_start$/.exec(lockId);
    if (until) return nowMs < bpSeasonStartMs(Number(until[1]));
    const after = /^lock_valid_after_bp_season_(\d+)_start$/.exec(lockId);
    if (after) return nowMs >= bpSeasonStartMs(Number(after[1]));

    if (lockId === 'lock_mythic_shop_tier_high') return context.tier === 'high';
    if (lockId === 'lock_mythic_shop_tier_medium') return context.tier === 'medium';
    if (lockId === 'lock_mythic_shop_tier_low') return context.tier === 'low';

    if (
        lockId === 'lock_elder_shop_leg_featured_currently' ||
        lockId === 'lock_elder_shop_leg_featured_currently_mythic'
    ) {
        return nowMs < ELDER_SHOP_FEATURED_ROTATION_MS;
    }
    if (lockId === 'lock_elder_shop_leg_featured_next' || lockId === 'lock_elder_shop_leg_featured_next_mythic') {
        return nowMs >= ELDER_SHOP_FEATURED_ROTATION_MS;
    }

    const starsByUnitId = context.starsByUnitId ?? {};

    // Roster-wide (not per-character): does the roster own ANY unit at blue-star-or-above?
    if (
        lockId === 'lock_crusade_shop_owns_unit_at_mythic' ||
        lockId === 'lock_crusade_shop_does_not_own_unit_at_mythic'
    ) {
        const ownsBlueStarUnit = Object.values(starsByUnitId).some(stars => stars >= MAX_LEGENDARY_STARS_THRESHOLD);
        return lockId === 'lock_crusade_shop_owns_unit_at_mythic' ? ownsBlueStarUnit : !ownsBlueStarUnit;
    }

    const belowMax = /^lock_below_max_legendary_(.+)$/.exec(lockId);
    if (belowMax) {
        const stars = starsByUnitId[belowMax[1]];
        return stars !== undefined && stars < MAX_LEGENDARY_STARS_THRESHOLD;
    }

    const atMax = /^lock_max_legendary_(.+)$/.exec(lockId);
    if (atMax) {
        const stars = starsByUnitId[atMax[1]];
        return stars !== undefined && stars >= MAX_LEGENDARY_STARS_THRESHOLD;
    }

    const notUnlocked = /^lock_not_unlocked_(.+)$/.exec(lockId);
    if (notUnlocked) {
        return starsByUnitId[notUnlocked[1]] === undefined;
    }

    return true;
}

export function eventProductMatches(
    product: ShopProduct,
    pl: number,
    context: ShopLockContext,
    nowMs = Date.now()
): boolean {
    if (!productMatchesPl(product, pl)) return false;
    if (product.conditions.lockId && !resolveEventLockId(product.conditions.lockId, context, nowMs)) return false;
    return true;
}

export function todayDow(): ShopDayOfWeek {
    return DOW_MAP[new Date().getUTCDay()];
}

export function cronMatchesDay(cronSchedule: string, day: ShopDayOfWeek): boolean {
    const parts = cronSchedule.split(' ');
    const dowField = parts[5] ?? '*';
    if (dowField === '*') return true;
    return dowField.split(',').includes(day);
}

export function productMatchesPl(product: ShopProduct, pl: number): boolean {
    const { minPowerLevel, maxPowerLevel } = product.conditions;
    if (minPowerLevel !== undefined && pl < minPowerLevel) return false;
    if (maxPowerLevel !== undefined && pl > maxPowerLevel) return false;
    return true;
}

export function parseReward(reward: string): { type: string; qty: number } {
    const colonIndex = reward.indexOf(':');
    if (colonIndex === -1) return { type: reward, qty: 1 };
    return { type: reward.slice(0, colonIndex), qty: Number.parseInt(reward.slice(colonIndex + 1), 10) };
}

/**
 * Groups each shop slot's day/PL-matching variants by reward type into `ResolvedShopItem`s, one
 * slot per `ResolvedShopSlot`. `productMatches` decides which per-product conditions (PL, lockId)
 * apply — conservative for `resolveShopForDay` (goal-tracking consumers), permissive for
 * `resolveShopSlotsPermissive` (reference/browsing consumers).
 */
function groupSlotsByRewardType(
    shop: ShopData,
    day: ShopDayOfWeek,
    productMatches: (product: ShopProduct) => boolean
): ResolvedShopSlot[] {
    const slots: ResolvedShopSlot[] = [];

    for (const slot of shop.products) {
        const matching = slot.filter(v => cronMatchesDay(v.cronSchedule, day) && productMatches(v));
        if (matching.length === 0) continue;

        const byRewardType = new Map<string, ShopProduct[]>();
        for (const product of matching) {
            const { type } = parseReward(product.reward);
            const bucket = byRewardType.get(type);
            if (bucket) {
                bucket.push(product);
            } else {
                byRewardType.set(type, [product]);
            }
        }

        // If all matching variants resolve to the same reward type, the slot is deterministic.
        const isGuaranteed = byRewardType.size === 1;

        const items: ResolvedShopItem[] = [];
        for (const [type, variants] of byRewardType) {
            const first = variants[0];
            const { qty } = parseReward(first.reward);
            const freeOfferType = first.freeOffer ? parseReward(first.freeOffer).type : undefined;
            items.push({
                rewardType: type,
                rewardQty: qty,
                costAmount: first.cost.amount,
                maxPerDay: first.maxPurchases === undefined ? 1 : Number.parseInt(first.maxPurchases, 10),
                isGuaranteed,
                freeOfferType,
            });
        }
        slots.push({ items });
    }

    return slots;
}

export function resolveShopForDay(
    shop: ShopData,
    day: ShopDayOfWeek,
    userPL: number,
    hasBlueStarUnit = false
): ResolvedShopItem[] {
    return groupSlotsByRewardType(
        shop,
        day,
        v => productMatchesPl(v, userPL) && lockIsActive(v.conditions.lockId, Date.now(), hasBlueStarUnit)
    ).flatMap(slot => slot.items);
}

/**
 * Per-slot variant of `resolveShopForDay` for reference/browsing UIs (not goal-tracking): keeps
 * each shop slot's mutually-exclusive reward options grouped together (rather than flattened), and
 * uses `eventProductMatches`'s permissive lock resolution — unrecognized lockIds default to
 * "possibly active" rather than hidden, since roster-dependent gating (e.g. "hero not maxed out")
 * can't be precisely modeled and it's better to over-show than hide real shop content.
 *
 * `extraFilter`, when given, is ANDed with the permissive PL/lock check — for shop-specific rules
 * that aren't expressible as a lockId (e.g. Rogue Trader's per-character mythic-shard eligibility).
 */
export function resolveShopSlotsPermissive(
    shop: ShopData,
    day: ShopDayOfWeek,
    pl: number,
    context: ShopLockContext,
    extraFilter?: (product: ShopProduct) => boolean
): ResolvedShopSlot[] {
    return groupSlotsByRewardType(shop, day, v => eventProductMatches(v, pl, context) && (extraFilter?.(v) ?? true));
}
