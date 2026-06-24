import type { ResolvedShopItem, ShopData, ShopDayOfWeek, ShopProduct } from './shop.models';

export const DOW_MAP: ShopDayOfWeek[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const BP_SEASON_40_START_MS = Date.UTC(2026, 5, 29); // 2026-06-29T00:00:00Z
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
