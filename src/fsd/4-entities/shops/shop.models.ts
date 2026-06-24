export interface ShopProduct {
    weight: number;
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

export type ShopDayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
