import React from 'react';

import { GuildAction } from 'src/reducers/guildReducer';
import { GuildWarAction } from 'src/reducers/guildWarReducer';
import { MowsAction } from 'src/reducers/mows.reducer';
import { TeamsAction } from 'src/reducers/teams.reducer';

import { Alliance, Faction, Rank, Rarity, RarityStars } from '@/fsd/5-shared/model';

import {
    ICampaignsProgress,
    ICampaingsFilters,
    CampaignGroupType,
    CampaignType,
    ICampaignBattleComposed,
    IDetailedEnemy,
} from '@/fsd/4-entities/campaign';
import { CharacterBias, ICharacter2, ICharLegendaryEvent } from '@/fsd/4-entities/character';
import { LegendaryEventEnum, LreTrackId } from '@/fsd/4-entities/lre';
import { IMow, IMowDb } from '@/fsd/4-entities/mow';
import { IMaterialFull, IMaterialRecipeIngredientFull } from '@/fsd/4-entities/upgrade';

import { ILreProgressDto } from '@/fsd/3-features/lre-progress';
import { CharactersFilterBy } from 'src/v2/features/characters/enums/characters-filter-by';
import { CharactersOrderBy } from 'src/v2/features/characters/enums/characters-order-by';
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

import { CampaignsLocationsUsage, DailyRaidsStrategy, Difficulty, EquipmentClass, PersonalGoalType } from './enums';

export interface INpcDataRaw {
    name: string;
    faction: string;
    alliance: string;
    movement: number;
    meleeHits: number;
    meleeType: string;
    rangeHits?: number;
    rangeType?: string;
    range?: number;
    health: number;
    damage: number;
    armor: number;
    critChance?: number;
    critDamage?: number;
    blockChance?: number;
    blockDamage?: number;
    traits: string[];
    activeAbilities: string[];
    passiveAbilities: string[];
}

export interface INpcsRaw {
    npcs: INpcDataRaw[];
}

export interface INpcData {
    name: string;
    faction: Faction;
    alliance: Alliance;
    movement: number;
    meleeHits: number;
    meleeType: string;
    rangeHits?: number;
    rangeType?: string;
    range?: number;
    health: number;
    damage: number;
    armor: number;
    critChance?: number;
    critDamage?: number;
    blockChance?: number;
    blockDamage?: number;
    traits: string[];
    activeAbilities: string[];
    passiveAbilities: string[];
}

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
    mows: Array<IMow>;
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
    filters: ICampaingsFilters;
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
export type SelectedRequirements = Record<string, boolean>;

export interface ILegendaryEventSelectedTeams {
    id: LegendaryEventEnum;
    name: string;
    teams: ILreTeam[];
    alpha: SelectedTeams;
    beta: SelectedTeams;
    gamma: SelectedTeams;
}

export interface ILreTeam {
    id: string;
    name: string;
    section: LreTrackId;
    restrictionsIds: string[];
    charactersIds: string[];
    /**
     * Client Side only
     */
    characters?: ICharacter2[];
}

export interface ILegendaryEventSelectedRequirements {
    id: LegendaryEventEnum;
    name: string;
    alpha: SelectedRequirements;
    beta: SelectedRequirements;
    gamma: SelectedRequirements;
}

export interface ILegendaryEventData {
    selectedTeams: ITableRow<string>[];
}

export interface IViewOption<T = IViewPreferences> {
    key: keyof T;
    value: boolean;
    label: string;
    disabled: boolean;
    tooltip?: string;
}

export interface IViewPreferences extends ILreViewSettings, ILreTileSettings, IWyoViewSettings {
    theme: 'light' | 'dark';
    // autoTeams: boolean;
    wyoFilter: CharactersFilterBy;
    wyoOrder: CharactersOrderBy;
    craftableItemsInInventory: boolean;
    inventoryShowAlphabet: boolean;
    inventoryShowPlusMinus: boolean;
    goalsTableView: boolean;
    myProgressShowCoreCharacters: boolean;
    apiIntegrationSyncOptions: string[];
}

export interface IWyoViewSettings {
    showBadges: boolean;
    showAbilitiesLevel: boolean;
    showBsValue: boolean;
    showPower: boolean;
    showCharacterLevel: boolean;
    showCharacterRarity: boolean;
}

export interface ILreViewSettings {
    lreGridView: boolean;
    showAlpha: boolean;
    showBeta: boolean;
    showGamma: boolean;
    onlyUnlocked: boolean;
    hideCompleted: boolean;
}

export interface ILreTileSettings {
    lreTileShowUnitIcon: boolean;
    lreTileShowUnitRarity: boolean;
    lreTileShowUnitRank: boolean;
    lreTileShowUnitRankBackground: boolean;
    lreTileShowUnitName: boolean;
    lreTileShowUnitBias: boolean;
    lreTileShowUnitActiveAbility: boolean;
    lreTileShowUnitPassiveAbility: boolean;
    lreTileShowUnitHealTraits: boolean;
}

export interface IAutoTeamsPreferences {
    preferCampaign: boolean;
    ignoreRarity: boolean;
    ignoreRank: boolean;
    ignoreRecommendedFirst: boolean; // ignore Bias
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
    shards: number;
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

export enum EquipmentType {
    Crit = 'Crit',
    Block = 'Block',
    CritBooster = 'Crit Booster',
    BlockBooster = 'Block Booster',
    Defensive = 'Defensive',
}

export interface IMaterialEstimated2 {
    id: string;
    label: string;
    expectedEnergy: number;
    numberOfBattles: number;
    totalEnergy: number;
    dailyEnergy: number;
    locations: ICampaignBattleComposed[];
    possibleLocations: ICampaignBattleComposed[];
    unlockedLocations: string[];
    locationsString: string;
    missingLocationsString: string;
    daysOfBattles: number;
    dailyBattles: number;
    count: number;
    craftedCount: number;
    rarity: Rarity;
    // energyPerBattle: number;
    quantity: number;
    countLeft: number;
    iconPath: string;
    characters: string[];
    priority: number;
    isBlocked: boolean;
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
    filters?: ICampaingsFilters;
    upgrades: Record<string, number>;
}

export interface IInventory {
    upgrades: Record<string, number>;
}

/**
 * Information about equipment coming directly from a spreadsheet, with a tiny
 * bit of massaging into JSON. Most of this was gathered by Towen (thanks so
 * much).
 */
export interface IEquipmentRaw {
    /** What kind of equipment this is (e.g. Crit). */
    slot: string;

    /** The class of equipment, e.g. Greaves, VoidBlade. */
    clazz: string;

    /**
     * The ID that SP uses to identify this object. You can use this ID to
     * determine the icon path.
     */
    snowprintId: number;

    /** The in-game name of the item. */
    displayName: string;

    /** The rarity of the item. */
    rarity: string;

    /** For equipment with RNG, the chance (or boost to chance) they provide. */
    chance: number;

    /** The factions that can equip this item. */
    factions: string[];

    /**
     * The primary boost this item gives. For defensive items, this is health.
     * So it's expected that this can be empty (e.g. for greaves).
     *
     * The index represents the level of the item.
     */
    boost1: number[];

    /**
     * The secondary boost this item gives. For defensive items, this is armor.
     * Most items do not yield two boosts, so this is often empty.
     *
     * The index represents the level of the item.
     */
    boost2: number[];
}

/**
 * Similar to IEquipmentRaw, but with the types converted to enums.
 */
export interface IEquipment {
    /** See @IEquipmentRaw.slot. */
    slot: EquipmentType;

    /** See @IEquipmentRaw.clazz. */
    clazz: EquipmentClass;

    /** See @IEquipmentRaw.snowprintId. */
    snowprintId: number;

    /** See @IEquipmentRaw.displayName. */
    displayName: string;

    /** See @IEquipmentRaw.rarity. */
    rarity: Rarity;

    /** See @IEquipmentRaw.chance. */
    chance?: number;

    /** See @IEquipmentRaw.factions. */
    factions: Faction[];

    /** See @IEquipmentRaw.boost1. */
    boost1: number[];

    /** See @IEquipmentRaw.boost2. */
    boost2: number[];
}

// Re-export types from FSD entities
export type {
    ICampaignsProgress,
    ICampaingsFilters,
    ICampaignBattleComposed,
    IDetailedEnemy,
    ICharacter2,
    ICharLegendaryEvent,
    IMow,
    IMowDb,
    IMaterialFull,
    IMaterialRecipeIngredientFull,
};
