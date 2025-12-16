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

import { ICharacterAbilitiesMaterialsTotal, IXpEstimate } from '@/fsd/3-features/characters/characters.models';

import { IMowMaterialsTotal } from '@/fsd/1-pages/learn-mow/lookup.models';

export type CharacterRaidGoalSelect =
    | ICharacterUpgradeRankGoal
    | ICharacterAscendGoal
    | ICharacterUnlockGoal
    | ICharacterUpgradeMow
    | ICharacterUpgradeAbilities;

/**
 * Personal goal payload for upgrading a character's abilities.
 *
 * This interface is the discriminated branch for PersonalGoalType.CharacterAbilities and is consumed by
 * the planner, goal persistence, and UI selection code to represent which ability slots are targeted
 * and how much progress has been applied.
 *
 * - type: Discriminator set to PersonalGoalType.CharacterAbilities (identifies this shape in unions).
 * - level: The current xp level of the unit.
 *
 * - xp: The current XP from `level` the unit already has. Once the unit advances another XP level, this resets to zero.
 *
 * - activeStart / activeEnd: Inclusive, 0-based indices of the active-ability slots selected by the goal.
 *   These define a contiguous range of active abilities to which the level/xp upgrade applies. When a single
 *   active slot is targeted start and end will be equal. Calling code enumerates indices in [activeStart, activeEnd]
 *   to identify affected abilities for cost calculation, validation and UI highlighting.
 *
 * - passiveStart / passiveEnd: Inclusive, 0-based indices of the passive-ability slots selected by the goal.
 *   Semantically equivalent to the active range fields but for passive abilities. Use [passiveStart, passiveEnd]
 *   to enumerate affected passive ability slots.
 *
 * Remarks:
 * - Consumers should treat the start/end pairs as an inclusive range and validate indices against the
 *   character's actual ability arrays before applying upgrades.
 * - The selection/UI layer is responsible for populating these numeric fields (they are not optional). If no
 *   abilities of a category are targeted the selection logic should represent that consistently (e.g. by
 *   setting start/end to an agreed sentinel or by ensuring the planner skips empty/invalid ranges).
 * - This shape is used by serialization, the planner's cost/progress calculations, and by UI components to
 *   present, edit and validate character-ability upgrade goals.
 */
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
    xpDaysLeft?: number;
    energyTotal: number;
    oTokensTotal: number;
    xpBooksTotal: number;
    xpEstimate?: IXpEstimate;
    xpEstimateAbilities?: IXpEstimate;
    mowEstimate?: IMowMaterialsTotal;
    abilitiesEstimate?: ICharacterAbilitiesMaterialsTotal;
    xpBooksApplied?: number;
    xpBooksRequired?: number;
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
