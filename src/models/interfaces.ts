import {
    Alliance,
    Campaign,
    CampaignsLocationsUsage,
    CampaignType,
    CharacterBias,
    CharacterReleaseRarity,
    DailyRaidsStrategy,
    DamageType,
    Difficulty,
    Equipment,
    Faction,
    LegendaryEventEnum,
    LegendaryEvents,
    PersonalGoalType,
    Rank,
    Rarity,
    RarityStars,
    RarityString,
    Trait,
    UserRole,
} from './enums';
import React from 'react';
import { CharactersAction } from '../reducers/characters.reducer';
import { ViewPreferencesAction } from '../reducers/view-settings.reducer';
import { AutoTeamsPreferencesAction } from '../reducers/auto-teams-settings.reducer';
import { SelectedTeamsOrderingAction } from '../reducers/selected-teams-order.reducer';
import { LeSelectedRequirementsAction } from '../reducers/le-selected-requirements.reducer';
import { LeSelectedTeamsAction } from '../reducers/le-selected-teams.reducer';
import { LeProgressAction } from '../reducers/le-progress.reducer';
import { GoalsAction } from '../reducers/goals.reducer';
import { CampaignsProgressAction } from '../reducers/campaigns-progress.reducer';
import { DailyRaidsPreferencesAction } from '../reducers/daily-raids-settings.reducer';
import { InventoryAction } from '../reducers/inventory.reducer';
import { DailyRaidsAction } from '../reducers/dailyRaids.reducer';
import { CharactersFilterBy } from 'src/v2/features/characters/enums/characters-filter-by';
import { CharactersOrderBy } from 'src/v2/features/characters/enums/characters-order-by';
import { IGWLayout, IGWTeam } from 'src/v2/features/guild-war/guild-war.models';
import { GuildWarAction } from 'src/reducers/guildWarReducer';
import { GuildAction } from 'src/reducers/guildReducer';
import { IItemRaidLocation } from 'src/v2/features/goals/goals.models';
import { IMow, IMowDb } from 'src/v2/features/characters/characters.models';
import { MowsAction } from 'src/reducers/mows.reducer';
import { UnitType } from 'src/v2/features/characters/units.enums';
import { IPersonalTeam } from 'src/v2/features/teams/teams.models';
import { TeamsAction } from 'src/reducers/teams.reducer';

export type LegendaryEventSection = 'alpha' | 'beta' | 'gamma';

export interface UnitDataRaw {
    Name: string;
    Faction: Faction;
    Alliance: Alliance;
    Health: number;
    Damage: number;
    Armour: number;
    'Short Name': string;
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
    Icon: string;
    ReleaseRarity?: CharacterReleaseRarity;
    releaseDate?: string;
    lre?: ILreCharacterStaticData;
}

export interface IUnitData {
    unitType: UnitType.character;
    id: string;
    alliance: Alliance;
    faction: Faction;
    name: string;
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
    icon: string;
    legendaryEvents: ICharLegendaryEvents;
    lre?: ILreCharacterStaticData;
    releaseRarity?: CharacterReleaseRarity;
    releaseDate?: string;
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

export interface ILegendaryEvent extends ILegendaryEventStatic {
    id: LegendaryEventEnum;
    alpha: ILegendaryEventTrack;
    beta: ILegendaryEventTrack;
    gamma: ILegendaryEventTrack;

    suggestedTeams: ITableRow[];
    allowedUnits: Array<ICharacter2>;
    battlesCount: number;
}

export interface ILegendaryEventStatic {
    id: number;
    name: string;
    wikiLink: string;
    eventStage: number;
    nextEventDate: string;
    nextEventDateUtc?: string;

    regularMissions: string[];
    premiumMissions: string[];

    alpha: ILegendaryEventTrackStatic;
    beta: ILegendaryEventTrackStatic;
    gamma: ILegendaryEventTrackStatic;

    pointsMilestones: IPointsMilestone[];
    chestsMilestones: IChestMilestone[];

    shardsPerChest: number;
    battlesCount: number;
    constraintsCount: number;
    progression: ILEProgression;
}

export interface ILEProgression {
    unlock: number;
    fourStars: number;
    fiveStars: number;
    blueStar: number;
}

export interface IPointsMilestone {
    milestone: number;
    cumulativePoints: number;
    engramPayout: number;
}

export interface IChestMilestone {
    chestLevel: number;
    engramCost: number;
}

export interface ILegendaryEventTrackStatic {
    name: string;
    killPoints: number;
    battlesPoints: number[];
    enemies: {
        label: string;
        link: string;
    };
}

export interface ILegendaryEventTrack extends ILegendaryEventTrackStatic {
    eventId: LegendaryEventEnum;
    section: LegendaryEventSection;
    allowedUnits: ICharacter2[];
    unitsRestrictions: Array<ILegendaryEventTrackRequirement>;

    getCharacterPoints(char: ICharacter2): number;

    getCharacterSlots(char: ICharacter2): number;

    getRestrictionPoints(name: string): number;

    suggestTeams(
        settings: IAutoTeamsPreferences | ISelectedTeamsOrdering,
        onlyUnlocked: boolean,
        restrictions: string[]
    ): Record<string, Array<ICharacter2 | undefined>>;

    suggestTeam(
        settings: IAutoTeamsPreferences | ISelectedTeamsOrdering,
        onlyUnlocked: boolean,
        restrictions: string[]
    ): Array<ICharacter2>;
}

export interface ILegendaryEventTrackRequirement {
    id?: string;
    name: string;
    points: number;
    units: ICharacter2[];
    selected?: boolean;
}

export type ITableRow<T = ICharacter2 | string> = Record<string, T>;
export type ICharacter2 = IUnitData & IPersonalCharacterData2 & DynamicProps;

export type DynamicProps = {
    numberOfUnlocked?: number;
    ownedBy?: string[];
    potential?: number;
    power?: number;
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
    legendaryEventsProgress: ILegendaryEventsProgressState;
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
    leProgress: LegendaryEventData<ILegendaryEventProgressState>;
    leSelectedRequirements: LegendaryEventData<ILegendaryEventSelectedRequirements>;
    campaignsProgress: ICampaignsProgress;
    inventory: IInventory;
    dailyRaids: IDailyRaids;
    guildWar: IGuildWar;
    guild: IGuild;
}

export interface IUserInfo {
    username: string;
    userId: number;
    role: UserRole;
    pendingTeamsCount: number;
    rejectedTeamsCount: number;
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
    leProgress: LegendaryEventData<ILegendaryEventProgressState>;
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
    section: LegendaryEventSection;
    restrictionsIds: string[];
    charactersIds: string[];
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

export interface IViewPreferences extends ILreViewSettings, IWyoViewSettings {
    theme: 'light' | 'dark';
    // autoTeams: boolean;
    wyoFilter: CharactersFilterBy;
    wyoOrder: CharactersOrderBy;
    craftableItemsInInventory: boolean;
    inventoryShowAlphabet: boolean;
    inventoryShowPlusMinus: boolean;
    goalsTableView: boolean;
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
    useV1Lre: boolean;
    showAlpha: boolean;
    showBeta: boolean;
    showGamma: boolean;
    lightWeight: boolean;
    hideSelectedTeams: boolean;
    onlyUnlocked: boolean;
    hideCompleted: boolean;
    hideNames: boolean;
    lreGridView: boolean;
}

export interface IAutoTeamsPreferences {
    preferCampaign: boolean;
    ignoreRarity: boolean;
    ignoreRank: boolean;
    ignoreRecommendedFirst: boolean;
    ignoreRecommendedLast: boolean;
}

export interface IDailyRaidsPreferences {
    dailyEnergy: number;
    shardsEnergy: number;
    farmByPriorityOrder: boolean;
    farmStrategy: DailyRaidsStrategy;
    customSettings?: ICustomDailyRaidsSettings;
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
    leSelection: LegendaryEvents;
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

export type ILegendaryEventsProgressState = Record<LegendaryEventEnum, ILegendaryEventProgressState>;

export interface ILegendaryEventProgressState {
    id: LegendaryEventEnum;
    name: string;
    alpha: ILegendaryEventProgressTrackState;
    beta: ILegendaryEventProgressTrackState;
    gamma: ILegendaryEventProgressTrackState;
    regularMissions: number;
    premiumMissions: number;
    bundle?: number;
    overview?: {
        1: ILegendaryEventOverviewProgress;
        2: ILegendaryEventOverviewProgress;
        3: ILegendaryEventOverviewProgress;
    };
    notes: string;
}

export interface ILegendaryEventProgressTrackState {
    battles: Array<boolean[]>;
}

export interface ILegendaryEventProgress {
    alpha: ILegendaryEventProgressTrack;
    beta: ILegendaryEventProgressTrack;
    gamma: ILegendaryEventProgressTrack;
    overview: {
        1: ILegendaryEventOverviewProgress;
        2: ILegendaryEventOverviewProgress;
        3: ILegendaryEventOverviewProgress;
    };
    notes: string;
}

export interface ILegendaryEventOverviewProgress {
    regularMissions: number;
    premiumMissions: number;
    bundle: number;
}

export interface ILegendaryEventProgressTrack {
    name: 'alpha' | 'beta' | 'gamma';
    battles: ILegendaryEventBattle[];
}

export interface ILegendaryEventBattle {
    battleNumber: number;
    state: boolean[];
    requirements: ILegendaryEventTrackRequirement[];
}

export interface IWhatsNew {
    currentVersion: string;
    releaseNotes: IVersionReleaseNotes[];
}

export interface IVersionReleaseNotes {
    version: string;
    date: string;
    type: string;
    new: IReleaseNote[];
    minor: IReleaseNote[];
    bugFixes: IReleaseNote[];
}

export interface IReleaseNote {
    text: string;
    route?: string;
    mobileRoute?: string;
    imagePath?: string;
    subPoints?: string[];
    images?: Array<{ path: string; size?: number }>;
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
    // new props for upgrades service
    isSelected?: boolean;
    isUnlocked?: boolean;
    isPassFilter?: boolean;
    isCompleted?: boolean;
}

export interface IRecipeData {
    [material: string]: IMaterial;
}

export interface IMaterial {
    material: string;
    label?: string;
    rarity: string;
    craftable: boolean;
    stat: string | 'Health' | 'Damage' | 'Armour' | 'Shard';
    icon?: string;
    faction?: string; // if not specifor to faction then this property can be omitted ("undefined");
    recipe?: Array<IMaterialRecipeIngredient>; // if material is not craftable recipe can be omitted ("undefined")
    locations?: Array<string>; // campaigs locations campaigs can be in short form (IM12) or long (Indomitus mirros) depedings how you decisde to update battleData json.
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
    [character: string]: IRankUpData2;
}

export interface IRankUpData2 {
    [rank: string]: string[];
}

export interface IEquipment {
    type: EquipmentType;
    factions: string[];
    triggerChance?: number; // Block/Crit change can be undefined for Defensive items
    stats: {
        common: IEquipmentStat;
        uncommon: IEquipmentStat;
        rare: IEquipmentStat;
        epic: IEquipmentStat;
        legendary: IEquipmentStat;
    };
}

export interface IEquipmentStat {
    name: string;
    damageMin: number;
    damageMax: number;

    healthMin: number; // valid only for defensive items
    healthMax: number; // valid only for defensive items

    armourMin: number; // valid only for defensive items
    armourMax: number; // valid only for defensive items
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

export type ICampaignsProgress = {
    Indomitus: number;
    'Indomitus Mirror': number;
    'Indomitus Elite': number;
    'Indomitus Mirror Elite': number;

    'Fall of Cadia': number;
    'Fall of Cadia Mirror': number;
    'Fall of Cadia Elite': number;
    'Fall of Cadia Mirror Elite': number;

    Octarius: number;
    'Octarius Mirror': number;
    'Octarius Elite': number;
    'Octarius Mirror Elite': number;

    'Saim-Hann': number;
    'Saim-Hann Mirror': number;
    'Saim-Hann Elite': number;
    'Saim-Hann Mirror Elite': number;
};

export interface IInventory {
    upgrades: Record<string, number>;
}

export interface IContributor {
    name: string;
    type: string;
    thankYou: string;
    resourceDescription: string;
    resourceLink: string;
    avatarIcon?: string;
}

export interface IContentCreator {
    name: string;
    youtubeLink: string;
    thankYou: string;
    avatarIcon: string;
    resourceIcon: string;
    resourceLink: string;
}

export interface IYoutubeCreator {
    name: string;
    youtubeVideoId: string;
    avatarLink: string;
}
