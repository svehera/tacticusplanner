import type { IProductCalendar, IProductCalendarDay, IProductCalendarOffer } from '@/fsd/4-entities/calendars';

const MONTH_NAMES: Record<string, string> = {
    january: 'January',
    february: 'February',
    march: 'March',
    april: 'April',
    may: 'May',
    june: 'June',
    july: 'July',
    august: 'August',
    september: 'September',
    october: 'October',
    november: 'November',
    december: 'December',
};

// Maps single-letter rarity codes (used in equipment item IDs) to full rarity strings.
export const RARITY_LETTER_MAP: Record<string, string> = {
    C: 'Common',
    U: 'Uncommon',
    R: 'Rare',
    E: 'Epic',
    L: 'Legendary',
    M: 'Mythic',
};

// Converts a calendar ID like "calendar_seasonal_event_july_2026" to "July 2026".
export function calendarDisplayName(calendarId: string): string {
    const parts = calendarId.split('_');
    const year = parts.at(-1);
    const month = parts.at(-2);
    if (year && month && MONTH_NAMES[month]) {
        return `${MONTH_NAMES[month]} ${year}`;
    }
    return calendarId;
}

export function formatPrice(priceCents: number, free: boolean): string {
    if (free) return 'FREE';
    return `$${Math.ceil(priceCents / 100)}`;
}

export function titlesInOrder(calendar: IProductCalendar): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const calDay of calendar.days) {
        for (const offer of calDay.offers) {
            if (!seen.has(offer.title)) {
                seen.add(offer.title);
                result.push(offer.title);
            }
        }
    }
    return result;
}

export function offersForDayByTitle(calDay: IProductCalendarDay): Map<string, IProductCalendarOffer[]> {
    const result = new Map<string, IProductCalendarOffer[]>();
    for (const offer of calDay.offers) {
        const existing = result.get(offer.title) ?? [];
        existing.push(offer);
        result.set(offer.title, existing);
    }
    return result;
}

// Returns the rarity string for equipment item IDs like "I_Crit_E002" or "I_Booster_Crit_M004".
// Returns undefined if the ID doesn't match the expected pattern.
export function equipmentItemRarity(itemId: string): string | undefined {
    if (!itemId.startsWith('I_')) return undefined;
    const lastSegment = itemId.split('_').at(-1) ?? '';
    const letter = lastSegment[0] ?? '';
    return RARITY_LETTER_MAP[letter];
}

// Returns the rarity string for upgrade material IDs like "upgArmR026" or "upgHpL106".
// Returns undefined if the ID doesn't match the expected pattern.
export function upgradeMaterialRarity(itemId: string): string | undefined {
    const match = itemId.match(/^upg[A-Z][a-z]+([URELMC])\d+$/);
    if (!match) return undefined;
    return RARITY_LETTER_MAP[match[1] ?? ''];
}

// Returns true if the reward type has a dedicated UI icon, false if it falls back to text display.
// Keep in sync with calendarRewardInfo() in product-calendar.tsx.
export function isKnownCalendarRewardType(type: string): boolean {
    if (
        type === 'gold' ||
        type === 'dust' ||
        type === 'mythicDust' ||
        type === 'summoningToken' ||
        type === 'specialSummoningToken' ||
        type === 'stamina' ||
        type === 'stamina_treasureBeach' ||
        type === 'stamina_waves' ||
        type === 'gems' ||
        type === 'raidTicket' ||
        type === 'xpEpic' ||
        type === 'xpLegendary' ||
        type === 'xpMythic' ||
        type === 'xpRare' ||
        type === 'ShardsImperial' ||
        type === 'ShardsChaos' ||
        type === 'ShardsXenos' ||
        type === 'draft_machinesOfWarTokens' ||
        type === 'machinesOfWarAmmo' ||
        type === 'seasonalEventCurrencyJune2026'
    )
        return true;

    if (type.startsWith('Shards')) return true;

    if (
        /^draft_abilityTokens(?:Common|Uncommon|Rare|Epic|Legendary|Mythic)$/.test(type) ||
        /^abilityTokens?(?:Common|Uncommon|Rare|Epic|Legendary|Mythic)_(?:Imperial|Chaos|Xenos)$/.test(type) ||
        /^abilityTokens(?:Common|Uncommon|Rare|Epic|Legendary|Mythic)$/.test(type) ||
        /^draft_ascensionOrbs(?:Uncommon|Rare|Epic|Legendary|Mythic)$/.test(type) ||
        /^ascensionOrbs(?:Uncommon|Rare|Epic|Legendary|Mythic)$/.test(type) ||
        /^heroAscensionOrb(?:Uncommon|Rare|Epic|Legendary|Mythic)_(?:Imperial|Chaos|Xenos)$/.test(type) ||
        /^items(?:Common|Uncommon|Rare|Epic|Legendary|Mythic)$/.test(type) ||
        /^upgrades(?:Common|Uncommon|Rare|Epic|Legendary|Mythic)$/.test(type) ||
        /^itemAscensionResource_(?:Uncommon|Rare|Epic|Legendary|Mythic)$/.test(type) ||
        /^machinesOfWarToken_(?:Imperial|Chaos|Xenos)$/.test(type)
    )
        return true;

    if (type.startsWith('R_')) return true;
    if (equipmentItemRarity(type) !== undefined) return true;
    if (upgradeMaterialRarity(type) !== undefined) return true;

    return false;
}
