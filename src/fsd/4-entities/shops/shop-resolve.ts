import { RarityStars } from '@/fsd/5-shared/model';

import type { ResolvedShopItem, ShopData, ShopDayOfWeek, ShopProduct } from './shop.models';

export const DOW_MAP: ShopDayOfWeek[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

/** "Max legendary" = first blue star or higher (this also covers all of Mythic rarity). */
const MAX_LEGENDARY_STARS_THRESHOLD = RarityStars.OneBlueStar;

const BP_SEASON_40_START_MS = Date.UTC(2026, 7, 2); // 2026-08-02T00:00:00Z
const BP_SEASON_DURATION_MS = 35 * 86_400_000; // exactly 5 weeks

export function bpSeasonStartMs(season: number): number {
    return BP_SEASON_40_START_MS + (season - 40) * BP_SEASON_DURATION_MS;
}

export function lockIsActive(lockId: string | undefined, nowMs = Date.now()): boolean {
    if (!lockId) return true;
    const until = /^lock_valid_until_bp_season_(\d+)_start$/.exec(lockId);
    if (until) return nowMs < bpSeasonStartMs(Number(until[1]));
    const after = /^lock_valid_after_bp_season_(\d+)_start$/.exec(lockId);
    if (after) return nowMs >= bpSeasonStartMs(Number(after[1]));
    return false;
}

/** Roster/power-level tier context used to resolve event-shop lockIds (mythic-tier gating, per-unit legendary thresholds). */
export interface ShopLockContext {
    tier?: 'low' | 'medium' | 'high';
    /** snowprintId -> current RarityStars value, merged across characters and MoWs. */
    starsByUnitId?: Record<string, number>;
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

    const starsByUnitId = context.starsByUnitId ?? {};

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

export function resolveShopForDay(shop: ShopData, day: ShopDayOfWeek, userPL: number): ResolvedShopItem[] {
    const result: ResolvedShopItem[] = [];

    for (const slot of shop.products) {
        const matching = slot.filter(
            v => cronMatchesDay(v.cronSchedule, day) && productMatchesPl(v, userPL) && lockIsActive(v.conditions.lockId)
        );
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

        for (const [type, variants] of byRewardType) {
            const first = variants[0];
            const { qty } = parseReward(first.reward);
            const freeOfferType = first.freeOffer ? parseReward(first.freeOffer).type : undefined;
            result.push({
                rewardType: type,
                rewardQty: qty,
                costAmount: first.cost.amount,
                maxPerDay: first.maxPurchases === undefined ? 1 : Number.parseInt(first.maxPurchases, 10),
                isGuaranteed,
                freeOfferType,
            });
        }
    }

    return result;
}
