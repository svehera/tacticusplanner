import { Rarity } from '@/fsd/5-shared/model';

export interface TacticusPlayerResponse {
    player: TacticusPlayer;
}

export interface TacticusPlayer {
    units: TacticusUnit[];
    inventory: TacticusInventory;
    progress: TacticusProgress;
}

export interface TacticusInventory {
    upgrades: TacticusUpgrade[];
    shards: TacticusShard[];
}

export interface TacticusAbility {
    /**
     * Unique identifier for the ability.
     */
    id: string;

    /**
     * 0 = ability is locked
     */
    level: number;
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

export interface TacticusProgress {
    campaigns: TacticusCampaignProgress[]; // List of CampaignProgress objects
}

export interface TacticusCampaignProgress {
    id: string; // Example: "campaign2"
    name: string; // Example: "Fall of Cadia"
    type: string; // Example: "Standard"
    battles: TacticusCampaignLevel[]; // List of CampaignLevel objects
}

export interface TacticusCampaignLevel {
    battleIndex: number; // Example: 10
    attemptsLeft: number; // Example: 2
    attemptsUsed: number; // Example: 3
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
