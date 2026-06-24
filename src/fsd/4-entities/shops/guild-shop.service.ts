/* eslint-disable import-x/no-internal-modules */
import guildShopJson from './data/new-guild-shop.json';
import { resolveShopForDay, todayDow } from './shop-resolve';
import type { ShopData, ResolvedShopItem, ShopDayOfWeek } from './shop.models';

// @ts-expect-error FIXME: Caused by transition to const JSON imports
const GUILD_SHOP = guildShopJson as ShopData;

export const GuildShopService = {
    getTodayDow(): ShopDayOfWeek {
        return todayDow();
    },

    resolveForDay(day: ShopDayOfWeek, userPL: number): ResolvedShopItem[] {
        return resolveShopForDay(GUILD_SHOP, day, userPL);
    },
};
