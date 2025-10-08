import { CampaignsLocationsUsage, PersonalGoalType } from 'src/models/enums';
import {
    ICampaignBattleComposed,
    ICampaignsProgress,
    ICampaignsFilters,
    IDailyRaidsPreferences,
} from 'src/models/interfaces';

import { IUnitUpgradeRank } from '@/fsd/4-entities/character';
import {
    ICharacterAscendGoal,
    ICharacterRaidGoalSelectBase,
    ICharacterUnlockGoal,
    ICharacterUpgradeMow,
    ICharacterUpgradeRankGoal,
} from '@/fsd/4-entities/goal';
import { IBaseUpgrade } from '@/fsd/4-entities/upgrade';

import { ICharacterAbilitiesMaterialsTotal, IXpEstimate } from 'src/v2/features/characters/characters.models';

import { IMowMaterialsTotal } from '@/fsd/1-pages/learn-mow/lookup.models';

export type CharacterRaidGoalSelect =
    | ICharacterUpgradeRankGoal
    | ICharacterAscendGoal
    | ICharacterUnlockGoal
    | ICharacterUpgradeMow
    | ICharacterUpgradeAbilities;

export interface ICharacterUpgradeAbilities extends ICharacterRaidGoalSelectBase {
    type: PersonalGoalType.CharacterAbilities;

    level: number;
    xp: number;

    activeStart: number;
    activeEnd: number;

    passiveStart: number;
    passiveEnd: number;
}

export interface IGoalEstimate {
    goalId: string;
    daysTotal: number;
    daysLeft: number;
    energyTotal: number;
    oTokensTotal: number;
    xpBooksTotal: number;
    xpEstimate?: IXpEstimate;
    xpEstimateAbilities?: IXpEstimate;
    mowEstimate?: IMowMaterialsTotal;
    abilitiesEstimate?: ICharacterAbilitiesMaterialsTotal;
}

export interface IEstimatedAscensionSettings {
    raidedLocations: IItemRaidLocation[];
    campaignsProgress: ICampaignsProgress;
    preferences: IDailyRaidsPreferences;
    filters?: ICampaignsFilters;
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

export interface ICharacterUpgradeRankEstimate {
    goalId: string;
    upgrades: ICharacterUpgradeEstimate[];
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

export type {
    ICharacterAscendGoal,
    ICharacterRaidGoalSelectBase,
    ICharacterUnlockGoal,
    ICharacterUpgradeMow,
    ICharacterUpgradeRankGoal,
};
