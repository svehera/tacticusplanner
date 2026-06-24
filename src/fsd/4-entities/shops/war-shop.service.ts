/* eslint-disable import-x/no-internal-modules */
import warShopJson from './data/new-war-shop.json';
import { resolveShopForDay, todayDow } from './shop-resolve';
import type { ResolvedShopItem, ShopData, ShopDayOfWeek } from './shop.models';

// @ts-expect-error FIXME: Caused by transition to const JSON imports
const WAR_SHOP = warShopJson as ShopData;

export const WarShopService = {
    getTodayDow(): ShopDayOfWeek {
        return todayDow();
    },

    resolveForDay(day: ShopDayOfWeek, userPL: number): ResolvedShopItem[] {
        return resolveShopForDay(WAR_SHOP, day, userPL);
    },
};
