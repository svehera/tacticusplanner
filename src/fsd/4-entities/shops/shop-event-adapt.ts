import { getShopEventBannerUrl } from './shop-event-banners';
import type {
    IEventMissions,
    ShopEventData,
    ShopEventEarningsLine,
    ShopEventMilestoneReward,
    ShopEventProgressChest,
    ShopProduct,
} from './shop.models';

export interface ShopEventMeta {
    id: string;
    /** Fallback name, used when the event JSON has no `title`. */
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
    milestoneRewards?: ShopEventMilestoneReward[];
    progressChests?: ShopEventProgressChest[];
    missions?: IEventMissions;
    earnings?: { tooltip?: string };
    bonusShipment?: { tooltip?: string };
}

export interface SeasonalEventRaw {
    event: string;
    title?: string;
    /** File name of the event's interstitial art, e.g. "ui_interstitial_november_2026.png". */
    interstitial?: string;
    weeks: SeasonalEventRawWeek[];
}

/** Adapts the `{event, weeks:[{week, slots:[{slot, variants}]}]}` shape (e.g. `2026-06-armageddon.json`) into the canonical `ShopEventData`. */
export function adaptSeasonalEventJson(meta: ShopEventMeta, raw: SeasonalEventRaw): ShopEventData {
    const sortedWeeks = [...raw.weeks].toSorted((a, b) => a.week - b.week);
    return {
        ...meta,
        displayName: raw.title ?? meta.displayName,
        banner: getShopEventBannerUrl(raw.interstitial),
        weeks: sortedWeeks.map(week => ({
            products: [...week.slots].toSorted((a, b) => a.slot - b.slot).map(slot => slot.variants),
            milestoneRewards: week.milestoneRewards,
            progressChests: week.progressChests,
            missions: week.missions,
            earningsTooltip: week.earnings?.tooltip,
            bonusShipmentTooltip: week.bonusShipment?.tooltip,
        })),
    };
}
