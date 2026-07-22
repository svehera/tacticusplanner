import { guildShopData } from './data';
import { resolveShopForDay, todayDow } from './shop-resolve';
import type { ShopData, ResolvedShopItem, ShopDayOfWeek } from './shop.models';

const GUILD_SHOP = guildShopData as unknown as ShopData;

export const GuildShopService = {
    getTodayDow(): ShopDayOfWeek {
        return todayDow();
    },

    resolveForDay(day: ShopDayOfWeek, userPL: number): ResolvedShopItem[] {
        return resolveShopForDay(GUILD_SHOP, day, userPL);
    },
};
