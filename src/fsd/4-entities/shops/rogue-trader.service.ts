/* eslint-disable import-x/no-internal-modules */
import rogueTraderJson from './data/new-rogue-trader.json';
import { parseReward, resolveShopForDay, todayDow } from './shop-resolve';
import type { ResolvedShopItem, ShopData, ShopDayOfWeek } from './shop.models';

// @ts-expect-error FIXME: Caused by transition to const JSON imports
const ROGUE_TRADER = rogueTraderJson as ShopData;

// Only the forge badge and mythic upgrade material variants are relevant.
// The event-only mythicShards variant in this slot is excluded to prevent
// it from making the slot appear non-guaranteed on its scheduled days.
const RELEVANT_REWARDS = new Set(['itemAscensionResource_Mythic', 'upgHpM001', 'upgHpM002', 'upgHpM003', 'upgHpM004']);

const penultimateSlot = ROGUE_TRADER.products
    .at(-2)!
    .filter(p => RELEVANT_REWARDS.has(parseReward(p.reward).type))
    .map(p => ({ ...p, conditions: {} }));

const ROGUE_TRADER_PENULTIMATE: ShopData = {
    displayLocation: 'rogueTraderPenultimate',
    refreshWithAdWatch: false,
    allowedRefreshesPerDay: 0,
    products: [penultimateSlot],
};

export const RogueTraderService = {
    getTodayDow(): ShopDayOfWeek {
        return todayDow();
    },

    resolvePenultimateForDay(day: ShopDayOfWeek): ResolvedShopItem[] {
        return resolveShopForDay(ROGUE_TRADER_PENULTIMATE, day, 0);
    },
};
