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
    movement: number
}


export interface LegendaryEvent {
    alphaTrack: LegendaryEventTrack;   
    betaTrack: LegendaryEventTrack;   
    gammaTrack: LegendaryEventTrack;   
}

export interface LegendaryEventTrack {
    factionRestriction: (unit: UnitData) => boolean; 
    unitsRestrictions: Array<LegendaryEventTrackRestriction>
}

export interface LegendaryEventTrackRestriction {
    name: string,
    points: number,
    restriction: (unit: UnitData) => boolean;
}