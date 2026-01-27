import { Rarity } from '@/fsd/5-shared/model';

export interface TacticusPlayerResponse {
    player: TacticusPlayer;
}

interface TacticusPlayer {
    units: TacticusUnit[];
    inventory: TacticusInventory;
    progress: TacticusProgress;
}

export interface TacticusEquipment {
    id: string; // I_Crit_M007
    level: number; // 1-3/11.
    name: string; // Supa-Killy Slugga
    rarity: string; // Mythic
    slotId: string; // Slot1
}

export interface TacticusInventory {
    upgrades: TacticusUpgrade[];
    shards: TacticusShard[];
    mythicShards: TacticusShard[];
    xpBooks: TacticusXpBook[];
    abilityBadges: TacticusAbilityBadges;
    orbs: TacticusOrbs;
    forgeBadges: TacticusForgeBadge[];
    components: TacticusComponents[];
}

interface TacticusOrb {
    rarity: string;
    amount: number;
}

interface TacticusOrbs {
    Imperial: TacticusOrb[];
    Xenos: TacticusOrb[];
    Chaos: TacticusOrb[];
}

interface TacticusForgeBadge {
    name: string;
    rarity: string;
    amount: number;
}

interface TacticusComponents {
    name: string;
    grandAlliance: string;
    amount: number;
}

interface TacticusAbility {
    /**
     * Unique identifier for the ability.
     */
    id: string;

    /**
     * 0 = ability is locked
     */
    level: number;
}

interface TacticusXpBook {
    /** Unique identifier for the xp book.*/
    id: string;

    /** Rarity of the book. */
    rarity: string;

    /** Amount of XP books owned. */
    amount: number;
}

interface TacticusAbilityBadge {
    /** Unique identifier for ability badge.*/
    id: string;

    /** Rarity of the ability badge. */
    rarity: string;

    /** Amount of this badge owned. */
    amount: number;
}

interface TacticusAbilityBadges {
    Imperial: TacticusAbilityBadge[];
    Xenos: TacticusAbilityBadge[];
    Chaos: TacticusAbilityBadge[];
}

export interface TacticusUnit {
    /**
     * Unique identifier for the unit.
     */
    id: string;

    /**
     * Name of the unit.
     */
    name: string;

    /**
     * Star level: 0 = Common, 3 = Uncommon, 6 = Rare, 9 = Epic, 12 = Legendary
     */
    progressionIndex: number;

    /**
     * Total XP gained for the unit.
     */
    xp: number;

    /**
     * XP level of the unit.
     */
    xpLevel: number;

    /**
     * 0 = Stone I, 3 = Iron I, 6 = Bronze I, 9 = Silver I, 12 = Gold I, 15 = Diamond I, 17 = Diamond III
     */
    rank: number;

    /**
     * Active and passive abilities of the unit.
     */
    abilities: [TacticusAbility, TacticusAbility];

    /**
     * 2*3 matrix, 0 = top left, 1 = bottom left, 2 top center etc
     */
    upgrades: number[];

    /**
     * Owned shards of the unit.
     */
    shards: number;

    /**
     * Owned mythic shards of the unit.
     */
    mythicShards: number;

    /**
     * Equipment the unit currently has on.
     */
    items: TacticusEquipment[];
}

export interface TacticusUpgrade {
    id: string;
    name: string;
    amount: number;
}

export interface TacticusShard {
    id: string;
    name: string;
    amount: number;
}

interface TacticusProgress {
    campaigns: TacticusCampaignProgress[]; // List of CampaignProgress objects
    legendaryEvents: TacticusLegendaryEventProgress[]; // List of LegendaryEventProgress objects
}

export interface TacticusCampaignProgress {
    id: string; // Example: "campaign2"
    name: string; // Example: "Fall of Cadia"
    type: string; // Example: "Standard"
    battles: TacticusCampaignLevel[]; // List of CampaignLevel objects
}

interface TacticusCampaignLevel {
    battleIndex: number; // Example: 10
    attemptsLeft: number; // Example: 2
    attemptsUsed: number; // Example: 3
}

export interface TacticusLegendaryEventProgress {
    id: string; // The SP ID of the event character.
    lanes: TacticusLegendaryEventLane[];
    currentPoints: number;
    currentCurrency: number;
    currentShards: number;
    currentClaimedChestIndex: number | undefined;
    currentEvent: TacticusLegendaryEventCurrentEvent | undefined;
}
export interface TacticusLegendaryEventLane {
    id: number; // Typically Alpha=1, Beta=2, Gamma=3
    name: string; // Typically Alpha, Beta, Gamma
    battleConfigs: TacticusLegendaryEventBattleConfig[];
    progress: TacticusLegendaryEventBattlesProgress[];
}

export interface TacticusLegendaryEventBattleConfig {
    numEnemies: number;
    objectives: TacticusLegendaryEventObjective[];
    disallowedFactions: string[];
}

export interface TacticusLegendaryEventObjective {
    objectiveType: string;
    objectiveTarget: string;
    score: number;
}

export interface TacticusLegendaryEventBattlesProgress {
    // 0 is always "clear score", and the rest are 1-based indices of the restrictions.
    objectivesCleared: number[];
    highScore: number;
    encounterPoints: number;
}

export interface TacticusLegendaryEventCurrentEvent {
    run: number;
    tokens: TacticusLegendaryEventTokens;
    hasUsedAdForExtraTokenToday: boolean;
    extraCurrencyPerPayout: number;
}

export interface TacticusLegendaryEventTokens {
    currentTokens: number;
    maxTokens: number;
    nextTokenInSeconds: number;
    regenDelayInSeconds: number;
}

export interface TacticusGuildResponse {
    guild: TacticusGuild;
}

export interface TacticusGuild {
    guildId: string;
    guildTag: string;
    name: string;
    level: number;
    members: TacticusGuildMember[];
    guildRaidSeasons: number[];
}

export interface TacticusGuildMember {
    userId: string;
    role: TacticusGuildRole;
    level: number;
    lastActivityOn?: string | null;
}

export enum TacticusGuildRole {
    MEMBER = 0,
    OFFICER = 1,
    CO_LEADER = 2,
    LEADER = 3,
}

export interface TacticusGuildRaidResponse {
    season: number;
    seasonConfigId: string;
    entries: TacticusGuildRaidEntry[];
}

export interface TacticusGuildRaidEntry {
    userId: string;
    tier: number;
    set: number;
    encounterIndex: number;
    remainingHp: number;
    maxHp: number;
    encounterType: TacticusEncounterType;
    unitId: string;
    type: string;
    rarity: Rarity;
    damageDealt: number;
    damageType: TacticusDamageType;
    startedOn?: number | null;
    completedOn?: number | null;
    heroDetails: TacticusGuildRaidUnit[];
    machineOfWarDetails?: TacticusGuildRaidUnit;
    globalConfigHash: string;
}

export interface TacticusGuildRaidUnit {
    unitId: string;
    power: number;
}

export enum TacticusEncounterType {
    SideBoss = 0,
    Boss = 1,
}

export enum TacticusDamageType {
    Bomb = 0,
    Battle = 1,
}
