﻿import {
    Alliance,
    CampaignsLocationsUsage,
    Faction,
    PersonalGoalType,
    Rank,
    Rarity,
    RarityStars,
} from 'src/models/enums';
import {
    ICampaignBattleComposed,
    ICampaignsProgress,
    IDailyRaidsFilters,
    IDailyRaidsPreferences,
} from 'src/models/interfaces';
import { ICharacterAbilitiesMaterialsTotal, IXpEstimate } from 'src/v2/features/characters/characters.models';
import { IMowMaterialsTotal } from 'src/v2/features/lookup/lookup.models';
import { rarityCaps } from '../characters/characters.contants';

export type CharacterRaidGoalSelect =
    | ICharacterUpgradeRankGoal
    | ICharacterAscendGoal
    | ICharacterUnlockGoal
    | ICharacterUpgradeMow
    | ICharacterUpgradeAbilities;

export interface ICharacterRaidGoalSelectBase {
    priority: number;
    include: boolean;
    goalId: string;
    unitId: string;
    unitName: string;
    unitIcon: string;
    unitAlliance: Alliance;
    notes: string;
}

export interface ICharacterUpgradeRankGoal extends ICharacterRaidGoalSelectBase, IRankLookup {
    type: PersonalGoalType.UpgradeRank;

    rarity: Rarity;
    level: number;
    xp: number;
}

export interface ICharacterUpgradeMow extends ICharacterRaidGoalSelectBase {
    type: PersonalGoalType.MowAbilities;

    primaryStart: number;
    primaryEnd: number;

    secondaryStart: number;
    secondaryEnd: number;
    upgradesRarity: Rarity[];

    shards: number;
    stars: RarityStars;
    rarity: Rarity;
}

export interface ICharacterUpgradeAbilities extends ICharacterRaidGoalSelectBase {
    type: PersonalGoalType.CharacterAbilities;

    level: number;
    xp: number;

    activeStart: number;
    activeEnd: number;

    passiveStart: number;
    passiveEnd: number;
}

/**
 * Represents data about a character-associated goal, including the starting
 * and ending rank, the applied upgrades, and the rarity of upgrades to farm
 * first.
 */
export interface IRankLookup {
    unitName: string;
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
    legendaryXpBooksTotal: number;
    mythicXpBooksTotal: number;
    xpEstimate?: IXpEstimate;
    xpEstimateAbilities?: IXpEstimate;
    mowEstimate?: IMowMaterialsTotal;
    abilitiesEstimate?: ICharacterAbilitiesMaterialsTotal;
}

export interface ICharacterUnlockGoal extends ICharacterRaidGoalSelectBase {
    type: PersonalGoalType.Unlock;

    shards: number;
    rank: Rank;
    rarity: Rarity;
    faction: Faction;
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
    raidedLocations: IItemRaidLocation[];
    campaignsProgress: ICampaignsProgress;
    preferences: IDailyRaidsPreferences;
    filters?: IDailyRaidsFilters;
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
    acquiredCount: number;
    requiredCount: number;
    iconPath: string;
    relatedCharacters: string[];
    possibleLocations: ICampaignBattleComposed[];
    onslaughtShards: number;
    campaignsUsage: CampaignsLocationsUsage;
}

export interface IShardsRaid extends ICharacterShardsEstimate {
    isCompleted: boolean;
    locations: Array<IItemRaidLocation>;
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

export interface IEstimatedUpgrades {
    upgradesRaids: IUpgradesRaidsDay[];
    inProgressMaterials: ICharacterUpgradeEstimate[];
    blockedMaterials: ICharacterUpgradeEstimate[];
    finishedMaterials: ICharacterUpgradeEstimate[];
    characters: IUnitUpgrade[];
    byCharactersPriority: ICharacterUpgradeRankEstimate[];
    relatedUpgrades: string[];
    energyTotal: number;
    raidsTotal: number;
    daysTotal: number;
    freeEnergyDays: number;
}

export interface IUpgradesRaidsDay {
    raids: IUpgradeRaid[];
    energyTotal: number;
    raidsTotal: number;
}

export interface IUpgradeRaid extends ICharacterUpgradeEstimate {
    raidLocations: IItemRaidLocation[];
}

export interface IItemRaidLocation extends ICampaignBattleComposed {
    raidsCount: number;
    farmedItems: number;
    energySpent: number;
    isShardsLocation: boolean;
}

export interface IUnitUpgrade {
    goalId: string;
    unitId: string;
    label: string;
    upgradeRanks: IUnitUpgradeRank[];
    baseUpgradesTotal: Record<string, number>;
    relatedUpgrades: string[];
}

/**
 * Contains the start and end rank of a particular goal, and
 * all of the upgrade material necessary to hit that goal.
 * Upgrade materials may appear multiple times in `upgrades`.
 */
export interface IUnitUpgradeRank {
    rankStart: Rank;
    rankEnd: Rank;
    rankPoint5: boolean;
    upgrades: string[];
}

export interface ICharacterUpgradeRankEstimate {
    goalId: string;
    upgrades: ICharacterUpgradeEstimate[];
}

export interface IBaseUpgrade {
    id: string;
    label: string;
    rarity: Rarity;
    iconPath: string;
    locations: ICampaignBattleComposed[];
    crafted: false;
    stat: string | 'Health' | 'Damage' | 'Armour' | 'Shard';
}

export interface ICombinedUpgrade extends IBaseUpgrade {
    countByGoalId: Record<string, number>;
    requiredCount: number;
    relatedCharacters: string[];
    relatedGoals: string[];
}

export interface ICharacterUpgradeEstimate extends IBaseUpgrade {
    energyTotal: number;
    energyLeft: number;
    daysTotal: number;
    raidsTotal: number;

    acquiredCount: number;
    requiredCount: number;
    relatedCharacters: string[];
    relatedGoals: string[];

    isBlocked: boolean;
    isFinished: boolean;
}

export interface ICraftedUpgrade {
    id: string;
    label: string;
    rarity: Rarity;
    iconPath: string;
    baseUpgrades: IUpgradeRecipe[];
    craftedUpgrades: IUpgradeRecipe[];
    recipe: IUpgradeRecipe[];
    crafted: true;
    stat: string | 'Health' | 'Damage' | 'Armour' | 'Shard';
}

/**
 * Holds the fully-expanded recipe for an upgrade material. One can then
 * reference the necessary IBaseUpgrade objects to get the full details.
 * That is, to say, expandedRecipe contains only uncraftable materials. If
 * this material is already uncraftable, expandedRecipe is empty.
 */
export interface IRecipeExpandedUpgrade {
    id: string;
    label: string;
    rarity: Rarity;
    iconPath: string;
    expandedRecipe: Record<string, number>;
    crafted: boolean;
    stat: string | 'Health' | 'Damage' | 'Armour' | 'Shard';
}

/**
 * Holds a material and a count of how many of the material are needed.
 */
export interface IUpgradeRecipe {
    id: string;
    count: number;
}

export type IBaseUpgradeData = Record<string, IBaseUpgrade>;
export type ICraftedUpgradeData = Record<string, ICraftedUpgrade>;
export type IRecipeExpandedUpgradeData = Record<string, IRecipeExpandedUpgrade>;
