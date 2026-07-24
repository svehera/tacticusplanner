import { crusadeShopData } from './data';
import { resolveShopForDay, todayDow } from './shop-resolve';
import type { ResolvedShopItem, ShopData, ShopDayOfWeek } from './shop.models';

const CRUSADE_SHOP = crusadeShopData as unknown as ShopData;

export const CrusadeShopService = {
    getTodayDow(): ShopDayOfWeek {
        return todayDow();
    },

    resolveForDay(day: ShopDayOfWeek, userPL: number, hasBlueStarUnit: boolean): ResolvedShopItem[] {
        return resolveShopForDay(CRUSADE_SHOP, day, userPL, hasBlueStarUnit);
    },
};
