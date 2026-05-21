import { Alliance, Rarity, RarityStars } from '@/fsd/5-shared/model';

export type OnslaughtSector = 'stone' | 'iron' | 'bronze' | 'silver' | 'gold' | 'diamond' | 'adamantine';
export type OnslaughtTier = 1 | 2 | 3 | 4;

export interface IAllianceOnslaughtPrefs {
    sector: OnslaughtSector;
    tier: OnslaughtTier;
}

export interface IOnslaughtPreferences {
    [Alliance.Imperial]: IAllianceOnslaughtPrefs;
    [Alliance.Xenos]: IAllianceOnslaughtPrefs;
    [Alliance.Chaos]: IAllianceOnslaughtPrefs;
}

export interface OnslaughtRewardRange {
    min: number;
    max: number;
    /** true = mythic shards; false = regular shards */
    isMythic: boolean;
}

type SectorTierRewards = {
    common: OnslaughtRewardRange;
    uncommon: OnslaughtRewardRange;
    rare: OnslaughtRewardRange;
    epic: OnslaughtRewardRange;
    legendary: OnslaughtRewardRange;
    /** Legendary with >= OneBlueStar (consistent across tiers in a sector) */
    legendaryBlue: OnslaughtRewardRange;
    /** Rarity.Mythic characters (scales with tier in higher sectors) */
    mythicShards: OnslaughtRewardRange;
};

function r(min: number, max: number): OnslaughtRewardRange {
    return { min, max, isMythic: false };
}
function m(min: number, max: number): OnslaughtRewardRange {
    return { min, max, isMythic: true };
}

export const ONSLAUGHT_REWARDS: Record<OnslaughtSector, Record<1 | 2 | 3, SectorTierRewards>> = {
    stone: {
        1: {
            common: r(2, 3),
            uncommon: r(2, 3),
            rare: r(2, 3),
            epic: r(2, 3),
            legendary: r(2, 3),
            legendaryBlue: m(1, 1),
            mythicShards: m(1, 1),
        },
        2: {
            common: r(2, 4),
            uncommon: r(2, 4),
            rare: r(2, 4),
            epic: r(2, 4),
            legendary: r(2, 4),
            legendaryBlue: m(1, 1),
            mythicShards: m(1, 1),
        },
        3: {
            common: r(3, 4),
            uncommon: r(3, 4),
            rare: r(3, 4),
            epic: r(3, 4),
            legendary: r(3, 4),
            legendaryBlue: m(1, 1),
            mythicShards: m(1, 1),
        },
    },
    iron: {
        1: {
            common: r(3, 4),
            uncommon: r(3, 4),
            rare: r(3, 4),
            epic: r(3, 4),
            legendary: r(3, 4),
            legendaryBlue: m(1, 1),
            mythicShards: m(1, 1),
        },
        2: {
            common: r(3, 4),
            uncommon: r(3, 5),
            rare: r(3, 5),
            epic: r(3, 5),
            legendary: r(3, 5),
            legendaryBlue: m(1, 1),
            mythicShards: m(1, 1),
        },
        3: {
            common: r(3, 4),
            uncommon: r(4, 5),
            rare: r(4, 5),
            epic: r(4, 5),
            legendary: r(4, 5),
            legendaryBlue: m(1, 1),
            mythicShards: m(1, 1),
        },
    },
    bronze: {
        1: {
            common: r(3, 4),
            uncommon: r(4, 5),
            rare: r(5, 6),
            epic: r(5, 6),
            legendary: r(5, 6),
            legendaryBlue: m(1, 1),
            mythicShards: m(1, 1),
        },
        2: {
            common: r(3, 4),
            uncommon: r(4, 5),
            rare: r(5, 7),
            epic: r(5, 7),
            legendary: r(5, 7),
            legendaryBlue: m(1, 1),
            mythicShards: m(1, 1),
        },
        3: {
            common: r(3, 4),
            uncommon: r(4, 5),
            rare: r(6, 7),
            epic: r(6, 7),
            legendary: r(6, 7),
            legendaryBlue: m(1, 1),
            mythicShards: m(1, 1),
        },
    },
    silver: {
        1: {
            common: r(3, 4),
            uncommon: r(4, 5),
            rare: r(6, 7),
            epic: r(8, 9),
            legendary: r(8, 9),
            legendaryBlue: m(1, 1),
            mythicShards: m(1, 1),
        },
        2: {
            common: r(3, 4),
            uncommon: r(4, 5),
            rare: r(6, 7),
            epic: r(9, 10),
            legendary: r(9, 10),
            legendaryBlue: m(1, 1),
            mythicShards: m(1, 1),
        },
        3: {
            common: r(3, 4),
            uncommon: r(4, 5),
            rare: r(6, 7),
            epic: r(10, 11),
            legendary: r(10, 11),
            legendaryBlue: m(1, 1),
            mythicShards: m(1, 1),
        },
    },
    gold: {
        1: {
            common: r(3, 4),
            uncommon: r(4, 5),
            rare: r(6, 7),
            epic: r(10, 11),
            legendary: r(14, 16),
            legendaryBlue: m(1, 1),
            mythicShards: m(1, 1),
        },
        2: {
            common: r(3, 4),
            uncommon: r(4, 5),
            rare: r(6, 7),
            epic: r(10, 11),
            legendary: r(15, 17),
            legendaryBlue: m(1, 1),
            mythicShards: m(1, 1),
        },
        3: {
            common: r(3, 4),
            uncommon: r(4, 5),
            rare: r(6, 7),
            epic: r(10, 11),
            legendary: r(16, 18),
            legendaryBlue: m(1, 1),
            mythicShards: m(1, 1),
        },
    },
    diamond: {
        1: {
            common: r(3, 4),
            uncommon: r(4, 5),
            rare: r(6, 7),
            epic: r(10, 11),
            legendary: r(16, 20),
            legendaryBlue: m(1, 2),
            mythicShards: m(1, 2),
        },
        2: {
            common: r(3, 4),
            uncommon: r(4, 5),
            rare: r(6, 7),
            epic: r(10, 11),
            legendary: r(17, 21),
            legendaryBlue: m(1, 2),
            mythicShards: m(1, 2),
        },
        3: {
            common: r(3, 4),
            uncommon: r(4, 5),
            rare: r(6, 7),
            epic: r(10, 11),
            legendary: r(18, 22),
            legendaryBlue: m(1, 2),
            mythicShards: m(1, 2),
        },
    },
    adamantine: {
        1: {
            common: r(3, 4),
            uncommon: r(4, 5),
            rare: r(6, 7),
            epic: r(10, 11),
            legendary: r(18, 22),
            legendaryBlue: m(1, 2),
            mythicShards: m(1, 2),
        },
        2: {
            common: r(3, 4),
            uncommon: r(4, 5),
            rare: r(6, 7),
            epic: r(10, 11),
            legendary: r(18, 22),
            legendaryBlue: m(1, 2),
            mythicShards: m(1, 3),
        },
        3: {
            common: r(3, 4),
            uncommon: r(4, 5),
            rare: r(6, 7),
            epic: r(10, 11),
            legendary: r(18, 22),
            legendaryBlue: m(1, 2),
            mythicShards: m(2, 3),
        },
    },
};

export const ONSLAUGHT_SECTOR_LABELS: Record<OnslaughtSector, string> = {
    stone: 'Stone',
    iron: 'Iron',
    bronze: 'Bronze',
    silver: 'Silver',
    gold: 'Gold',
    diamond: 'Diamond',
    adamantine: 'Adamantine',
};

export const ONSLAUGHT_SECTORS: OnslaughtSector[] = [
    'stone',
    'iron',
    'bronze',
    'silver',
    'gold',
    'diamond',
    'adamantine',
];

export const ONSLAUGHT_TIERS: OnslaughtTier[] = [1, 2, 3];

export const defaultAlliancePrefs: IAllianceOnslaughtPrefs = {
    sector: 'stone',
    tier: 1,
};

export const defaultOnslaughtPreferences: IOnslaughtPreferences = {
    [Alliance.Imperial]: { sector: 'stone', tier: 1 },
    [Alliance.Xenos]: { sector: 'stone', tier: 1 },
    [Alliance.Chaos]: { sector: 'stone', tier: 1 },
};

/**
 * Returns the shard reward range for a character at the given rarity/stars
 * playing in the specified sector and tier.
 */
export function getOnslaughtReward(
    rarity: Rarity,
    stars: RarityStars,
    sector: OnslaughtSector,
    passedTier: OnslaughtTier
): OnslaughtRewardRange {
    const tier = passedTier === 4 ? 3 : passedTier; // whole-sector rewards use the tier 3 values
    const rewards = ONSLAUGHT_REWARDS[sector][tier];
    if (rarity === Rarity.Mythic) return rewards.mythicShards;
    if (rarity === Rarity.Legendary && stars >= RarityStars.OneBlueStar) return rewards.legendaryBlue;
    if (rarity === Rarity.Legendary) return rewards.legendary;
    if (rarity === Rarity.Epic) return rewards.epic;
    if (rarity === Rarity.Rare) return rewards.rare;
    if (rarity === Rarity.Uncommon) return rewards.uncommon;
    return rewards.common;
}

/** Returns midpoint of the shard range (used for estimation). */
export function getOnslaughtRewardMidpoint(
    rarity: Rarity,
    stars: RarityStars,
    sector: OnslaughtSector,
    tier: OnslaughtTier
): number {
    const { min, max } = getOnslaughtReward(rarity, stars, sector, tier);
    return (min + max) / 2;
}

/** Returns a human-readable range string, e.g. "14-16" or "1-2 mythic". */
export function formatOnslaughtRewardRange(
    rarity: Rarity,
    stars: RarityStars,
    sector: OnslaughtSector,
    tier: OnslaughtTier
): string {
    const { min, max, isMythic } = getOnslaughtReward(rarity, stars, sector, tier);
    const suffix = isMythic ? ' mythic' : '';
    if (min === max) return `${min}${suffix}`;
    return `${min}-${max}${suffix}`;
}

/**
 * Returns the shard reward range for a character given their alliance preferences.
 */
export function getOnslaughtRewardForCharacter(
    rarity: Rarity,
    stars: RarityStars,
    alliance: Alliance,
    preferences: IOnslaughtPreferences
): OnslaughtRewardRange {
    const prefs = preferences[alliance];
    return getOnslaughtReward(rarity, stars, prefs.sector, prefs.tier);
}

/**
 * Returns midpoint of the shard range for a character given their alliance preferences.
 */
export function getOnslaughtMidpointForCharacter(
    rarity: Rarity,
    stars: RarityStars,
    alliance: Alliance,
    preferences: IOnslaughtPreferences
): number {
    const { min, max } = getOnslaughtRewardForCharacter(rarity, stars, alliance, preferences);
    return (min + max) / 2;
}
