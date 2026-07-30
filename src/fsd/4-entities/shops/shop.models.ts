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
    milestoneRewards?: ShopEventMilestoneReward[];
    progressChests?: ShopEventProgressChest[];
    missions?: IEventMissions;
}

export interface ShopEventEarningsLine {
    label: string;
    amount: string;
}

export interface ShopEventMilestoneReward {
    requiredProgress: number;
    reward?: string;
    chest?: { type?: string; rewards: string[] }[];
}

export interface ShopEventProgressChest {
    requiredProgress: number;
    chest: { type?: string; rewards: string[] }[];
}

export interface IMissionTask {
    name: string;
    target: number;
    locaKey: string;
    /** Scalar params (`factionId`, `trait`, ...) are strings; `gameModes` is the one list-valued param. */
    taskParameters?: Record<string, string | string[]>;
}

export interface IMissionChain {
    name: string;
    rewards: string[];
    tasks: IMissionTask[];
}

export interface IEventMissions {
    daily: IMissionChain[];
    free: IMissionChain[];
    premium: IMissionChain[];
    battlePass: IMissionChain[];
}

export interface ShopEventData {
    id: string;
    displayName: string;
    currencyType: string;
    startUtc: number;
    weeks: ShopEventWeek[];
    earningsInfographic?: ShopEventEarningsLine[];
}
