import { ResolvedShopItem } from '@/fsd/4-entities/shops';

export interface ShopAvailabilityGroups {
    guaranteed: ResolvedShopItem[];
    possible: ResolvedShopItem[];
}

/**
 * Splits already-filtered "visible" shop items into guaranteed-today vs. possibly-today (random
 * slot). When `hideRandom` is true, the possible group is dropped entirely rather than shown under
 * its own header.
 */
export function groupByAvailability(items: ResolvedShopItem[], hideRandom: boolean): ShopAvailabilityGroups {
    return {
        guaranteed: items.filter(item => item.isGuaranteed),
        possible: hideRandom ? [] : items.filter(item => !item.isGuaranteed),
    };
}
