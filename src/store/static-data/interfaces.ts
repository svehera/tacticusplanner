import {
    Alliance,
    DamageType,
    Equipment,
    Faction,
    Rarity,
    Trait
} from './enums';
import {
    IAutoTeamsPreferences,
    IPersonalCharacterData,
    LegendaryEvents,
    Rank
} from '../personal-data/personal-data.interfaces';

export type LegendaryEventSection = '(Alpha)' | '(Beta)' | '(Gamma)';


export interface UnitDataRaw {
    Name: string;
    Faction: Faction;
    Alliance: Alliance;
    Health: number;
    Damage: number;
    Armour: number;
    'Initial rarity': Rarity;
    'Melee Damage': DamageType;
    'Melee Hits': number;
    'Ranged Damage'?: DamageType;
    'Ranged Hits'?: number;
    Distance?: number;
    Movement: number;
    'Trait 1'?: Trait;
    'Trait 2'?: Trait;
    'Trait 3'?: Trait;
    'Trait 4'?: Trait;
    Traits: Trait[],
    'Active Ability'?: DamageType;
    'Passive Ability'?: DamageType;
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
    damageTypes: IDamageTypes,
    traits: Trait[],
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

export interface IDamageTypes {
    all: DamageType[],
    melee: DamageType,
    range?: DamageType,
    activeAbility?: DamageType,
    passiveAbility?: DamageType,
}

export interface IDirtyDozenChar {
    Name: string;
    Rank: number;
    Pvp: number;
    GRTyranid: number;
    GRNecron: number;
    GROrk: number;
    GRMortarion: number;
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
    suggestedTeams: ITableRow[];
    allowedUnits: Array<ICharacter>;

    getSelectedCharactersPoints(): Array<{
        name: string,
        points: number,
        rank: Rank,
        timesSelected: number
    }>;
}

export interface ILegendaryEventTrack {
    section: LegendaryEventSection;
    name: string;
    killPoints: number;
    allowedUnits: ICharacter[];
    unitsRestrictions: Array<ILegendaryEventTrackRestriction>;

    getCharacterPoints(char: ICharacter): number;

    getCharacterSlots(char: ICharacter): number;

    getRestrictionPoints(name: string): number;

    suggestTeams(event: LegendaryEvents, settings: IAutoTeamsPreferences): Array<ICharacter[]>;
}

export interface ILegendaryEventTrackRestriction {
    name: string,
    points: number,
    units: ICharacter[],
}

export type ITableRow<T = ICharacter | string> = Record<string, T>;
