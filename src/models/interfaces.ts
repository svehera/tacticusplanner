import React from 'react';

import { GameModeTokensAction } from '@/reducers/game-mode-tokens-reducer';
import { LeSettingsAction } from '@/reducers/le-settings.reducer';
import { RosterSnapshotsAction } from '@/reducers/roster-snapshots-reducer';
import { Teams2Action } from '@/reducers/teams2.reducer';
import { XpIncomeAction } from '@/reducers/xp-income-reducer';
import { XpUseAction } from '@/reducers/xp-use-reducer';
import { GuildAction } from 'src/reducers/guildReducer';
import { GuildWarAction } from 'src/reducers/guildWarReducer';
import { MowsAction } from 'src/reducers/mows.reducer';
import { TeamsAction } from 'src/reducers/teams.reducer';

import { TacticusTokensState } from '@/fsd/5-shared/lib/tacticus-api/tacticus-api.models';
import { Alliance, Rank, Rarity, RarityStars } from '@/fsd/5-shared/model';

import {
    ICampaignsProgress,
    ICampaignsFilters,
    CampaignGroupType,
    CampaignType,
    ICampaignBattleComposed,
} from '@/fsd/4-entities/campaign';
import { CharacterBias, ICharacter2 } from '@/fsd/4-entities/character';
import { LegendaryEventEnum } from '@/fsd/4-entities/lre';
import { IMow, IMow2, IMowDb } from '@/fsd/4-entities/mow';

import { IItemRaidLocation } from '@/fsd/3-features/goals/goals.models';
import { IGWLayout, IGWTeam } from '@/fsd/3-features/guild-war/guild-war.models';
import { IAutoTeamsPreferences, ILegendaryEventSelectedRequirements, ILreTeam } from '@/fsd/3-features/lre';
import { ILreProgressDto } from '@/fsd/3-features/lre-progress';
import { IPersonalTeam } from '@/fsd/3-features/teams/teams.models';
import { IViewPreferences } from '@/fsd/3-features/view-settings';

import { XpUseState } from '@/fsd/1-pages/input-resources';
import { IRosterSnapshotsState } from '@/fsd/1-pages/input-roster-snapshots/models';
import { XpIncomeState } from '@/fsd/1-pages/input-xp-income';
import { ITeam2 } from '@/fsd/1-pages/plan-teams2/models';

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

type ITableRow<T = ICharacter2 | string> = Record<string, T>;

export interface IPersonalData {
    version?: string;
    autoTeamsPreferences: IAutoTeamsPreferences;
    viewPreferences: IViewPreferences;
    selectedTeamOrder: ISelectedTeamsOrdering;
    characters: IPersonalCharacter[];
    charactersPriorityList: string[];
    goals: IPersonalGoal[];
    teams2: ITeam2[];
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
    teams2: ITeam2[];
    selectedTeamOrder: ISelectedTeamsOrdering;
    leSelectedTeams: LegendaryEventData<ILegendaryEventSelectedTeams>;
    leProgress: LegendaryEventData<ILreProgressDto>;
    leSelectedRequirements: LegendaryEventData<ILegendaryEventSelectedRequirements>;
    leSettings: ILegendaryEventSettings;
    campaignsProgress: ICampaignsProgress;
    inventory: IInventory;
    dailyRaids: IDailyRaids;
    guildWar: IGuildWar;
    guild: IGuild;
    xpIncome: XpIncomeState;
    xpUse: XpUseState;
    rosterSnapshots: IRosterSnapshotsState;
    gameModeTokens: IGameModeTokensState;
}

export interface IDispatchContext {
    characters: React.Dispatch<CharactersAction>;
    mows: React.Dispatch<MowsAction>;
    teams: React.Dispatch<TeamsAction>;
    teams2: React.Dispatch<Teams2Action>;
    viewPreferences: React.Dispatch<ViewPreferencesAction>;
    dailyRaidsPreferences: React.Dispatch<DailyRaidsPreferencesAction>;
    autoTeamsPreferences: React.Dispatch<AutoTeamsPreferencesAction>;
    selectedTeamOrder: React.Dispatch<SelectedTeamsOrderingAction>;
    leSelectedRequirements: React.Dispatch<LeSelectedRequirementsAction>;
    leSelectedTeams: React.Dispatch<LeSelectedTeamsAction>;
    leProgress: React.Dispatch<LeProgressAction>;
    leSettings: React.Dispatch<LeSettingsAction>;
    campaignsProgress: React.Dispatch<CampaignsProgressAction>;
    goals: React.Dispatch<GoalsAction>;
    inventory: React.Dispatch<InventoryAction>;
    dailyRaids: React.Dispatch<DailyRaidsAction>;
    guildWar: React.Dispatch<GuildWarAction>;
    guild: React.Dispatch<GuildAction>;
    xpIncome: React.Dispatch<XpIncomeAction>;
    xpUse: React.Dispatch<XpUseAction>;
    rosterSnapshots: React.Dispatch<RosterSnapshotsAction>;
    gameModeTokens: React.Dispatch<GameModeTokensAction>;
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
    teams2: ITeam2[];
    leTeams: LegendaryEventData<ILegendaryEventSelectedTeams>;
    leProgress: LegendaryEventData<ILreProgressDto>;
    leSelectedRequirements: LegendaryEventData<ILegendaryEventSelectedRequirements>;
    leSettings: ILegendaryEventSettings;
    campaignsProgress: ICampaignsProgress;
    inventory: IInventory;
    dailyRaids: IDailyRaids;
    guildWar: IGuildWar;
    guild: IGuild;
    xpIncome: XpIncomeState;
    xpUse: XpUseState;
    rosterSnapshots: IRosterSnapshotsState;
    gameModeTokens: IGameModeTokensState;
}

export interface IGameModeTokensState {
    tokens?: TacticusTokensState;
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

interface ILegendaryEventsData {
    jainZar: ILegendaryEventData;
    aunShi: ILegendaryEventData;
    shadowSun: ILegendaryEventData;
}

type ILegendaryEventsData3 = Record<LegendaryEventEnum, ILegendaryEventSelectedTeams>;

export type SelectedTeams = Record<string, string[]>;

export interface ILegendaryEventSelectedTeams {
    id: LegendaryEventEnum;
    name: string;
    teams: ILreTeam[];
    alpha: SelectedTeams;
    beta: SelectedTeams;
    gamma: SelectedTeams;
}

interface ILegendaryEventData {
    selectedTeams: ITableRow<string>[];
}

export enum IDailyRaidsFarmOrder {
    goalPriority,
    totalMaterials,
    homeScreenEvent,
}

export enum IDailyRaidsHomeScreenEvent {
    none,
    purgeOrder,
    trainingRush,
    warpSurge,
    machineHunt,
}

export enum ITrainingRushStrategy {
    maximizeRewards,
    maximizeXpForCharacter,
}
interface IPurgeOrderPreferences {
    // Only consider battles with at least this mean Tyranids worth rearranging for.
    minimumTyranidCount: number;
}

export interface ITrainingRushPreferences {
    strategy: ITrainingRushStrategy;

    // Only matters when strategy is maximizeXpForCharacter
    characterId?: string;
}
interface IWarpSurgePreferences {
    // Only consider battles with at least this mean chaos enemies worth rearranging for.
    minimumChaosEnemyCount: number;
}
interface IMachineHuntPreferences {
    // Only consider battles with at least this mean mechanical enemies worth rearranging for.
    minimumMechanicalEnemyCount: number;
}
interface IDailyRaidsFarmPreferences {
    order: IDailyRaidsFarmOrder;
    homeScreenEvent: IDailyRaidsHomeScreenEvent;
    purgeOrderPreferences?: IPurgeOrderPreferences;
    trainingRushPreferences?: ITrainingRushPreferences;
    warpSurgePreferences?: IWarpSurgePreferences;
    machineHuntPreferences?: IMachineHuntPreferences;
}

export interface IDailyRaidsPreferences {
    dailyEnergy: number;
    shardsEnergy: number;
    farmPreferences: IDailyRaidsFarmPreferences;
    farmStrategy: DailyRaidsStrategy;
    customSettings?: ICustomDailyRaidsSettings;
    campaignEvent?: CampaignGroupType | 'none';
}

export type ICustomDailyRaidsSettings = Record<Rarity, CampaignType[]>;

export interface ISelectedTeamsOrdering {
    orderBy: 'name' | 'rank' | 'rarity';
    direction: 'asc' | 'desc';
}

type IPersonalCharacter = IPersonalCharacterData;

interface IPersonalCharacterData {
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

export interface IPersonalCharacterDataEquipment {
    id: string;
    level: number;
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
    equipment: IPersonalCharacterDataEquipment[];
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
    startingRank?: Rank;
    startingRankPoint5?: boolean;
    targetRank?: Rank;
    rankPoint5?: boolean;
    upgradesRarity?: Rarity[];
    // ascend
    targetRarity?: Rarity;
    targetStars?: RarityStars;
    shardsPerToken?: number;
    mythicShardsPerToken?: number;

    // unlock
    campaignsUsage?: CampaignsLocationsUsage;
    mythicCampaignsUsage?: CampaignsLocationsUsage;

    // upgrade mow
    unitId?: string;
    firstAbilityLevel?: number;
    secondAbilityLevel?: number;
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
    xpBooks: Record<Rarity, number>;
    abilityBadges: Record<Alliance, Record<Rarity, number>>;
    components: Record<Alliance, number>;
    forgeBadges: Record<Rarity, number>;
    orbs: Record<Alliance, Record<Rarity, number>>;
    upgrades: Record<string, number>;
}

export interface ILegendaryEventSettings {
    defaultPageForActiveEvent: LegendaryEventDefaultPage;
    defaultPageWhenEventNotActive: LegendaryEventDefaultPage;
    showP2POptions: boolean;
}

export enum LegendaryEventDefaultPage {
    TEAMS,
    PROGRESS,
    TOKENOMICS,
}

// Re-export types from FSD entities
export type {
    ICampaignsProgress,
    ICampaignsFilters,
    ICampaignBattleComposed,
    ICharacter2,
    ILreTeam,
    ILegendaryEventSelectedRequirements,
    IAutoTeamsPreferences,
};

export type { IViewPreferences } from '@/fsd/3-features/view-settings';
