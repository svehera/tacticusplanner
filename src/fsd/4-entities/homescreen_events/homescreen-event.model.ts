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
    points?: number;
    pointsByRarity?: Record<string, number>;
    locaKey?: string;
    gameModeRestrictions?: HomescreenEventGameModeRestrictions;
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

export interface HomescreenEventTier {
    tieredProgressRewards: HomescreenEventReward[];
    descriptions?: string[];
    liveEventConfig?: HomescreenEventLiveEventConfig;
    abilities?: Record<string, HomescreenEventAbilityDefinition>;
}

/** `default` is used by events that don't split rewards into a high/mid/low power-level tier. */
export type HomescreenEventTierKey = 'high' | 'mid' | 'low' | 'default';

export interface HomescreenEventData {
    eventName: string;
    tiers: Partial<Record<HomescreenEventTierKey, HomescreenEventTier>>;
}
