import React from 'react';

import { GuildAction } from 'src/reducers/guildReducer';
import { GuildWarAction } from 'src/reducers/guildWarReducer';
import { MowsAction } from 'src/reducers/mows.reducer';
import { TeamsAction } from 'src/reducers/teams.reducer';

import { Alliance, RarityString, Rarity, RarityStars } from '@/fsd/5-shared/model';

import { DamageType, Trait, Rank, CharacterBias } from '@/fsd/4-entities/character';
import { Faction } from '@/fsd/4-entities/faction';
import { LegendaryEventEnum, LreTrackId } from '@/fsd/4-entities/lre';

import { ILreProgressDto } from '@/fsd/3-features/lre-progress';
import { CampaignGroupType } from 'src/v2/features/campaigns/campaigns.enums';
import { IMow, IMowDb } from 'src/v2/features/characters/characters.models';
import { CharactersFilterBy } from 'src/v2/features/characters/enums/characters-filter-by';
import { CharactersOrderBy } from 'src/v2/features/characters/enums/characters-order-by';
import { UnitType } from 'src/v2/features/characters/units.enums';
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

import {
    Campaign,
    CampaignsLocationsUsage,
    CampaignType,
    CharacterReleaseRarity,
    DailyRaidsStrategy,
    Difficulty,
    Equipment,
    EquipmentClass,
    PersonalGoalType,
} from './enums';

export interface UnitDataRaw {
    Name: string;
    Faction: Faction;
    Alliance: Alliance;
    Health: number;
    Damage: number;
    Armour: number;
    'Short Name': string;
    'Full Name': string;
    'Initial rarity': RarityString;
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
    Traits: Trait[];
    'Active Ability'?: DamageType;
    'Passive Ability'?: DamageType;
    Equipment1: Equipment;
    Equipment2: Equipment;
    Equipment3: Equipment;
    Number: number;
    ForcedSummons: boolean;
    RequiredInCampaign: boolean;
    /**
     * The prefix of each campaign in which this character is required. Some examples:
     * - 'Maladus' would be ['Adeptus Mechanicus']
     * - 'Bellator' would be ['Indomitus', 'Tyranids']
     *
     * By using prefixes, we ensure that the elite, extremis, and challenge campaigns
     * will be included in the list of required campaigns.
     */
    CampaignsRequiredIn?: string[];
    Icon: string;
    ReleaseRarity?: CharacterReleaseRarity;
    releaseDate?: string;
    tacticusId?: string;
    lre?: ILreCharacterStaticData;
}

export interface IUnitData {
    unitType: UnitType.character;
    id: string;
    tacticusId?: string;
    alliance: Alliance;
    faction: Faction;
    name: string;
    fullName: string;
    shortName: string;
    numberAdded: number;
    health: number;
    damage: number;
    armour: number;
    initialRarity: Rarity;
    rarityStars: RarityStars;
    damageTypes: IDamageTypes;
    traits: Trait[];
    equipment1: Equipment;
    equipment2: Equipment;
    equipment3: Equipment;
    meleeHits: number;
    rangeHits?: number;
    rangeDistance?: number;
    movement: number;
    forcedSummons: boolean;
    requiredInCampaign: boolean;
    campaignsRequiredIn?: string[];
    icon: string;
    legendaryEvents: ICharLegendaryEvents;
    lre?: ILreCharacterStaticData;
    releaseRarity?: CharacterReleaseRarity;
    releaseDate?: string;
}

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

export interface ILreCharacterStaticData {
    id: LegendaryEventEnum;
    finished: boolean;
    eventStage: number;
    nextEventDate: string;
    nextEventDateUtc?: string;
}

export interface IDamageTypes {
    all: DamageType[];
    melee: DamageType;
    range?: DamageType;
    activeAbility?: DamageType;
    passiveAbility?: DamageType;
}

export type ICharLegendaryEvents = Record<LegendaryEventEnum, ICharLegendaryEvent>;

export interface ICharLegendaryEvent {
    alphaPoints: number;
    alphaSlots: number;

    betaPoints: number;
    betaSlots: number;

    gammaPoints: number;
    gammaSlots: number;

    totalPoints: number;
    totalSlots: number;
}

export type ITableRow<T = ICharacter2 | string> = Record<string, T>;
export type ICharacter2 = IUnitData & IPersonalCharacterData2 & DynamicProps;

export type DynamicProps = {
    numberOfUnlocked?: number;
    ownedBy?: string[];
    potential?: number;
    power?: number;
    teamId?: string; // LRE team id
    statsByOwner?: Array<{
        owner: string;
        rank: Rank;
        activeAbilityLevel: number;
        passiveAbilityLevel: number;
        primaryAbilityLevel: number;
        secondaryAbilityLevel: number;
    }>;
};

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
    filters: IDailyRaidsFilters;
    raidedLocations: IItemRaidLocation[];
    lastRefreshDateUTC: string;
}

export interface IDailyRaidsFilters {
    enemiesAlliance: Alliance[];
    enemiesFactions: Faction[];
    alliesAlliance: Alliance[];
    alliesFactions: Faction[];
    campaignTypes: CampaignType[];
    upgradesRarity: Rarity[];
    slotsCount?: number[];
    enemiesTypes?: string[];
    enemiesCount?: number[];
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

export type ICampaignConfigs = {
    [campaignType in `${CampaignType}`]: ICampaignConfig;
};

export interface ICampaignConfig {
    type: CampaignType | string;
    energyCost: number;
    dailyBattleCount: number;
    dropRate: IDropRate;
}

export interface IDropRate {
    common: number;
    uncommon: number;
    rare: number;
    epic: number;
    legendary: number;
    shard: number;
}

export interface ICampaignsData {
    [campaignKey: string]: ICampaignBattle;
}

/**
 * When we have more detailed information about a campaign battle, this holds
 * the information on a particular type of enemy. If @rarity is specified, it
 * means that the enemy is a character, not an NPC.
 */
export interface IDetailedEnemy {
    count: number;
    name: string;
    rank: string;
    stars: number;
    rarity?: string;
}

export interface ICampaignBattle {
    shortName?: string;
    campaign: Campaign | string;
    campaignType: CampaignType | string;
    nodeNumber: number;
    reward: string; // material name or hero name in case farming shards
    expectedGold: number;
    slots?: number;
    enemiesAlliances?: string[];
    enemiesFactions?: string[];
    enemiesTotal?: number;
    enemiesTypes?: string[];
    detailedEnemyTypes?: IDetailedEnemy[];
}

export interface ICampaignBattleComposed {
    id: string;
    campaign: Campaign;
    campaignType: CampaignType;
    energyCost: number;
    dailyBattleCount: number;
    dropRate: number;
    energyPerItem: number;
    itemsPerDay: number;
    energyPerDay: number;
    nodeNumber: number;
    rarity: string;
    rarityEnum: Rarity;
    reward: string; // material name or hero name in case farming shards
    expectedGold: number;
    slots?: number;
    enemiesFactions: Faction[];
    enemiesAlliances: Alliance[];
    alliesFactions: Faction[];
    alliesAlliance: Alliance;
    enemiesTotal: number;
    enemiesTypes: string[];
    detailedEnemyTypes?: IDetailedEnemy[];
    // new props for upgrades service
    isSuggested?: boolean;
    isUnlocked?: boolean;
    isPassFilter?: boolean;
    isCompleted?: boolean;
    isStarted?: boolean;
}

export interface IRecipeData {
    [material: string]: IMaterial;
}

export interface IMaterial {
    material: string;
    label?: string;
    tacticusId?: string;
    rarity: string;
    craftable: boolean;
    stat: string | 'Health' | 'Damage' | 'Armour' | 'Shard';
    icon?: string;
    faction?: string; // If not specific to a faction, this property can be omitted ("undefined").
    recipe?: Array<IMaterialRecipeIngredient>; // If material is not craftable, recipe can be omitted ("undefined").
    locations?: Array<string>; // Campaign locations can be in short form (IM12) or long (Indomitus mirros) depedings how you decide to update battleData json.
}

export interface IMaterialRecipeIngredient {
    material: string | 'Gold'; // material name;
    count: number;
}

export interface IRecipeDataFull {
    [material: string]: IMaterialFull;
}

export interface IMaterialFull {
    id: string;
    label: string;
    rarity: Rarity;
    craftable: boolean;
    stat: string | 'Health' | 'Damage' | 'Armour' | 'Shard';
    faction?: string; // if not specifor to faction then this property can be omitted ("undefined");
    recipe?: Array<IMaterialRecipeIngredientFull>; // if material is not craftable recipe can be omitted ("undefined")
    allMaterials?: IMaterialRecipeIngredientFull[];
    iconPath: string;
    character?: string;
    priority?: number;
}

export interface IMaterialRecipeIngredientFull {
    id: string;
    label: string | 'Gold';
    count: number;
    rarity: Rarity;
    stat: string;
    craftable: boolean;
    recipe?: IMaterialRecipeIngredientFull[];
    locations?: Array<string>;
    locationsComposed?: Array<ICampaignBattleComposed>;
    iconPath: string;
    characters: string[];
    priority: number;
}

export interface IRankUpData {
    [character: string]: IRankUpData2 | undefined;
}

export interface IRankUpData2 {
    [rank: string]: string[];
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

export interface ICharacterRankRange {
    id: string;
    rankStart: Rank;
    rankEnd: Rank;
    appliedUpgrades: string[];
    rankPoint5: boolean;
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
    filters?: IDailyRaidsFilters;
    upgrades: Record<string, number>;
}

export type ICampaignsProgress = Record<Campaign, number>;

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
