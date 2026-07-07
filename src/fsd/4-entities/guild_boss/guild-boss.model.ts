export type GuildBossEncounterType = 'Boss' | 'Crystal';

export interface GuildBossStats {
    Health: number;
    Damage: number;
    FixedArmor: number;
    Rank: number;
    StarLevel: number;
    BaseRarity: string;
    ProgressionIndex: number;
    AbilityLevel: number;
    BlockChance?: number;
    BlockDamage?: number;
    CritChance?: number;
    CritDamage?: number;
}

export interface GuildBossWeapon {
    hits: number;
    DamageProfile: string;
    Range?: number;
}

export interface GuildBossUnitSet {
    questUnitId?: string;
    FactionId: string;
    Movement: number;
    stats: GuildBossStats[];
    weapons?: GuildBossWeapon[];
    activeAbilities?: string[];
    passiveAbilities?: string[];
    traits?: string[];
    relicAbilities?: string[];
}

export interface GuildBossModifierDefinition {
    type: string;
    target: string;
    subtarget?: string;
    subtargets?: string[];
    amount: number;
}

export interface GuildBossEncounterModifier {
    hpLost: number;
    modifier: string;
}

export interface GuildBossEncounter {
    encounterIndex: number;
    guildBossEncounterType: GuildBossEncounterType;
    boardId: string;
    maxNrOfTurns: number;
    bossType?: string;
    unitId: string;
    npc1id?: string;
    npc2id?: string;
    enemies?: string[];
    modifiers?: GuildBossEncounterModifier[];
    disallowedFactions?: string[];
}

export interface GuildBossSet {
    set: number;
    chestId: string;
    guildXp: number;
    encounters: GuildBossEncounter[];
}

export interface GuildBossTier {
    tier: number;
    sets: GuildBossSet[];
}

export interface GuildBossSeasonConfig {
    guildBossSeasonConfigId: string;
    tiers: GuildBossTier[];
}

export interface GuildBossData {
    guildBossSeasonConfigRotation: string[];
    unitSets: Record<string, GuildBossUnitSet>;
    guildBossSeasonDataConfigsGDTO: Record<string, GuildBossSeasonConfig>;
    modifiers: Record<string, GuildBossModifierDefinition>;
    primarchs: string[];
}
