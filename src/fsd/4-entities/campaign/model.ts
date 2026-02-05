import { Alliance, Rarity, FactionId } from '@/fsd/5-shared/model';

import { Campaign, CampaignDifficulty, CampaignGroupType, CampaignReleaseType, CampaignType } from './enums';

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
    rewards: IRewards;
    slots?: number;
    enemiesFactions: FactionId[];
    enemiesAlliances: Alliance[];
    enemyPower: number;
    alliesFactions: FactionId[];
    alliesAlliance: Alliance;
    enemiesTotal: number;
    enemiesTypes: string[];
    detailedEnemyTypes?: IDetailedEnemy[];
    rawEnemyTypes?: IRawEnemy[];
    // new props for upgrades service
    isSuggested?: boolean;
    isUnlocked?: boolean;
    isPassFilter?: boolean;
    isCompleted?: boolean;
    isStarted?: boolean;
}

export interface IRewards {
    guaranteed: IGuaranteedReward[];
    potential: IPotentialReward[];
}

interface IGuaranteedReward {
    id: string;
    min: number;
    max: number;
}

interface IPotentialReward {
    id: string;
    chance_numerator: number;
    chance_denominator: number;
    effective_rate: number;
}

/**
 * When we have more detailed information about a campaign battle, this holds
 * the information on a particular type of enemy. If @rarity is specified, it
 * means that the enemy is a character, not an NPC.
 */
export interface IDetailedEnemy {
    id: string;
    count: number;
    name: string;
    rank: string;
    stars: number;
    rarity?: string;
}

export interface IRawEnemy {
    id: string;
    count: number;
}

export interface ICampaignsData {
    [campaignKey: string]: ICampaignBattle;
}

export interface ICampaignBattle {
    shortName?: string;
    campaign: Campaign | string;
    campaignType: CampaignType | string;
    nodeNumber: number;
    energyCost: number;
    rewards: IRewards;
    slots?: number;
    enemiesAlliances?: string[];
    enemiesFactions?: FactionId[];
    enemiesTotal?: number;
    enemiesTypes?: string[];
    enemyPower: number;
    rawEnemyTypes?: IRawEnemy[];
    detailedEnemyTypes?: IDetailedEnemy[];
    requiredCharacterSnowprintIds?: string[];
}

export type ICampaignConfigs = {
    [campaignType in `${CampaignType}`]: ICampaignConfig;
};

interface ICampaignConfig {
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
    mythic?: number;
    shard: number;
    mythicShard?: number;
}

/**
 * Represents the structure of a campaign with its unique attributes.
 */
export interface ICampaignModel {
    /**
     * Unique identifier for the campaign.
     */
    id: Campaign;

    /**
     * The full name of the campaign.
     */
    name: string;

    /**
     * A potentially shorter version of the campaign in order to fit it on
     * one line in the desktop "Campaign Progress" page.
     */
    displayName: string;

    /**
     * The faction required to beat campaign.
     */
    faction: FactionId;

    /**
     * The characters required to beat campaign.
     */
    coreCharacters: string[];

    /**
     * The release type of the campaign, indicating how and when it was made available.
     */
    releaseType: CampaignReleaseType;

    /**
     * The group or storyline that the campaign belongs to (e.g., Indomitus, Octarius).
     */
    groupType: CampaignGroupType;

    /**
     * The difficulty level of the campaign, such as standard, elite, or event-specific modes.
     */
    difficulty: CampaignDifficulty;
}

export type ICampaignsProgress = Record<Campaign, number>;

export interface ICampaignsFilters {
    enemiesAlliance: Alliance[];
    enemiesFactions: FactionId[];
    alliesAlliance: Alliance[];
    alliesFactions: FactionId[];
    campaignTypes: CampaignType[];
    upgradesRarity: Rarity[];
    slotsCount?: number[];
    enemiesTypes?: string[];
    enemiesMinCount?: number;
    enemiesMaxCount?: number;
}
