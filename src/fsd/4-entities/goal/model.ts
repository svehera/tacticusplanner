/* eslint-disable import-x/no-internal-modules */
import { ShardFarmType } from '@/models/interfaces';

import { Alliance, FactionId, Rank, Rarity, RarityStars } from '@/fsd/5-shared/model';

import { IRankLookup } from '@/fsd/4-entities/character/@x/goal';

import { CampaignsLocationsUsage, PersonalGoalType } from './enums';

export interface IGenericGoal {
    priority: number;
    include: boolean;
    goalId: string;
    notes: string;
}

export interface ICharacterRaidGoalSelectBase extends IGenericGoal {
    unitId: string;
    unitName: string;
    unitIcon: string;
    unitRoundIcon: string;
    unitAlliance: Alliance;
}

export interface ICharacterUpgradeRankGoal extends ICharacterRaidGoalSelectBase, IRankLookup {
    type: PersonalGoalType.UpgradeRank;

    rarity: Rarity;
    level: number;
    xp: number;
    manuallyFarmXp: boolean;
}

export interface IUpgradeMaterialGoal extends IGenericGoal {
    type: PersonalGoalType.UpgradeMaterial;
    upgradeMaterialId: string;
    quantity: number;
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

export interface ICharacterUnlockGoal extends ICharacterRaidGoalSelectBase {
    type: PersonalGoalType.Unlock;

    shards: number;
    mythicShards: 0;
    rank: Rank;
    rarity: Rarity;
    faction: FactionId;
    campaignsUsage: CampaignsLocationsUsage;
}

export interface ICharacterAscendGoal extends ICharacterRaidGoalSelectBase {
    type: PersonalGoalType.Ascend;

    rarityStart: Rarity;
    starsStart: RarityStars;
    starsEnd: RarityStars;
    rarityEnd: Rarity;
    shards: number;
    mythicShards: number;
    onslaughtShards: number;
    onslaughtMythicShards: number;
    campaignsUsage: CampaignsLocationsUsage;
    mythicCampaignsUsage: CampaignsLocationsUsage;
    farmType: ShardFarmType;
}
