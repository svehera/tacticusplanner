import { Alliance, DamageTypeRaw, DamageTypes, Equipment, Faction, Rarity, Traits, TraitTypeRaw } from './enums';
import { IPersonalCharacterData, LegendaryEvents, Rank } from '../personal-data/personal-data.interfaces';
 
export type LegendaryEventSection = '(Alpha)' | '(Beta)' | '(Gamma)';


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
    'Equipment1': Equipment;
    'Equipment2': Equipment;
    'Equipment3': Equipment;
    Number: number;
    ForcedSummons: boolean;
    RequiredInCampaign: boolean;
}


export interface IUnitData {
    alliance: Alliance;
    faction: Faction;
    factionColor: string,
    name: string;
    numberAdded: number;
    health: number;
    damage: number;
    armour: number;
    damageTypes: DamageTypes,
    meleeDamage: DamageTypes,
    rangeDamage: DamageTypes,
    abilitiesDamage: DamageTypes,
    traits: Traits,
    equipment1: Equipment;
    equipment2: Equipment;
    equipment3: Equipment;
    meleeHits: number,
    rangeHits?: number,
    rangeDistance?: number,
    movement: number,
    forcedSummons: boolean;
    requiredInCampaign: boolean;
    legendaryEvents: ICharLegendaryEvents;
}

export interface IDirtyDozenChar {
    Name: string
    Rank: number
    Pvp: number
    GRTyranid: number
    GRNecron: number
    GROrk: number
    GRMortarion: number
}


export type ICharacter = IUnitData & IPersonalCharacterData;

export type ICharLegendaryEvents = Record<LegendaryEvents, ICharLegendaryEvent>;

export interface ICharLegendaryEvent {
    points: number;
    slots: number;
}

export interface ILegendaryEvent {
    id: LegendaryEvents;
    alphaTrack: ILegendaryEventTrack;   
    betaTrack: ILegendaryEventTrack;   
    gammaTrack: ILegendaryEventTrack;
    
    selectedTeams: ITableRow[];
    allowedUnits: Array<ICharacter>;

    getSelectedCharactersPoints(): Array<{
        name: string,
        points: number,
        rank: Rank,
        timesSelected: number
    }>
}

export interface ILegendaryEventTrack {
    section: LegendaryEventSection;
    name: string;
    killPoints: number;
    allowedUnits: ICharacter[];
    unitsRestrictions: Array<ILegendaryEventTrackRestriction>;
    
    getCharacterPoints(char: ICharacter): number;
    getCharacterSlots(char: ICharacter): number;
    getRestrictionPoints (name: string): number
}

export interface ILegendaryEventTrackRestriction {
    name: string,
    points: number,
    units: ICharacter[],
}

export type ITableRow = Record<string, ICharacter | string>;
