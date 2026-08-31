import { tacticusIcons } from './icon-list';

export interface SimpleRewardIcon {
    iconKey: keyof typeof tacticusIcons;
    label: string;
}

const SIMPLE_REWARD_TYPES: Record<string, SimpleRewardIcon> = {
    gold: { iconKey: 'coin', label: 'Gold' },
    dust: { iconKey: 'salvage', label: 'Salvage' },
    mythicDust: { iconKey: 'mythicSalvage', label: 'Mythic Salvage' },
    summoningToken: { iconKey: 'reqOrder', label: 'Req Scroll' },
    specialSummoningToken: { iconKey: 'blessedReqOrder', label: 'Blessed Req Scroll' },
    crusadeBomb: { iconKey: 'crusadeBomb', label: 'Crusade Bomb' },
    crusadeNpc: { iconKey: 'crusadeNpc', label: 'Crusade NPC' },
    intel: { iconKey: 'crusadeIntel', label: 'Crusade Intel' },
    stamina: { iconKey: 'stamina', label: 'Energy' },
    stamina_waves: { iconKey: 'onslaughtToken', label: 'Onslaught Tokens' },
    stamina_treasureBeach: { iconKey: 'salvageRunToken', label: 'Salvage Run Tokens' },
    stamina_survival: { iconKey: 'survivalToken', label: 'Survival Tokens' },
    machinesOfWarAmmo: { iconKey: 'mowAmmo', label: 'Munitions' },
    xp_battlepass: { iconKey: 'battlepassPoints', label: 'Battlepass Points' },
    xp_seasonal: { iconKey: 'eventPoints', label: 'Event Point' },
    survivalBoost_stats: { iconKey: 'survivalStatBoost', label: '' },
    ShardsAll: { iconKey: 'shard', label: 'Shards' },
    gems: { iconKey: 'blackstone', label: 'Blackstone' },
    raidTicket: { iconKey: 'raidTicket', label: 'Raid Ticket' },
    expeditionSpeedUp: { iconKey: 'expeditionSpeedUp', label: 'Expedition Speed Up' },
    avatarFrame_frameAugust2026: {
        iconKey: 'seasonalEventAugust2026AvatarFrame',
        label: 'Seasonal Event (August 2026) Avatar Frame',
    },
    playerProfileTheme_may_2026: {
        iconKey: 'playerProfileThemeMay2026',
        label: 'Seasonal Event (May 2026) Profile Theme',
    },
    draft_machinesOfWarTokens: { iconKey: 'draftMachinesOfWarComponents', label: 'MoW Component (Pick One)' },
};

const XP_BOOK_ICON_BY_RARITY: Record<string, keyof typeof tacticusIcons> = {
    Common: 'commonBook',
    Uncommon: 'uncommonBook',
    Rare: 'rareBook',
    Epic: 'epicBook',
    Legendary: 'legendaryBook',
    Mythic: 'mythicBook',
};

/**
 * Resolves a reward `type` string (the part before the `:qty` in a reward/freeOffer/cost string)
 * to an icon key + label, for the "simple named resource" reward types shared across the Shop
 * Events and product-calendar features. Returns `undefined` for anything else (currencies, shards,
 * equipment, upgrades, alliance-bound badges/orbs, etc.) — those need page-specific rendering and
 * are resolved by each consumer's own logic.
 */
export function resolveSimpleRewardIcon(type: string): SimpleRewardIcon | undefined {
    const simple = SIMPLE_REWARD_TYPES[type];
    if (simple) return simple;

    const xpMatch = /^xp(Common|Uncommon|Rare|Epic|Legendary|Mythic)$/.exec(type);
    if (xpMatch) {
        const rarity = xpMatch[1];
        return { iconKey: XP_BOOK_ICON_BY_RARITY[rarity], label: `XP Book (${rarity})` };
    }

    const draftOrbMatch = /^draft_ascensionOrbs(Uncommon|Rare|Epic|Legendary|Mythic)$/.exec(type);
    if (draftOrbMatch) {
        const rarity = draftOrbMatch[1];
        return {
            iconKey: `draftOrbs${rarity}` as keyof typeof tacticusIcons,
            label: `${rarity} Ascension Orb (Pick One)`,
        };
    }

    const draftBadgeMatch = /^draft_abilityTokens(Common|Uncommon|Rare|Epic|Legendary|Mythic)$/.exec(type);
    if (draftBadgeMatch) {
        const rarity = draftBadgeMatch[1];
        return {
            iconKey: `draftAbilityBadges${rarity}` as keyof typeof tacticusIcons,
            label: `${rarity} Ability Badge (Pick One)`,
        };
    }

    return undefined;
}
