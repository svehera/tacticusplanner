export interface ShopProduct {
    weight?: number;
    conditions: { minPowerLevel?: number; maxPowerLevel?: number; lockId?: string };
    cronSchedule: string;
    reward: string;
    freeOffer?: string;
    maxPurchases?: string;
    cost: { type: string; amount: number };
}

export interface ShopData {
    displayLocation: string;
    refreshCost?: { resourceType: string; amount: number };
    refreshWithAdWatch: boolean;
    allowedRefreshesPerDay: number;
    products: ShopProduct[][];
}

export interface ResolvedShopItem {
    rewardType: string;
    rewardQty: number;
    costAmount: number;
    maxPerDay: number;
    isGuaranteed: boolean;
    freeOfferType?: string;
}

/** One shop slot's resolved reward options for a given day — `items.length > 1` means the slot is random. */
export interface ResolvedShopSlot {
    items: ResolvedShopItem[];
}

export type ShopDayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

export interface ShopEventWeek {
    products: ShopProduct[][];
}

export interface ShopEventEarningsLine {
    label: string;
    amount: string;
}

export interface ShopEventData {
    id: string;
    displayName: string;
    currencyType: string;
    startUtc: number;
    weeks: ShopEventWeek[];
    earningsInfographic?: ShopEventEarningsLine[];
}
