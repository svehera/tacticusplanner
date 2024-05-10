import { CampaignsLocationsUsage, PersonalGoalType, Rank, Rarity, RarityStars } from 'src/models/enums';
import { ICampaignBattleComposed, ICampaignsProgress, IDailyRaidsPreferences } from 'src/models/interfaces';
import { IXpEstimate } from 'src/v2/features/characters/characters.models';

export type CharacterRaidGoalSelect = ICharacterUpgradeRankGoal | ICharacterAscendGoal | ICharacterUnlockGoal;

export interface ICharacterRaidGoalSelectBase {
    priority: number;
    include: boolean;
    goalId: string;
    characterName: string;
    characterIcon: string;
    notes: string;
}

export interface ICharacterUpgradeRankGoal extends ICharacterRaidGoalSelectBase, IRankLookup {
    type: PersonalGoalType.UpgradeRank;

    rarity: Rarity;
    level: number;
    xp: number;
}

export interface IRankLookup {
    characterName: string;
    rankStart: Rank;
    rankEnd: Rank;
    appliedUpgrades: string[];
    rankPoint5: boolean;
    upgradesRarity: Rarity[];
}

export interface IGoalEstimate {
    goalId: string;
    daysTotal: number;
    daysLeft: number;
    energyTotal: number;
    oTokensTotal: number;
    xpBooksTotal: number;
    xpEstimate?: IXpEstimate;
}

export interface ICharacterUnlockGoal extends ICharacterRaidGoalSelectBase {
    type: PersonalGoalType.Unlock;

    shards: number;
    rank: Rank;
    rarity: Rarity;
    campaignsUsage: CampaignsLocationsUsage;
}

export interface ICharacterAscendGoal extends ICharacterRaidGoalSelectBase {
    type: PersonalGoalType.Ascend;

    rarityStart: Rarity;
    starsStart: RarityStars;
    starsEnd: RarityStars;
    rarityEnd: Rarity;
    shards: number;
    onslaughtShards: number;
    campaignsUsage: CampaignsLocationsUsage;
}

export interface IEstimatedAscensionSettings {
    completedLocations: string[];
    campaignsProgress: ICampaignsProgress;
    preferences: IDailyRaidsPreferences;
}

export interface IEstimatedShards {
    shardsRaids: IShardsRaid[];
    materials: ICharacterShardsEstimate[];
    energyTotal: number;
    raidsTotal: number;
    onslaughtTokens: number;
    daysTotal: number;
    energyPerDay: number;
}

export interface IShardMaterial {
    goalId: string;
    characterId: string;
    label: string;
    ownedCount: number;
    requiredCount: number;
    iconPath: string;
    relatedCharacters: string[];
    possibleLocations: ICampaignBattleComposed[];
    onslaughtShards: number;
    campaignsUsage: CampaignsLocationsUsage;
}

export interface IShardsRaid extends ICharacterShardsEstimate {
    isCompleted: boolean;
    locations: Array<ILocationRaid>;
}

export interface ICharacterShardsEstimate extends IShardMaterial {
    availableLocations: ICampaignBattleComposed[];
    raidsLocations: ICampaignBattleComposed[];
    energyTotal: number;
    raidsTotal: number;
    daysTotal: number;
    onslaughtTokensTotal: number;
    isBlocked: boolean;
    energyPerDay: number;
}

export interface ILocationRaid {
    id: string;
    campaign: string;
    battleNumber: number;
    raidsCount: number;
    farmedItems: number;
    energySpent: number;
    isCompleted: boolean;
}

export interface IEstimatedUpgrades {
    // shardsRaids: IShardsRaid[];
    materials: ICharacterUpgradeEstimate[];
    energyTotal: number;
    raidsTotal: number;
    daysTotal: number;
}

export interface ICharacterUpgrade {
    goalId: string;
    characterId: string;
    label: string;
    upgradeRanks: ICharacterUpgradeRank[];
}

export interface ICharacterUpgradeRank {
    rankStart: Rank;
    rankEnd: Rank;
    rankPoint5: boolean;
    upgrades: IBaseUpgrade[];
}
export interface ICharacterUpgradeEstimate extends ICharacterUpgradeRank {}

export interface IUpgradeInfo extends IUpgradeBase {
    baseUpgrades: IUpgradeBase[];
    craftedUpgrades: IUpgradeBase[];
}

export interface IUpgradeBase {
    id: string;
    label: string;
    rarity: Rarity;
    count: number;
}

export interface IBaseUpgrade {
    id: string;
    label: string;
    rarity: Rarity;
    iconPath: string;
    locations: ICampaignBattleComposed[];
}

export interface ICraftedUpgrade {
    id: string;
    label: string;
    rarity: Rarity;
    iconPath: string;
    baseUpgrades: IUpgradeRecipe[];
    craftedUpgrades: IUpgradeRecipe[];
}

export interface IUpgradeRecipe {
    id: string;
    count: number;
}

export type IBaseUpgradeData = Record<string, IBaseUpgrade>;
export type ICraftedUpgradeData = Record<string, ICraftedUpgrade>;
export type IUpgradeData = Record<string, IUpgradeInfo>;
