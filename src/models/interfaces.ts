import React from 'react';

import { GuildAction } from 'src/reducers/guildReducer';
import { GuildWarAction } from 'src/reducers/guildWarReducer';
import { MowsAction } from 'src/reducers/mows.reducer';
import { TeamsAction } from 'src/reducers/teams.reducer';

import { Rank, Rarity, RarityStars } from '@/fsd/5-shared/model';

import {
    ICampaignsProgress,
    ICampaignsFilters,
    CampaignGroupType,
    CampaignType,
    ICampaignBattleComposed,
    IDetailedEnemy,
} from '@/fsd/4-entities/campaign';
import { CharacterBias, ICharacter2, ICharLegendaryEvent } from '@/fsd/4-entities/character';
import { LegendaryEventEnum } from '@/fsd/4-entities/lre';
import { IMow, IMow2, IMowDb } from '@/fsd/4-entities/mow';
import { IMaterialFull, IMaterialRecipeIngredientFull, IMaterialEstimated2 } from '@/fsd/4-entities/upgrade';

import { IAutoTeamsPreferences, ILegendaryEventSelectedRequirements, ILreTeam } from '@/fsd/3-features/lre';
import { ILreProgressDto } from '@/fsd/3-features/lre-progress';
import { IViewPreferences } from '@/fsd/3-features/view-settings';
import { IItemRaidLocation } from 'src/v2/features/goals/goals.models';
import { IGWLayout, IGWTeam } from 'src/v2/features/guild-war/guild-war.models';
import { IPersonalTeam } from 'src/v2/features/teams/teams.models';

import { AutoTeamsPreferencesAction } from '../reducers/auto-teams-settings.reducer';
import { CampaignsProgressAction } from '../reducers/campaigns-progress.reducer';
import { CharactersAction } from '../reducers/characters.reducer';
import { DailyRaidsPreferencesAction } from '../reducers/daily-raids-settings.reducer';
import { DailyRaidsAction } from '../reducers/dailyRaids.reducer';
import { GoalsAction } from '../reducers/goals.reducer';
import { InventoryAction } from '../reducers/inventory.reducer';
import { LeProgressAction } from '../reducers/le-progress.reducer';
import { LeSelectedRequirementsAction } from '../reducers/le-selected-requirements.reducer';
import { LeSelectedTeamsAction } from '../reducers/le-selected-teams.reducer';
import { SelectedTeamsOrderingAction } from '../reducers/selected-teams-order.reducer';
import { ViewPreferencesAction } from '../reducers/view-settings.reducer';

import { CampaignsLocationsUsage, DailyRaidsStrategy, Difficulty, PersonalGoalType } from './enums';

export type ITableRow<T = ICharacter2 | string> = Record<string, T>;

export interface IPersonalData {
    version?: string;
    autoTeamsPreferences: IAutoTeamsPreferences;
    viewPreferences: IViewPreferences;
    selectedTeamOrder: ISelectedTeamsOrdering;
    characters: IPersonalCharacter[];
    charactersPriorityList: string[];
    goals: IPersonalGoal[];
    legendaryEvents: ILegendaryEventsData | undefined;
    legendaryEvents3: ILegendaryEventsData3 | undefined;
    legendaryEventsProgress: LegendaryEventData<ILreProgressDto>;
    legendaryEventSelectedRequirements: Record<LegendaryEventEnum, ILegendaryEventSelectedRequirements>;
    modifiedDate?: Date | string;
}

export type LegendaryEventData<T> = Partial<Record<LegendaryEventEnum, T>>;

export type SetStateAction<T> = { type: 'Set'; value: T };

export interface IGlobalState {
    modifiedDate?: Date;
    seenAppVersion?: string | null;
    autoTeamsPreferences: IAutoTeamsPreferences;
    viewPreferences: IViewPreferences;
    dailyRaidsPreferences: IDailyRaidsPreferences;
    characters: Array<ICharacter2>;
    mows: Array<IMow | IMow2>;
    goals: IPersonalGoal[];
    teams: IPersonalTeam[];
    selectedTeamOrder: ISelectedTeamsOrdering;
    leSelectedTeams: LegendaryEventData<ILegendaryEventSelectedTeams>;
    leProgress: LegendaryEventData<ILreProgressDto>;
    leSelectedRequirements: LegendaryEventData<ILegendaryEventSelectedRequirements>;
    campaignsProgress: ICampaignsProgress;
    inventory: IInventory;
    dailyRaids: IDailyRaids;
    guildWar: IGuildWar;
    guild: IGuild;
}

export interface IDispatchContext {
    characters: React.Dispatch<CharactersAction>;
    mows: React.Dispatch<MowsAction>;
    teams: React.Dispatch<TeamsAction>;
    viewPreferences: React.Dispatch<ViewPreferencesAction>;
    dailyRaidsPreferences: React.Dispatch<DailyRaidsPreferencesAction>;
    autoTeamsPreferences: React.Dispatch<AutoTeamsPreferencesAction>;
    selectedTeamOrder: React.Dispatch<SelectedTeamsOrderingAction>;
    leSelectedRequirements: React.Dispatch<LeSelectedRequirementsAction>;
    leSelectedTeams: React.Dispatch<LeSelectedTeamsAction>;
    leProgress: React.Dispatch<LeProgressAction>;
    campaignsProgress: React.Dispatch<CampaignsProgressAction>;
    goals: React.Dispatch<GoalsAction>;
    inventory: React.Dispatch<InventoryAction>;
    dailyRaids: React.Dispatch<DailyRaidsAction>;
    guildWar: React.Dispatch<GuildWarAction>;
    guild: React.Dispatch<GuildAction>;
    seenAppVersion: React.Dispatch<React.SetStateAction<string | undefined | null>>;
    setStore: (data: IGlobalState, modified: boolean, reset: boolean) => void;
}

export interface IPersonalData2 {
    schemaVersion: 2;
    modifiedDate?: Date;
    seenAppVersion?: string | null;
    autoTeamsPreferences: IAutoTeamsPreferences;
    viewPreferences: IViewPreferences;
    dailyRaidsPreferences: IDailyRaidsPreferences;
    selectedTeamOrder: ISelectedTeamsOrdering;
    characters: Partial<IPersonalCharacterData2>[];
    mows: IMowDb[];
    goals: IPersonalGoal[];
    teams: IPersonalTeam[];
    leTeams: LegendaryEventData<ILegendaryEventSelectedTeams>;
    leProgress: LegendaryEventData<ILreProgressDto>;
    leSelectedRequirements: LegendaryEventData<ILegendaryEventSelectedRequirements>;
    campaignsProgress: ICampaignsProgress;
    inventory: IInventory;
    dailyRaids: IDailyRaids;
    guildWar: IGuildWar;
    guild: IGuild;
}

export interface IGuild {
    members: IGuildMember[];
}

export interface IGuildMember {
    username: string;
    shareToken: string;
    userId?: string;
    inGameName?: string;
    index: number;
}

export interface IGuildWar {
    zoneDifficulty: Difficulty;
    attackTokens: number;
    deployedCharacters: string[];
    teams: IGWTeam[];
    layouts: IGWLayout[];
}

export interface IDailyRaids {
    filters: ICampaignsFilters;
    raidedLocations: IItemRaidLocation[];
    lastRefreshDateUTC: string;
}

export interface ILegendaryEventsData {
    jainZar: ILegendaryEventData;
    aunShi: ILegendaryEventData;
    shadowSun: ILegendaryEventData;
}

export type ILegendaryEventsData3 = Record<LegendaryEventEnum, ILegendaryEventSelectedTeams>;

export type SelectedTeams = Record<string, string[]>;

export interface ILegendaryEventSelectedTeams {
    id: LegendaryEventEnum;
    name: string;
    teams: ILreTeam[];
    alpha: SelectedTeams;
    beta: SelectedTeams;
    gamma: SelectedTeams;
}

export interface ILegendaryEventData {
    selectedTeams: ITableRow<string>[];
}

export interface IDailyRaidsPreferences {
    dailyEnergy: number;
    shardsEnergy: number;
    farmByPriorityOrder: boolean;
    farmStrategy: DailyRaidsStrategy;
    customSettings?: ICustomDailyRaidsSettings;
    campaignEvent?: CampaignGroupType | 'none';
}

export type ICustomDailyRaidsSettings = Record<Rarity, CampaignType[]>;

export interface ISelectedTeamsOrdering {
    orderBy: 'name' | 'rank' | 'rarity';
    direction: 'asc' | 'desc';
}

export type IPersonalCharacter = IPersonalCharacterData;

export interface IPersonalCharacterData {
    name: string;
    unlocked: boolean;
    progress: boolean;
    rank: Rank;
    rarity: Rarity;
    rarityStars: RarityStars;
    alwaysRecommend?: boolean;
    neverRecommend?: boolean;
    bias: CharacterBias;
}

export interface IPersonalCharacterData2 {
    name: string;
    rank: Rank;
    rarity: Rarity;
    stars: RarityStars;
    level: number;
    xp: number;
    bias: CharacterBias;
    upgrades: string[];
    activeAbilityLevel: number;
    passiveAbilityLevel: number;
    shards: number;
    mythicShards: number;
}

export interface IInsightsData {
    numberOfUnlocked?: number;
    ownedBy?: string[];
    statsByOwner?: Array<{
        owner: string;
        rank: Rank;
        activeAbilityLevel: number;
        passiveAbilityLevel: number;
        primaryAbilityLevel: number;
        secondaryAbilityLevel: number;
    }>;
}
export interface ICharProgression {
    shards?: number;
    mythicShards?: number;
    orbs?: number;
    rarity?: Rarity;
}

export interface IPersonalGoal {
    id: string;
    character: string;
    type: PersonalGoalType;
    priority: number;
    dailyRaids: boolean;
    notes?: string;
    // upgrade rank
    targetRank?: Rank;
    rankPoint5?: boolean;
    upgradesRarity?: Rarity[];
    // ascend
    targetRarity?: Rarity;
    targetStars?: RarityStars;
    shardsPerToken?: number;

    // unlock
    campaignsUsage?: CampaignsLocationsUsage;

    // upgrade mow
    unitId?: string;
    firstAbilityLevel?: number;
    secondAbilityLevel?: number;
}

export interface IDailyRaid {
    raids: IMaterialRaid[];
    energyLeft: number;
    raidsCount: number;
}

export interface IMaterialRaid {
    materialId: string;
    materialLabel: string;
    materialRarity: Rarity;
    totalCount: number;
    materialIconPath: string;
    characterIconPath?: string;
    characters: string[];
    locations: Array<IRaidLocation>;
    materialRef?: IMaterialEstimated2;
}

export interface IRaidLocation {
    id: string;
    campaign: string;
    battleNumber: number;
    raidsCount: number;
    farmedItems: number;
    energySpent: number;
}

export interface IEstimatedRanks {
    raids: IDailyRaid[];
    upgrades: IMaterialFull[];
    materials: IMaterialEstimated2[];
    totalEnergy: number;
    totalUnusedEnergy: number;
    totalRaids: number;
}

export interface IEstimatedRanksSettings {
    completedLocations: IItemRaidLocation[];
    campaignsProgress: ICampaignsProgress;
    dailyEnergy: number;
    preferences: IDailyRaidsPreferences;
    filters?: ICampaignsFilters;
    upgrades: Record<string, number>;
}

export interface IInventory {
    upgrades: Record<string, number>;
}

// Re-export types from FSD entities
export type {
    ICampaignsProgress,
    ICampaignsFilters,
    ICampaignBattleComposed,
    IDetailedEnemy,
    ICharacter2,
    ICharLegendaryEvent,
    IMow,
    IMowDb,
    IMaterialFull,
    IMaterialRecipeIngredientFull,
    ILreTeam,
    ILegendaryEventSelectedRequirements,
    IAutoTeamsPreferences,
};

export type {
    IViewPreferences,
    IViewOption,
    ILreViewSettings,
    IWyoViewSettings,
    ILreTileSettings,
} from '@/fsd/3-features/view-settings';
