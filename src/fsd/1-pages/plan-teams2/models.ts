import { Alliance, DamageType, FactionId, Rank, Rarity, Trait } from '@/fsd/5-shared/model';

// The roster filter criteria shown in the "Unit Filter" panel of the Assemble Team dialog.
// MoWs only carry rarity, faction, alliance and name/id, so `passesMowFilter` ignores the
// character-only fields (rank, hits, movement, range, damage types, traits).
// This is a structural superset of `IRosterFilterCriteria` (from `4-entities/character`), which
// `Teams2Service` delegates to for the fields shared with the `/learn/characters` filter.
export interface IUnitFilterCriteria {
    allowLockedUnits: boolean;
    minRank: Rank;
    maxRank: Rank;
    minRarity: Rarity;
    maxRarity: Rarity;
    factions: FactionId[];
    // `Trait` LABEL values (e.g. `Trait.LivingMetal === 'Living Metal'`), not raw storage keys.
    traits: Trait[];
    alliance: Alliance[];
    attackType: string;
    minHits: number | '';
    maxHits: number | '';
    movement: number | '';
    minRange: number | '';
    maxRange: number | '';
    damageTypes: DamageType[];
    searchText: string;
}

export interface ITeam2 {
    // The name of the team.
    name: string;
    // Display/sort order, 1-based. Re-derived by normalizeOrder after every mutation.
    priority: number;
    // The snowpring ID of the characters.
    chars: string[];
    // If there are flex characters, the first flex character appears at chars[flexIndex].
    flexIndex?: number;
    // The snowpring IDs of the machines of war.
    mows?: string[];
    // If the team is viable as a warOffense team.
    warOffense?: boolean;
    // If the team is viable as a warDefense team.
    warDefense?: boolean;
    // If the team is viable as a guild-raid team.
    raid?: boolean;
    // If the team is viable in tournament arena.
    ta?: boolean;
    // If the team is viable in horde mode.
    horde?: boolean;
    // If the team is viable for campaign battles.
    campaign?: boolean;
    // The campaign storyline this team targets (a value from campaignStorylineOptions).
    campaignStoryline?: string;
    // If the team is viable for Incursion.
    incursion?: boolean;
    // The snowprintIds of the MoWs this Incursion team is built around.
    incursionMows?: string[];
    // Any user-provided notes.
    notes?: string;
}
