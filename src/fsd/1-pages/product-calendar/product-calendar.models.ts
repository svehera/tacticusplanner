/* eslint-disable import-x/no-internal-modules */
import { Alliance, RarityMapper, RarityString } from '@/fsd/5-shared/model';
import { tacticusIcons } from '@/fsd/5-shared/ui/icons/icon-list';

import type { IProductCalendar, IProductCalendarDay, IProductCalendarOffer } from '@/fsd/4-entities/calendars';
import { EquipmentService } from '@/fsd/4-entities/equipment';

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

export type CalendarRewardIcon =
    | { kind: 'misc'; icon: keyof typeof tacticusIcons }
    | { kind: 'equipment'; rarity: string; icon: string }
    | { kind: 'orb'; alliance: Alliance; rarity: number }
    | { kind: 'unknownItem'; rarity: string }
    | { kind: 'unknownUpgradeMaterial'; rarity: string }
    | { kind: 'xpBook'; rarity: string }
    | { kind: 'text'; text: string };

export interface CalendarRewardInfo {
    icon: CalendarRewardIcon;
    label: string;
    qty: number | undefined;
}

// Parses a reward string like "gold:500" into its display info. Unrecognized types fall back to
// a plain-text icon showing the raw type string.
export function calendarRewardInfo(reward: string): CalendarRewardInfo {
    const colonIndex = reward.indexOf(':');
    const type = colonIndex === -1 ? reward : reward.slice(0, colonIndex);
    const qtyString = colonIndex === -1 ? undefined : reward.slice(colonIndex + 1);
    const qty = qtyString === undefined ? undefined : Number.parseInt(qtyString, 10);
    const misc = (icon: keyof typeof tacticusIcons, label: string): CalendarRewardInfo => ({
        icon: { kind: 'misc', icon },
        label,
        qty,
    });

    if (type === 'gold') return misc('coin', 'Gold');
    if (type === 'dust') return misc('salvage', 'Salvage');
    if (type === 'mythicDust') return misc('mythicSalvage', 'Mythic Salvage');
    if (type === 'summoningToken') return misc('reqOrder', 'Req Scroll');
    if (type === 'specialSummoningToken') return misc('blessedReqOrder', 'Blessed Req Scroll');
    if (type === 'stamina') return misc('stamina', 'Energy');
    if (type === 'stamina_treasureBeach') return misc('salvageRunToken', 'Salvage Run Tokens');
    if (type === 'stamina_waves') return misc('onslaughtToken', 'Onslaught Tokens');
    if (type === 'gems') return misc('blackstone', 'Blackstone');
    if (type === 'raidTicket') return misc('raidTicket', 'Raid Ticket');

    if (type === 'ShardsImperial') return misc('allianceImperial', 'Imperial Shards');
    if (type === 'ShardsChaos') return misc('allianceChaos', 'Chaos Shards');
    if (type === 'ShardsXenos') return misc('allianceXenos', 'Xenos Shards');
    if (type.startsWith('Shards')) return misc('shard', 'Shards');

    const draftBadgeMatch = /^draft_abilityTokens(Common|Uncommon|Rare|Epic|Legendary|Mythic)$/.exec(type);
    if (draftBadgeMatch) {
        const rarity = draftBadgeMatch[1] as RarityString;
        const iconKey = `draftAbilityBadges${rarity}` as keyof typeof tacticusIcons;
        return misc(iconKey, `${rarity} Badge (Pick One)`);
    }

    const badgeMatch = /^abilityTokens(Common|Uncommon|Rare|Epic|Legendary|Mythic)$/.exec(type);
    if (badgeMatch) {
        const rarity = badgeMatch[1] as RarityString;
        const iconKey = `draftAbilityBadges${rarity}` as keyof typeof tacticusIcons;
        return misc(iconKey, `${rarity} Badge`);
    }

    const draftOrbMatch = /^draft_ascensionOrbs(Uncommon|Rare|Epic|Legendary|Mythic)$/.exec(type);
    if (draftOrbMatch) {
        const rarity = draftOrbMatch[1] as RarityString;
        const iconKey = `draftOrbs${rarity}` as keyof typeof tacticusIcons;
        return misc(iconKey, `${rarity} Orb (Pick One)`);
    }

    const orbMatch = /^ascensionOrbs(Uncommon|Rare|Epic|Legendary|Mythic)$/.exec(type);
    if (orbMatch) {
        const rarityNumber = RarityMapper.stringToNumber[orbMatch[1] as RarityString];
        return {
            icon: { kind: 'orb', alliance: Alliance.Imperial, rarity: rarityNumber },
            label: `${orbMatch[1]} Orb`,
            qty,
        };
    }

    const xpMatch = /^xp(Common|Uncommon|Rare|Epic|Legendary|Mythic)$/.exec(type);
    if (xpMatch) {
        return misc(`${xpMatch[1].toLowerCase()}Book` as keyof typeof tacticusIcons, `XP Book (${xpMatch[1]})`);
    }

    const itemsMatch = /^items(Common|Uncommon|Rare|Epic|Legendary|Mythic)$/.exec(type);
    if (itemsMatch) {
        return { icon: { kind: 'unknownItem', rarity: itemsMatch[1] }, label: `${itemsMatch[1]} Item`, qty };
    }

    if (type === 'draft_machinesOfWarTokens') return misc('draftMachinesOfWarComponents', 'MoW Component (Pick One)');
    if (type === 'machinesOfWarAmmo') return misc('mow', 'MoW Ammo');
    if (type === 'seasonalEventCurrencyJune2026') return misc('armageddonCurrency', 'Event Currency');

    const heroOrbMatch = /^heroAscensionOrb(Uncommon|Rare|Epic|Legendary|Mythic)_(Imperial|Chaos|Xenos)$/.exec(type);
    if (heroOrbMatch) {
        const rarityNumber = RarityMapper.stringToNumber[heroOrbMatch[1] as RarityString];
        const alliance =
            heroOrbMatch[2] === 'Imperial'
                ? Alliance.Imperial
                : heroOrbMatch[2] === 'Chaos'
                  ? Alliance.Chaos
                  : Alliance.Xenos;
        return { icon: { kind: 'orb', alliance, rarity: rarityNumber }, label: `${heroOrbMatch[1]} Orb`, qty };
    }

    const mowTokenMatch = /^machinesOfWarToken_(Imperial|Chaos|Xenos)$/.exec(type);
    // Here we return an icon for the alliance's (the thing after token_) mow components.
    if (mowTokenMatch)
        return misc(
            (mowTokenMatch[1].toLowerCase() + 'Component') as keyof typeof tacticusIcons,
            `${mowTokenMatch[1]} Components`
        );

    const allianceBadgeMatch =
        /^abilityTokens?(Common|Uncommon|Rare|Epic|Legendary|Mythic)_(Imperial|Chaos|Xenos)$/.exec(type);
    if (allianceBadgeMatch) {
        const rarity = allianceBadgeMatch[1] as RarityString;
        const iconKey = `draftAbilityBadges${rarity}` as keyof typeof tacticusIcons;
        return misc(iconKey, `${rarity} Badge`);
    }

    const upgradesMatch = /^upgrades(Common|Uncommon|Rare|Epic|Legendary|Mythic)$/.exec(type);
    if (upgradesMatch) {
        return {
            icon: { kind: 'unknownUpgradeMaterial', rarity: upgradesMatch[1] },
            label: `${upgradesMatch[1]} Upgrades`,
            qty,
        };
    }

    const ascensionResourceMatch = /^itemAscensionResource_(Uncommon|Rare|Epic|Legendary|Mythic)$/.exec(type);
    if (ascensionResourceMatch) {
        const rarityNumber = RarityMapper.stringToNumber[ascensionResourceMatch[1] as RarityString];
        return {
            icon: { kind: 'orb', alliance: Alliance.Imperial, rarity: rarityNumber },
            label: `${ascensionResourceMatch[1]} Ascension Resource`,
            qty,
        };
    }

    const equipment = EquipmentService.equipmentData.find(item => item.id === type);
    if (equipment !== undefined) {
        return {
            icon: {
                kind: 'equipment',
                rarity: equipment.isRelic ? 'Relic' : RarityMapper.rarityToRarityString(equipment.rarity),
                icon: equipment.icon,
            },
            label: equipment.name,
            qty,
        };
    }

    const equipRarity = equipmentItemRarity(type);
    if (equipRarity !== undefined) {
        return { icon: { kind: 'unknownItem', rarity: equipRarity }, label: `${equipRarity} Item`, qty };
    }

    const upgRarity = upgradeMaterialRarity(type);
    if (upgRarity !== undefined) {
        return { icon: { kind: 'unknownItem', rarity: upgRarity }, label: `${upgRarity} Upgrade`, qty };
    }

    if (type.startsWith('upg')) {
        const letter = type.replace(/^upg[A-Za-z]+/, '')[0] ?? '';
        const rarity = RARITY_LETTER_MAP[letter];
        if (rarity) return { icon: { kind: 'unknownItem', rarity }, label: `${rarity} Upgrade`, qty };
    }

    return { icon: { kind: 'text', text: type }, label: type, qty };
}

// Returns true if the reward type has a dedicated UI icon, false if it falls back to text display.
export function isKnownCalendarRewardType(type: string): boolean {
    return calendarRewardInfo(`${type}:0`).icon.kind !== 'text';
}
