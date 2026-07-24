import { rogueTraderData } from './data';
import {
    parseReward,
    resolveShopForDay,
    resolveShopSlotsPermissive,
    shardRewardEligible,
    todayDow,
} from './shop-resolve';
import type { ShopLockContext } from './shop-resolve';
import type { ResolvedShopItem, ResolvedShopSlot, ShopData, ShopDayOfWeek, ShopProduct } from './shop.models';

const ROGUE_TRADER = rogueTraderData as unknown as ShopData;

// Only the forge badge and mythic upgrade material variants are relevant.
// The event-only mythicShards variant in this slot is excluded to prevent
// it from making the slot appear non-guaranteed on its scheduled days.
const RELEVANT_REWARDS = new Set(['itemAscensionResource_Mythic', 'upgHpM001', 'upgHpM002', 'upgHpM003', 'upgHpM004']);

const penultimateSlot =
    ROGUE_TRADER.products !== undefined && ROGUE_TRADER.products.length > 2
        ? ROGUE_TRADER.products
              .at(-2)!
              .filter(p => RELEVANT_REWARDS.has(parseReward(p.reward).type))
              .map(p => ({ ...p, conditions: {} }))
        : undefined;

const ROGUE_TRADER_PENULTIMATE: ShopData = {
    displayLocation: 'rogueTraderPenultimate',
    refreshWithAdWatch: false,
    allowedRefreshesPerDay: 0,
    products: penultimateSlot ? [penultimateSlot] : [],
};

/**
 * Abraxas — a special-event-gated mythic shard offer (`lock_during_se_april2026_and_max_legendary_*`)
 * that isn't reliably resolvable outside its event window, so it's excluded from the full-shop view
 * the same way it's already excluded from `RELEVANT_REWARDS` above.
 */
const EXCLUDED_MYTHIC_SHARD_IDS = new Set(['thousInfernalMaster']);

/**
 * True unless `product` is a shard offer that shouldn't be shown: Abraxas (see
 * `EXCLUDED_MYTHIC_SHARD_IDS`), or fails the general shard-eligibility rule (`shardRewardEligible`)
 * — plain shards once already blue-star, mythic shards before reaching blue star.
 */
function rogueTraderShardEligible(product: ShopProduct, context: ShopLockContext): boolean {
    const { type } = parseReward(product.reward);
    if (type.startsWith('mythicShards_') && EXCLUDED_MYTHIC_SHARD_IDS.has(type.slice('mythicShards_'.length))) {
        return false;
    }
    return shardRewardEligible(type, context);
}

export const RogueTraderService = {
    getTodayDow(): ShopDayOfWeek {
        return todayDow();
    },

    resolvePenultimateForDay(day: ShopDayOfWeek): ResolvedShopItem[] {
        return resolveShopForDay(ROGUE_TRADER_PENULTIMATE, day, 0);
    },

    /** Full Rogue Trader shop (all slots), for reference/browsing UIs rather than goal-tracking. */
    resolveFullShopForDay(day: ShopDayOfWeek, pl: number, context: ShopLockContext): ResolvedShopSlot[] {
        return resolveShopSlotsPermissive(ROGUE_TRADER, day, pl, context, product =>
            rogueTraderShardEligible(product, context)
        );
    },
};
