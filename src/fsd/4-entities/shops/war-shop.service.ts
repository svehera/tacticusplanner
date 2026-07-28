import { warShopData } from './data';
import { resolveShopForDay, todayDow } from './shop-resolve';
import type { ResolvedShopItem, ShopData, ShopDayOfWeek } from './shop.models';

const WAR_SHOP = warShopData as unknown as ShopData;

export const WarShopService = {
    getTodayDow(): ShopDayOfWeek {
        return todayDow();
    },

    resolveForDay(day: ShopDayOfWeek, userPL: number): ResolvedShopItem[] {
        return resolveShopForDay(WAR_SHOP, day, userPL);
    },
};
