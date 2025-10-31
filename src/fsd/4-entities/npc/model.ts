import { Alliance, Faction, Rank, RarityStars } from '@/fsd/5-shared/model';

export interface INpcStats {
    abilityLevel: number;
    damage: number;
    armor: number;
    health: number;
    progressionIndex: number;
    rank: Rank;
    rarityStars: RarityStars;
}

export interface INpcData {
    snowprintId: string;
    name: string;
    faction?: Faction;
    alliance?: Alliance;
    meleeDamage?: string;
    meleeHits?: number;
    rangeDamage?: string;
    rangeHits?: number;
    rangeDistance?: number;
    movement: number;
    traits: string[];
    icon: string;
    activeAbilities: string[];
    passiveAbilities: string[];
    activeAbilityDamage?: string[];
    passiveAbilityDamage?: string[];
    stats: INpcStats[];
}

export interface INpcRawStats {
    AbilityLevel: number;
    Damage: number;
    Armor: number;
    Health: number;
    ProgressionIndex: number;
    Rank: number;
    Stars: number;
}

export interface INpcDataRaw {
    id: string;
    Name: string;
    Faction: string;
    Alliance: string;
    'Melee Damage': string;
    'Melee Hits': number;
    'Ranged Damage'?: string;
    'Ranged Hits'?: number;
    Distance?: number;
    Movement: number;
    Traits: string[];
    Stats: INpcRawStats[];
    'Active Ability Damage'?: string[];
    'Active Abilities'?: string[];
    'Passive Ability Damage'?: string[];
    'Passive Abilities'?: string[];
    Icon: string;
}
