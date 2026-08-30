import { tacticusIcons } from '@/fsd/5-shared/ui/icons';

/**
 * Maps a shop `cost.type` currency string (as found in shop JSON files) to the icon key used to
 * render it via `MiscIcon`. Every currency that appears in `shops/data/*.json` must have an entry
 * here — enforced by `shop-currency-icon.spec.ts`, which forces whoever adds a newly datamined
 * event to also bring over its currency icon asset.
 */
const CURRENCY_ICON_BY_TYPE: Record<string, keyof typeof tacticusIcons> = {
    seasonalEventCurrencyJune2026: 'armageddonCurrency',
    seasonalEventCurrencyApril2026: 'seasonalEventCurrencyApril2026',
    seasonalEventCurrencyAugust2026: 'seasonalEventCurrencyAugust2026',
    seasonalEventCurrencyHolidays2025: 'seasonalEventCurrencyHolidays2025',
    seasonalEventCurrencyMarch2026: 'seasonalEventCurrencyMarch2026',
    seasonalEventCurrencyMay2026: 'seasonalEventCurrencyMay2026',
    seasonalEventCurrencySeptember2026: 'seasonalEventCurrencySeptember2026',
    seasonalEventCurrencyCrescendo: 'seasonalEventCurrencyCrescendo',
    crusadeCurrency: 'crusadeCurrency',
    guildCredits: 'guildCredits',
    guildWarCurrency: 'warCredits',
    elderShopCurrency: 'archeotech',
};

/** Returns the `MiscIcon` icon key for a shop currency type string, or `undefined` if unregistered. */
export function getShopCurrencyIconKey(currencyType: string): keyof typeof tacticusIcons | undefined {
    return CURRENCY_ICON_BY_TYPE[currencyType];
}

/** Display label overrides for currencies with a specific in-game name, rather than the generic "Event Currency". */
const CURRENCY_LABEL_BY_TYPE: Record<string, string> = {
    crusadeCurrency: 'Crusade Credits',
};

/** Returns the display label for a shop currency type string. */
export function getShopCurrencyLabel(currencyType: string): string {
    return CURRENCY_LABEL_BY_TYPE[currencyType] ?? 'Event Currency';
}
