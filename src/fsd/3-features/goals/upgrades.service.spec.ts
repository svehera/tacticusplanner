/* eslint-disable import-x/no-internal-modules */
import { describe, it, expect } from 'vitest';

import { CampaignsLocationsUsage, DailyRaidsStrategy, PersonalGoalType } from 'src/models/enums';
import {
    ICustomDailyRaidsSettings,
    IDailyRaidsFarmOrder,
    IDailyRaidsHomeScreenEvent,
    IEstimatedRanksSettings,
} from 'src/models/interfaces';

import { Alliance, FactionId, Rank, Rarity, RarityStars, UnitType } from '@/fsd/5-shared/model';

import {
    Campaign,
    CampaignGroupType,
    CampaignsService,
    CampaignType,
    ICampaignBattleComposed,
    ICampaignsFilters,
} from '@/fsd/4-entities/campaign';
import { battleData } from '@/fsd/4-entities/campaign/data';
import { CharacterUpgradesService, CharactersService, ICharacter2, ICharacterData } from '@/fsd/4-entities/character';
import { rankUpData } from '@/fsd/4-entities/character/data';
import { ICharacterUpgradeMow, ICharacterUnlockGoal, ICharacterUpgradeRankGoal } from '@/fsd/4-entities/goal';
import { IMow2, MowsService } from '@/fsd/4-entities/mow';
import { mows2Data } from '@/fsd/4-entities/mow/data';
import { UpgradesService as FsdUpgradesService } from '@/fsd/4-entities/upgrade';
import { recipeDataByName } from '@/fsd/4-entities/upgrade/data';

import {
    ICharacterAscendGoal,
    ICombinedUpgrade,
    IItemRaidLocation,
    IUpgradesRaidsDay,
    IUnitUpgrade,
    IUpgradeRaid,
} from '@/fsd/3-features/goals/goals.models';
import { UpgradesService } from '@/fsd/3-features/goals/upgrades.service';

const createAscendGoal = (overrides: Partial<ICharacterAscendGoal> = {}): ICharacterAscendGoal => ({
    priority: 1,
    include: true,
    goalId: 'goal-default',
    unitId: 'unit-default',
    unitName: 'Unit',
    unitIcon: '',
    unitRoundIcon: '',
    unitAlliance: Alliance.Imperial,
    notes: '',
    rarityStart: Rarity.Rare,
    rarityEnd: Rarity.Epic,
    starsStart: RarityStars.RedOneStar,
    starsEnd: RarityStars.RedOneStar,
    shards: 0,
    mythicShards: 0,
    onslaughtShards: 6.5,
    onslaughtMythicShards: 0,
    campaignsUsage: CampaignsLocationsUsage.LeastEnergy,
    mythicCampaignsUsage: CampaignsLocationsUsage.LeastEnergy,
    type: PersonalGoalType.Ascend,
    ...overrides,
});

const createCharacter = (baseChar: ICharacterData, overrides: Partial<ICharacter2> = {}): ICharacter2 => {
    return {
        ...baseChar,
        rarity: Rarity.Rare,
        rank: Rank.Silver1,
        stars: RarityStars.RedOneStar,
        unitType: UnitType.character,
        shards: 0,
        mythicShards: 0,
        ...overrides,
    } as ICharacter2;
};

const createMow = (baseMow: IMow2, overrides: Partial<IMow2> = {}): IMow2 => {
    return {
        ...baseMow,
        id: baseMow.snowprintId,
        unlocked: true,
        rarity: Rarity.Rare,
        stars: RarityStars.RedOneStar,
        primaryAbilityLevel: 1,
        secondaryAbilityLevel: 1,
        shards: 0,
        mythicShards: 0,
        unitType: UnitType.mow,
        ...overrides,
    } as IMow2;
};

const createRankGoal = (
    baseChar: ICharacterData,
    overrides: Partial<ICharacterUpgradeRankGoal> = {}
): ICharacterUpgradeRankGoal => ({
    priority: 1,
    include: true,
    goalId: 'goal-rank-default',
    unitId: baseChar.snowprintId!,
    unitName: baseChar.shortName ?? baseChar.name,
    unitIcon: baseChar.icon ?? '',
    unitRoundIcon: baseChar.roundIcon ?? '',
    unitAlliance: baseChar.alliance ?? Alliance.Imperial,
    notes: '',
    type: PersonalGoalType.UpgradeRank,
    rankStart: Rank.Stone1,
    rankEnd: Rank.Stone2,
    appliedUpgrades: [],
    rankStartPoint5: false,
    rankPoint5: false,
    upgradesRarity: [],
    rarity: baseChar.initialRarity ?? Rarity.Common,
    level: 1,
    xp: 0,
    ...overrides,
});

const createUnlockGoal = (
    baseChar: ICharacterData,
    overrides: Partial<ICharacterUnlockGoal> = {}
): ICharacterUnlockGoal => ({
    priority: 1,
    include: true,
    goalId: 'goal-unlock-default',
    unitId: baseChar.snowprintId!,
    unitName: baseChar.shortName ?? baseChar.name,
    unitIcon: baseChar.icon ?? '',
    unitRoundIcon: baseChar.roundIcon ?? '',
    unitAlliance: baseChar.alliance ?? Alliance.Imperial,
    notes: '',
    type: PersonalGoalType.Unlock,
    shards: 0,
    mythicShards: 0,
    rank: Rank.Locked,
    rarity: baseChar.initialRarity ?? Rarity.Common,
    faction: baseChar.faction,
    campaignsUsage: CampaignsLocationsUsage.LeastEnergy,
    ...overrides,
});

const buildBaseUpgradeCounts = (
    upgradeIds: string[],
    inventory: Record<string, number> = {},
    rarityFilter: Rarity[] | undefined = undefined
): Record<string, number> => {
    const counts: Record<string, number> = {};

    const addBaseUpgrade = (upgradeId: string, count: number) => {
        const available = inventory[upgradeId] ?? 0;
        if (available >= count) {
            inventory[upgradeId] = available - count;
            return;
        }
        if (available > 0) {
            inventory[upgradeId] = 0;
            count -= available;
        }
        if (count > 0) {
            counts[upgradeId] = (counts[upgradeId] ?? 0) + count;
        }
    };

    upgradeIds.forEach(upgradeId => {
        const upgrade = FsdUpgradesService.getUpgrade(upgradeId);
        if (!upgrade) return;
        if (upgrade.crafted) {
            const expanded = FsdUpgradesService.recipeExpandedUpgradeData[upgrade.snowprintId];
            Object.entries(expanded.expandedRecipe).forEach(([baseId, count]) => {
                addBaseUpgrade(baseId, count);
            });
            return;
        }
        addBaseUpgrade(upgradeId, 1);
    });

    if (rarityFilter && rarityFilter.length > 0) {
        Object.keys(counts).forEach(upgradeId => {
            const upgrade = FsdUpgradesService.baseUpgradesData[upgradeId];
            if (upgrade && !rarityFilter.includes(upgrade.rarity as Rarity)) {
                delete counts[upgradeId];
            }
        });
    }

    return counts;
};

const createUnitUpgrade = (overrides: Partial<IUnitUpgrade> = {}): IUnitUpgrade => ({
    goalId: 'goal-unit-default',
    unitId: 'unit-default',
    label: 'Unit',
    upgradeRanks: [],
    upgradeShards: undefined,
    baseUpgradesTotal: {},
    relatedUpgrades: [],
    ...overrides,
});

const getWorldEatersFactionMaterialIds = (rarity: 'Rare' | 'Legendary'): string[] => {
    if (rarity === 'Rare') {
        return ['upgDmgR038', 'upgHpR038', 'upgArmR038'];
    }
    return ['upgHpL118'];
};

const createCompletedLocation = (
    battle: ICampaignBattleComposed,
    raidsCount: number = battle.dailyBattleCount
): IItemRaidLocation => {
    return {
        ...battle,
        raidsAlreadyPerformed: raidsCount,
        raidsToPerform: 0,
        farmedItems: 0,
        energySpent: raidsCount * battle.energyCost,
        isShardsLocation: false,
    };
};

const createNoRewardLocation = (battleId: string, raidsCount = 1): IItemRaidLocation => {
    const battle = battleData[battleId];
    return {
        id: battleId,
        rewards: battle.rewards,
        energyCost: battle.energyCost,
        dailyBattleCount: raidsCount,
        raidsAlreadyPerformed: raidsCount,
        farmedItems: 0,
        energySpent: raidsCount * battle.energyCost,
        isShardsLocation: false,
    } as IItemRaidLocation;
};

const createSettings = (overrides: Partial<IEstimatedRanksSettings> = {}): IEstimatedRanksSettings => ({
    completedLocations: [],
    campaignsProgress: { [Campaign.I]: 0 } as IEstimatedRanksSettings['campaignsProgress'],
    dailyEnergy: 0,
    preferences: {
        dailyEnergy: 0,
        shardsEnergy: 0,
        farmPreferences: {
            order: IDailyRaidsFarmOrder.goalPriority,
            homeScreenEvent: IDailyRaidsHomeScreenEvent.none,
        },
        farmStrategy: DailyRaidsStrategy.leastEnergy,
    },
    upgrades: {},
    ...overrides,
});

const createAllCampaignsProgress = (): IEstimatedRanksSettings['campaignsProgress'] => {
    return Object.values(Campaign)
        .filter((value): value is Campaign => typeof value === 'string')
        .reduce(
            (acc, campaign) => {
                acc[campaign] = 999;
                return acc;
            },
            {} as IEstimatedRanksSettings['campaignsProgress']
        );
};

const createFilters = (overrides: Partial<ICampaignsFilters> = {}): ICampaignsFilters => ({
    enemiesAlliance: [],
    enemiesFactions: [],
    alliesAlliance: [],
    alliesFactions: [],
    campaignTypes: [],
    upgradesRarity: [],
    slotsCount: [],
    enemiesTypes: [],
    enemiesMinCount: undefined,
    enemiesMaxCount: undefined,
    ...overrides,
});

const createCustomDailyRaidsSettings = (
    overrides: Partial<ICustomDailyRaidsSettings> = {}
): ICustomDailyRaidsSettings => {
    const defaults = Object.values(Rarity)
        .filter((value): value is Rarity => typeof value === 'number')
        .reduce<Partial<Record<Rarity, CampaignType[]>>>(
            (acc, rarity) => {
                acc[rarity] = [];
                return acc;
            },
            { Shard: [], 'Mythic Shard': [] } as Partial<Record<Rarity | 'Shard' | 'Mythic Shard', CampaignType[]>>
        ) as Record<Rarity | 'Shard' | 'Mythic Shard', CampaignType[]>;

    return {
        ...defaults,
        ...overrides,
    };
};

const getRewardLocations = (rewardId: string): ICampaignBattleComposed[] => {
    return Object.values(CampaignsService.campaignsComposed).filter(
        battle =>
            (battle.campaignType === CampaignType.Elite || battle.campaignType === CampaignType.Mirror) &&
            (battle.rewards.guaranteed.some(reward => reward.id === rewardId) ||
                battle.rewards.potential.some(reward => reward.id === rewardId))
    );
};

describe('UpgradesService.addOnslaughtsForDay', () => {
    it('adds three onslaught battles for an ascend goal with three tokens', () => {
        const baseChar = CharactersService.charactersData[0];
        const character = createCharacter(baseChar, { shards: 237 });

        const goal: ICharacterAscendGoal = createAscendGoal({
            goalId: 'goal-1',
            unitId: character.snowprintId!,
            unitName: character.shortName ?? character.name,
            unitIcon: character.icon ?? '',
            unitRoundIcon: character.roundIcon ?? '',
            unitAlliance: character.alliance ?? Alliance.Imperial,
        });

        const inventory: Record<string, number> = {
            ...Object.fromEntries(
                Object.values(recipeDataByName)
                    .slice(0, 1)
                    .map(item => [item.material, 0])
            ),
            [`shards_${character.snowprintId}`]: 0,
        };

        const settings: IEstimatedRanksSettings = {
            completedLocations: [],
            campaignsProgress: {} as IEstimatedRanksSettings['campaignsProgress'],
            dailyEnergy: 0,
            preferences: {
                dailyEnergy: 638,
                shardsEnergy: 0,
                farmPreferences: {
                    order: IDailyRaidsFarmOrder.goalPriority,
                    homeScreenEvent: IDailyRaidsHomeScreenEvent.none,
                },
                farmStrategy: DailyRaidsStrategy.leastEnergy,
            },
            upgrades: inventory,
            onslaughtTokensToday: 3,
        };

        const day: IUpgradesRaidsDay = {
            raids: [],
            energyTotal: 0,
            raidsTotal: 0,
            onslaughtTokens: 0,
        };

        const combinedBaseMaterials = {} as Record<string, ICombinedUpgrade>;

        UpgradesService.addOnslaughtsForDay(
            day,
            [character],
            [],
            3,
            [goal],
            combinedBaseMaterials,
            settings,
            inventory
        );

        expect(day.onslaughtTokens).toBe(3);
        expect(day.raids).toHaveLength(1);
        expect(day.raids[0].id).toBe(`shards_${character.snowprintId}`);
        expect(day.raids[0].raidLocations).toHaveLength(3);
        expect(day.raids[0].raidLocations.every(loc => loc.raidsToPerform === 1)).toBe(true);
        expect(day.raids[0].raidLocations.map(loc => loc.farmedItems)).toEqual([6, 7, 6]);
    });

    it('consumes only the tokens needed to complete onslaught shards', () => {
        const baseChar = CharactersService.charactersData[0];
        const character = createCharacter(baseChar, { rarity: Rarity.Rare, stars: RarityStars.RedOneStar, shards: 40 });

        const goal: ICharacterAscendGoal = createAscendGoal({
            goalId: 'goal-2',
            unitId: character.snowprintId!,
            unitName: character.shortName ?? character.name,
            unitIcon: character.icon ?? '',
            unitRoundIcon: character.roundIcon ?? '',
            unitAlliance: character.alliance ?? Alliance.Imperial,
            rarityStart: Rarity.Rare,
            rarityEnd: Rarity.Epic,
            starsStart: RarityStars.RedOneStar,
            starsEnd: RarityStars.RedOneStar,
            onslaughtShards: 6.5,
        });

        const inventory: Record<string, number> = {
            ...Object.fromEntries(
                Object.values(recipeDataByName)
                    .slice(0, 1)
                    .map(item => [item.material, 0])
            ),
            [`shards_${character.snowprintId}`]: character.shards,
        };

        const settings: IEstimatedRanksSettings = {
            completedLocations: [],
            campaignsProgress: {} as IEstimatedRanksSettings['campaignsProgress'],
            dailyEnergy: 0,
            preferences: {
                dailyEnergy: 638,
                shardsEnergy: 0,
                farmPreferences: {
                    order: IDailyRaidsFarmOrder.goalPriority,
                    homeScreenEvent: IDailyRaidsHomeScreenEvent.none,
                },
                farmStrategy: DailyRaidsStrategy.leastEnergy,
            },
            upgrades: inventory,
            onslaughtTokensToday: 3,
        };

        const day: IUpgradesRaidsDay = {
            raids: [],
            energyTotal: 0,
            raidsTotal: 0,
            onslaughtTokens: 0,
        };

        const combinedBaseMaterials = {} as Record<string, ICombinedUpgrade>;

        UpgradesService.addOnslaughtsForDay(
            day,
            [character],
            [],
            3,
            [goal],
            combinedBaseMaterials,
            settings,
            inventory
        );

        expect(day.onslaughtTokens).toBe(2);
        expect(day.raids).toHaveLength(1);
        expect(day.raids[0].id).toBe(`shards_${character.snowprintId}`);
        expect(day.raids[0].raidLocations).toHaveLength(2);
        expect(day.raids[0].raidLocations.map(loc => loc.farmedItems)).toEqual([6, 7]);
    });

    it('allocates onslaught raids across two goals that each need one token', () => {
        const baseCharA = CharactersService.charactersData[0];
        const baseCharB = CharactersService.charactersData[1];

        const characterA = createCharacter(baseCharA, {
            rarity: Rarity.Rare,
            stars: RarityStars.RedOneStar,
            shards: 49,
        });
        const characterB = createCharacter(baseCharB, {
            rarity: Rarity.Rare,
            stars: RarityStars.RedOneStar,
            shards: 49,
        });

        const goalA: ICharacterAscendGoal = createAscendGoal({
            goalId: 'goal-a',
            unitId: characterA.snowprintId!,
            unitName: characterA.shortName ?? characterA.name,
            unitIcon: characterA.icon ?? '',
            unitRoundIcon: characterA.roundIcon ?? '',
            unitAlliance: characterA.alliance ?? Alliance.Imperial,
            rarityStart: Rarity.Rare,
            rarityEnd: Rarity.Epic,
            starsStart: RarityStars.RedOneStar,
            starsEnd: RarityStars.RedOneStar,
        });

        const goalB: ICharacterAscendGoal = createAscendGoal({
            priority: 2,
            goalId: 'goal-b',
            unitId: characterB.snowprintId!,
            unitName: characterB.shortName ?? characterB.name,
            unitIcon: characterB.icon ?? '',
            unitRoundIcon: characterB.roundIcon ?? '',
            unitAlliance: characterB.alliance ?? Alliance.Imperial,
            rarityStart: Rarity.Rare,
            rarityEnd: Rarity.Epic,
            starsStart: RarityStars.RedOneStar,
            starsEnd: RarityStars.RedOneStar,
        });

        const inventory: Record<string, number> = {
            ...Object.fromEntries(
                Object.values(recipeDataByName)
                    .slice(0, 1)
                    .map(item => [item.material, 0])
            ),
            [`shards_${characterA.snowprintId}`]: characterA.shards,
            [`shards_${characterB.snowprintId}`]: characterB.shards,
        };

        const settings: IEstimatedRanksSettings = {
            completedLocations: [],
            campaignsProgress: {} as IEstimatedRanksSettings['campaignsProgress'],
            dailyEnergy: 0,
            preferences: {
                dailyEnergy: 638,
                shardsEnergy: 0,
                farmPreferences: {
                    order: IDailyRaidsFarmOrder.goalPriority,
                    homeScreenEvent: IDailyRaidsHomeScreenEvent.none,
                },
                farmStrategy: DailyRaidsStrategy.leastEnergy,
            },
            upgrades: inventory,
            onslaughtTokensToday: 2,
        };

        const day: IUpgradesRaidsDay = {
            raids: [],
            energyTotal: 0,
            raidsTotal: 0,
            onslaughtTokens: 0,
        };

        const combinedBaseMaterials = {} as Record<string, ICombinedUpgrade>;

        UpgradesService.addOnslaughtsForDay(
            day,
            [characterA, characterB],
            [],
            2,
            [goalA, goalB],
            combinedBaseMaterials,
            settings,
            inventory
        );

        const raidIds = day.raids.map(raid => raid.id);

        expect(day.onslaughtTokens).toBe(2);
        expect(day.raids).toHaveLength(2);
        expect(raidIds).toContain(`shards_${characterA.snowprintId}`);
        expect(raidIds).toContain(`shards_${characterB.snowprintId}`);
        expect(day.raids.every(raid => raid.raidLocations.length === 1)).toBe(true);
    });

    it('does not add onslaughts when shard goal is already met (total materials)', () => {
        const baseChar = CharactersService.charactersData.find(char => char.snowprintId === 'emperExultant');
        expect(baseChar).toBeDefined();
        const character = createCharacter(baseChar as ICharacterData, {
            shards: 750,
            rarity: Rarity.Legendary,
            stars: RarityStars.RedFourStars,
        });

        const goal: ICharacterAscendGoal = createAscendGoal({
            goalId: 'goal-legendary-ascend',
            unitId: character.snowprintId!,
            unitName: character.shortName ?? character.name,
            unitIcon: character.icon ?? '',
            unitRoundIcon: character.roundIcon ?? '',
            unitAlliance: character.alliance ?? Alliance.Imperial,
            rarityStart: Rarity.Legendary,
            rarityEnd: Rarity.Legendary,
            starsStart: RarityStars.RedFourStars,
            starsEnd: RarityStars.OneBlueStar,
        });

        const inventory: Record<string, number> = {
            ...Object.fromEntries(
                Object.values(recipeDataByName)
                    .slice(0, 1)
                    .map(item => [item.material, 0])
            ),
            [`shards_${character.snowprintId}`]: 750,
        };

        const settings: IEstimatedRanksSettings = {
            completedLocations: [],
            campaignsProgress: {} as IEstimatedRanksSettings['campaignsProgress'],
            dailyEnergy: 0,
            preferences: {
                dailyEnergy: 638,
                shardsEnergy: 0,
                farmPreferences: {
                    order: IDailyRaidsFarmOrder.totalMaterials,
                    homeScreenEvent: IDailyRaidsHomeScreenEvent.none,
                },
                farmStrategy: DailyRaidsStrategy.leastEnergy,
            },
            upgrades: inventory,
            onslaughtTokensToday: 3,
        };

        const day: IUpgradesRaidsDay = {
            raids: [],
            energyTotal: 0,
            raidsTotal: 0,
            onslaughtTokens: 0,
        };

        const combinedBaseMaterials = {} as Record<string, ICombinedUpgrade>;

        UpgradesService.addOnslaughtsForDay(
            day,
            [character],
            [],
            3,
            [goal],
            combinedBaseMaterials,
            settings,
            inventory
        );

        expect(day.raids).toHaveLength(0);
        expect(day.onslaughtTokens).toBe(0);
    });

    it('does not add onslaughts when shard goal is already met (goal priority)', () => {
        const baseChar = CharactersService.charactersData.find(char => char.snowprintId === 'emperExultant');
        expect(baseChar).toBeDefined();
        const character = createCharacter(baseChar as ICharacterData, {
            shards: 750,
            rarity: Rarity.Legendary,
            stars: RarityStars.RedFourStars,
        });

        const goal: ICharacterAscendGoal = createAscendGoal({
            goalId: 'goal-legendary-ascend',
            unitId: character.snowprintId!,
            unitName: character.shortName ?? character.name,
            unitIcon: character.icon ?? '',
            unitRoundIcon: character.roundIcon ?? '',
            unitAlliance: character.alliance ?? Alliance.Imperial,
            rarityStart: Rarity.Legendary,
            rarityEnd: Rarity.Legendary,
            starsStart: RarityStars.RedFourStars,
            starsEnd: RarityStars.OneBlueStar,
        });

        const inventory: Record<string, number> = {
            ...Object.fromEntries(
                Object.values(recipeDataByName)
                    .slice(0, 1)
                    .map(item => [item.material, 0])
            ),
            [`shards_${character.snowprintId}`]: 750,
        };

        const settings: IEstimatedRanksSettings = {
            completedLocations: [],
            campaignsProgress: {} as IEstimatedRanksSettings['campaignsProgress'],
            dailyEnergy: 0,
            preferences: {
                dailyEnergy: 638,
                shardsEnergy: 0,
                farmPreferences: {
                    order: IDailyRaidsFarmOrder.goalPriority,
                    homeScreenEvent: IDailyRaidsHomeScreenEvent.none,
                },
                farmStrategy: DailyRaidsStrategy.leastEnergy,
            },
            upgrades: inventory,
            onslaughtTokensToday: 3,
        };

        const day: IUpgradesRaidsDay = {
            raids: [],
            energyTotal: 0,
            raidsTotal: 0,
            onslaughtTokens: 0,
        };

        const combinedBaseMaterials = {} as Record<string, ICombinedUpgrade>;

        UpgradesService.addOnslaughtsForDay(
            day,
            [character],
            [],
            3,
            [goal],
            combinedBaseMaterials,
            settings,
            inventory
        );

        expect(day.raids).toHaveLength(0);
        expect(day.onslaughtTokens).toBe(0);
    });

    it('does not modify the day when goals is empty', () => {
        const baseChar = CharactersService.charactersData[0];
        const character = createCharacter(baseChar);

        const inventory: Record<string, number> = {
            ...Object.fromEntries(
                Object.values(recipeDataByName)
                    .slice(0, 1)
                    .map(item => [item.material, 0])
            ),
            [`shards_${character.snowprintId}`]: 0,
        };

        const settings: IEstimatedRanksSettings = {
            completedLocations: [],
            campaignsProgress: {} as IEstimatedRanksSettings['campaignsProgress'],
            dailyEnergy: 0,
            preferences: {
                dailyEnergy: 638,
                shardsEnergy: 0,
                farmPreferences: {
                    order: IDailyRaidsFarmOrder.goalPriority,
                    homeScreenEvent: IDailyRaidsHomeScreenEvent.none,
                },
                farmStrategy: DailyRaidsStrategy.leastEnergy,
            },
            upgrades: inventory,
            onslaughtTokensToday: 2,
        };

        const day: IUpgradesRaidsDay = {
            raids: [],
            energyTotal: 0,
            raidsTotal: 0,
            onslaughtTokens: 0,
        };

        const combinedBaseMaterials = {} as Record<string, ICombinedUpgrade>;

        UpgradesService.addOnslaughtsForDay(day, [character], [], 2, [], combinedBaseMaterials, settings, inventory);

        expect(day.onslaughtTokens).toBe(0);
        expect(day.raids).toHaveLength(0);
        expect(day.energyTotal).toBe(0);
        expect(day.raidsTotal).toBe(0);
    });
});

describe('UpgradesService.planDayRaiding', () => {
    it('farms both Boon of Khorne elite locations when sorting by total materials', () => {
        const baseChar = CharactersService.charactersData.find(
            char => char.shortName === 'Tarvakh' || char.name === 'Tarvakh'
        );
        expect(baseChar).toBeDefined();
        const character = createCharacter(baseChar as ICharacterData, {
            rank: Rank.Silver1,
            rarity: Rarity.Legendary,
            stars: RarityStars.RedThreeStars,
        });

        const goal = createRankGoal(baseChar as ICharacterData, {
            goalId: 'goal-tarvakh-s1-d3',
            rankStart: Rank.Silver1,
            rankEnd: Rank.Diamond3,
        });

        const campaignsProgress = Object.values(Campaign)
            .filter((value): value is Campaign => typeof value === 'string')
            .reduce(
                (acc, campaign) => {
                    acc[campaign] = 999;
                    return acc;
                },
                {} as IEstimatedRanksSettings['campaignsProgress']
            );

        const inventory: Record<string, number> = {};
        const settings = createSettings({
            dailyEnergy: 500,
            campaignsProgress,
            upgrades: inventory,
            preferences: {
                ...createSettings().preferences,
                dailyEnergy: 500,
                farmPreferences: {
                    order: IDailyRaidsFarmOrder.totalMaterials,
                    homeScreenEvent: IDailyRaidsHomeScreenEvent.none,
                },
                farmStrategy: DailyRaidsStrategy.leastEnergy,
            },
        });

        const unitUpgrades = UpgradesService.getUpgrades(inventory, [character], [], [goal]);
        const combinedBaseMaterials = UpgradesService.combineBaseMaterials(unitUpgrades);
        UpgradesService.populateLocationsData(combinedBaseMaterials, settings);

        const locs = Object.values(combinedBaseMaterials)
            .flatMap(mat => mat.locations)
            .filter(loc => loc.isSuggested);

        const day: IUpgradesRaidsDay = {
            raids: [],
            energyTotal: 0,
            raidsTotal: 0,
            onslaughtTokens: 0,
        };

        UpgradesService.planDayRaiding(day, settings, settings.dailyEnergy, locs, combinedBaseMaterials, inventory, [
            goal,
        ]);

        const boonLocations = [
            CampaignsService.campaignsComposed['FoCE29'].id,
            CampaignsService.campaignsComposed['SHME31'].id,
        ];
        const boonRaid = day.raids.find(raid => raid.id === 'upgHpL118');
        const raidLocationIds = boonRaid?.raidLocations.map(loc => loc.id) ?? [];

        expect(boonRaid).toBeDefined();
        expect(raidLocationIds).toEqual(expect.arrayContaining(boonLocations));
    });
});

describe('UpgradesService.addRaidForLocation (daily caps)', () => {
    const upgradeId = 'upgHpU012';
    const baseUpgrade = FsdUpgradesService.baseUpgradesData[upgradeId];
    const baseCharA = CharactersService.charactersData[0];
    const baseCharB = CharactersService.charactersData[1];
    const baseCharC = CharactersService.charactersData[2];

    const goalA = createRankGoal(baseCharA, { goalId: 'goal-a', priority: 1 });
    const goalB = createRankGoal(baseCharB, { goalId: 'goal-b', priority: 2 });
    const goalC = createRankGoal(baseCharC, { goalId: 'goal-c', priority: 3 });
    const goals = [goalA, goalB, goalC];

    const createLocation = (id: string): ICampaignBattleComposed => {
        const base = CampaignsService.campaignsComposed[id];
        const baseRewards = base.rewards || { guaranteed: [], potential: [] };
        const potential =
            baseRewards.potential && baseRewards.potential.length > 0 ? baseRewards.potential : [{ id: upgradeId }];
        return {
            ...base,
            rewards: {
                ...baseRewards,
                potential,
            },
            isSuggested: true,
            dailyBattleCount: 6,
            dropRate: 1,
        } as ICampaignBattleComposed;
    };

    const buildRemainingMats = (countByGoalId: Record<string, number>, locations: ICampaignBattleComposed[]) => ({
        [upgradeId]: {
            ...baseUpgrade,
            requiredCount: Object.values(countByGoalId).reduce((sum, count) => sum + count, 0),
            countByGoalId,
            relatedCharacters: [goalA.unitId, goalB.unitId, goalC.unitId],
            relatedGoals: [goalA.goalId, goalB.goalId, goalC.goalId],
            locations,
        } as ICombinedUpgrade,
    });

    const createDayWithRaid = (
        raidLocations: IItemRaidLocation[],
        raidKey: string,
        goalForRaid: ICharacterUpgradeRankGoal
    ): IUpgradesRaidsDay => ({
        raids: [
            {
                raidLocations,
                energyTotal: raidLocations.reduce((sum, loc) => sum + loc.energySpent, 0),
                energyLeft: 0,
                daysTotal: -1,
                raidsTotal: raidLocations.reduce((sum, loc) => sum + loc.raidsToPerform, 0),
                acquiredCount: 0,
                requiredCount: 0,
                relatedCharacters: [goalForRaid.unitId],
                relatedGoals: [goalForRaid.goalId],
                isBlocked: false,
                isFinished: false,
                id: raidKey,
                snowprintId: baseUpgrade.snowprintId,
                label: baseUpgrade.label,
                rarity: baseUpgrade.rarity,
                iconPath: baseUpgrade.iconPath,
                locations: raidLocations,
                crafted: baseUpgrade.crafted,
                stat: baseUpgrade.stat,
            } as IUpgradeRaid,
        ],
        energyTotal: 0,
        raidsTotal: 0,
        onslaughtTokens: 0,
    });

    it('raids each location once when two goals need one material each', () => {
        const locOE05 = createLocation('OE05');
        const locIME04 = createLocation('IME04');
        const remainingMats = buildRemainingMats({ [goalA.goalId]: 1, [goalB.goalId]: 1 }, [locOE05, locIME04]);
        const inventory: Record<string, number> = {};
        const day: IUpgradesRaidsDay = { raids: [], energyTotal: 0, raidsTotal: 0, onslaughtTokens: 0 };

        UpgradesService.raidLocation(day, 999, inventory, locOE05, remainingMats, goals, goalA.goalId, {
            raidKey: `${upgradeId}::${goalA.goalId}`,
            goal: { goalId: goalA.goalId, unitId: goalA.unitId },
        });
        UpgradesService.raidLocation(day, 999, inventory, locIME04, remainingMats, goals, goalB.goalId, {
            raidKey: `${upgradeId}::${goalB.goalId}`,
            goal: { goalId: goalB.goalId, unitId: goalB.unitId },
        });

        const raidA = day.raids.find(r => r.id === `${upgradeId}::${goalA.goalId}`)!;
        const raidB = day.raids.find(r => r.id === `${upgradeId}::${goalB.goalId}`)!;

        const locationIdsA = raidA.raidLocations.map(loc => loc.id);
        expect(locationIdsA).toHaveLength(1);
        expect(new Set(locationIdsA).size).toBe(1);
        expect(locationIdsA).toEqual([locOE05.id]);
        const countsA = Object.fromEntries(raidA.raidLocations.map(loc => [loc.id, loc.raidsToPerform]));
        expect(countsA[locOE05.id]).toBe(1);

        const locationIdsB = raidB.raidLocations.map(loc => loc.id);
        expect(locationIdsB).toHaveLength(1);
        expect(new Set(locationIdsB).size).toBe(1);
        expect(locationIdsB).toEqual([locIME04.id]);
        const countsB = Object.fromEntries(raidB.raidLocations.map(loc => [loc.id, loc.raidsToPerform]));
        expect(countsB[locIME04.id]).toBe(1);
    });

    it('caps raids to one goal when both locations are maxed by the first goal', () => {
        const locOE05 = createLocation('OE05');
        const locIME04 = createLocation('IME04');
        const remainingMats = buildRemainingMats({ [goalA.goalId]: 20, [goalB.goalId]: 20 }, [locOE05, locIME04]);
        const inventory: Record<string, number> = {};
        const day: IUpgradesRaidsDay = { raids: [], energyTotal: 0, raidsTotal: 0, onslaughtTokens: 0 };

        UpgradesService.raidLocation(day, 999, inventory, locOE05, remainingMats, goals, goalA.goalId, {
            raidKey: `${upgradeId}::${goalA.goalId}`,
            goal: { goalId: goalA.goalId, unitId: goalA.unitId },
        });
        UpgradesService.raidLocation(day, 999, inventory, locIME04, remainingMats, goals, goalA.goalId, {
            raidKey: `${upgradeId}::${goalA.goalId}`,
            goal: { goalId: goalA.goalId, unitId: goalA.unitId },
        });
        UpgradesService.raidLocation(day, 999, inventory, locOE05, remainingMats, goals, goalB.goalId, {
            raidKey: `${upgradeId}::${goalB.goalId}`,
            goal: { goalId: goalB.goalId, unitId: goalB.unitId },
        });
        UpgradesService.raidLocation(day, 999, inventory, locIME04, remainingMats, goals, goalB.goalId, {
            raidKey: `${upgradeId}::${goalB.goalId}`,
            goal: { goalId: goalB.goalId, unitId: goalB.unitId },
        });

        const raidA = day.raids.find(r => r.id === `${upgradeId}::${goalA.goalId}`)!;
        const raidB = day.raids.find(r => r.id === `${upgradeId}::${goalB.goalId}`);

        const locationIdsA = raidA.raidLocations.map(loc => loc.id);
        expect(locationIdsA).toHaveLength(2);
        expect(new Set(locationIdsA).size).toBe(2);
        expect(locationIdsA).toEqual(expect.arrayContaining([locOE05.id, locIME04.id]));
        const countsA = Object.fromEntries(raidA.raidLocations.map(loc => [loc.id, loc.raidsToPerform]));
        expect(countsA[locOE05.id]).toBe(6);
        expect(countsA[locIME04.id]).toBe(6);

        expect(raidB).toBeUndefined();
    });

    it('shares a location between goals when the first goal leaves remaining attempts', () => {
        const locOE05 = createLocation('OE05');
        const locIME04 = createLocation('IME04');
        const remainingMats = buildRemainingMats({ [goalA.goalId]: 8, [goalB.goalId]: 8 }, [locOE05, locIME04]);
        const inventory: Record<string, number> = {};
        const day: IUpgradesRaidsDay = { raids: [], energyTotal: 0, raidsTotal: 0, onslaughtTokens: 0 };

        UpgradesService.raidLocation(day, 999, inventory, locOE05, remainingMats, goals, goalA.goalId, {
            raidKey: `${upgradeId}::${goalA.goalId}`,
            goal: { goalId: goalA.goalId, unitId: goalA.unitId },
        });
        UpgradesService.raidLocation(day, 999, inventory, locIME04, remainingMats, goals, goalA.goalId, {
            raidKey: `${upgradeId}::${goalA.goalId}`,
            goal: { goalId: goalA.goalId, unitId: goalA.unitId },
        });

        const raidAfterGoalA = day.raids.find(r => r.id === `${upgradeId}::${goalA.goalId}`)!;
        const countsAfterGoalA = Object.fromEntries(
            raidAfterGoalA.raidLocations.map(loc => [loc.id, loc.raidsToPerform])
        );
        expect(countsAfterGoalA[locOE05.id]).toBe(6);
        expect(countsAfterGoalA[locIME04.id]).toBe(2);

        UpgradesService.raidLocation(day, 999, inventory, locIME04, remainingMats, goals, goalB.goalId, {
            raidKey: `${upgradeId}::${goalB.goalId}`,
            goal: { goalId: goalB.goalId, unitId: goalB.unitId },
        });

        const raidA = day.raids.find(r => r.id === `${upgradeId}::${goalA.goalId}`)!;
        const raidB = day.raids.find(r => r.id === `${upgradeId}::${goalB.goalId}`)!;

        const locationIdsA = raidA.raidLocations.map(loc => loc.id);
        expect(locationIdsA).toHaveLength(2);
        expect(new Set(locationIdsA).size).toBe(2);
        expect(locationIdsA).toEqual(expect.arrayContaining([locOE05.id, locIME04.id]));
        const countsA = Object.fromEntries(raidA.raidLocations.map(loc => [loc.id, loc.raidsToPerform]));
        expect(countsA[locOE05.id]).toBe(6);
        expect(countsA[locIME04.id]).toBe(2);

        const locationIdsB = raidB.raidLocations.map(loc => loc.id);
        expect(locationIdsB).toHaveLength(1);
        expect(new Set(locationIdsB).size).toBe(1);
        expect(locationIdsB).toEqual([locIME04.id]);
        const countsB = Object.fromEntries(raidB.raidLocations.map(loc => [loc.id, loc.raidsToPerform]));
        expect(countsB[locIME04.id]).toBe(4);
    });

    it('does not add raids when both locations are already maxed', () => {
        const locOE05 = createLocation('OE05');
        const locIME04 = createLocation('IME04');
        const remainingMats = buildRemainingMats({ [goalA.goalId]: 1, [goalB.goalId]: 1 }, [locOE05, locIME04]);
        const inventory: Record<string, number> = {};
        const day = createDayWithRaid(
            [
                {
                    ...locOE05,
                    raidsAlreadyPerformed: 6,
                    raidsToPerform: 6,
                    farmedItems: 6,
                    energySpent: 6 * locOE05.energyCost,
                    isShardsLocation: false,
                },
                {
                    ...locIME04,
                    raidsAlreadyPerformed: 6,
                    raidsToPerform: 6,
                    farmedItems: 6,
                    energySpent: 6 * locIME04.energyCost,
                    isShardsLocation: false,
                },
            ],
            `${upgradeId}::${goalC.goalId}`,
            goalC
        );

        UpgradesService.raidLocation(day, 999, inventory, locOE05, remainingMats, goals, goalA.goalId, {
            raidKey: `${upgradeId}::${goalA.goalId}`,
            goal: { goalId: goalA.goalId, unitId: goalA.unitId },
        });
        UpgradesService.raidLocation(day, 999, inventory, locIME04, remainingMats, goals, goalB.goalId, {
            raidKey: `${upgradeId}::${goalB.goalId}`,
            goal: { goalId: goalB.goalId, unitId: goalB.unitId },
        });

        const raid = day.raids.find(r => r.id === `${upgradeId}::${goalC.goalId}`)!;
        const locationIds = raid.raidLocations.map(loc => loc.id);
        expect(locationIds).toHaveLength(2);
        expect(new Set(locationIds).size).toBe(2);
        expect(locationIds).toEqual(expect.arrayContaining([locOE05.id, locIME04.id]));
        const counts = Object.fromEntries(raid.raidLocations.map(loc => [loc.id, loc.raidsToPerform]));
        expect(counts[locOE05.id]).toBe(6);
        expect(counts[locIME04.id]).toBe(6);
        expect(day.raids.find(r => r.id === `${upgradeId}::${goalA.goalId}`)).toBeUndefined();
        expect(day.raids.find(r => r.id === `${upgradeId}::${goalB.goalId}`)).toBeUndefined();
    });

    it('uses the second location when the first is already maxed by another goal', () => {
        const locOE05 = createLocation('OE05');
        const locIME04 = createLocation('IME04');
        const remainingMats = buildRemainingMats({ [goalA.goalId]: 1, [goalB.goalId]: 1 }, [locOE05, locIME04]);
        const inventory: Record<string, number> = {};
        const day = createDayWithRaid(
            [
                {
                    ...locOE05,
                    raidsAlreadyPerformed: 6,
                    raidsToPerform: 6,
                    farmedItems: 6,
                    energySpent: 6 * locOE05.energyCost,
                    isShardsLocation: false,
                },
            ],
            `${upgradeId}::${goalC.goalId}`,
            goalC
        );

        UpgradesService.raidLocation(day, 999, inventory, locOE05, remainingMats, goals, goalA.goalId, {
            raidKey: `${upgradeId}::${goalA.goalId}`,
            goal: { goalId: goalA.goalId, unitId: goalA.unitId },
        });
        UpgradesService.raidLocation(day, 999, inventory, locIME04, remainingMats, goals, goalA.goalId, {
            raidKey: `${upgradeId}::${goalA.goalId}`,
            goal: { goalId: goalA.goalId, unitId: goalA.unitId },
        });
        UpgradesService.raidLocation(day, 999, inventory, locOE05, remainingMats, goals, goalB.goalId, {
            raidKey: `${upgradeId}::${goalB.goalId}`,
            goal: { goalId: goalB.goalId, unitId: goalB.unitId },
        });
        UpgradesService.raidLocation(day, 999, inventory, locIME04, remainingMats, goals, goalB.goalId, {
            raidKey: `${upgradeId}::${goalB.goalId}`,
            goal: { goalId: goalB.goalId, unitId: goalB.unitId },
        });

        const raidA = day.raids.find(r => r.id === `${upgradeId}::${goalA.goalId}`)!;
        const raidB = day.raids.find(r => r.id === `${upgradeId}::${goalB.goalId}`)!;

        const locationIdsA = raidA.raidLocations.map(loc => loc.id);
        expect(locationIdsA).toHaveLength(1);
        expect(new Set(locationIdsA).size).toBe(1);
        expect(locationIdsA).toEqual([locIME04.id]);
        const countsA = Object.fromEntries(raidA.raidLocations.map(loc => [loc.id, loc.raidsToPerform]));
        expect(countsA[locIME04.id]).toBe(1);

        const locationIdsB = raidB.raidLocations.map(loc => loc.id);
        expect(locationIdsB).toHaveLength(1);
        expect(new Set(locationIdsB).size).toBe(1);
        expect(locationIdsB).toEqual([locIME04.id]);
        const countsB = Object.fromEntries(raidB.raidLocations.map(loc => [loc.id, loc.raidsToPerform]));
        expect(countsB[locIME04.id]).toBe(1);
    });
});

describe('UpgradesService.canonicalizeInventoryUpgrades', () => {
    it('keeps inventory keys that are already snowprint IDs', () => {
        const snowprintId = Object.keys(recipeDataByName)[0];
        const inventory = { [snowprintId]: 4 };

        const result = UpgradesService.canonicalizeInventoryUpgrades(inventory, [], []);

        expect(result[snowprintId]).toBe(4);
    });

    it('canonicalizes human-readable material names to snowprint IDs', () => {
        const [snowprintId, material] = Object.entries(recipeDataByName)[0];
        const inventory = { [material.material]: 7 };

        const result = UpgradesService.canonicalizeInventoryUpgrades(inventory, [], []);

        expect(result[snowprintId]).toBe(7);
    });

    it('stores existing shards and mythic shards for characters', () => {
        const baseChar = CharactersService.charactersData[0];
        const character = createCharacter(baseChar, { shards: 12, mythicShards: 3 });

        const result = UpgradesService.canonicalizeInventoryUpgrades({}, [character], []);

        expect(result[`shards_${character.snowprintId}`]).toBe(12);
        expect(result[`mythicShards_${character.snowprintId}`]).toBe(3);
    });

    it('stores existing shards and mythic shards for mows', () => {
        const baseMow = mows2Data.mows[0] as IMow2;
        const mow = createMow(baseMow, { shards: 5, mythicShards: 2 });

        const result = UpgradesService.canonicalizeInventoryUpgrades({}, [], [mow]);

        expect(result[`shards_${mow.snowprintId}`]).toBe(5);
        expect(result[`mythicShards_${mow.snowprintId}`]).toBe(2);
    });
});

describe('UpgradesService.getUpgrades', () => {
    const worldEatersRareIds = getWorldEatersFactionMaterialIds('Rare');
    const worldEatersLegendaryIds = getWorldEatersFactionMaterialIds('Legendary');
    const tyranidsRareIds = ['upgArmR033', 'upgDmgR033', 'upgHpR033'];
    const tyranidsLegendaryIds = ['upgHpL116'];

    const findStone1UncraftableCandidate = () => {
        for (const [unitId, ranks] of Object.entries(rankUpData)) {
            const stoneOne = (ranks as Record<string, string[]>)['Stone I'];
            if (!stoneOne || stoneOne.length === 0) continue;
            const allUncrafted = stoneOne.every(upgradeId => {
                const upgrade = FsdUpgradesService.getUpgrade(upgradeId);
                return upgrade !== undefined && !upgrade.crafted;
            });
            const hasDuplicate = new Set(stoneOne).size < stoneOne.length;
            if (allUncrafted && hasDuplicate) {
                return { unitId, upgrades: stoneOne };
            }
        }
        return undefined;
    };

    it('counts uncraftable upgrades for a Stone I to Stone II rank-up goal', () => {
        const candidate = findStone1UncraftableCandidate();
        if (!candidate) throw new Error('No candidate with uncraftable Stone I upgrades found.');

        const baseChar = CharactersService.getUnit(candidate.unitId)!;
        const goal = createRankGoal(baseChar, {
            goalId: 'goal-stone1-stone2',
            unitId: baseChar.snowprintId!,
            unitName: baseChar.shortName ?? baseChar.name,
            unitIcon: baseChar.icon ?? '',
            unitRoundIcon: baseChar.roundIcon ?? '',
            unitAlliance: baseChar.alliance ?? Alliance.Imperial,
            rankStart: Rank.Stone1,
            rankEnd: Rank.Stone2,
        });

        const character = createCharacter(baseChar);
        const upgrades = UpgradesService.getUpgrades({}, [character], [], [goal]);

        const expected = buildBaseUpgradeCounts(candidate.upgrades);
        const actual = upgrades[0].baseUpgradesTotal;

        expect(Object.keys(actual)).toHaveLength(Object.keys(expected).length);
        expect(actual).toEqual(expected);
    });

    it('includes uncraftable upgrades already covered by inventory for a Stone I to Stone II goal', () => {
        const candidate = findStone1UncraftableCandidate();
        if (!candidate) throw new Error('No candidate with uncraftable Stone I upgrades found.');

        const baseChar = CharactersService.getUnit(candidate.unitId)!;
        const character = createCharacter(baseChar);
        const goal = createRankGoal(baseChar, {
            goalId: 'goal-stone1-stone2-inventory',
            unitId: baseChar.snowprintId!,
            unitName: baseChar.shortName ?? baseChar.name,
            unitIcon: baseChar.icon ?? '',
            unitRoundIcon: baseChar.roundIcon ?? '',
            unitAlliance: baseChar.alliance ?? Alliance.Imperial,
            rankStart: Rank.Stone1,
            rankEnd: Rank.Stone2,
        });
        const selectedUpgrade = candidate.upgrades[0]!;
        const selectedUpgradeCount = candidate.upgrades.filter(x => x === selectedUpgrade).length;

        const inventory = { [selectedUpgrade]: selectedUpgradeCount };
        const upgrades = UpgradesService.getUpgrades(inventory, [character], [], [goal]);

        const actual = upgrades[0].baseUpgradesTotal;

        expect(actual[selectedUpgrade]).toEqual(1);
    });

    it('counts legendary upgrades for Kharn from Diamond II to Diamond III', () => {
        const kharn = CharactersService.getUnit('worldKharn')!;
        const character = createCharacter(kharn);
        const goal = createRankGoal(kharn, {
            goalId: 'goal-kharn-d2-d3',
            unitId: kharn.snowprintId!,
            unitName: kharn.shortName ?? kharn.name,
            unitIcon: kharn.icon ?? '',
            unitRoundIcon: kharn.roundIcon ?? '',
            unitAlliance: kharn.alliance ?? Alliance.Chaos,
            rankStart: Rank.Diamond2,
            rankEnd: Rank.Diamond3,
        });

        const upgrades = UpgradesService.getUpgrades({}, [character], [], [goal]);
        const actualLegendaryCount = upgrades[0].baseUpgradesTotal['upgHpL118'] ?? 0;

        expect(actualLegendaryCount).toBe(27);
    });

    it('filters to legendary upgrades for Kharn Stone I to Diamond II.5', () => {
        const kharn = CharactersService.getUnit('worldKharn')!;
        const character = createCharacter(kharn);
        const goal = createRankGoal(kharn, {
            goalId: 'goal-kharn-legendary-filter',
            unitId: kharn.snowprintId!,
            unitName: kharn.shortName ?? kharn.name,
            unitIcon: kharn.icon ?? '',
            unitRoundIcon: kharn.roundIcon ?? '',
            unitAlliance: kharn.alliance ?? Alliance.Chaos,
            rankStart: Rank.Stone1,
            rankEnd: Rank.Diamond2,
            rankPoint5: true,
            upgradesRarity: [Rarity.Legendary],
        });

        const upgrades = UpgradesService.getUpgrades({}, [character], [], [goal]);

        expect(upgrades.map(x => x.baseUpgradesTotal)).toEqual([{ upgHpL118: 82, upgArmL203: 1, upgDmgL003: 1 }]);
    });

    it('filters to common through epic upgrades for Kharn Stone I to Diamond III', () => {
        const kharn = CharactersService.getUnit('worldKharn')!;
        const character = createCharacter(kharn);
        const goal = createRankGoal(kharn, {
            goalId: 'goal-kharn-non-legendary-filter',
            unitId: kharn.snowprintId!,
            unitName: kharn.shortName ?? kharn.name,
            unitIcon: kharn.icon ?? '',
            unitRoundIcon: kharn.roundIcon ?? '',
            unitAlliance: kharn.alliance ?? Alliance.Chaos,
            rankStart: Rank.Stone1,
            rankEnd: Rank.Diamond3,
            upgradesRarity: [Rarity.Common, Rarity.Uncommon, Rarity.Rare, Rarity.Epic],
        });

        const upgrades = UpgradesService.getUpgrades({}, [character], [], [goal]);
        const actual = upgrades[0].baseUpgradesTotal;

        expect(
            Object.keys(actual).every(id => FsdUpgradesService.baseUpgradesData[id]?.rarity !== Rarity.Legendary)
        ).toBe(true);

        expect(actual['upgDmgR038'] ?? 0).toBe(64);
        expect(actual['upgHpR038'] ?? 0).toBe(64);
        expect(actual['upgArmR038'] ?? 0).toBe(64);
        expect(actual['upgHpE012'] ?? 0).toBe(34);
    });

    it('adds 130 shards for an Abraxas unlock goal with zero shards', () => {
        const abraxas = CharactersService.getUnit('thousInfernalMaster')!;
        const character = createCharacter(abraxas, { rank: Rank.Locked, shards: 0 });
        const goal = createUnlockGoal(abraxas, {
            goalId: 'goal-abraxas-unlock-zero',
            unitId: abraxas.snowprintId!,
            unitName: abraxas.shortName ?? abraxas.name,
            unitIcon: abraxas.icon ?? '',
            unitRoundIcon: abraxas.roundIcon ?? '',
            unitAlliance: abraxas.alliance ?? Alliance.Chaos,
        });

        const upgrades = UpgradesService.getUpgrades({}, [character], [], [goal]);

        expect(upgrades[0].baseUpgradesTotal[`shards_${abraxas.snowprintId}`]).toBe(130);
    });

    it('adds 30 shards for an Abraxas unlock goal with 100 shards', () => {
        const abraxas = CharactersService.getUnit('thousInfernalMaster')!;
        const character = createCharacter(abraxas, { rank: Rank.Locked, shards: 100 });
        const goal = createUnlockGoal(abraxas, {
            goalId: 'goal-abraxas-unlock-100',
            unitId: abraxas.snowprintId!,
            unitName: abraxas.shortName ?? abraxas.name,
            unitIcon: abraxas.icon ?? '',
            unitRoundIcon: abraxas.roundIcon ?? '',
            unitAlliance: abraxas.alliance ?? Alliance.Chaos,
        });

        const upgrades = UpgradesService.getUpgrades({}, [character], [], [goal]);
        const shardName = `shards_${abraxas.snowprintId}`;

        expect(upgrades[0].baseUpgradesTotal[shardName]).toBe(130);
    });

    it('adds 80 shards for a Wrask unlock goal with zero shards', () => {
        const wrask = CharactersService.getUnit('worldTerminator')!;
        const character = createCharacter(wrask, { rank: Rank.Locked, shards: 0 });
        const goal = createUnlockGoal(wrask, {
            goalId: 'goal-wrask-unlock-zero',
            unitId: wrask.snowprintId!,
            unitName: wrask.shortName ?? wrask.name,
            unitIcon: wrask.icon ?? '',
            unitRoundIcon: wrask.roundIcon ?? '',
            unitAlliance: wrask.alliance ?? Alliance.Chaos,
        });

        const upgrades = UpgradesService.getUpgrades({}, [character], [], [goal]);

        expect(upgrades[0].baseUpgradesTotal[`shards_${wrask.snowprintId}`]).toBe(80);
    });

    it('adds 20 shards for a Wrask unlock goal when all but twenty shards are owned', () => {
        const wrask = CharactersService.getUnit('worldTerminator')!;
        const character = createCharacter(wrask, { rank: Rank.Locked, shards: 60 });
        const goal = createUnlockGoal(wrask, {
            goalId: 'goal-wrask-unlock-60',
            unitId: wrask.snowprintId!,
            unitName: wrask.shortName ?? wrask.name,
            unitIcon: wrask.icon ?? '',
            unitRoundIcon: wrask.roundIcon ?? '',
            unitAlliance: wrask.alliance ?? Alliance.Chaos,
        });

        const upgrades = UpgradesService.getUpgrades({}, [character], [], [goal]);
        const shardName = `shards_${wrask.snowprintId}`;

        expect(upgrades[0].baseUpgradesTotal[shardName]).toBe(80);
    });

    it('counts World Eaters rares and legendaries across two Kharn goals', () => {
        const kharn = CharactersService.getUnit('worldKharn')!;
        const character = createCharacter(kharn);

        const goalStoneToGold = createRankGoal(kharn, {
            goalId: 'goal-kharn-stone-gold',
            unitId: kharn.snowprintId!,
            unitName: kharn.shortName ?? kharn.name,
            unitIcon: kharn.icon ?? '',
            unitRoundIcon: kharn.roundIcon ?? '',
            unitAlliance: kharn.alliance ?? Alliance.Chaos,
            rankStart: Rank.Stone1,
            rankEnd: Rank.Gold1,
        });

        const goalGoldToDiamond = createRankGoal(kharn, {
            goalId: 'goal-kharn-gold-diamond',
            unitId: kharn.snowprintId!,
            unitName: kharn.shortName ?? kharn.name,
            unitIcon: kharn.icon ?? '',
            unitRoundIcon: kharn.roundIcon ?? '',
            unitAlliance: kharn.alliance ?? Alliance.Chaos,
            rankStart: Rank.Gold1,
            rankEnd: Rank.Diamond1,
        });

        const expectedStone = buildBaseUpgradeCounts(
            CharacterUpgradesService.getCharacterUpgradeRank(goalStoneToGold).flatMap(rank => rank.upgrades)
        );
        const expectedGold = buildBaseUpgradeCounts(
            CharacterUpgradesService.getCharacterUpgradeRank(goalGoldToDiamond).flatMap(rank => rank.upgrades)
        );

        const expectedRareTotal = worldEatersRareIds.reduce(
            (sum, id) => sum + (expectedStone[id] ?? 0) + (expectedGold[id] ?? 0),
            0
        );
        const expectedLegendaryTotal = worldEatersLegendaryIds.reduce(
            (sum, id) => sum + (expectedStone[id] ?? 0) + (expectedGold[id] ?? 0),
            0
        );

        const upgrades = UpgradesService.getUpgrades({}, [character], [], [goalStoneToGold, goalGoldToDiamond]);
        const actualCounts = upgrades.reduce<Record<string, number>>((acc, upgrade) => {
            Object.entries(upgrade.baseUpgradesTotal).forEach(([id, count]) => {
                acc[id] = (acc[id] ?? 0) + count;
            });
            return acc;
        }, {});

        const actualRareTotal = worldEatersRareIds.reduce((sum, id) => sum + (actualCounts[id] ?? 0), 0);
        const actualLegendaryTotal = worldEatersLegendaryIds.reduce((sum, id) => sum + (actualCounts[id] ?? 0), 0);

        expect(actualRareTotal).toBe(expectedRareTotal);
        expect(actualLegendaryTotal).toBe(expectedLegendaryTotal);
    });

    it('includes World Eaters legendaries even when inventory covers them for Kharn Stone I to Diamond III', () => {
        const kharn = CharactersService.getUnit('worldKharn')!;
        const character = createCharacter(kharn);
        const goal = createRankGoal(kharn, {
            goalId: 'goal-kharn-stone-diamond',
            unitId: kharn.snowprintId!,
            unitName: kharn.shortName ?? kharn.name,
            unitIcon: kharn.icon ?? '',
            unitRoundIcon: kharn.roundIcon ?? '',
            unitAlliance: kharn.alliance ?? Alliance.Chaos,
            rankStart: Rank.Stone1,
            rankEnd: Rank.Diamond3,
        });

        const upgradeIds = CharacterUpgradesService.getCharacterUpgradeRank(goal).flatMap(rank => rank.upgrades);
        const legendaryInventory = { upgHpL118: buildBaseUpgradeCounts(upgradeIds)['upgHpL118'] };

        const upgrades = UpgradesService.getUpgrades(legendaryInventory, [character], [], [goal]);

        expect(upgrades[0].baseUpgradesTotal['upgHpL118']).toBe(82);
    });

    it('includes World Eaters legendaries even when inventory covers Kharn and Wrask Stone I to Diamond III', () => {
        const kharn = CharactersService.getUnit('worldKharn')!;
        const wrask = CharactersService.getUnit('worldTerminator')!;
        const kharnChar = createCharacter(kharn);
        const wraskChar = createCharacter(wrask);

        const kharnGoal = createRankGoal(kharn, {
            goalId: 'goal-kharn-stone-diamond-all',
            unitId: kharn.snowprintId!,
            unitName: kharn.shortName ?? kharn.name,
            unitIcon: kharn.icon ?? '',
            unitRoundIcon: kharn.roundIcon ?? '',
            unitAlliance: kharn.alliance ?? Alliance.Chaos,
            rankStart: Rank.Stone1,
            rankEnd: Rank.Diamond3,
        });

        const wraskGoal = createRankGoal(wrask, {
            goalId: 'goal-wrask-stone-diamond-all',
            unitId: wrask.snowprintId!,
            unitName: wrask.shortName ?? wrask.name,
            unitIcon: wrask.icon ?? '',
            unitRoundIcon: wrask.roundIcon ?? '',
            unitAlliance: wrask.alliance ?? Alliance.Chaos,
            rankStart: Rank.Stone1,
            rankEnd: Rank.Diamond3,
        });

        const upgrades = UpgradesService.getUpgrades(
            { upgHpL118: 164 },
            [kharnChar, wraskChar],
            [],
            [kharnGoal, wraskGoal]
        );

        const combined = upgrades.reduce<Record<string, number>>((acc, upgrade) => {
            Object.entries(upgrade.baseUpgradesTotal).forEach(([id, count]) => {
                acc[id] = (acc[id] ?? 0) + count;
            });
            return acc;
        }, {});

        expect(combined['upgHpL118']).toBe(164);
    });

    it('counts Tyranid rares and legendaries for Biovore MoW upgrades to 50/50', () => {
        const biovore = mows2Data.mows.find(mow => mow.snowprintId === 'tyranBiovore') as IMow2;
        const mow = createMow(biovore);

        const goal: ICharacterUpgradeMow = {
            priority: 1,
            include: true,
            goalId: 'goal-biovore-50-50',
            unitId: biovore.snowprintId,
            unitName: biovore.name,
            unitIcon: biovore.icon,
            unitRoundIcon: biovore.roundIcon,
            unitAlliance: Alliance.Xenos,
            notes: '',
            type: PersonalGoalType.MowAbilities,
            primaryStart: 1,
            primaryEnd: 50,
            secondaryStart: 1,
            secondaryEnd: 50,
            upgradesRarity: [],
            shards: 0,
            stars: RarityStars.None,
            rarity: Rarity.Common,
        };

        const upgradeIds = [
            ...MowsService.getUpgradesRaw(goal.unitId, goal.primaryStart, goal.primaryEnd, 'primary'),
            ...MowsService.getUpgradesRaw(goal.unitId, goal.secondaryStart, goal.secondaryEnd, 'secondary'),
        ];

        const expected = buildBaseUpgradeCounts(upgradeIds);
        const expectedRare = tyranidsRareIds.reduce((sum, id) => sum + (expected[id] ?? 0), 0);
        const expectedLegendary = tyranidsLegendaryIds.reduce((sum, id) => sum + (expected[id] ?? 0), 0);

        const upgrades = UpgradesService.getUpgrades({}, [], [mow], [goal]);
        const actual = upgrades[0].baseUpgradesTotal;
        const actualRare = tyranidsRareIds.reduce((sum, id) => sum + (actual[id] ?? 0), 0);
        const actualLegendary = tyranidsLegendaryIds.reduce((sum, id) => sum + (actual[id] ?? 0), 0);

        expect(actualRare).toBe(expectedRare);
        expect(actualLegendary).toBe(expectedLegendary);
    });
});

describe('UpgradesService.getUpgradesEstimatedDays', () => {
    const buildSettings = (overrides: Partial<IEstimatedRanksSettings> = {}) =>
        createSettings({
            dailyEnergy: 638,
            campaignsProgress: createAllCampaignsProgress(),
            preferences: {
                ...createSettings().preferences,
                dailyEnergy: 638,
                farmPreferences: {
                    order: IDailyRaidsFarmOrder.goalPriority,
                    homeScreenEvent: IDailyRaidsHomeScreenEvent.none,
                },
                farmStrategy: DailyRaidsStrategy.leastEnergy,
            },
            ...overrides,
        });

    it('Helbrecht Stone I to Silver I with empty inventory', () => {
        const hmh = CharactersService.getUnit('templHelbrecht')!;
        const character = createCharacter(hmh, { rank: Rank.Stone1 });
        const goal = createRankGoal(hmh, {
            goalId: 'goal-hmh-s1-s1',
            unitId: hmh.snowprintId!,
            unitName: hmh.shortName ?? hmh.name,
            unitIcon: hmh.icon ?? '',
            unitRoundIcon: hmh.roundIcon ?? '',
            unitAlliance: hmh.alliance ?? Alliance.Imperial,
            rankStart: Rank.Stone1,
            rankEnd: Rank.Silver1,
        });

        const settings = buildSettings({ preferences: { ...createSettings().preferences } });
        const result = UpgradesService.getUpgradesEstimatedDays(settings, [character], [], goal);

        expect(result.daysTotal).toBe(4);
        // 2149 with current drop rates.
        expect(Math.abs(2150 - result.energyTotal)).toBeLessThan(100);
    });

    it('Atlacoya Stone I to Silver I with empty inventory', () => {
        const atlacoya = CharactersService.getUnit('custoAtlacoya')!;
        const character = createCharacter(atlacoya, { rank: Rank.Stone1 });
        const goal = createRankGoal(atlacoya, {
            goalId: 'goal-atlacoya-s1-s1',
            unitId: atlacoya.snowprintId!,
            unitName: atlacoya.shortName ?? atlacoya.name,
            unitIcon: atlacoya.icon ?? '',
            unitRoundIcon: atlacoya.roundIcon ?? '',
            unitAlliance: atlacoya.alliance ?? Alliance.Imperial,
            rankStart: Rank.Stone1,
            rankEnd: Rank.Silver1,
        });

        const settings = buildSettings({ preferences: { ...createSettings().preferences } });
        const result = UpgradesService.getUpgradesEstimatedDays(settings, [character], [], goal);

        expect(result.daysTotal).toBe(3);
        // 1852 with current drop rates.
        expect(Math.abs(1850 - result.energyTotal)).toBeLessThan(100);
    });

    it('estimates Wrask Diamond I to Diamond III with positive days and energy', () => {
        const wrask = CharactersService.getUnit('worldTerminator')!;
        const character = createCharacter(wrask, { rank: Rank.Diamond1 });
        const goal = createRankGoal(wrask, {
            goalId: 'goal-wrask-d1-d3',
            unitId: wrask.snowprintId!,
            unitName: wrask.shortName ?? wrask.name,
            unitIcon: wrask.icon ?? '',
            unitRoundIcon: wrask.roundIcon ?? '',
            unitAlliance: wrask.alliance ?? Alliance.Chaos,
            rankStart: Rank.Diamond1,
            rankEnd: Rank.Diamond3,
        });

        const result = UpgradesService.getUpgradesEstimatedDays(
            buildSettings({ preferences: { ...createSettings().preferences } }),
            [character],
            [],
            goal
        );

        expect(result.daysTotal).toBe(11);
        // 4715 with current drop rates.
        expect(Math.abs(4500 - result.energyTotal)).toBeLessThan(500);
    });

    it('estimates Helbrecht Stone I to Diamond III with positive days and energy', () => {
        const hmh = CharactersService.getUnit('templHelbrecht')!;
        const character = createCharacter(hmh, { rank: Rank.Stone1 });
        const goal = createRankGoal(hmh, {
            goalId: 'goal-hmh-s1-d3',
            unitId: hmh.snowprintId!,
            unitName: hmh.shortName ?? hmh.name,
            unitIcon: hmh.icon ?? '',
            unitRoundIcon: hmh.roundIcon ?? '',
            unitAlliance: hmh.alliance ?? Alliance.Imperial,
            rankStart: Rank.Stone1,
            rankEnd: Rank.Diamond3,
        });

        const result = UpgradesService.getUpgradesEstimatedDays(
            buildSettings({ preferences: { ...createSettings().preferences } }),
            [character],
            [],
            goal
        );

        expect(result.daysTotal).toBe(25);
        // 15504 with current drop rates.
        expect(Math.abs(15500 - result.energyTotal)).toBeLessThan(1000);
    });

    it('estimates Helbrecht Stone I to Diamond III needs 108 faction legendaries', () => {
        const hmh = CharactersService.getUnit('templHelbrecht')!;
        const character = createCharacter(hmh, { rank: Rank.Stone1 });
        const goal = createRankGoal(hmh, {
            goalId: 'goal-hmh-s1-d3',
            unitId: hmh.snowprintId!,
            unitName: hmh.shortName ?? hmh.name,
            unitIcon: hmh.icon ?? '',
            unitRoundIcon: hmh.roundIcon ?? '',
            unitAlliance: hmh.alliance ?? Alliance.Imperial,
            rankStart: Rank.Stone1,
            rankEnd: Rank.Diamond3,
        });

        const customLocationSettings = {
            [Rarity.Common]: [
                CampaignType.Early,
                CampaignType.Mirror,
                CampaignType.Elite,
                CampaignType.Standard,
                CampaignType.Extremis,
            ],
            [Rarity.Uncommon]: [
                CampaignType.Early,
                CampaignType.Mirror,
                CampaignType.Elite,
                CampaignType.Standard,
                CampaignType.Extremis,
            ],
            [Rarity.Rare]: [CampaignType.Early, CampaignType.Elite, CampaignType.Extremis],
            [Rarity.Epic]: [CampaignType.Early, CampaignType.Elite, CampaignType.Extremis],
            [Rarity.Legendary]: [CampaignType.Early, CampaignType.Elite, CampaignType.Extremis],
            [Rarity.Mythic]: [CampaignType.Early, CampaignType.Elite, CampaignType.Extremis],
            Shard: [CampaignType.Elite, CampaignType.Extremis],
            'Mythic Shard': [CampaignType.Elite, CampaignType.Extremis],
        };
        const result = UpgradesService.getUpgradesEstimatedDays(
            buildSettings({
                preferences: {
                    ...createSettings().preferences,
                    farmStrategy: DailyRaidsStrategy.custom,
                    customSettings: customLocationSettings,
                },
            }),
            [character],
            [],
            goal
        );

        const bones = result.inProgressMaterials.find(mat => mat.snowprintId === 'upgHpL101');
        expect(bones?.requiredCount).toBe(108);
    });

    it('accounts for 78 Bones of the Paragons in inventory', () => {
        const hmh = CharactersService.getUnit('templHelbrecht')!;
        const character = createCharacter(hmh, { rank: Rank.Stone1 });
        const goal = createRankGoal(hmh, {
            goalId: 'goal-hmh-s1-d3-inventory-bones',
            unitId: hmh.snowprintId!,
            unitName: hmh.shortName ?? hmh.name,
            unitIcon: hmh.icon ?? '',
            unitRoundIcon: hmh.roundIcon ?? '',
            unitAlliance: hmh.alliance ?? Alliance.Imperial,
            rankStart: Rank.Stone1,
            rankEnd: Rank.Diamond3,
        });

        const inventory = {
            upgHpL101: 78, // Bones of the Paragons
        };

        const result = UpgradesService.getUpgradesEstimatedDays(
            buildSettings({ upgrades: inventory, preferences: { ...createSettings().preferences } }),
            [character],
            [],
            goal
        );

        const bones = result.inProgressMaterials.find(mat => mat.snowprintId === 'upgHpL101');

        expect
            .soft(UpgradesService.getUpgrades(inventory, [character], [], [goal])[0].baseUpgradesTotal['upgHpL101'])
            .toEqual(108);

        expect.soft(result.finishedMaterials.find(mat => mat.snowprintId === 'upgHpL101')).toBeUndefined();
        expect.soft(bones?.requiredCount).toBe(108);
        expect.soft((bones?.requiredCount ?? 0) - (bones?.acquiredCount ?? 0)).toBe(30);
    });

    it('needs one bladesman honour for helbrecht to d3', () => {
        const hmh = CharactersService.getUnit('templHelbrecht')!;
        const character = createCharacter(hmh, { rank: Rank.Stone1 });
        const goal = createRankGoal(hmh, {
            goalId: 'goal-hmh-s1-d3-inventory-bones',
            unitId: hmh.snowprintId!,
            unitName: hmh.shortName ?? hmh.name,
            unitIcon: hmh.icon ?? '',
            unitRoundIcon: hmh.roundIcon ?? '',
            unitAlliance: hmh.alliance ?? Alliance.Imperial,
            rankStart: Rank.Stone1,
            rankEnd: Rank.Diamond3,
        });

        const inventory = {
            upgHpL101: 78, // Bones of the Paragons
        };

        const result = UpgradesService.getUpgradesEstimatedDays(
            buildSettings({ upgrades: inventory, preferences: { ...createSettings().preferences } }),
            [character],
            [],
            goal
        );

        const honour = result.inProgressMaterials.find(mat => mat.snowprintId === 'upgDmgR007');

        expect.soft(result.finishedMaterials.find(mat => mat.snowprintId === 'upgDmgR007')).toBeUndefined();
        expect.soft(result.blockedMaterials.find(mat => mat.snowprintId === 'upgDmgR007')).toBeUndefined();
        expect.soft(honour?.requiredCount).toEqual(1);
        expect.soft(honour?.acquiredCount).toBe(0);
    });

    it('having one bladesman honour for helbrecht to d3 with custom farming settings does not result in bladesman honour being blocked', () => {
        const hmh = CharactersService.getUnit('templHelbrecht')!;
        const character = createCharacter(hmh, { rank: Rank.Stone1 });
        const goal = createRankGoal(hmh, {
            goalId: 'goal-hmh-s1-d3-inventory-bones',
            unitId: hmh.snowprintId!,
            unitName: hmh.shortName ?? hmh.name,
            unitIcon: hmh.icon ?? '',
            unitRoundIcon: hmh.roundIcon ?? '',
            unitAlliance: hmh.alliance ?? Alliance.Imperial,
            rankStart: Rank.Stone1,
            rankEnd: Rank.Diamond3,
        });

        const inventory = {
            upgDmgR007: 1, // Bladesman's Honour
        };

        const customLocationSettings = {
            [Rarity.Common]: [
                CampaignType.Early,
                CampaignType.Mirror,
                CampaignType.Elite,
                CampaignType.Standard,
                CampaignType.Extremis,
            ],
            [Rarity.Uncommon]: [
                CampaignType.Early,
                CampaignType.Mirror,
                CampaignType.Elite,
                CampaignType.Standard,
                CampaignType.Extremis,
            ],
            [Rarity.Rare]: [CampaignType.Early, CampaignType.Elite, CampaignType.Extremis],
            [Rarity.Epic]: [CampaignType.Early, CampaignType.Elite, CampaignType.Extremis],
            [Rarity.Legendary]: [CampaignType.Early, CampaignType.Elite, CampaignType.Extremis],
            [Rarity.Mythic]: [CampaignType.Early, CampaignType.Elite, CampaignType.Extremis],
            Shard: [CampaignType.Elite, CampaignType.Extremis],
            'Mythic Shard': [CampaignType.Elite, CampaignType.Extremis],
        };
        const result = UpgradesService.getUpgradesEstimatedDays(
            buildSettings({
                upgrades: inventory,
                preferences: {
                    ...createSettings().preferences,
                    farmStrategy: DailyRaidsStrategy.custom,
                    customSettings: customLocationSettings,
                },
            }),
            [character],
            [],
            goal
        );

        const honour = result.blockedMaterials.find(mat => mat.snowprintId === 'upgDmgR007');
        expect(honour).toBeUndefined();
    });

    it('reduces Helbrecht Diamond III estimate with existing inventory', () => {
        const hmh = CharactersService.getUnit('templHelbrecht')!;
        const character = createCharacter(hmh, { rank: Rank.Stone1 });
        const goal = createRankGoal(hmh, {
            goalId: 'goal-hmh-s1-d3-inventory',
            unitId: hmh.snowprintId!,
            unitName: hmh.shortName ?? hmh.name,
            unitIcon: hmh.icon ?? '',
            unitRoundIcon: hmh.roundIcon ?? '',
            unitAlliance: hmh.alliance ?? Alliance.Imperial,
            rankStart: Rank.Stone1,
            rankEnd: Rank.Diamond3,
        });

        const inventory = {
            'Bones of the Paragons': 73,
            'Master-Crafted Ammo': 16,
            'Archeotech Remnant': 32,
            'Special Issue Ammo': 24,
        };

        const withInventory = UpgradesService.getUpgradesEstimatedDays(
            buildSettings({ upgrades: inventory }),
            [character],
            [],
            goal
        );

        expect(Math.abs(22 - withInventory.daysTotal)).toBeLessThanOrEqual(1);
        expect(Math.abs(12500 - withInventory.energyTotal)).toBeLessThan(1000);
    });

    it('adds Atlacoya after Helbrecht and prioritizes Helbrecht materials first', () => {
        const hmh = CharactersService.getUnit('templHelbrecht')!;
        const atlacoya = CharactersService.getUnit('custoAtlacoya')!;

        const hmhChar = createCharacter(hmh, { rank: Rank.Stone1 });
        const atlacoyaChar = createCharacter(atlacoya, { rank: Rank.Stone1 });

        const hmhGoal = createRankGoal(hmh, {
            goalId: 'goal-hmh-s1-d3-priority-1',
            unitId: hmh.snowprintId!,
            unitName: hmh.shortName ?? hmh.name,
            unitIcon: hmh.icon ?? '',
            unitRoundIcon: hmh.roundIcon ?? '',
            unitAlliance: hmh.alliance ?? Alliance.Imperial,
            rankStart: Rank.Stone1,
            rankEnd: Rank.Diamond3,
            priority: 1,
        });

        const atlacoyaGoal = createRankGoal(atlacoya, {
            goalId: 'goal-atlacoya-s1-d3-priority-2',
            unitId: atlacoya.snowprintId!,
            unitName: atlacoya.shortName ?? atlacoya.name,
            unitIcon: atlacoya.icon ?? '',
            unitRoundIcon: atlacoya.roundIcon ?? '',
            unitAlliance: atlacoya.alliance ?? Alliance.Imperial,
            rankStart: Rank.Stone1,
            rankEnd: Rank.Diamond3,
            priority: 2,
        });

        const inventory = {
            'Bones of the Paragons': 73,
            'Master-Crafted Ammo': 16,
            'Archeotech Remnant': 32,
            'Special Issue Ammo': 24,
        };

        const result = UpgradesService.getUpgradesEstimatedDays(
            buildSettings({ upgrades: inventory }),
            [hmhChar, atlacoyaChar],
            [],
            hmhGoal,
            atlacoyaGoal
        );

        expect(Math.abs(44 - result.daysTotal)).toBeLessThanOrEqual(1);
        expect(Math.abs(26500 - result.energyTotal)).toBeLessThan(1000);
    });

    it('prioritizes Atlacoya when its goal is more urgent than Helbrecht', () => {
        const hmh = CharactersService.getUnit('templHelbrecht')!;
        const atlacoya = CharactersService.getUnit('custoAtlacoya')!;

        const hmhChar = createCharacter(hmh, { rank: Rank.Stone1 });
        const atlacoyaChar = createCharacter(atlacoya, { rank: Rank.Stone1 });

        const hmhGoal = createRankGoal(hmh, {
            goalId: 'goal-hmh-s1-d3-priority-2',
            unitId: hmh.snowprintId!,
            unitName: hmh.shortName ?? hmh.name,
            unitIcon: hmh.icon ?? '',
            unitRoundIcon: hmh.roundIcon ?? '',
            unitAlliance: hmh.alliance ?? Alliance.Imperial,
            rankStart: Rank.Stone1,
            rankEnd: Rank.Diamond3,
            priority: 2,
        });

        const atlacoyaGoal = createRankGoal(atlacoya, {
            goalId: 'goal-atlacoya-s1-d3-priority-1',
            unitId: atlacoya.snowprintId!,
            unitName: atlacoya.shortName ?? atlacoya.name,
            unitIcon: atlacoya.icon ?? '',
            unitRoundIcon: atlacoya.roundIcon ?? '',
            unitAlliance: atlacoya.alliance ?? Alliance.Imperial,
            rankStart: Rank.Stone1,
            rankEnd: Rank.Diamond3,
            priority: 1,
        });

        const inventory = {
            'Bones of the Paragons': 73,
            'Master-Crafted Ammo': 16,
            'Archeotech Remnant': 32,
            'Special Issue Ammo': 24,
        };

        const result = UpgradesService.getUpgradesEstimatedDays(
            buildSettings({ upgrades: inventory }),
            [hmhChar, atlacoyaChar],
            [],
            hmhGoal,
            atlacoyaGoal
        );

        expect(Math.abs(44 - result.daysTotal)).toBeLessThanOrEqual(1);
        // 26581 with current drop rates.
        expect(Math.abs(26500 - result.energyTotal)).toBeLessThan(1500);
    });

    it('total energy cost is roughly equivalent regardless of priority', () => {
        const hmh = CharactersService.getUnit('templHelbrecht')!;
        const atlacoya = CharactersService.getUnit('custoAtlacoya')!;

        const hmhChar = createCharacter(hmh, { rank: Rank.Stone1 });
        const atlacoyaChar = createCharacter(atlacoya, { rank: Rank.Stone1 });

        const hmhGoal = createRankGoal(hmh, {
            goalId: 'goal-hmh-s1-d3-priority-2',
            unitId: hmh.snowprintId!,
            unitName: hmh.shortName ?? hmh.name,
            unitIcon: hmh.icon ?? '',
            unitRoundIcon: hmh.roundIcon ?? '',
            unitAlliance: hmh.alliance ?? Alliance.Imperial,
            rankStart: Rank.Stone1,
            rankEnd: Rank.Diamond3,
            priority: 2,
        });

        const atlacoyaGoal = createRankGoal(atlacoya, {
            goalId: 'goal-atlacoya-s1-d3-priority-1',
            unitId: atlacoya.snowprintId!,
            unitName: atlacoya.shortName ?? atlacoya.name,
            unitIcon: atlacoya.icon ?? '',
            unitRoundIcon: atlacoya.roundIcon ?? '',
            unitAlliance: atlacoya.alliance ?? Alliance.Imperial,
            rankStart: Rank.Stone1,
            rankEnd: Rank.Diamond3,
            priority: 1,
        });

        const inventory = {
            'Bones of the Paragons': 73,
            'Master-Crafted Ammo': 16,
            'Archeotech Remnant': 32,
            'Special Issue Ammo': 24,
        };

        const result1 = UpgradesService.getUpgradesEstimatedDays(
            buildSettings({ upgrades: inventory }),
            [hmhChar, atlacoyaChar],
            [],
            hmhGoal,
            atlacoyaGoal
        );

        const temp = hmhGoal.priority;
        hmhGoal.priority = atlacoyaGoal.priority;
        atlacoyaGoal.priority = temp;

        const result2 = UpgradesService.getUpgradesEstimatedDays(
            buildSettings({ upgrades: inventory }),
            [hmhChar, atlacoyaChar],
            [],
            hmhGoal,
            atlacoyaGoal
        );

        expect(Math.abs(result1.daysTotal - result2.daysTotal)).toBeLessThanOrEqual(2);
        // Two days worth of energy.
        expect(Math.abs(result1.energyTotal - result2.energyTotal)).toBeLessThan(1272);
    });
});

describe('UpgradesService.handleFirstDayCompletedRaids', () => {
    const kharn = CharactersService.getUnit('worldKharn')!;
    const kharnGoal: ICharacterUpgradeRankGoal = {
        priority: 1,
        include: true,
        goalId: 'goal-kharn-ranks',
        unitId: kharn.snowprintId!,
        unitName: kharn.shortName ?? kharn.name,
        unitIcon: kharn.icon ?? '',
        unitRoundIcon: kharn.roundIcon ?? '',
        unitAlliance: kharn.alliance ?? Alliance.Chaos,
        notes: '',
        type: PersonalGoalType.UpgradeRank,
        rankStart: Rank.Bronze1,
        rankEnd: Rank.Diamond3,
        appliedUpgrades: [],
        rankStartPoint5: false,
        rankPoint5: false,
        upgradesRarity: [],
        rarity: kharn.initialRarity ?? Rarity.Legendary,
        level: 1,
        xp: 0,
    };

    const worldEatersRewards = ['upgDmgR038', 'upgHpR038', 'upgArmR038', 'upgHpL118'];

    const buildCombinedBaseMaterials = (rewardIds: string[]): Record<string, ICombinedUpgrade> => {
        return Object.fromEntries(
            rewardIds.map(rewardId => [
                rewardId,
                {
                    ...FsdUpgradesService.baseUpgradesData[rewardId],
                    requiredCount: 10,
                    countByGoalId: { [kharnGoal.goalId]: 10 },
                    relatedCharacters: [kharnGoal.unitId],
                    relatedGoals: [kharnGoal.goalId],
                },
            ])
        ) as Record<string, ICombinedUpgrade>;
    };

    const buildSettings = (completedLocations: IItemRaidLocation[], upgrades: Record<string, number>) => {
        return {
            completedLocations,
            campaignsProgress: {} as IEstimatedRanksSettings['campaignsProgress'],
            dailyEnergy: 0,
            preferences: {
                dailyEnergy: 638,
                shardsEnergy: 0,
                farmPreferences: {
                    order: IDailyRaidsFarmOrder.goalPriority,
                    homeScreenEvent: IDailyRaidsHomeScreenEvent.none,
                },
                farmStrategy: DailyRaidsStrategy.leastEnergy,
            },
            upgrades,
            onslaughtTokensToday: 0,
        } as IEstimatedRanksSettings;
    };

    it('handles no-reward battles by separating them into their own raids', () => {
        const noRewardLocation = createNoRewardLocation('I09');
        const noRewardLocation2 = createNoRewardLocation('I10');

        const settings = buildSettings([noRewardLocation, noRewardLocation2], {});

        const day: IUpgradesRaidsDay = {
            raids: [],
            energyTotal: 0,
            raidsTotal: 0,
            onslaughtTokens: 0,
        };
        UpgradesService.handleFirstDayCompletedRaids(day, settings, {});

        expect(day.raids).toHaveLength(2);
        expect(day.raids.every(raid => raid.id.includes('no-reward'))).toBe(true);
        expect(day.energyTotal).toBe(6);
        expect(day.raidsTotal).toBe(2);
    });

    it('groups completed elite and mirror battles by reward for Kharn materials', () => {
        const rewardLocations = worldEatersRewards.map(rewardId => ({
            rewardId,
            locations: getRewardLocations(rewardId),
        }));

        rewardLocations.forEach(({ rewardId: _, locations }) => {
            expect(locations.length).toBeGreaterThan(0);
            expect(
                locations.some(
                    loc => loc.campaignType === CampaignType.Elite || loc.campaignType === CampaignType.Mirror
                )
            ).toBe(true);
        });

        const completedLocations = rewardLocations.flatMap(({ locations }) =>
            locations.map(location => createCompletedLocation(location))
        );

        const combinedBaseMaterials = buildCombinedBaseMaterials(worldEatersRewards);

        const upgrades = Object.fromEntries(worldEatersRewards.map(rewardId => [rewardId, 0]));
        const settings = buildSettings(completedLocations, upgrades);

        const day: IUpgradesRaidsDay = {
            raids: [],
            energyTotal: 0,
            raidsTotal: 0,
            onslaughtTokens: 0,
        };
        UpgradesService.handleFirstDayCompletedRaids(day, settings, combinedBaseMaterials);

        expect(day.raids).toHaveLength(worldEatersRewards.length);

        for (const { rewardId, locations } of rewardLocations) {
            const raid = day.raids.find(x => x.id.includes(rewardId));
            expect(raid).toBeDefined();
            expect(raid?.raidLocations).toHaveLength(locations.length);
        }
    });

    it('calculates raid totals and energy totals when some battles are raided more than others', () => {
        const rewardA = worldEatersRewards[0];
        const rewardB = worldEatersRewards[1];

        const rewardALocations = getRewardLocations(rewardA);
        const rewardBLocations = getRewardLocations(rewardB);

        expect(rewardALocations.length).toBeGreaterThan(1);
        expect(rewardBLocations.length).toBeGreaterThan(0);

        const completedLocations = [
            createCompletedLocation(rewardALocations[0], 1),
            createCompletedLocation(rewardALocations[1], 3),
            createCompletedLocation(rewardBLocations[0], 2),
        ];

        const combinedBaseMaterials = buildCombinedBaseMaterials([rewardA, rewardB]);
        const upgrades = { [rewardA]: 0, [rewardB]: 0 };
        const settings = buildSettings(completedLocations, upgrades);

        const day: IUpgradesRaidsDay = {
            raids: [],
            energyTotal: 0,
            raidsTotal: 0,
            onslaughtTokens: 0,
        };
        UpgradesService.handleFirstDayCompletedRaids(day, settings, combinedBaseMaterials);

        const raidA = day.raids.find(x => x.id.includes(rewardA))!;
        const raidB = day.raids.find(x => x.id.includes(rewardB))!;

        const expectedEnergyTotal = completedLocations.reduce((sum, loc) => sum + loc.energySpent, 0);
        const expectedRaidAEnergy = raidA.raidLocations.reduce((sum, loc) => sum + loc.energySpent, 0);
        const expectedRaidBEnergy = raidB.raidLocations.reduce((sum, loc) => sum + loc.energySpent, 0);

        expect(day.raidsTotal).toBe(6);
        expect(day.energyTotal).toBe(expectedEnergyTotal);
        expect(raidA.energyTotal).toBe(expectedRaidAEnergy);
        expect(raidB.energyTotal).toBe(expectedRaidBEnergy);
        expect(raidA.raidsTotal).toBe(4);
        expect(raidB.raidsTotal).toBe(2);
    });
});

describe('UpgradesService.getOnslaughtTokensForGoal', () => {
    it('returns 0 tokens when the goal unit is not found in characters', () => {
        const goal: ICharacterAscendGoal = createAscendGoal({
            unitId: 'missing-unit',
            rarityStart: Rarity.Common,
            starsStart: RarityStars.None,
            rarityEnd: Rarity.Common,
            starsEnd: RarityStars.None,
            onslaughtShards: 6.5,
        });

        const inventory: Record<string, number> = {
            [`shards_${goal.unitId}`]: 0,
        };

        const tokens = UpgradesService.getOnslaughtTokensForGoal(inventory, [], [], goal);

        expect(tokens).toBe(0);
    });

    it('returns 0 tokens when regular onslaught is disabled even if regular shards are needed', () => {
        const baseChar = CharactersService.charactersData[0];
        const character = createCharacter(baseChar, {
            rarity: Rarity.Common,
            stars: RarityStars.None,
            rarityStars: RarityStars.None,
        });

        const goal: ICharacterAscendGoal = createAscendGoal({
            unitId: character.snowprintId!,
            unitName: character.shortName ?? character.name,
            unitIcon: character.icon ?? '',
            unitRoundIcon: character.roundIcon ?? '',
            unitAlliance: character.alliance ?? Alliance.Imperial,
            rarityStart: Rarity.Common,
            starsStart: RarityStars.None,
            rarityEnd: Rarity.Common,
            starsEnd: RarityStars.TwoStars,
            onslaughtShards: 0,
        });

        const inventory: Record<string, number> = {
            [`shards_${character.snowprintId}`]: 0,
        };

        const tokens = UpgradesService.getOnslaughtTokensForGoal(inventory, [character], [], goal);

        expect(tokens).toBe(0);
    });

    it('returns mythic tokens when only mythic shards are needed and regular onslaught is disabled', () => {
        const baseChar = CharactersService.charactersData[0];
        const character = createCharacter(baseChar, {
            rarity: Rarity.Mythic,
            stars: RarityStars.OneBlueStar,
            rarityStars: RarityStars.OneBlueStar,
        });

        const goal: ICharacterAscendGoal = createAscendGoal({
            unitId: character.snowprintId!,
            unitName: character.shortName ?? character.name,
            unitIcon: character.icon ?? '',
            unitRoundIcon: character.roundIcon ?? '',
            unitAlliance: character.alliance ?? Alliance.Imperial,
            rarityStart: Rarity.Mythic,
            starsStart: RarityStars.OneBlueStar,
            rarityEnd: Rarity.Mythic,
            starsEnd: RarityStars.TwoBlueStars,
            onslaughtShards: 0,
            onslaughtMythicShards: 1,
        });

        const inventory: Record<string, number> = {
            [`shards_${character.snowprintId}`]: 0,
            [`mythicShards_${character.snowprintId}`]: 0,
        };

        const tokens = UpgradesService.getOnslaughtTokensForGoal(inventory, [character], [], goal);

        expect(tokens).toBe(30);
    });

    it('returns normal onslaughts only when character has a goal from pre-mythic to mythic but character is not yet mythic', () => {
        const baseChar = CharactersService.charactersData[0];
        const character = createCharacter(baseChar, {
            rarity: Rarity.Legendary,
            stars: RarityStars.RedFiveStars,
            rarityStars: RarityStars.RedFiveStars,
        });

        const goal: ICharacterAscendGoal = createAscendGoal({
            unitId: character.snowprintId!,
            unitName: character.shortName ?? character.name,
            unitIcon: character.icon ?? '',
            unitRoundIcon: character.roundIcon ?? '',
            unitAlliance: character.alliance ?? Alliance.Imperial,
            rarityStart: Rarity.Legendary,
            starsStart: RarityStars.RedFiveStars,
            rarityEnd: Rarity.Mythic,
            starsEnd: RarityStars.OneBlueStar,
            onslaughtShards: 6.5,
            onslaughtMythicShards: 1,
        });

        const inventory: Record<string, number> = {
            [`shards_${character.snowprintId}`]: 494,
            [`mythicShards_${character.snowprintId}`]: 16,
        };

        const tokens = UpgradesService.getOnslaughtTokensForGoal(inventory, [character], [], goal);

        expect(tokens).toBe(1);
    });

    it('returns mythic onslaughts only when character has a goal from pre-mythic to mythic and character is now mythic', () => {
        const baseChar = CharactersService.charactersData[0];
        const character = createCharacter(baseChar, {
            rarity: Rarity.Mythic,
            stars: RarityStars.OneBlueStar,
            rarityStars: RarityStars.OneBlueStar,
        });

        const goal: ICharacterAscendGoal = createAscendGoal({
            unitId: character.snowprintId!,
            unitName: character.shortName ?? character.name,
            unitIcon: character.icon ?? '',
            unitRoundIcon: character.roundIcon ?? '',
            unitAlliance: character.alliance ?? Alliance.Imperial,
            rarityStart: Rarity.Mythic,
            starsStart: RarityStars.OneBlueStar,
            rarityEnd: Rarity.Mythic,
            starsEnd: RarityStars.TwoBlueStars,
            onslaughtShards: 6.5,
            onslaughtMythicShards: 1,
        });

        const inventory: Record<string, number> = {
            [`shards_${character.snowprintId}`]: 0,
            [`mythicShards_${character.snowprintId}`]: 16,
        };

        const tokens = UpgradesService.getOnslaughtTokensForGoal(inventory, [character], [], goal);

        expect(tokens).toBe(14);
    });

    it('rounds up tokens for 21 regular shards at 6.5 per token', () => {
        const baseChar = CharactersService.charactersData[0];
        const character = createCharacter(baseChar, {
            rarity: Rarity.Rare,
            rarityStars: RarityStars.RedOneStar,
        });

        const goal: ICharacterAscendGoal = createAscendGoal({
            unitId: character.snowprintId!,
            unitName: character.shortName ?? character.name,
            unitIcon: character.icon ?? '',
            unitRoundIcon: character.roundIcon ?? '',
            unitAlliance: character.alliance ?? Alliance.Imperial,
            rarityStart: Rarity.Rare,
            starsStart: RarityStars.RedOneStar,
            rarityEnd: Rarity.Epic,
            starsEnd: RarityStars.RedOneStar,
            onslaughtShards: 6.5,
        });

        const inventory: Record<string, number> = {
            [`shards_${character.snowprintId}`]: 29,
        };

        const tokens = UpgradesService.getOnslaughtTokensForGoal(inventory, [character], [], goal);

        expect(tokens).toBe(4);
    });

    it('Uses no onslaught tokens when goal is already met', () => {
        const baseChar = CharactersService.charactersData[0];
        const character = createCharacter(baseChar, {
            rarity: Rarity.Rare,
            rarityStars: RarityStars.RedOneStar,
        });

        const goal: ICharacterAscendGoal = createAscendGoal({
            unitId: character.snowprintId!,
            unitName: character.shortName ?? character.name,
            unitIcon: character.icon ?? '',
            unitRoundIcon: character.roundIcon ?? '',
            unitAlliance: character.alliance ?? Alliance.Imperial,
            rarityStart: Rarity.Uncommon,
            starsStart: RarityStars.FourStars,
            rarityEnd: Rarity.Rare,
            starsEnd: RarityStars.RedOneStar,
            onslaughtShards: 6.5,
        });

        const inventory: Record<string, number> = {
            [`shards_${character.snowprintId}`]: 0,
        };

        const tokens = UpgradesService.getOnslaughtTokensForGoal(inventory, [character], [], goal);

        expect(tokens).toBe(0);
    });

    it('Uses no onslaught tokens when goal is already surpassed', () => {
        const baseChar = CharactersService.charactersData[0];
        const character = createCharacter(baseChar, {
            rarity: Rarity.Legendary,
            stars: RarityStars.OneBlueStar,
            rarityStars: RarityStars.OneBlueStar,
        });

        const goal: ICharacterAscendGoal = createAscendGoal({
            unitId: character.snowprintId!,
            unitName: character.shortName ?? character.name,
            unitIcon: character.icon ?? '',
            unitRoundIcon: character.roundIcon ?? '',
            unitAlliance: character.alliance ?? Alliance.Imperial,
            rarityStart: Rarity.Rare,
            starsStart: RarityStars.RedOneStar,
            rarityEnd: Rarity.Epic,
            starsEnd: RarityStars.RedOneStar,
            onslaughtShards: 6.5,
        });

        const inventory: Record<string, number> = {
            [`shards_${character.snowprintId}`]: 0,
        };

        const tokens = UpgradesService.getOnslaughtTokensForGoal(inventory, [character], [], goal);

        expect(tokens).toBe(0);
    });

    it('rounds up tokens for 5 mythic shards at 1.5 per token', () => {
        const baseChar = CharactersService.charactersData[0];
        const character = createCharacter(baseChar, {
            rarity: Rarity.Mythic,
            stars: RarityStars.TwoBlueStars,
            rarityStars: RarityStars.TwoBlueStars,
        });

        const goal: ICharacterAscendGoal = createAscendGoal({
            unitId: character.snowprintId!,
            unitName: character.shortName ?? character.name,
            unitIcon: character.icon ?? '',
            unitRoundIcon: character.roundIcon ?? '',
            unitAlliance: character.alliance ?? Alliance.Imperial,
            rarityStart: Rarity.Mythic,
            starsStart: RarityStars.TwoBlueStars,
            rarityEnd: Rarity.Mythic,
            starsEnd: RarityStars.ThreeBlueStars,
            onslaughtShards: 0,
            onslaughtMythicShards: 1.5,
        });

        const inventory: Record<string, number> = {
            [`mythicShards_${character.snowprintId}`]: 45,
        };

        const tokens = UpgradesService.getOnslaughtTokensForGoal(inventory, [character], [], goal);

        expect(tokens).toBe(4);
    });

    it('returns one token when onslaught rewards more token than needed', () => {
        const baseChar = CharactersService.charactersData[0];
        const character = createCharacter(baseChar, {
            rarity: Rarity.Rare,
            stars: RarityStars.RedOneStar,
            rarityStars: RarityStars.RedOneStar,
        });

        const goal: ICharacterAscendGoal = createAscendGoal({
            unitId: character.snowprintId!,
            unitName: character.shortName ?? character.name,
            unitIcon: character.icon ?? '',
            unitRoundIcon: character.roundIcon ?? '',
            unitAlliance: character.alliance ?? Alliance.Imperial,
            rarityStart: Rarity.Rare,
            starsStart: RarityStars.RedOneStar,
            rarityEnd: Rarity.Epic,
            starsEnd: RarityStars.RedOneStar,
            onslaughtShards: 6.5,
        });

        const inventory: Record<string, number> = {
            [`shards_${character.snowprintId}`]: 45,
        };

        const tokens = UpgradesService.getOnslaughtTokensForGoal(inventory, [character], [], goal);

        expect(tokens).toBe(1);
    });
});

describe('UpgradesService.findLongestOnslaughtGoal', () => {
    it('returns the only goal when a single onslaught goal exists', () => {
        const baseChar = CharactersService.charactersData[0];
        const character = createCharacter(baseChar);

        const goal: ICharacterAscendGoal = createAscendGoal({
            goalId: 'goal-1',
            unitId: character.snowprintId!,
            unitName: character.shortName ?? character.name,
            unitIcon: character.icon ?? '',
            unitRoundIcon: character.roundIcon ?? '',
            unitAlliance: character.alliance ?? Alliance.Imperial,
        });

        const inventory: Record<string, number> = {
            [`shards_${character.snowprintId}`]: 0,
        };

        const result = UpgradesService.findLongestOnslaughtGoal(inventory, [character], [], [goal]);

        expect(result?.goalId).toBe(goal.goalId);
    });

    it('prefers the goal that allows onslaught when another goal has onslaught disabled', () => {
        const baseCharA = CharactersService.charactersData[0];
        const baseCharB = CharactersService.charactersData[1];

        const characterNoOnslaught = createCharacter(baseCharA, { shards: 40 });

        const characterAllowsOnslaught = createCharacter(baseCharB);

        const goalNoOnslaught: ICharacterAscendGoal = createAscendGoal({
            goalId: 'goal-no-onslaught',
            unitId: characterNoOnslaught.snowprintId!,
            unitName: characterNoOnslaught.shortName ?? characterNoOnslaught.name,
            unitIcon: characterNoOnslaught.icon ?? '',
            unitRoundIcon: characterNoOnslaught.roundIcon ?? '',
            unitAlliance: characterNoOnslaught.alliance ?? Alliance.Imperial,
            shards: 40,
            onslaughtShards: 0,
            onslaughtMythicShards: 0,
        });

        const goalAllowsOnslaught: ICharacterAscendGoal = createAscendGoal({
            priority: 2,
            goalId: 'goal-allow-onslaught',
            unitId: characterAllowsOnslaught.snowprintId!,
            unitName: characterAllowsOnslaught.shortName ?? characterAllowsOnslaught.name,
            unitIcon: characterAllowsOnslaught.icon ?? '',
            unitRoundIcon: characterAllowsOnslaught.roundIcon ?? '',
            unitAlliance: characterAllowsOnslaught.alliance ?? Alliance.Imperial,
        });

        const inventory: Record<string, number> = {
            [`shards_${characterNoOnslaught.snowprintId}`]: 40,
            [`shards_${characterAllowsOnslaught.snowprintId}`]: 0,
        };

        const result = UpgradesService.findLongestOnslaughtGoal(
            inventory,
            [characterNoOnslaught, characterAllowsOnslaught],
            [],
            [goalNoOnslaught, goalAllowsOnslaught]
        );

        expect(result?.goalId).toBe(goalAllowsOnslaught.goalId);
    });

    it('returns undefined when the only goal needs both shard types but mythic onslaught is disabled', () => {
        const baseChar = CharactersService.charactersData[0];
        const character = createCharacter(baseChar, {
            rarity: Rarity.Legendary,
            stars: RarityStars.RedFiveStars,
            rarityStars: RarityStars.RedFiveStars,
        });

        const goal: ICharacterAscendGoal = createAscendGoal({
            goalId: 'goal-both-no-mythic',
            unitId: character.snowprintId!,
            unitName: character.shortName ?? character.name,
            unitIcon: character.icon ?? '',
            unitRoundIcon: character.roundIcon ?? '',
            unitAlliance: character.alliance ?? Alliance.Imperial,
            rarityStart: Rarity.Legendary,
            starsStart: RarityStars.RedFiveStars,
            rarityEnd: Rarity.Mythic,
            starsEnd: RarityStars.TwoBlueStars,
            onslaughtShards: 6.5,
            onslaughtMythicShards: 1,
        });

        const inventory: Record<string, number> = {
            [`shards_${character.snowprintId}`]: 1394,
            [`mythicShards_${character.snowprintId}`]: 49,
        };

        const result = UpgradesService.findLongestOnslaughtGoal(inventory, [character], [], [goal]);

        expect(result).toBeUndefined();
    });

    it('returns undefined when the only goal needs both shard types but regular onslaught is disabled', () => {
        const baseChar = CharactersService.charactersData[0];
        const character = createCharacter(baseChar, {
            rarity: Rarity.Mythic,
            stars: RarityStars.OneBlueStar,
            rarityStars: RarityStars.OneBlueStar,
        });

        const goal: ICharacterAscendGoal = createAscendGoal({
            goalId: 'goal-both-no-regular',
            unitId: character.snowprintId!,
            unitName: character.shortName ?? character.name,
            unitIcon: character.icon ?? '',
            unitRoundIcon: character.roundIcon ?? '',
            unitAlliance: character.alliance ?? Alliance.Imperial,
            rarityStart: Rarity.Mythic,
            starsStart: RarityStars.OneBlueStar,
            rarityEnd: Rarity.Mythic,
            starsEnd: RarityStars.TwoBlueStars,
            onslaughtShards: 6.5,
            onslaughtMythicShards: 1,
        });

        const inventory: Record<string, number> = {
            [`shards_${character.snowprintId}`]: 1394,
            [`mythicShards_${character.snowprintId}`]: 49,
        };

        const result = UpgradesService.findLongestOnslaughtGoal(inventory, [character], [], [goal]);

        expect(result).toBeUndefined();
    });

    it('returns the goal with the highest total tokens across shard types', () => {
        const baseCharA = CharactersService.charactersData[0];
        const baseCharB = CharactersService.charactersData[1];

        const characterRegular = createCharacter(baseCharA, {
            rarity: Rarity.Common,
            stars: RarityStars.TwoStars,
            rarityStars: RarityStars.TwoStars,
        });
        const characterMythic = createCharacter(baseCharB, {
            rarity: Rarity.Mythic,
            stars: RarityStars.OneBlueStar,
            rarityStars: RarityStars.OneBlueStar,
        });

        const goalRegular: ICharacterAscendGoal = createAscendGoal({
            goalId: 'goal-regular-tokens',
            unitId: characterRegular.snowprintId!,
            unitName: characterRegular.shortName ?? characterRegular.name,
            unitIcon: characterRegular.icon ?? '',
            unitRoundIcon: characterRegular.roundIcon ?? '',
            unitAlliance: characterRegular.alliance ?? Alliance.Imperial,
            rarityStart: Rarity.Common,
            starsStart: RarityStars.TwoStars,
            rarityEnd: Rarity.Uncommon,
            starsEnd: RarityStars.TwoStars,
            onslaughtShards: 6.5,
            onslaughtMythicShards: 0,
        });

        const goalMythic: ICharacterAscendGoal = createAscendGoal({
            goalId: 'goal-mythic-tokens',
            unitId: characterMythic.snowprintId!,
            unitName: characterMythic.shortName ?? characterMythic.name,
            unitIcon: characterMythic.icon ?? '',
            unitRoundIcon: characterMythic.roundIcon ?? '',
            unitAlliance: characterMythic.alliance ?? Alliance.Imperial,
            rarityStart: Rarity.Mythic,
            starsStart: RarityStars.OneBlueStar,
            rarityEnd: Rarity.Mythic,
            starsEnd: RarityStars.TwoBlueStars,
            onslaughtShards: 0,
            onslaughtMythicShards: 1,
        });

        const inventory: Record<string, number> = {
            [`shards_${characterRegular.snowprintId}`]: 0,
            [`mythicShards_${characterMythic.snowprintId}`]: 15,
        };

        const result = UpgradesService.findLongestOnslaughtGoal(
            inventory,
            [characterRegular, characterMythic],
            [],
            [goalRegular, goalMythic]
        );

        expect(result?.goalId).toBe(goalMythic.goalId);
    });

    it('returns the goal with the highest regular shard tokens when all goals require regular shards', () => {
        const baseCharA = CharactersService.charactersData[0];
        const baseCharB = CharactersService.charactersData[1];

        const characterLow = createCharacter(baseCharA, {
            rarity: Rarity.Common,
            stars: RarityStars.TwoStars,
            rarityStars: RarityStars.TwoStars,
        });
        const characterHigh = createCharacter(baseCharB, {
            rarity: Rarity.Common,
            stars: RarityStars.TwoStars,
            rarityStars: RarityStars.TwoStars,
        });

        const goalLow: ICharacterAscendGoal = createAscendGoal({
            goalId: 'goal-regular-low',
            unitId: characterLow.snowprintId!,
            unitName: characterLow.shortName ?? characterLow.name,
            unitIcon: characterLow.icon ?? '',
            unitRoundIcon: characterLow.roundIcon ?? '',
            unitAlliance: characterLow.alliance ?? Alliance.Imperial,
            rarityStart: Rarity.Common,
            starsStart: RarityStars.TwoStars,
            rarityEnd: Rarity.Uncommon,
            starsEnd: RarityStars.TwoStars,
            onslaughtShards: 6.5,
            onslaughtMythicShards: 0,
        });

        const goalHigh: ICharacterAscendGoal = createAscendGoal({
            goalId: 'goal-regular-high',
            unitId: characterHigh.snowprintId!,
            unitName: characterHigh.shortName ?? characterHigh.name,
            unitIcon: characterHigh.icon ?? '',
            unitRoundIcon: characterHigh.roundIcon ?? '',
            unitAlliance: characterHigh.alliance ?? Alliance.Imperial,
            rarityStart: Rarity.Common,
            starsStart: RarityStars.TwoStars,
            rarityEnd: Rarity.Uncommon,
            starsEnd: RarityStars.TwoStars,
            onslaughtShards: 6.5,
            onslaughtMythicShards: 0,
        });

        const inventory: Record<string, number> = {
            [`shards_${characterLow.snowprintId}`]: 10,
            [`shards_${characterHigh.snowprintId}`]: 0,
        };

        const result = UpgradesService.findLongestOnslaughtGoal(
            inventory,
            [characterLow, characterHigh],
            [],
            [goalLow, goalHigh]
        );

        expect(result?.goalId).toBe(goalHigh.goalId);
    });

    it('returns a goal when only mythic shards are needed and mythic onslaught is enabled', () => {
        const baseChar = CharactersService.charactersData[0];
        const character = createCharacter(baseChar, {
            rarity: Rarity.Legendary,
            stars: RarityStars.OneBlueStar,
            rarityStars: RarityStars.OneBlueStar,
        });

        const goal: ICharacterAscendGoal = createAscendGoal({
            goalId: 'goal-only-mythic',
            unitId: character.snowprintId!,
            unitName: character.shortName ?? character.name,
            unitIcon: character.icon ?? '',
            unitRoundIcon: character.roundIcon ?? '',
            unitAlliance: character.alliance ?? Alliance.Imperial,
            rarityStart: Rarity.Legendary,
            starsStart: RarityStars.OneBlueStar,
            rarityEnd: Rarity.Mythic,
            starsEnd: RarityStars.OneBlueStar,
            onslaughtShards: 0,
            onslaughtMythicShards: 1,
        });

        const inventory: Record<string, number> = {
            [`shards_${character.snowprintId}`]: 1400,
            [`mythicShards_${character.snowprintId}`]: 19,
        };

        const result = UpgradesService.findLongestOnslaughtGoal(inventory, [character], [], [goal]);

        expect(result?.goalId).toBe(goal.goalId);
    });

    it('returns a goal when only regular shards are needed and regular onslaught is enabled', () => {
        const baseChar = CharactersService.charactersData[0];
        const character = createCharacter(baseChar, {
            rarity: Rarity.Rare,
            stars: RarityStars.RedOneStar,
            rarityStars: RarityStars.RedOneStar,
        });

        const goal: ICharacterAscendGoal = createAscendGoal({
            goalId: 'goal-only-regular',
            unitId: character.snowprintId!,
            unitName: character.shortName ?? character.name,
            unitIcon: character.icon ?? '',
            unitRoundIcon: character.roundIcon ?? '',
            unitAlliance: character.alliance ?? Alliance.Imperial,
            rarityStart: Rarity.Rare,
            starsStart: RarityStars.RedOneStar,
            rarityEnd: Rarity.Epic,
            starsEnd: RarityStars.RedOneStar,
            onslaughtShards: 6.5,
            onslaughtMythicShards: 0,
        });

        const inventory: Record<string, number> = {
            [`shards_${character.snowprintId}`]: 33.5,
        };

        const result = UpgradesService.findLongestOnslaughtGoal(inventory, [character], [], [goal]);

        expect(result?.goalId).toBe(goal.goalId);
    });
});

describe('UpgradesService.findHighestPriorityOnslaughtGoal', () => {
    it('returns the only goal when a single onslaught goal exists', () => {
        const baseChar = CharactersService.charactersData[0];
        const character = createCharacter(baseChar);

        const goal: ICharacterAscendGoal = createAscendGoal({
            goalId: 'goal-1',
            unitId: character.snowprintId!,
            unitName: character.shortName ?? character.name,
            unitIcon: character.icon ?? '',
            unitRoundIcon: character.roundIcon ?? '',
            unitAlliance: character.alliance ?? Alliance.Imperial,
        });

        const inventory: Record<string, number> = {
            [`shards_${character.snowprintId}`]: 0,
        };

        const result = UpgradesService.findHighestPriorityOnslaughtGoal(inventory, [character], [], [goal]);

        expect(result?.goalId).toBe(goal.goalId);
    });

    it('skips goals that do not allow onslaught even if they have higher priority', () => {
        const baseCharA = CharactersService.charactersData[0];
        const baseCharB = CharactersService.charactersData[1];

        const characterNoOnslaught = createCharacter(baseCharA, { shards: 40 });

        const characterAllowsOnslaught = createCharacter(baseCharB);

        const goalNoOnslaught: ICharacterAscendGoal = createAscendGoal({
            goalId: 'goal-no-onslaught',
            unitId: characterNoOnslaught.snowprintId!,
            unitName: characterNoOnslaught.shortName ?? characterNoOnslaught.name,
            unitIcon: characterNoOnslaught.icon ?? '',
            unitRoundIcon: characterNoOnslaught.roundIcon ?? '',
            unitAlliance: characterNoOnslaught.alliance ?? Alliance.Imperial,
            shards: 40,
            onslaughtShards: 0,
            onslaughtMythicShards: 0,
        });

        const goalAllowsOnslaught: ICharacterAscendGoal = createAscendGoal({
            priority: 2,
            goalId: 'goal-allow-onslaught',
            unitId: characterAllowsOnslaught.snowprintId!,
            unitName: characterAllowsOnslaught.shortName ?? characterAllowsOnslaught.name,
            unitIcon: characterAllowsOnslaught.icon ?? '',
            unitRoundIcon: characterAllowsOnslaught.roundIcon ?? '',
            unitAlliance: characterAllowsOnslaught.alliance ?? Alliance.Imperial,
        });

        const inventory: Record<string, number> = {
            [`shards_${characterNoOnslaught.snowprintId}`]: 40,
            [`shards_${characterAllowsOnslaught.snowprintId}`]: 0,
        };

        const result = UpgradesService.findHighestPriorityOnslaughtGoal(
            inventory,
            [characterNoOnslaught, characterAllowsOnslaught],
            [],
            [goalNoOnslaught, goalAllowsOnslaught]
        );

        expect(result?.goalId).toBe(goalAllowsOnslaught.goalId);
    });

    it('returns the goal with the lowest priority value when both allow onslaught', () => {
        const baseCharA = CharactersService.charactersData[0];
        const baseCharB = CharactersService.charactersData[1];

        const characterPriorityLow = createCharacter(baseCharA);

        const characterPriorityHigh = createCharacter(baseCharB);

        const goalPriorityLow: ICharacterAscendGoal = createAscendGoal({
            goalId: 'goal-priority-low',
            unitId: characterPriorityLow.snowprintId!,
            unitName: characterPriorityLow.shortName ?? characterPriorityLow.name,
            unitIcon: characterPriorityLow.icon ?? '',
            unitRoundIcon: characterPriorityLow.roundIcon ?? '',
            unitAlliance: characterPriorityLow.alliance ?? Alliance.Imperial,
        });

        const goalPriorityHigh: ICharacterAscendGoal = createAscendGoal({
            priority: 2,
            goalId: 'goal-priority-high',
            unitId: characterPriorityHigh.snowprintId!,
            unitName: characterPriorityHigh.shortName ?? characterPriorityHigh.name,
            unitIcon: characterPriorityHigh.icon ?? '',
            unitRoundIcon: characterPriorityHigh.roundIcon ?? '',
            unitAlliance: characterPriorityHigh.alliance ?? Alliance.Imperial,
        });

        const inventory: Record<string, number> = {
            [`shards_${characterPriorityLow.snowprintId}`]: 0,
            [`shards_${characterPriorityHigh.snowprintId}`]: 0,
        };

        const result = UpgradesService.findHighestPriorityOnslaughtGoal(
            inventory,
            [characterPriorityLow, characterPriorityHigh],
            [],
            [goalPriorityHigh, goalPriorityLow]
        );

        expect(result?.goalId).toBe(goalPriorityLow.goalId);
    });
});

describe('UpgradesService.canOnslaughtCharacterForRegularShards', () => {
    it('handles locked, stars threshold, onslaughtShards zero, and missing character', () => {
        const unitId = 'unit-regular';
        const baseChar = CharactersService.charactersData[0];

        const baseGoal = createAscendGoal({ unitId, onslaughtShards: 6.5 });
        const missingCharacterResult = UpgradesService.canOnslaughtCharacterForRegularShards(unitId, [], [], baseGoal);
        expect(missingCharacterResult).toBe(false);

        const lockedCharacter = createCharacter(baseChar, { snowprintId: unitId, rank: Rank.Locked });
        const lockedResult = UpgradesService.canOnslaughtCharacterForRegularShards(
            unitId,
            [lockedCharacter],
            [],
            baseGoal
        );
        expect(lockedResult).toBe(false);

        const blueStarCharacter = createCharacter(baseChar, {
            snowprintId: unitId,
            stars: RarityStars.OneBlueStar,
            rarityStars: RarityStars.OneBlueStar,
        });
        const blueStarResult = UpgradesService.canOnslaughtCharacterForRegularShards(
            unitId,
            [blueStarCharacter],
            [],
            baseGoal
        );
        expect(blueStarResult).toBe(false);

        const zeroOnslaughtGoal = createAscendGoal({ unitId, onslaughtShards: 0 });
        const zeroOnslaughtResult = UpgradesService.canOnslaughtCharacterForRegularShards(
            unitId,
            [createCharacter(baseChar, { snowprintId: unitId })],
            [],
            zeroOnslaughtGoal
        );
        expect(zeroOnslaughtResult).toBe(false);

        const shardsOnslaughtGoal = createAscendGoal({ unitId, onslaughtShards: 6.5 });
        const shardsOnslaughtResult = UpgradesService.canOnslaughtCharacterForRegularShards(
            unitId,
            [createCharacter(baseChar, { snowprintId: unitId })],
            [],
            shardsOnslaughtGoal
        );
        expect(shardsOnslaughtResult).toBe(true);
    });
});

describe('UpgradesService.canOnslaughtCharacterForMythicShards', () => {
    it('handles locked, stars threshold, onslaughtShards zero, and missing character', () => {
        const unitId = 'unit-mythic';
        const baseChar = CharactersService.charactersData[0];

        const baseGoal = createAscendGoal({ unitId, onslaughtShards: 6.5, onslaughtMythicShards: 20 });
        const missingCharacterResult = UpgradesService.canOnslaughtCharacterForMythicShards(unitId, [], [], baseGoal);
        expect(missingCharacterResult).toBe(false);

        const lockedCharacter = createCharacter(baseChar, { snowprintId: unitId, rank: Rank.Locked });
        const lockedResult = UpgradesService.canOnslaughtCharacterForMythicShards(
            unitId,
            [lockedCharacter],
            [],
            baseGoal
        );
        expect(lockedResult).toBe(false);

        const belowBlueStarCharacter = createCharacter(baseChar, {
            snowprintId: unitId,
            stars: RarityStars.RedOneStar,
            rarityStars: RarityStars.RedOneStar,
        });
        const belowBlueStarResult = UpgradesService.canOnslaughtCharacterForMythicShards(
            unitId,
            [belowBlueStarCharacter],
            [],
            baseGoal
        );
        expect(belowBlueStarResult).toBe(false);

        const zeroOnslaughtGoal = createAscendGoal({ unitId, onslaughtShards: 6.5, onslaughtMythicShards: 0 });
        const zeroOnslaughtResult = UpgradesService.canOnslaughtCharacterForMythicShards(
            unitId,
            [
                createCharacter(baseChar, {
                    snowprintId: unitId,
                    stars: RarityStars.OneBlueStar,
                    rarityStars: RarityStars.OneBlueStar,
                }),
            ],
            [],
            zeroOnslaughtGoal
        );
        expect(zeroOnslaughtResult).toBe(false);

        const oneOnslaughtGoal = createAscendGoal({ unitId, onslaughtShards: 6.5, onslaughtMythicShards: 1 });
        const oneOnslaughtResult = UpgradesService.canOnslaughtCharacterForMythicShards(
            unitId,
            [
                createCharacter(baseChar, {
                    snowprintId: unitId,
                    stars: RarityStars.OneBlueStar,
                    rarityStars: RarityStars.OneBlueStar,
                }),
            ],
            [],
            oneOnslaughtGoal
        );
        expect(oneOnslaughtResult).toBe(true);
    });
});

describe('UpgradesService.combineBaseMaterials', () => {
    it('combines a single goal with unique materials', () => {
        const baseUpgradesTotal = buildBaseUpgradeCounts(rankUpData.worldKharn!['Stone I']);
        const goalId = 'goal-kharn-stone-1';
        const unitUpgrade = createUnitUpgrade({
            goalId,
            unitId: 'worldKharn',
            baseUpgradesTotal,
        });

        const result = UpgradesService.combineBaseMaterials([unitUpgrade]);

        expect(result.upgHpC015.requiredCount).toBe(1);
        expect(result.upgHpC015.countByGoalId).toEqual({ [goalId]: 1 });
        expect(result.upgHpC015.relatedCharacters).toEqual(['worldKharn']);
        expect(result.upgHpC015.relatedGoals).toEqual([goalId]);
    });

    it('keeps duplicate materials within a single goal', () => {
        const baseUpgradesTotal = buildBaseUpgradeCounts(rankUpData.worldTerminator!['Stone II']);
        const goalId = 'goal-wrask-stone-2';
        const unitUpgrade = createUnitUpgrade({
            goalId,
            unitId: 'worldTerminator',
            baseUpgradesTotal,
        });

        const result = UpgradesService.combineBaseMaterials([unitUpgrade]);

        expect(result.upgArmC007.requiredCount).toBe(2);
        expect(result.upgArmC007.countByGoalId).toEqual({ [goalId]: 2 });
        expect(result.upgArmC007.relatedCharacters).toEqual(['worldTerminator']);
        expect(result.upgArmC007.relatedGoals).toEqual([goalId]);
    });

    it('combines two goals with unique materials', () => {
        const kharnGoalId = 'goal-kharn-unique';
        const wingedPrimeGoalId = 'goal-winged-prime-unique';

        const kharnUpgrade = createUnitUpgrade({
            goalId: kharnGoalId,
            unitId: 'worldKharn',
            baseUpgradesTotal: buildBaseUpgradeCounts(rankUpData.worldKharn!['Stone I']),
        });

        const wingedPrimeUpgrade = createUnitUpgrade({
            goalId: wingedPrimeGoalId,
            unitId: 'tyranWingedPrime',
            baseUpgradesTotal: buildBaseUpgradeCounts(rankUpData.tyranWingedPrime!['Stone I']),
        });

        const result = UpgradesService.combineBaseMaterials([kharnUpgrade, wingedPrimeUpgrade]);

        expect(result.upgDmgC012.requiredCount).toBe(1);
        expect(result.upgDmgC012.relatedGoals).toEqual([kharnGoalId]);
        expect(result.upgDmgC012.relatedCharacters).toEqual(['worldKharn']);

        expect(result.upgArmC005.requiredCount).toBe(2);
        expect(result.upgArmC005.relatedGoals).toEqual([wingedPrimeGoalId]);
        expect(result.upgArmC005.relatedCharacters).toEqual(['tyranWingedPrime']);
    });

    it('combines two goals with shared materials', () => {
        const kharnGoalId = 'goal-kharn-shared';
        const wraskGoalId = 'goal-wrask-shared';

        const kharnUpgrade = createUnitUpgrade({
            goalId: kharnGoalId,
            unitId: 'worldKharn',
            baseUpgradesTotal: buildBaseUpgradeCounts(rankUpData.worldKharn!['Stone I']),
        });

        const wraskUpgrade = createUnitUpgrade({
            goalId: wraskGoalId,
            unitId: 'worldTerminator',
            baseUpgradesTotal: buildBaseUpgradeCounts(rankUpData.worldTerminator!['Stone I']),
        });

        const result = UpgradesService.combineBaseMaterials([kharnUpgrade, wraskUpgrade]);

        expect(result.upgArmC013.requiredCount).toBe(2);
        expect(result.upgArmC013.countByGoalId).toEqual({
            [kharnGoalId]: 1,
            [wraskGoalId]: 1,
        });
        expect(result.upgArmC013.relatedCharacters).toEqual(expect.arrayContaining(['worldKharn', 'worldTerminator']));
        expect(result.upgArmC013.relatedGoals).toEqual(expect.arrayContaining([kharnGoalId, wraskGoalId]));

        expect(result.upgHpC015.requiredCount).toBe(1);
        expect(result.upgHpC002.requiredCount).toBe(1);
    });

    it('combines three goals with shared and unique materials', () => {
        const kharnGoalId = 'goal-kharn-three';
        const wraskGoalId = 'goal-wrask-three';
        const tarvakhGoalId = 'goal-tarvakh-three';

        const kharnUpgrade = createUnitUpgrade({
            goalId: kharnGoalId,
            unitId: 'worldKharn',
            baseUpgradesTotal: buildBaseUpgradeCounts(rankUpData.worldKharn!['Stone I']),
        });

        const wraskUpgrade = createUnitUpgrade({
            goalId: wraskGoalId,
            unitId: 'worldTerminator',
            baseUpgradesTotal: buildBaseUpgradeCounts(rankUpData.worldTerminator!['Stone I']),
        });

        const tarvakhUpgrade = createUnitUpgrade({
            goalId: tarvakhGoalId,
            unitId: 'worldExecutions',
            baseUpgradesTotal: buildBaseUpgradeCounts(rankUpData.worldExecutions!['Stone I']),
        });

        const result = UpgradesService.combineBaseMaterials([kharnUpgrade, wraskUpgrade, tarvakhUpgrade]);

        expect(result.upgArmC006.requiredCount).toBe(3);
        expect(result.upgArmC006.countByGoalId).toEqual({
            [kharnGoalId]: 1,
            [wraskGoalId]: 1,
            [tarvakhGoalId]: 1,
        });
        expect(result.upgArmC006.relatedCharacters).toEqual(
            expect.arrayContaining(['worldKharn', 'worldTerminator', 'worldExecutions'])
        );

        expect(result.upgHpC015.requiredCount).toBe(2);
        expect(result.upgHpC015.relatedGoals).toEqual(expect.arrayContaining([kharnGoalId, tarvakhGoalId]));

        expect(result.upgDmgC010.requiredCount).toBe(1);
        expect(result.upgDmgC010.relatedCharacters).toEqual(['worldExecutions']);
    });
});

describe('UpgradesService.populateLocationsData', () => {
    it('marks least-energy locations as suggested and sets unlock/completion states', () => {
        const locationHighEnergy = { ...CampaignsService.campaignsComposed['FoC05'] };
        const locationLowEnergy = { ...CampaignsService.campaignsComposed['OME26'] };
        const locationLocked = { ...CampaignsService.campaignsComposed['SH08'] };

        const combinedUpgrade: ICombinedUpgrade = {
            ...FsdUpgradesService.baseUpgradesData.upgHpC015,
            requiredCount: 1,
            countByGoalId: {},
            relatedCharacters: [],
            relatedGoals: [],
            locations: [locationHighEnergy, locationLowEnergy, locationLocked],
        };

        const settings = createSettings({
            completedLocations: [createCompletedLocation(locationLowEnergy)],
            campaignsProgress: {
                [Campaign.FoC]: 5,
                [Campaign.OME]: 26,
                [Campaign.SH]: 5,
            } as IEstimatedRanksSettings['campaignsProgress'],
            preferences: {
                ...createSettings().preferences,
                farmStrategy: DailyRaidsStrategy.leastEnergy,
            },
        });

        UpgradesService.populateLocationsData({ [combinedUpgrade.id]: combinedUpgrade }, settings);

        expect(locationLowEnergy.isSuggested).toBe(true);
        expect(locationHighEnergy.isSuggested).toBe(false);
        expect(locationLocked.isSuggested).toBe(false);
    });

    it('keeps all unlocked locations suggested for least-time strategy', () => {
        const locationA = { ...CampaignsService.campaignsComposed['FoC05'] };
        const locationB = { ...CampaignsService.campaignsComposed['O01'] };
        const locationLocked = { ...CampaignsService.campaignsComposed['SH08'] };

        const combinedUpgrade: ICombinedUpgrade = {
            ...FsdUpgradesService.baseUpgradesData.upgHpC015,
            requiredCount: 1,
            countByGoalId: {},
            relatedCharacters: [],
            relatedGoals: [],
            locations: [locationA, locationB, locationLocked],
        };

        const settings = createSettings({
            completedLocations: [createCompletedLocation(locationA)],
            campaignsProgress: {
                [Campaign.FoC]: 5,
                [Campaign.O]: 1,
                [Campaign.SH]: 5,
            } as IEstimatedRanksSettings['campaignsProgress'],
            preferences: {
                ...createSettings().preferences,
                farmStrategy: DailyRaidsStrategy.leastTime,
            },
        });

        UpgradesService.populateLocationsData({ [combinedUpgrade.id]: combinedUpgrade }, settings);

        expect(locationA.isSuggested).toBe(true);
        expect(locationB.isSuggested).toBe(true);
        expect(locationLocked.isSuggested).toBe(false);
    });

    it('filters custom locations by rarity settings and respects unlock/completion state', () => {
        const locationNormal = { ...CampaignsService.campaignsComposed['FoC05'] };
        const locationElite = { ...CampaignsService.campaignsComposed['OME26'] };
        const locationLocked = { ...CampaignsService.campaignsComposed['SH08'] };

        const combinedUpgrade: ICombinedUpgrade = {
            ...FsdUpgradesService.baseUpgradesData.upgHpC015,
            requiredCount: 1,
            countByGoalId: {},
            relatedCharacters: [],
            relatedGoals: [],
            locations: [locationNormal, locationElite, locationLocked],
        };

        const settings = createSettings({
            completedLocations: [createCompletedLocation(locationElite)],
            campaignsProgress: {
                [Campaign.FoC]: 5,
                [Campaign.OME]: 26,
                [Campaign.SH]: 5,
            } as IEstimatedRanksSettings['campaignsProgress'],
            preferences: {
                ...createSettings().preferences,
                farmStrategy: DailyRaidsStrategy.custom,
                customSettings: createCustomDailyRaidsSettings({
                    [Rarity.Common]: [CampaignType.Elite],
                }),
            },
        });

        UpgradesService.populateLocationsData({ [combinedUpgrade.id]: combinedUpgrade }, settings);

        expect(locationElite.isSuggested).toBe(true);
        expect(locationNormal.isSuggested).toBe(false);
        expect(locationLocked.isSuggested).toBe(false);
    });

    it('suggests mythic shards only from extremis nodes', () => {
        const locationExtremis = { ...CampaignsService.campaignsComposed['AME25'] };

        const combinedUpgrade: ICombinedUpgrade = {
            id: 'mythicShards_admecMarshall',
            snowprintId: 'mythicShards_admecMarshall',
            label: "Tan Gi'da Mythic Shards",
            rarity: 'Mythic Shard',
            iconPath: '',
            locations: [locationExtremis],
            crafted: false,
            stat: 'Shard',
            requiredCount: 1,
            countByGoalId: {},
            relatedCharacters: [],
            relatedGoals: [],
        };

        const settings = createSettings({
            completedLocations: [],
            campaignsProgress: {
                [Campaign.AME]: 25,
            } as IEstimatedRanksSettings['campaignsProgress'],
            preferences: {
                ...createSettings().preferences,
                farmStrategy: DailyRaidsStrategy.custom,
                customSettings: createCustomDailyRaidsSettings({
                    'Mythic Shard': [CampaignType.Extremis],
                }),
                campaignEvent: CampaignGroupType.adMechCE,
            },
        });

        UpgradesService.populateLocationsData({ [combinedUpgrade.id]: combinedUpgrade }, settings);
        expect(locationExtremis.isSuggested).toBe(true);
    });

    it('does not suggest mythic shards from campaign event that is not active', () => {
        const locationExtremis = { ...CampaignsService.campaignsComposed['AME25'] };

        const combinedUpgrade: ICombinedUpgrade = {
            id: 'mythicShards_admecMarshall',
            snowprintId: 'mythicShards_admecMarshall',
            label: "Tan Gi'da Mythic Shards",
            rarity: 'Mythic Shard',
            iconPath: '',
            locations: [locationExtremis],
            crafted: false,
            stat: 'Shard',
            requiredCount: 1,
            countByGoalId: {},
            relatedCharacters: [],
            relatedGoals: [],
        };

        const settings = createSettings({
            completedLocations: [],
            campaignsProgress: {
                [Campaign.AME]: 25,
            } as IEstimatedRanksSettings['campaignsProgress'],
            preferences: {
                ...createSettings().preferences,
                farmStrategy: DailyRaidsStrategy.custom,
                customSettings: createCustomDailyRaidsSettings({
                    'Mythic Shard': [CampaignType.Extremis],
                }),
                campaignEvent: CampaignGroupType.tyranidCE,
            },
        });

        UpgradesService.populateLocationsData({ [combinedUpgrade.id]: combinedUpgrade }, settings);

        expect(locationExtremis.isSuggested).toBe(false);
    });

    it('completed status has no effect on suggestion', () => {
        const locationExtremis = { ...CampaignsService.campaignsComposed['AME25'] };

        const combinedUpgrade: ICombinedUpgrade = {
            id: 'mythicShards_admecMarshall',
            snowprintId: 'mythicShards_admecMarshall',
            label: "Tan Gi'da Mythic Shards",
            rarity: 'Mythic Shard',
            iconPath: '',
            locations: [locationExtremis],
            crafted: false,
            stat: 'Shard',
            requiredCount: 1,
            countByGoalId: {},
            relatedCharacters: [],
            relatedGoals: [],
        };

        const settings = createSettings({
            completedLocations: [createCompletedLocation(locationExtremis)],
            campaignsProgress: {
                [Campaign.AME]: 25,
            } as IEstimatedRanksSettings['campaignsProgress'],
            preferences: {
                ...createSettings().preferences,
                farmStrategy: DailyRaidsStrategy.custom,
                customSettings: createCustomDailyRaidsSettings({
                    'Mythic Shard': [CampaignType.Extremis],
                }),
                campaignEvent: CampaignGroupType.adMechCE,
            },
        });

        UpgradesService.populateLocationsData({ [combinedUpgrade.id]: combinedUpgrade }, settings);

        expect(locationExtremis.isSuggested).toBe(true);
    });

    it('gives no locations when custom settings would remove all choices', () => {
        const locationExtremis = { ...CampaignsService.campaignsComposed['AME25'] };

        const combinedUpgrade: ICombinedUpgrade = {
            id: 'mythicShards_admecMarshall',
            snowprintId: 'mythicShards_admecMarshall',
            label: "Tan Gi'da Mythic Shards",
            rarity: 'Mythic Shard',
            iconPath: '',
            locations: [locationExtremis],
            crafted: false,
            stat: 'Shard',
            requiredCount: 1,
            countByGoalId: {},
            relatedCharacters: [],
            relatedGoals: [],
        };
        const settings = createSettings({
            completedLocations: [],
            campaignsProgress: {
                [Campaign.AME]: 33,
            } as IEstimatedRanksSettings['campaignsProgress'],
            preferences: {
                ...createSettings().preferences,
                farmStrategy: DailyRaidsStrategy.custom,
                customSettings: createCustomDailyRaidsSettings({
                    'Mythic Shard': [CampaignType.Normal],
                }),
                campaignEvent: CampaignGroupType.adMechCE,
            },
        });

        UpgradesService.populateLocationsData({ [combinedUpgrade.id]: combinedUpgrade }, settings);

        expect(locationExtremis.isSuggested).toBe(false);
        expect(combinedUpgrade.locations.filter(x => x.isSuggested)).toEqual([]);
    });
});

describe('UpgradesService.populateLocationsData filters', () => {
    const buildUpgrade = (locations: ICampaignBattleComposed[]): ICombinedUpgrade => ({
        ...FsdUpgradesService.baseUpgradesData.upgHpC015,
        requiredCount: 1,
        countByGoalId: {},
        relatedCharacters: [],
        relatedGoals: [],
        locations,
    });

    const buildSettings = (filters: ICampaignsFilters): IEstimatedRanksSettings =>
        createSettings({
            campaignsProgress: {
                [Campaign.OME]: 26,
                [Campaign.FoC]: 5,
            } as IEstimatedRanksSettings['campaignsProgress'],
            preferences: {
                ...createSettings().preferences,
                farmStrategy: DailyRaidsStrategy.leastTime,
            },
            filters,
        });

    it('filters by enemies alliance', () => {
        const locationElite = { ...CampaignsService.campaignsComposed['OME26'] };
        const locationNormal = { ...CampaignsService.campaignsComposed['FoC05'] };
        const combinedUpgrade = buildUpgrade([locationElite, locationNormal]);
        const settings = buildSettings(createFilters({ enemiesAlliance: [Alliance.Xenos] }));

        UpgradesService.populateLocationsData({ [combinedUpgrade.id]: combinedUpgrade }, settings);

        expect(locationElite.isSuggested).toBe(true);
        expect(locationNormal.isSuggested).toBe(false);
    });

    it('filters by enemies factions', () => {
        const locationElite = { ...CampaignsService.campaignsComposed['OME26'] };
        const locationNormal = { ...CampaignsService.campaignsComposed['FoC05'] };
        const combinedUpgrade = buildUpgrade([locationElite, locationNormal]);
        const settings = buildSettings(createFilters({ enemiesFactions: ['Orks' as FactionId] }));

        UpgradesService.populateLocationsData({ [combinedUpgrade.id]: combinedUpgrade }, settings);

        expect(locationElite.isSuggested).toBe(true);
        expect(locationNormal.isSuggested).toBe(false);
    });

    it('filters by allies alliance', () => {
        const locationElite = { ...CampaignsService.campaignsComposed['OME26'] };
        const locationNormal = { ...CampaignsService.campaignsComposed['FoC05'] };
        const combinedUpgrade = buildUpgrade([locationElite, locationNormal]);
        const settings = buildSettings(createFilters({ alliesAlliance: [Alliance.Imperial] }));

        UpgradesService.populateLocationsData({ [combinedUpgrade.id]: combinedUpgrade }, settings);

        expect(locationElite.isSuggested).toBe(true);
        expect(locationNormal.isSuggested).toBe(false);
    });

    it('filters by allies factions', () => {
        const locationElite = { ...CampaignsService.campaignsComposed['OME26'] };
        const locationNormal = { ...CampaignsService.campaignsComposed['FoC05'] };
        const combinedUpgrade = buildUpgrade([locationElite, locationNormal]);
        const settings = buildSettings(createFilters({ alliesFactions: ['BlackLegion' as FactionId] }));

        UpgradesService.populateLocationsData({ [combinedUpgrade.id]: combinedUpgrade }, settings);

        expect(locationNormal.isSuggested).toBe(true);
        expect(locationElite.isSuggested).toBe(false);
    });

    it('filters by campaign types', () => {
        const locationElite = { ...CampaignsService.campaignsComposed['OME26'] };
        const locationNormal = { ...CampaignsService.campaignsComposed['FoC05'] };
        const combinedUpgrade = buildUpgrade([locationElite, locationNormal]);
        const settings = buildSettings(createFilters({ campaignTypes: [CampaignType.Elite] }));

        UpgradesService.populateLocationsData({ [combinedUpgrade.id]: combinedUpgrade }, settings);

        expect(locationElite.isSuggested).toBe(true);
        expect(locationNormal.isSuggested).toBe(false);
    });

    it('filters by upgrades rarity', () => {
        const locationElite = { ...CampaignsService.campaignsComposed['OME26'] };
        const locationNormal = { ...CampaignsService.campaignsComposed['FoC05'] };
        const combinedUpgrade = buildUpgrade([locationElite, locationNormal]);
        const settings = buildSettings(createFilters({ upgradesRarity: [Rarity.Rare] }));

        UpgradesService.populateLocationsData({ [combinedUpgrade.id]: combinedUpgrade }, settings);

        expect(locationElite.isSuggested).toBe(false);
        expect(locationNormal.isSuggested).toBe(false);
    });

    it('filters by slots count', () => {
        const locationElite = { ...CampaignsService.campaignsComposed['OME26'] };
        const locationNormal = { ...CampaignsService.campaignsComposed['FoC05'] };
        const combinedUpgrade = buildUpgrade([locationElite, locationNormal]);
        const settings = buildSettings(createFilters({ slotsCount: [5] }));

        UpgradesService.populateLocationsData({ [combinedUpgrade.id]: combinedUpgrade }, settings);

        expect(locationElite.isSuggested).toBe(true);
        expect(locationNormal.isSuggested).toBe(false);
    });

    it('filters by enemies types', () => {
        const locationElite = { ...CampaignsService.campaignsComposed['OME26'] };
        const locationNormal = { ...CampaignsService.campaignsComposed['FoC05'] };
        const combinedUpgrade = buildUpgrade([locationElite, locationNormal]);
        const settings = buildSettings(createFilters({ enemiesTypes: ['Grot'] }));

        UpgradesService.populateLocationsData({ [combinedUpgrade.id]: combinedUpgrade }, settings);

        expect(locationElite.isSuggested).toBe(true);
        expect(locationNormal.isSuggested).toBe(false);
    });

    it('filters by enemies minimum count', () => {
        const locationElite = { ...CampaignsService.campaignsComposed['OME26'] };
        const locationNormal = { ...CampaignsService.campaignsComposed['FoC05'] };
        const combinedUpgrade = buildUpgrade([locationElite, locationNormal]);
        const settings = buildSettings(createFilters({ enemiesMinCount: 10 }));

        UpgradesService.populateLocationsData({ [combinedUpgrade.id]: combinedUpgrade }, settings);

        expect(locationElite.isSuggested).toBe(true);
        expect(locationNormal.isSuggested).toBe(false);
    });

    it('filters by enemies maximum count', () => {
        const locationElite = { ...CampaignsService.campaignsComposed['OME26'] };
        const locationNormal = { ...CampaignsService.campaignsComposed['FoC05'] };
        const combinedUpgrade = buildUpgrade([locationElite, locationNormal]);
        const settings = buildSettings(createFilters({ enemiesMaxCount: 6 }));

        UpgradesService.populateLocationsData({ [combinedUpgrade.id]: combinedUpgrade }, settings);

        expect(locationNormal.isSuggested).toBe(true);
        expect(locationElite.isSuggested).toBe(false);
    });

    it('filters by a combination of fields', () => {
        const locationElite = { ...CampaignsService.campaignsComposed['OME26'] };
        const locationNormal = { ...CampaignsService.campaignsComposed['FoC05'] };
        const combinedUpgrade = buildUpgrade([locationElite, locationNormal]);
        const settings = buildSettings(
            createFilters({
                enemiesAlliance: [Alliance.Xenos],
                campaignTypes: [CampaignType.Elite],
                slotsCount: [5],
                enemiesMinCount: 10,
                enemiesTypes: ['Grot'],
            })
        );

        UpgradesService.populateLocationsData({ [combinedUpgrade.id]: combinedUpgrade }, settings);

        expect(locationElite.isSuggested).toBe(true);
        expect(locationNormal.isSuggested).toBe(false);
    });
});

describe('UpgradesService.calculateDaysToCompleteMaterial', () => {
    const getRate = (location: ICampaignBattleComposed): number => location.energyPerDay / location.energyPerItem;
    const upgradeId = 'upgHpL118';

    const buildCombinedUpgrade = (overrides: Partial<ICombinedUpgrade>): ICombinedUpgrade => ({
        ...FsdUpgradesService.baseUpgradesData[upgradeId],
        requiredCount: 0,
        countByGoalId: {},
        relatedCharacters: [],
        relatedGoals: [],
        locations: [],
        ...overrides,
    });

    const baseChar = CharactersService.charactersData[0];
    const goalA = createRankGoal(baseChar, { goalId: 'goalA', priority: 1 });
    const goalB = createRankGoal(baseChar, { goalId: 'goalB', priority: 2 });
    const goals = [goalA, goalB];

    it('uses required count for the selected goal id', () => {
        const location = { ...CampaignsService.campaignsComposed['FoCE29'], isSuggested: true };
        const combinedUpgrade = buildCombinedUpgrade({
            countByGoalId: { goalA: 10, goalB: 30 },
            requiredCount: 40,
            locations: [location],
        });

        const resultA = UpgradesService.calculateDaysToCompleteMaterial(
            upgradeId,
            { [upgradeId]: combinedUpgrade },
            {},
            goals,
            'goalA'
        );
        const resultB = UpgradesService.calculateDaysToCompleteMaterial(
            upgradeId,
            { [upgradeId]: combinedUpgrade },
            {},
            goals,
            'goalB'
        );

        const expectedA = Math.ceil(10 / getRate(location));
        const expectedB = Math.ceil(30 / getRate(location));

        expect(Math.ceil(resultA)).toBeCloseTo(expectedA, 5);
        expect(Math.ceil(resultB)).toBeCloseTo(expectedB, 5);
    });

    it('accounts for the number of available nodes', () => {
        const locationA = { ...CampaignsService.campaignsComposed['FoCE29'], isSuggested: true };
        const locationB = { ...CampaignsService.campaignsComposed['SHME31'], isSuggested: true };
        const combinedUpgradeSingle = buildCombinedUpgrade({
            countByGoalId: { goalA: 10 },
            requiredCount: 10,
            locations: [locationA],
        });
        const combinedUpgradeDual = buildCombinedUpgrade({
            countByGoalId: { goalA: 10 },
            requiredCount: 10,
            locations: [locationA, locationB],
        });

        const single = UpgradesService.calculateDaysToCompleteMaterial(
            upgradeId,
            { [upgradeId]: combinedUpgradeSingle },
            {},
            goals,
            'goalA'
        );
        const dual = UpgradesService.calculateDaysToCompleteMaterial(
            upgradeId,
            { [upgradeId]: combinedUpgradeDual },
            {},
            goals,
            'goalA'
        );

        const expectedSingle = Math.ceil(10 / getRate(locationA));
        const expectedDual = Math.ceil(10 / (getRate(locationA) + getRate(locationB)));

        expect(Math.ceil(single)).toBeCloseTo(expectedSingle, 5);
        expect(Math.ceil(dual)).toBeCloseTo(expectedDual, 5);
        expect(dual).toBeLessThan(single);
    });

    it('reflects drop rate differences via energy per item', () => {
        const slowLocation = { ...CampaignsService.campaignsComposed['SHM64'], isSuggested: true };
        const fastLocation = { ...CampaignsService.campaignsComposed['FoCE29'], isSuggested: true };

        const combinedSlow = buildCombinedUpgrade({
            countByGoalId: { goalA: 50 },
            requiredCount: 50,
            locations: [slowLocation],
        });
        const combinedFast = buildCombinedUpgrade({
            countByGoalId: { goalA: 50 },
            requiredCount: 50,
            locations: [fastLocation],
        });

        const slow = UpgradesService.calculateDaysToCompleteMaterial(
            upgradeId,
            { [upgradeId]: combinedSlow },
            {},
            goals,
            'goalA'
        );
        const fast = UpgradesService.calculateDaysToCompleteMaterial(
            upgradeId,
            { [upgradeId]: combinedFast },
            {},
            goals,
            'goalA'
        );

        const expectedSlow = Math.ceil(50 / getRate(slowLocation));
        const expectedFast = Math.ceil(50 / getRate(fastLocation));

        expect(Math.ceil(slow)).toBeCloseTo(expectedSlow, 5);
        expect(Math.ceil(fast)).toBeCloseTo(expectedFast, 5);
        expect(fast).toBeLessThan(slow);
    });

    it('does not change with rarity when locations are the same', () => {
        const location = { ...CampaignsService.campaignsComposed['FoCE29'], isSuggested: true };
        const combinedCommon = buildCombinedUpgrade({
            rarity: Rarity.Legendary,
            countByGoalId: { goalA: 12 },
            requiredCount: 12,
            locations: [location],
        });
        const combinedRare = buildCombinedUpgrade({
            rarity: Rarity.Epic,
            countByGoalId: { goalA: 12 },
            requiredCount: 12,
            locations: [location],
        });

        const common = UpgradesService.calculateDaysToCompleteMaterial(
            upgradeId,
            { [upgradeId]: combinedCommon },
            {},
            goals,
            'goalA'
        );
        const rare = UpgradesService.calculateDaysToCompleteMaterial(
            upgradeId,
            { [upgradeId]: combinedRare },
            {},
            goals,
            'goalA'
        );

        expect(common).toBeCloseTo(rare, 5);
    });

    it('combines multiple variables consistently', () => {
        const locationA = { ...CampaignsService.campaignsComposed['FoCE29'], isSuggested: true };
        const locationB = { ...CampaignsService.campaignsComposed['SHM64'], isSuggested: true };
        const combinedUpgrade = buildCombinedUpgrade({
            countByGoalId: { goalA: 8, goalB: 20 },
            requiredCount: 28,
            locations: [locationA, locationB],
        });

        const allGoals = UpgradesService.calculateDaysToCompleteMaterial(
            upgradeId,
            { [upgradeId]: combinedUpgrade },
            {},
            goals,
            undefined
        );
        const goalAOnly = UpgradesService.calculateDaysToCompleteMaterial(
            upgradeId,
            { [upgradeId]: combinedUpgrade },
            {},
            goals,
            'goalA'
        );

        const rateSum = getRate(locationA) + getRate(locationB);
        expect(Math.ceil(allGoals)).toBe(Math.ceil(28 / rateSum));
        expect(Math.ceil(goalAOnly)).toBe(Math.ceil(8 / rateSum));
        expect(Math.ceil(goalAOnly)).toBeLessThan(Math.ceil(allGoals));
    });

    it('accounts for higher priority goals when multiple goals share the material', () => {
        const location = { ...CampaignsService.campaignsComposed['FoCE29'], isSuggested: true };
        const combinedUpgrade = buildCombinedUpgrade({
            countByGoalId: { goalA: 10, goalB: 20 },
            requiredCount: 30,
            locations: [location],
        });

        const result = UpgradesService.calculateDaysToCompleteMaterial(
            upgradeId,
            { [upgradeId]: combinedUpgrade },
            { [upgradeId]: 15 },
            goals,
            'goalB'
        );

        const expected = Math.ceil(15 / getRate(location));
        expect(Math.ceil(result)).toEqual(expected);
    });

    it('uses total remaining materials when no goal is selected', () => {
        const location = { ...CampaignsService.campaignsComposed['FoCE29'], isSuggested: true };
        const combinedUpgrade = buildCombinedUpgrade({
            countByGoalId: { goalA: 10, goalB: 20 },
            requiredCount: 30,
            locations: [location],
        });

        const result = UpgradesService.calculateDaysToCompleteMaterial(
            upgradeId,
            { [upgradeId]: combinedUpgrade },
            { [upgradeId]: 12 },
            goals,
            undefined
        );

        const expected = Math.ceil(18 / getRate(location));
        expect(Math.ceil(result)).toEqual(expected);
    });
});

describe('UpgradesService.tagLocationsWithGoalPriorityAndDaysToCompletion', () => {
    const getRate = (location: ICampaignBattleComposed): number => location.energyPerDay / location.energyPerItem;
    const upgradeId = 'upgHpL118';

    const buildCombinedUpgrade = (overrides: Partial<ICombinedUpgrade>): ICombinedUpgrade => ({
        ...FsdUpgradesService.baseUpgradesData[upgradeId],
        requiredCount: 0,
        countByGoalId: {},
        relatedCharacters: [],
        relatedGoals: [],
        locations: [],
        ...overrides,
    });

    const baseChar = CharactersService.charactersData[0];
    const goalA = createRankGoal(baseChar, { goalId: 'goalA', priority: 1 });
    const goalB = createRankGoal(baseChar, { goalId: 'goalB', priority: 2 });
    const goals = [goalA, goalB];

    const buildSettings = (order: IDailyRaidsFarmOrder): IEstimatedRanksSettings =>
        createSettings({
            preferences: {
                ...createSettings().preferences,
                farmPreferences: {
                    order,
                    homeScreenEvent: IDailyRaidsHomeScreenEvent.none,
                },
                farmStrategy: DailyRaidsStrategy.leastEnergy,
            },
        });

    it('uses highest-priority goal that still needs the material', () => {
        const location = { ...CampaignsService.campaignsComposed['FoCE29'], isSuggested: true };
        const combinedUpgrade = buildCombinedUpgrade({
            countByGoalId: { goalA: 10, goalB: 30 },
            requiredCount: 40,
            relatedGoals: [goalA.goalId, goalB.goalId],
            locations: [location],
        });

        const [tagged] = UpgradesService.tagLocationsWithGoalPriorityAndDaysToCompletion(
            [location],
            goals,
            { [upgradeId]: combinedUpgrade },
            {},
            buildSettings(IDailyRaidsFarmOrder.goalPriority)
        );

        const expectedDays = Math.ceil(10 / getRate(location));
        expect(tagged?.priority).toBe(1);
        expect(tagged?.highestPriorityGoalId).toBe('goalA');
        expect(Math.ceil(tagged?.daysToComplete ?? 0)).toBe(expectedDays);
    });

    it('moves to the next goal when higher-priority needs are met', () => {
        const location = { ...CampaignsService.campaignsComposed['FoCE29'], isSuggested: true };
        const combinedUpgrade = buildCombinedUpgrade({
            countByGoalId: { goalA: 10, goalB: 20 },
            requiredCount: 30,
            relatedGoals: [goalA.goalId, goalB.goalId],
            locations: [location],
        });

        const [tagged] = UpgradesService.tagLocationsWithGoalPriorityAndDaysToCompletion(
            [location],
            goals,
            { [upgradeId]: combinedUpgrade },
            { [upgradeId]: 15 },
            buildSettings(IDailyRaidsFarmOrder.goalPriority)
        );

        const expectedDays = Math.ceil(15 / getRate(location));
        expect(tagged?.priority).toBe(2);
        expect(tagged?.highestPriorityGoalId).toBe('goalB');
        expect(Math.ceil(tagged?.daysToComplete ?? 0)).toBe(expectedDays);
    });

    it('accounts for the number of available nodes', () => {
        const locationA = { ...CampaignsService.campaignsComposed['FoCE29'], isSuggested: true };
        const locationB = { ...CampaignsService.campaignsComposed['SHME31'], isSuggested: true };
        const combinedUpgrade = buildCombinedUpgrade({
            countByGoalId: { goalA: 10 },
            requiredCount: 10,
            relatedGoals: [goalA.goalId],
            locations: [locationA, locationB],
        });

        const [tagged] = UpgradesService.tagLocationsWithGoalPriorityAndDaysToCompletion(
            [locationA, locationB],
            goals,
            { [upgradeId]: combinedUpgrade },
            {},
            buildSettings(IDailyRaidsFarmOrder.goalPriority)
        );

        const expectedDays = Math.ceil(10 / (getRate(locationA) + getRate(locationB)));
        expect(tagged?.priority).toBe(1);
        expect(tagged?.highestPriorityGoalId).toBe('goalA');
        expect(Math.ceil(tagged?.daysToComplete ?? 0)).toBe(expectedDays);
    });

    it('reflects drop rate differences via energy per item', () => {
        const slowLocation = { ...CampaignsService.campaignsComposed['SHM64'], isSuggested: true };
        const fastLocation = { ...CampaignsService.campaignsComposed['FoCE29'], isSuggested: true };
        const combinedSlow = buildCombinedUpgrade({
            countByGoalId: { goalA: 50 },
            requiredCount: 50,
            relatedGoals: [goalA.goalId],
            locations: [slowLocation],
        });
        const combinedFast = buildCombinedUpgrade({
            countByGoalId: { goalA: 50 },
            requiredCount: 50,
            relatedGoals: [goalA.goalId],
            locations: [fastLocation],
        });

        const [slowTagged] = UpgradesService.tagLocationsWithGoalPriorityAndDaysToCompletion(
            [slowLocation],
            goals,
            { [upgradeId]: combinedSlow },
            {},
            buildSettings(IDailyRaidsFarmOrder.goalPriority)
        );
        const [fastTagged] = UpgradesService.tagLocationsWithGoalPriorityAndDaysToCompletion(
            [fastLocation],
            goals,
            { [upgradeId]: combinedFast },
            {},
            buildSettings(IDailyRaidsFarmOrder.goalPriority)
        );

        const expectedSlow = Math.ceil(50 / getRate(slowLocation));
        const expectedFast = Math.ceil(50 / getRate(fastLocation));

        expect(Math.ceil(slowTagged?.daysToComplete ?? 0)).toBe(expectedSlow);
        expect(Math.ceil(fastTagged?.daysToComplete ?? 0)).toBe(expectedFast);
        expect(Math.ceil(fastTagged?.daysToComplete ?? 0)).toBeLessThan(Math.ceil(slowTagged?.daysToComplete ?? 0));
    });

    it('does not change with rarity when locations are the same', () => {
        const location = { ...CampaignsService.campaignsComposed['FoCE29'], isSuggested: true };
        const combinedLegendary = buildCombinedUpgrade({
            rarity: Rarity.Legendary,
            countByGoalId: { goalA: 12 },
            requiredCount: 12,
            relatedGoals: [goalA.goalId],
            locations: [location],
        });
        const combinedEpic = buildCombinedUpgrade({
            rarity: Rarity.Epic,
            countByGoalId: { goalA: 12 },
            requiredCount: 12,
            relatedGoals: [goalA.goalId],
            locations: [location],
        });

        const [legendaryTagged] = UpgradesService.tagLocationsWithGoalPriorityAndDaysToCompletion(
            [location],
            goals,
            { [upgradeId]: combinedLegendary },
            {},
            buildSettings(IDailyRaidsFarmOrder.goalPriority)
        );
        const [epicTagged] = UpgradesService.tagLocationsWithGoalPriorityAndDaysToCompletion(
            [location],
            goals,
            { [upgradeId]: combinedEpic },
            {},
            buildSettings(IDailyRaidsFarmOrder.goalPriority)
        );

        expect(legendaryTagged?.daysToComplete).toBe(epicTagged?.daysToComplete);
    });

    it('combines multiple variables consistently', () => {
        const locationA = { ...CampaignsService.campaignsComposed['FoCE29'], isSuggested: true };
        const locationB = { ...CampaignsService.campaignsComposed['SHM64'], isSuggested: true };
        const combinedUpgrade = buildCombinedUpgrade({
            countByGoalId: { goalA: 8, goalB: 20 },
            requiredCount: 28,
            relatedGoals: [goalA.goalId, goalB.goalId],
            locations: [locationA, locationB],
        });

        const [tagged] = UpgradesService.tagLocationsWithGoalPriorityAndDaysToCompletion(
            [locationA, locationB],
            goals,
            { [upgradeId]: combinedUpgrade },
            {},
            buildSettings(IDailyRaidsFarmOrder.goalPriority)
        );

        const rateSum = getRate(locationA) + getRate(locationB);
        expect(tagged?.priority).toBe(1);
        expect(tagged?.highestPriorityGoalId).toBe('goalA');
        expect(Math.ceil(tagged?.daysToComplete ?? 0)).toBe(Math.ceil(8 / rateSum));
    });

    it('returns default tagging for total-materials order', () => {
        const location = { ...CampaignsService.campaignsComposed['FoCE29'], isSuggested: true };
        const combinedUpgrade = buildCombinedUpgrade({
            countByGoalId: { goalA: 10, goalB: 20 },
            requiredCount: 30,
            relatedGoals: [goalA.goalId, goalB.goalId],
            locations: [location],
        });

        const [tagged] = UpgradesService.tagLocationsWithGoalPriorityAndDaysToCompletion(
            [location],
            goals,
            { [upgradeId]: combinedUpgrade },
            { [upgradeId]: 12 },
            buildSettings(IDailyRaidsFarmOrder.totalMaterials)
        );

        expect(tagged?.priority).toBe(undefined);
        expect(tagged?.highestPriorityGoalId).toBeUndefined();
        expect(Math.ceil(tagged?.daysToComplete ?? 0)).toBe(8);
    });

    it('omits goal and priority when ordering by total materials', () => {
        const location = { ...CampaignsService.campaignsComposed['FoCE29'], isSuggested: true };
        const combinedUpgrade = buildCombinedUpgrade({
            countByGoalId: { goalA: 10, goalB: 20 },
            requiredCount: 30,
            relatedGoals: [goalA.goalId, goalB.goalId],
            locations: [location],
        });

        const [tagged] = UpgradesService.tagLocationsWithGoalPriorityAndDaysToCompletion(
            [location],
            goals,
            { [upgradeId]: combinedUpgrade },
            { [upgradeId]: 12 },
            buildSettings(IDailyRaidsFarmOrder.totalMaterials)
        );

        expect(tagged?.priority).toBeUndefined();
        expect(tagged?.highestPriorityGoalId).toBeUndefined();
    });
});

describe('UpgradesService.sortLocationsForRaiding', () => {
    const baseChar = CharactersService.charactersData[0];
    const goal = createRankGoal(baseChar, { goalId: 'goal-hse', priority: 1 });
    const goals = [goal];

    const buildSettingsForHse = (
        order: IDailyRaidsFarmOrder,
        homeScreenEvent: IDailyRaidsHomeScreenEvent
    ): IEstimatedRanksSettings =>
        createSettings({
            preferences: {
                ...createSettings().preferences,
                farmPreferences: {
                    order,
                    homeScreenEvent,
                },
                farmStrategy: DailyRaidsStrategy.leastEnergy,
            },
        });

    const buildCombinedUpgradeForLocation = (
        upgradeId: string,
        location: ICampaignBattleComposed
    ): ICombinedUpgrade => ({
        ...FsdUpgradesService.baseUpgradesData[upgradeId],
        requiredCount: 5,
        countByGoalId: { [goal.goalId]: 5 },
        relatedCharacters: [],
        relatedGoals: [goal.goalId],
        locations: [location],
    });

    it('keeps Boon of Khorne locations near the front for Tarvakh S1→D3 (total materials, least energy)', () => {
        const tarvakh = CharactersService.charactersData.find(
            char => char.shortName === 'Tarvakh' || char.name === 'Tarvakh'
        );
        expect(tarvakh).toBeDefined();
        const character = createCharacter(tarvakh as ICharacterData, { rank: Rank.Silver1 });

        const tarvakhGoal = createRankGoal(tarvakh as ICharacterData, {
            goalId: 'goal-tarvakh-s1-d3-sort',
            rankStart: Rank.Silver1,
            rankEnd: Rank.Diamond3,
        });

        const campaignsProgress = Object.values(Campaign)
            .filter((value): value is Campaign => typeof value === 'string')
            .reduce(
                (acc, campaign) => {
                    acc[campaign] = 999;
                    return acc;
                },
                {} as IEstimatedRanksSettings['campaignsProgress']
            );

        const inventory: Record<string, number> = {};
        const settings = createSettings({
            dailyEnergy: 500,
            campaignsProgress,
            upgrades: inventory,
            preferences: {
                ...createSettings().preferences,
                dailyEnergy: 500,
                farmPreferences: {
                    order: IDailyRaidsFarmOrder.totalMaterials,
                    homeScreenEvent: IDailyRaidsHomeScreenEvent.none,
                },
                farmStrategy: DailyRaidsStrategy.leastEnergy,
            },
        });

        const unitUpgrades = UpgradesService.getUpgrades(inventory, [character], [], [tarvakhGoal]);
        const combinedBaseMaterials = UpgradesService.combineBaseMaterials(unitUpgrades);
        UpgradesService.populateLocationsData(combinedBaseMaterials, settings);

        expect(combinedBaseMaterials.upgHpL118).toBeDefined();

        const locs = Object.values(combinedBaseMaterials)
            .flatMap(mat => mat.locations)
            .filter(loc => loc.isSuggested);

        const sorted = UpgradesService.sortLocationsForRaiding(
            locs,
            [tarvakhGoal],
            combinedBaseMaterials,
            inventory,
            settings
        );

        const topLocations = sorted.slice(0, 10).map(loc => loc.id);
        const boonLocations = [
            CampaignsService.campaignsComposed['FoCE29'].id,
            CampaignsService.campaignsComposed['SHME31'].id,
        ];

        expect(topLocations).toEqual(expect.arrayContaining(boonLocations));
    });

    it('orders purge order battles by hsePoints (goal priority)', () => {
        const locO36 = { ...CampaignsService.campaignsComposed['O36'], isSuggested: true };
        const locO40 = { ...CampaignsService.campaignsComposed['O40'], isSuggested: true };
        const locOME30 = { ...CampaignsService.campaignsComposed['OME30'], isSuggested: true };
        const combinedBaseMaterials = {
            [locO36.rewards.potential[0].id]: buildCombinedUpgradeForLocation(locO36.rewards.potential[0].id, locO36),
            [locO40.rewards.potential[0].id]: buildCombinedUpgradeForLocation(locO40.rewards.potential[0].id, locO40),
            [locOME30.rewards.potential[0].id]: buildCombinedUpgradeForLocation(
                locOME30.rewards.potential[0].id,
                locOME30
            ),
        };

        const sorted = UpgradesService.sortLocationsForRaiding(
            [locO40, locOME30, locO36],
            goals,
            combinedBaseMaterials,
            {},
            buildSettingsForHse(IDailyRaidsFarmOrder.goalPriority, IDailyRaidsHomeScreenEvent.purgeOrder)
        );

        expect(sorted.map(loc => loc.id)).toEqual(['Octarius36', 'Octarius40', 'Octarius Mirror Elite30']);
    });

    it('orders purge order battles by hsePoints (total materials)', () => {
        const locO36 = { ...CampaignsService.campaignsComposed['O36'], isSuggested: true };
        const locO40 = { ...CampaignsService.campaignsComposed['O40'], isSuggested: true };
        const locOME30 = { ...CampaignsService.campaignsComposed['OME30'], isSuggested: true };
        const combinedBaseMaterials = {
            [locO36.rewards.potential[0].id]: buildCombinedUpgradeForLocation(locO36.rewards.potential[0].id, locO36),
            [locO40.rewards.potential[0].id]: buildCombinedUpgradeForLocation(locO40.rewards.potential[0].id, locO40),
            [locOME30.rewards.potential[0].id]: buildCombinedUpgradeForLocation(
                locOME30.rewards.potential[0].id,
                locOME30
            ),
        };

        const sorted = UpgradesService.sortLocationsForRaiding(
            [locO40, locOME30, locO36],
            goals,
            combinedBaseMaterials,
            {},
            buildSettingsForHse(IDailyRaidsFarmOrder.totalMaterials, IDailyRaidsHomeScreenEvent.purgeOrder)
        );

        expect(sorted.map(loc => loc.id)).toEqual(['Octarius Mirror Elite30', 'Octarius40', 'Octarius36']);
    });

    it('orders warp surge battles by hsePoints (goal priority)', () => {
        const locSH10 = { ...CampaignsService.campaignsComposed['SH10'], isSuggested: true };
        const locSHE39 = { ...CampaignsService.campaignsComposed['SHE39'], isSuggested: true };
        const locFoCME39 = { ...CampaignsService.campaignsComposed['FoCME39'], isSuggested: true };
        const combinedBaseMaterials = {
            [locSH10.rewards.potential[0].id]: buildCombinedUpgradeForLocation(
                locSH10.rewards.potential[0].id,
                locSH10
            ),
            [locSHE39.rewards.potential[0].id]: buildCombinedUpgradeForLocation(
                locSHE39.rewards.potential[0].id,
                locSHE39
            ),
            [locFoCME39.rewards.potential[0].id]: buildCombinedUpgradeForLocation(
                locFoCME39.rewards.potential[0].id,
                locFoCME39
            ),
        };

        const sorted = UpgradesService.sortLocationsForRaiding(
            [locFoCME39, locSHE39, locSH10],
            goals,
            combinedBaseMaterials,
            {},
            buildSettingsForHse(IDailyRaidsFarmOrder.goalPriority, IDailyRaidsHomeScreenEvent.warpSurge)
        );

        expect(sorted.map(loc => loc.id)).toEqual(['Saim-Hann Elite39', 'Saim-Hann10', 'Fall of Cadia Mirror Elite39']);
    });

    it('orders warp surge battles by hsePoints (total materials)', () => {
        const locSH10 = { ...CampaignsService.campaignsComposed['SH10'], isSuggested: true };
        const locSHE39 = { ...CampaignsService.campaignsComposed['SHE39'], isSuggested: true };
        const locFoCME39 = { ...CampaignsService.campaignsComposed['FoCME39'], isSuggested: true };
        const combinedBaseMaterials = {
            [locSH10.rewards.potential[0].id]: buildCombinedUpgradeForLocation(
                locSH10.rewards.potential[0].id,
                locSH10
            ),
            [locSHE39.rewards.potential[0].id]: buildCombinedUpgradeForLocation(
                locSHE39.rewards.potential[0].id,
                locSHE39
            ),
            [locFoCME39.rewards.potential[0].id]: buildCombinedUpgradeForLocation(
                locFoCME39.rewards.potential[0].id,
                locFoCME39
            ),
        };

        const sorted = UpgradesService.sortLocationsForRaiding(
            [locFoCME39, locSHE39, locSH10],
            goals,
            combinedBaseMaterials,
            {},
            buildSettingsForHse(IDailyRaidsFarmOrder.totalMaterials, IDailyRaidsHomeScreenEvent.warpSurge)
        );

        expect(sorted.map(loc => loc.id)).toEqual(['Fall of Cadia Mirror Elite39', 'Saim-Hann10', 'Saim-Hann Elite39']);
    });

    it('orders machine hunt battles by hsePoints (goal priority)', () => {
        const locI23 = { ...CampaignsService.campaignsComposed['I23'], isSuggested: true };
        const locI37 = { ...CampaignsService.campaignsComposed['I37'], isSuggested: true };
        const locIE05 = { ...CampaignsService.campaignsComposed['IE05'], isSuggested: true };
        const combinedBaseMaterials = {
            [locI23.rewards.potential[0].id]: buildCombinedUpgradeForLocation(locI23.rewards.potential[0].id, locI23),
            [locI37.rewards.potential[0].id]: buildCombinedUpgradeForLocation(locI37.rewards.potential[0].id, locI37),
            [locIE05.rewards.potential[0].id]: buildCombinedUpgradeForLocation(
                locIE05.rewards.potential[0].id,
                locIE05
            ),
        };

        const sorted = UpgradesService.sortLocationsForRaiding(
            [locI37, locIE05, locI23],
            goals,
            combinedBaseMaterials,
            {},
            buildSettingsForHse(IDailyRaidsFarmOrder.goalPriority, IDailyRaidsHomeScreenEvent.machineHunt)
        );
        expect(sorted.map(loc => loc.id)).toEqual(['Indomitus Elite5', 'Indomitus23', 'Indomitus37']);
    });

    it('orders machine hunt battles by hsePoints (total materials)', () => {
        const locI23 = { ...CampaignsService.campaignsComposed['I23'], isSuggested: true };
        const locI37 = { ...CampaignsService.campaignsComposed['I37'], isSuggested: true };
        const locIE05 = { ...CampaignsService.campaignsComposed['IE05'], isSuggested: true };
        const combinedBaseMaterials = {
            [locI23.rewards.potential[0].id]: buildCombinedUpgradeForLocation(locI23.rewards.potential[0].id, locI23),
            [locI37.rewards.potential[0].id]: buildCombinedUpgradeForLocation(locI37.rewards.potential[0].id, locI37),
            [locIE05.rewards.potential[0].id]: buildCombinedUpgradeForLocation(
                locIE05.rewards.potential[0].id,
                locIE05
            ),
        };

        const sorted = UpgradesService.sortLocationsForRaiding(
            [locI37, locIE05, locI23],
            goals,
            combinedBaseMaterials,
            {},
            buildSettingsForHse(IDailyRaidsFarmOrder.totalMaterials, IDailyRaidsHomeScreenEvent.machineHunt)
        );

        expect(sorted.map(loc => loc.id)).toEqual(['Indomitus37', 'Indomitus23', 'Indomitus Elite5']);
    });
});
