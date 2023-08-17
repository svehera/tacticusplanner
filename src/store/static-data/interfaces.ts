import { Alliance, DamageTypeRaw, DamageTypes, Faction, Rarity, Traits, TraitTypeRaw } from './enums';
import { IPersonalCharacterData } from '../personal-data/personal-data.interfaces';

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


export interface IUnitData {
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

export type ICharacter = IUnitData & IPersonalCharacterData;


export interface ILegendaryEvent {
    alphaTrack: ILegendaryEventTrack;   
    betaTrack: ILegendaryEventTrack;   
    gammaTrack: ILegendaryEventTrack;

    getAllowedUnits(): Array<IUnitData & Partial<IPersonalCharacterData>>;
}

export interface ILegendaryEventTrack {
    getAllowedUnits:() => IUnitData[];
    unitsRestrictions: Array<ILegendaryEventTrackRestriction>;
}

export interface ILegendaryEventTrackRestriction {
    name: string,
    points: number,
    units: IUnitData[],
}