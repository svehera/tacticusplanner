import { ITableRow } from '../static-data/interfaces';

export interface IPersonalData {
    viewPreferences: IViewPreferences;
    autoTeamsPreferences: IAutoTeamsPreferences;
    characters: IPersonalCharacterData[];
    legendaryEvents: ILegendaryEventsData;
}

export interface ILegendaryEventsData {
    jainZar: ILegendaryEventData;
    aunShi: ILegendaryEventData;
    shadowSun: ILegendaryEventData;
}

export interface ILegendaryEventData {
    selectedTeams: ITableRow<string>[];
}

export interface IViewPreferences {
    onlyUnlocked: boolean;
    usedInCampaigns: boolean;
}

export interface IAutoTeamsPreferences {
    preferCampaign: boolean;
    ignoreRank: boolean;
    ignoreRecommended: boolean;
}

export interface IPersonalCharacterData {
    name: string;
    unlocked?: boolean;
    rank: Rank;
    leSelection: LegendaryEvents;
    alwaysRecommend: boolean;
    neverRecommend: boolean;
}

export enum LegendaryEvents {
    None = 0,
    JainZar = 1 << 0,
    AunShi = 1 << 1,
    ShadowSun = 1 << 2,
}

export enum Rank {
    Undefined,
    Stone1,
    Stone2,
    Stone3,
    Iron1,
    Iron2,
    Iron3,
    Bronze1,
    Bronze2,
    Bronze3,
    Silver1,
    Silver2,
    Silver3,
    Gold1,
    Gold2,
    Gold3,
    Diamond1,
    Diamond2,
    Diamond3,
}