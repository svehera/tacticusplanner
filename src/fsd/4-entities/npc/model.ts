import { Alliance, Faction, Rank, RarityStars } from '@/fsd/5-shared/model';

export interface INpcStatsRaw {
    AbilityLevel: number;
    Damage: number;
    Armor: number;
    Health: number;
    ProgressionIndex: number;
    Rank: number;
    Stars: number;
}

export interface INpcStats {
    abilityLevel: number;
    damage: number;
    armor: number;
    health: number;
    progressionIndex: number;
    rank: Rank;
    stars: RarityStars;
}

export interface INpcData {
    id: string;
    name: string;
    faction: Faction;
    alliance: Alliance;
    movement: number;
    meleeHits: number;
    meleeType: string;
    rangeHits?: number;
    rangeType?: string;
    range?: number;
    traits: string[];
    stats: INpcStats[];
    activeAbilities: string[];
    passiveAbilities: string[];
    icon: string;
}

export interface INpcDataRaw {
    id: string;
    Name: string;
    Faction: string;
    Alliance: string;
    'Melee Damage'?: string;
    'Melee Hits'?: number;
    'Ranged Damage'?: string;
    'Ranged Hits'?: number;
    Distance?: number;
    Movement: number;
    Traits?: string[];
    Stats: INpcStatsRaw[];
    Icon: string;
    'Active Ability Damage'?: string[];
    'Active Abilities'?: string[];
    'Passive Ability Damage'?: string[];
    'Passive Abilities'?: string[];
}
