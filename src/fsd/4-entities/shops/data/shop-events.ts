import { adaptSeasonalEventJson, ShopEventMeta } from '../shop-event-adapt';
import type { SeasonalEventRaw } from '../shop-event-adapt';
import type { ShopEventData } from '../shop.models';

// Keyed by the `event` field inside each shop-event JSON file (e.g. "June2026"). None of this
// presentation metadata is derivable from the extracted data itself - `startUtc` is a real
// calendar date, `earningsInfographic` is hand-curated, and `id` is a persisted key used in
// saved user purchase-tracking state (see `ShopEventsState`) and in `migrations.ts`
// (`migrateShopEventsState` hardcodes the legacy `armageddon` key) - so `id` must stay stable
// even as the underlying file/event naming evolves.
export const EVENT_META: Record<string, ShopEventMeta> = {
    June2026: {
        id: 'armageddon',
        displayName: 'Armageddon Shop',
        currencyType: 'seasonalEventCurrencyJune2026',
        startUtc: Date.UTC(2026, 5, 22),
        earningsInfographic: [
            { label: 'F2P per week', amount: '1,050 – 1,100' },
            { label: 'Bonus shipment', amount: '+900' },
        ],
    },
    August2026: {
        id: 'august2026',
        displayName: 'War Amongst the Stars',
        currencyType: 'seasonalEventCurrencyAugust2026',
        startUtc: Date.UTC(2026, 7, 5),
        earningsInfographic: [
            { label: 'F2P per week', amount: '750 – 850' },
            { label: 'Bonus shipment', amount: '+1000' },
        ],
    },
};

// Every shop-event data file is named `YYYY-MM(-kebab-title).json` (e.g. `2026-06-armageddon-shop.json`),
// which keeps this glob from picking up the other shop data files living in the same directory
// (`new-guild-shop.json`, `new-war-shop.json`, `new-rogue-trader.json`, `new-crusade-shop-data.json`).
const modules = import.meta.glob<{ default: SeasonalEventRaw }>('./[0-9][0-9][0-9][0-9]-*.json', { eager: true });

export const shopEventRawByPath: [string, SeasonalEventRaw][] = Object.entries(modules)
    .toSorted(([pathA], [pathB]) => pathA.localeCompare(pathB))
    .map(([path, module_]) => [path, module_.default]);

export const shopEvents: ShopEventData[] = shopEventRawByPath
    .map(([, raw]) => raw)
    .filter(raw => EVENT_META[raw.event])
    .map(raw => adaptSeasonalEventJson(EVENT_META[raw.event], raw));
