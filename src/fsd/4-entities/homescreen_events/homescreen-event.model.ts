export interface HomescreenEventReward {
    requiredProgress: number;
    chestRewardId: string;
    endless?: boolean;
    endlessCap?: number;
}

export interface HomescreenEventGameModeRestrictions {
    allowed?: string[];
    disallowed?: string[];
}

export interface HomescreenEventModifier {
    modifier?: number;
    /** per-rarity value, e.g. `{ Common: 250, Uncommon: 300, ... }` */
    modifiers?: Record<string, number>;
    abilityId?: string;
    locaKey?: string;
    gameModeRestrictions?: HomescreenEventGameModeRestrictions;
}

export interface HomescreenEventTracker {
    /**
     * e.g. "killUnits", "raidBattles" (a duplicate description of killUnits, always co-occurring
     * with it), "defeatWaves", "deployedUnitsOfFactionMajority", "fullLineUpOfFaction",
     * "donateUpgradeToGuildMember", "donateIntelToGuildProject", "dispatchExpedition".
     */
    type?: string;
    points?: number;
    pointsByRarity?: Record<string, number>;
    locaKey?: string;
    gameModeRestrictions?: HomescreenEventGameModeRestrictions;
    /** Matched against an enemy's `traits` OR `alliance` (e.g. "Mechanical", "Summon", "Chaos", "Imperial"). */
    traitRestrictions?: HomescreenEventGameModeRestrictions;
    /** Matched against an enemy's `faction` (e.g. "Tyranids"). */
    factionRestrictions?: HomescreenEventGameModeRestrictions;
}

export interface HomescreenEventAbilityDefinition {
    ability: {
        constants: Record<string, string>;
        variables: Record<string, (string | number)[]>;
    };
}

export interface HomescreenEventLiveEventConfig {
    modifiers?: HomescreenEventModifier[];
    trackers?: HomescreenEventTracker[];
}

export interface HomescreenEventOffer {
    offer: {
        maxPurchases?: number;
    };
    realMoneyProduct: {
        /** Price in cents. */
        price: number;
        rewards: string[];
    };
}

export interface HomescreenEventTier {
    tieredProgressRewards: HomescreenEventReward[];
    descriptions?: string[];
    liveEventConfig?: HomescreenEventLiveEventConfig;
    abilities?: Record<string, HomescreenEventAbilityDefinition>;
    offers?: Record<string, HomescreenEventOffer>;
}

/** `default` is used by events that don't split rewards into a high/mid/low power-level tier. */
export type HomescreenEventTierKey = 'high' | 'mid' | 'low' | 'default';

export interface HomescreenEventData {
    eventName: string;
    tiers: Partial<Record<HomescreenEventTierKey, HomescreenEventTier>>;
}

/** Wave/kill-based modes: points come from clearing waves or killing enemies, so the natural input unit varies per event. */
export type HseWaveBasedMode = 'onslaught' | 'salvageRun' | 'survival' | 'legendaryEvent' | 'incursion';
/** Flat modes: match-based, no natural "wave"/"kill" unit in the tracker data. */
export type HseFlatMode = 'arena' | 'tournamentArena';

export interface HseWaveModeConfig {
    enabled: boolean;
    /** 'waves' when driven by a `defeatWaves` tracker (points-per-wave, exact); 'kills' when driven by a `killUnits` or `raidBattles` tracker (points-per-kill, used as an approximation of points-per-wave). Undefined when `!enabled`. */
    unit?: 'waves' | 'kills';
    pointsPerUnit?: number;
}

export interface HseFlatModeConfig {
    enabled: boolean;
}

export interface HseModesConfig {
    onslaught: HseWaveModeConfig;
    salvageRun: HseWaveModeConfig;
    survival: HseWaveModeConfig;
    legendaryEvent: HseWaveModeConfig;
    incursion: HseWaveModeConfig;
    arena: HseFlatModeConfig;
    tournamentArena: HseFlatModeConfig;
}
