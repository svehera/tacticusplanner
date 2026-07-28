import type { ShopEventData, ShopEventEarningsLine, ShopProduct } from './shop.models';

export interface ShopEventMeta {
    id: string;
    displayName: string;
    currencyType: string;
    startUtc: number;
    earningsInfographic?: ShopEventEarningsLine[];
}

export interface SeasonalEventRawSlot {
    slot: number;
    variants: ShopProduct[];
}

export interface SeasonalEventRawWeek {
    week: number;
    slots: SeasonalEventRawSlot[];
}

export interface SeasonalEventRaw {
    event: string;
    title?: string;
    weeks: SeasonalEventRawWeek[];
}

/** Adapts the `{event, weeks:[{week, slots:[{slot, variants}]}]}` shape (e.g. `2026-06-armageddon-shop.json`) into the canonical `ShopEventData`. */
export function adaptSeasonalEventJson(meta: ShopEventMeta, raw: SeasonalEventRaw): ShopEventData {
    const sortedWeeks = [...raw.weeks].toSorted((a, b) => a.week - b.week);
    return {
        ...meta,
        weeks: sortedWeeks.map(week => ({
            products: [...week.slots].toSorted((a, b) => a.slot - b.slot).map(slot => slot.variants),
        })),
    };
}
