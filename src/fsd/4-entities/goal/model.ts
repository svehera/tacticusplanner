import { Alliance, Faction, Rank, Rarity, RarityStars } from '@/fsd/5-shared/model';

import { IRankLookup } from '@/fsd/4-entities/character/@x/goal';

import { CampaignsLocationsUsage, PersonalGoalType } from './enums';

export interface ICharacterRaidGoalSelectBase {
    priority: number;
    include: boolean;
    goalId: string;
    unitId: string;
    unitName: string;
    unitIcon: string;
    unitRoundIcon: string;
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
