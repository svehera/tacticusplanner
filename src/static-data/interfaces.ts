import { Alliance, DamageTypeRaw, DamageTypes, Faction, Rarity, Traits, TraitTypeRaw } from './enums';

export interface UnitDataRaw {
    Name: string;
    Faction: Faction;
    Alliance: Alliance;
    Health: number;
    Damage: number;
    Armour: number;
    'Initial rarity': Rarity;
    'Melee Damage': DamageTypeRaw;
    'Melee Hits': number;
    'Ranged Damage'?: DamageTypeRaw;
    'Ranged Hits'?: number;
    Distance?: number;
    Movement: number;
    'Trait 1'?: TraitTypeRaw;
    'Trait 2'?: TraitTypeRaw;
    'Trait 3'?: TraitTypeRaw;
    'Trait 4'?: TraitTypeRaw;
    'Active Ability'?: DamageTypeRaw;
    'Passive Ability'?: DamageTypeRaw;
    Number: number;
    ForcedSummons: boolean;
}


export interface UnitData {
    alliance: Alliance;
    faction: Faction;
    factionColor: string,
    name: string;
    numberAdded: number;
    damageTypes: DamageTypes,
    traits: Traits,
    meleeHits: number,
    rangeHits?: number,
    rangeDistance?: number,
    movement: number,
    forcedSummons: boolean;
}


export interface LegendaryEvent {
    alphaTrack: LegendaryEventTrack;   
    betaTrack: LegendaryEventTrack;   
    gammaTrack: LegendaryEventTrack;   
}

export interface LegendaryEventTrack {
    getAllowedUnits:() => UnitData[];
    unitsRestrictions: Array<LegendaryEventTrackRestriction>;
}

export interface LegendaryEventTrackRestriction {
    name: string,
    points: number,
    units: UnitData[],
}