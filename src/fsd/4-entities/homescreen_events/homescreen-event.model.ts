export interface HomescreenEventReward {
    requiredProgress: number;
    chestRewardId: string;
    endless?: boolean;
    endlessCap?: number;
}

export interface HomescreenEventTier {
    tieredProgressRewards: HomescreenEventReward[];
}

/** `default` is used by events that don't split rewards into a high/mid/low power-level tier. */
export type HomescreenEventTierKey = 'high' | 'mid' | 'low' | 'default';

export interface HomescreenEventData {
    eventName: string;
    tiers: Partial<Record<HomescreenEventTierKey, HomescreenEventTier>>;
}
