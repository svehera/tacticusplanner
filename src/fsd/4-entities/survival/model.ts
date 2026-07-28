export interface ISurvivalWave {
    round: number;
    power: number;
    /** Absent on clone waves, which pit you against your own team instead of a fixed army. */
    army?: string[];
    armyAfterCompletion?: string[];
    armyScore: number;
    rarityUpgradeOnCompletion?: string;
    isCloneWave?: boolean;
    cloneWaveHealthPct?: number;
}

export interface ISurvivalBattle {
    tier: number;
    battleNr: number;
    boardId: string;
    power: number;
    waves: ISurvivalWave[];
    disallowedFactions: string[];
}

export interface ISurvivalMilestoneReward {
    requiredProgress: number;
    chestRewardId: string;
    endless?: boolean;
}

export interface ISurvivalChestCost {
    type: string;
    amount: number;
}

export interface ISurvivalChest {
    level: number;
    cost: ISurvivalChestCost;
    rewards: string[];
}

export interface ISurvivalRealMoneyProduct {
    price: number;
    rewards: string[];
}

export interface ISurvivalOffer {
    offer: {
        offerId: string;
        maxPurchases?: number;
    };
    realMoneyProduct: ISurvivalRealMoneyProduct;
}

export interface ISurvivalConfig {
    featuredHeroId: string;
    maxStamina: number;
    startStamina: number;
    battleSetId: string;
    isMachinesOfWarAllowedInBattle: boolean;
}

export interface ISurvivalEvent {
    eventName: string;
    theme: string;
    featuredHero: { id: string; name: string };
    resourceId: string;
    survival: ISurvivalConfig;
    battle: ISurvivalBattle;
    milestoneRewards: ISurvivalMilestoneReward[];
    chests: ISurvivalChest[];
    offers: Record<string, ISurvivalOffer>;
}
