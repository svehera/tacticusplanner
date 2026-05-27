/* eslint-disable import-x/no-internal-modules */
/* eslint-disable boundaries/element-types */
import { describe, it, expect } from 'vitest';

import { CampaignsLocationsUsage, PersonalGoalType } from 'src/models/enums';
import { IPersonalGoal, IInventory } from 'src/models/interfaces';

import { Alliance, Rank, Rarity, RarityStars, UnitType } from '@/fsd/5-shared/model';

import { ICharacter2 } from '@/fsd/4-entities/character';

import {
    ICharacterAscendGoal,
    ICharacterUnlockGoal,
    ICharacterUpgradeRankGoal,
    ICharacterUpgradeMow,
    IEstimatedUpgrades,
    IGoalEstimate,
} from '@/fsd/3-features/goals/goals.models';
import { GoalsService } from '@/fsd/3-features/goals/goals.service';

import { XpUseState } from '@/fsd/1-pages/input-resources';
import { ArenaLeague, XpIncomeState } from '@/fsd/1-pages/input-xp-income';

const makeEstimatedUpgrades = (overrides: Partial<IEstimatedUpgrades> = {}): IEstimatedUpgrades => ({
    upgradesRaids: [],
    inProgressMaterials: [],
    blockedMaterials: [],
    finishedMaterials: [],
    characters: [],
    byCharactersPriority: [],
    relatedUpgrades: [],
    energyTotal: 0,
    raidsTotal: 0,
    daysTotal: 0,
    freeEnergyDays: 0,
    ...overrides,
});

const makeBlockedMaterial = (
    id: string,
    goalIds: string[],
    acquiredCount: number
): IEstimatedUpgrades['blockedMaterials'][number] => ({
    id,
    snowprintId: id,
    label: id,
    rarity: Rarity.Mythic,
    iconPath: '',
    locations: [],
    acquiredCount,
    requiredCount: 5,
    relatedCharacters: [],
    relatedGoals: goalIds,
    daysTotal: 0,
    raidsTotal: 0,
    energyTotal: 0,
    energyLeft: 0,
    isBlocked: true,
    isFinished: false,
    crafted: false,
    stat: '',
});

describe('Goal service', () => {
    describe('convertToTypedGoal', () => {
        it('should convert to Upgrade rank object', () => {
            const characterMock: ICharacter2 = {
                unitType: UnitType.character,
                id: 'spaceBlackmane',
                snowprintId: 'spaceBlackmane',
                name: 'Ragnar Blackmane',
                shortName: 'Ragnar',
                alliance: Alliance.Imperial,
                icon: 'path',
                rank: Rank.Bronze1,
                upgrades: ['item1', 'item2'],
                level: 51,
                xp: 124,
                rarity: Rarity.Rare,
            } as ICharacter2;

            const goalMock: IPersonalGoal = {
                id: '124124',
                character: 'spaceBlackmane',
                type: PersonalGoalType.UpgradeRank,
                priority: 1,
                dailyRaids: false,
                notes: 'myNotes',
                startingRank: Rank.Bronze1,
                targetRank: Rank.Silver1,
                rankPoint5: true,
                startingRankPoint5: false,
            };

            const expectedResult: ICharacterUpgradeRankGoal = {
                priority: goalMock.priority,
                goalId: goalMock.id,
                include: goalMock.dailyRaids,
                unitId: characterMock.snowprintId,
                unitAlliance: characterMock.alliance,
                unitName: characterMock.shortName,
                unitIcon: characterMock.icon,
                unitRoundIcon: characterMock.roundIcon,
                notes: goalMock.notes!,
                rankStart: characterMock.rank,
                rankEnd: goalMock.targetRank!,
                rankPoint5: goalMock.rankPoint5!,
                rankStartPoint5: goalMock.startingRankPoint5!,
                rankAppliedUpgrades: 0,
                rankStartAppliedUpgrades: 0,
                appliedUpgrades: characterMock.upgrades,
                level: characterMock.level,
                xp: characterMock.xp,
                rarity: characterMock.rarity,
                type: PersonalGoalType.UpgradeRank,
                manuallyFarmXp: false,
                upgradesRarity: [],
            };

            const result = GoalsService.convertToTypedGoal(goalMock, characterMock);

            expect(result).toEqual(expectedResult);
        });

        it('should convert to Unlock object', () => {
            const characterMock: ICharacter2 = {
                unitType: UnitType.character,
                id: 'spaceBlackmane',
                snowprintId: 'spaceBlackmane',
                name: 'Ragnar Blackmane',
                shortName: 'Ragnar',
                alliance: Alliance.Chaos,
                faction: 'ThousandSons',
                icon: 'path',
                shards: 10,
                rarity: Rarity.Legendary,
                rank: Rank.Silver1,
            } as ICharacter2;

            const goalMock: IPersonalGoal = {
                id: '23424',
                character: 'Character',
                type: PersonalGoalType.Unlock,
                priority: 1,
                dailyRaids: false,
                notes: 'myNotes',
            };

            const expectedResult: ICharacterUnlockGoal = {
                priority: goalMock.priority,
                goalId: goalMock.id,
                include: goalMock.dailyRaids,
                unitId: characterMock.snowprintId,
                unitAlliance: characterMock.alliance,
                unitName: characterMock.shortName,
                unitIcon: characterMock.icon,
                unitRoundIcon: characterMock.roundIcon,
                faction: characterMock.faction,
                notes: goalMock.notes!,
                shards: characterMock.shards,
                mythicShards: 0,
                rarity: characterMock.rarity,
                rank: characterMock.rank,
                campaignsUsage: CampaignsLocationsUsage.LeastEnergy,
                type: PersonalGoalType.Unlock,
            };

            const result = GoalsService.convertToTypedGoal(goalMock, characterMock);

            expect(result).toEqual(expectedResult);
        });

        it('should convert to Ascend object', () => {
            const characterMock: ICharacter2 = {
                unitType: UnitType.character,
                id: 'spaceBlackmane',
                snowprintId: 'spaceBlackmane',
                name: 'Ragnar Blackmane',
                shortName: 'Ragnar',
                shards: 10,
                rarity: Rarity.Epic,
                stars: RarityStars.FiveStars,
            } as ICharacter2;

            const goalMock: IPersonalGoal = {
                id: '23424',
                character: 'Character',
                type: PersonalGoalType.Ascend,
                priority: 1,
                dailyRaids: false,
                notes: 'myNotes',
                targetRarity: Rarity.Legendary,
            };

            const expectedResult: ICharacterAscendGoal = {
                priority: goalMock.priority,
                goalId: goalMock.id,
                include: goalMock.dailyRaids,
                unitId: characterMock.snowprintId,
                unitAlliance: characterMock.alliance,
                unitName: characterMock.shortName,
                unitIcon: characterMock.icon,
                unitRoundIcon: characterMock.roundIcon,
                notes: goalMock.notes!,
                rarityStart: characterMock.rarity,
                rarityEnd: goalMock.targetRarity!,
                shards: characterMock.shards,
                mythicShards: 0,
                starsStart: characterMock.stars,
                starsEnd: RarityStars.RedThreeStars,
                onslaughtShards: 0,
                onslaughtMythicShards: 0,
                farmType: 'both',
                campaignsUsage: CampaignsLocationsUsage.LeastEnergy,
                mythicCampaignsUsage: CampaignsLocationsUsage.LeastEnergy,
                type: PersonalGoalType.Ascend,
            };

            const result = GoalsService.convertToTypedGoal(goalMock, characterMock);

            expect(result).toEqual(expectedResult);
        });
    });

    describe('buildGoalEstimates', () => {
        it('marks goal as blocked when any of its blocked materials cannot be covered by available inventory', () => {
            const goalId = 'goal-biovore';
            const highPriorityGoalId = 'goal-higher';

            // mat-A: inventory=10, higher-priority needs 5, this goal needs 3 → 10 >= 5+3, NOT blocked by this mat
            // mat-B: inventory=2, higher-priority needs 0, this goal needs 5 → 2 < 0+5, IS blocked by this mat
            const estimatedUpgrades = makeEstimatedUpgrades({
                blockedMaterials: [
                    makeBlockedMaterial('mat-A', [highPriorityGoalId, goalId], 10),
                    makeBlockedMaterial('mat-B', [goalId], 2),
                ],
                characters: [
                    {
                        goalId: highPriorityGoalId,
                        unitId: 'unitA',
                        label: 'Unit A',
                        upgradeMaterials: {},
                        upgradeRanks: [],
                        upgradeShards: undefined,
                        baseUpgradesTotal: { 'mat-A': 5 },
                        relatedUpgrades: [],
                    },
                    {
                        goalId,
                        unitId: 'unitB',
                        label: 'Biovore',
                        upgradeMaterials: {},
                        upgradeRanks: [],
                        upgradeShards: undefined,
                        baseUpgradesTotal: { 'mat-A': 3, 'mat-B': 5 },
                        relatedUpgrades: [],
                    },
                ],
            });

            const mowGoal: ICharacterUpgradeMow = {
                goalId,
                unitId: 'tyranBiovore',
                unitName: 'Biovore',
                unitIcon: '',
                unitRoundIcon: '',
                unitAlliance: Alliance.Xenos,
                priority: 9,
                include: true,
                notes: '',
                primaryStart: 50,
                primaryEnd: 60,
                secondaryStart: 50,
                secondaryEnd: 60,
                type: PersonalGoalType.MowAbilities,
                upgradesRarity: [],
                shards: 0,
                stars: RarityStars.None,
                rarity: Rarity.Common,
            };

            const higherGoal: ICharacterUpgradeMow = {
                goalId: highPriorityGoalId,
                unitId: 'someUnit',
                unitName: 'Some Unit',
                unitIcon: '',
                unitRoundIcon: '',
                unitAlliance: Alliance.Imperial,
                priority: 1,
                include: true,
                notes: '',
                primaryStart: 1,
                primaryEnd: 10,
                secondaryStart: 1,
                secondaryEnd: 10,
                type: PersonalGoalType.MowAbilities,
                upgradesRarity: [],
                shards: 0,
                stars: RarityStars.None,
                rarity: Rarity.Common,
            };

            const result = GoalsService.buildGoalEstimates(
                estimatedUpgrades,
                [],
                [],
                [higherGoal, mowGoal],
                [],
                [],
                true // isGoalPriority
            );

            const biovoreEstimate = result.find(est => est.goalId === goalId);
            expect(biovoreEstimate?.blocked).toBe(true);
        });

        it('does not mark goal as blocked when all its blocked materials are covered by inventory', () => {
            const goalId = 'goal-biovore';

            // mat-A: inventory=10, higher needs 0, this goal needs 5 → 10 >= 5, NOT blocked
            const estimatedUpgrades = makeEstimatedUpgrades({
                blockedMaterials: [makeBlockedMaterial('mat-A', [goalId], 10)],
                characters: [
                    {
                        goalId,
                        unitId: 'tyranBiovore',
                        label: 'Biovore',
                        upgradeMaterials: {},
                        upgradeRanks: [],
                        upgradeShards: undefined,
                        baseUpgradesTotal: { 'mat-A': 5 },
                        relatedUpgrades: [],
                    },
                ],
            });

            const mowGoal: ICharacterUpgradeMow = {
                goalId,
                unitId: 'tyranBiovore',
                unitName: 'Biovore',
                unitIcon: '',
                unitRoundIcon: '',
                unitAlliance: Alliance.Xenos,
                priority: 9,
                include: true,
                notes: '',
                primaryStart: 50,
                primaryEnd: 60,
                secondaryStart: 50,
                secondaryEnd: 60,
                type: PersonalGoalType.MowAbilities,
                upgradesRarity: [],
                shards: 0,
                stars: RarityStars.None,
                rarity: Rarity.Common,
            };

            const result = GoalsService.buildGoalEstimates(
                estimatedUpgrades,
                [],
                [],
                [mowGoal],
                [],
                [],
                true // isGoalPriority
            );

            const biovoreEstimate = result.find(est => est.goalId === goalId);
            expect(biovoreEstimate?.blocked).toBe(false);
        });
    });
});

// ─── adjustGoalEstimates ─────────────────────────────────────────────────────

const makeEmptyRarityRecord = (): Record<Rarity, number> => ({
    [Rarity.Common]: 0,
    [Rarity.Uncommon]: 0,
    [Rarity.Rare]: 0,
    [Rarity.Epic]: 0,
    [Rarity.Legendary]: 0,
    [Rarity.Mythic]: 0,
});

const makeEmptyAllianceRarityRecord = (): Record<Alliance, Record<Rarity, number>> => ({
    [Alliance.Imperial]: makeEmptyRarityRecord(),
    [Alliance.Chaos]: makeEmptyRarityRecord(),
    [Alliance.Xenos]: makeEmptyRarityRecord(),
});

const makeEmptyInventory = (): IInventory => ({
    xpBooks: makeEmptyRarityRecord(),
    abilityBadges: makeEmptyAllianceRarityRecord(),
    components: { [Alliance.Imperial]: 0, [Alliance.Chaos]: 0, [Alliance.Xenos]: 0 },
    forgeBadges: makeEmptyRarityRecord(),
    orbs: makeEmptyAllianceRarityRecord(),
    upgrades: {},
    items: {},
});

const noXpUse: XpUseState = {
    useCommon: false,
    useUncommon: false,
    useRare: false,
    useEpic: false,
    useLegendary: false,
    useMythic: false,
};

const noXpIncome: XpIncomeState = {
    manualCodicesPerDay: 0,
    arenaLeague: ArenaLeague.honorGuard,
    loopsRaids: 'no',
    clearRarity: Rarity.Common,
    additionalBosses: 0,
    raidLoops: 0,
    extraBossesAfterLoop: 0,
    useATForCodices: 'no',
    hasBlueStarMoW: 'no',
    incursionLegendaryLevel: 'L10',
    onslaughtMythicWinged: false,
    eliteEnergyPerDay: 0,
    nonEliteEnergyPerDay: 0,
    additionalCodicesPerWeek: 0,
    defaultCodexToUse: Rarity.Legendary,
};

const makePersonalGoal = (
    id: string,
    type: PersonalGoalType,
    priority: number,
    dailyRaids: boolean,
    character = 'unit-a'
): IPersonalGoal => ({
    id,
    character,
    type,
    priority,
    dailyRaids,
});

const makeGoalEstimate = (
    goalId: string,
    included: boolean,
    overrides: Partial<IGoalEstimate> = {}
): IGoalEstimate => ({
    goalId,
    daysTotal: 0,
    daysLeft: 0,
    energyTotal: 0,
    oTokensTotal: 0,
    xpBooksTotal: 0,
    included,
    ...overrides,
});

describe('GoalsService.adjustGoalEstimates', () => {
    describe('included rank-up goal', () => {
        it('appears in goal estimates when included', () => {
            const goalId = 'goal-rankup';
            const estimate = makeGoalEstimate(goalId, true);

            const inventory = makeEmptyInventory();
            const goal = makePersonalGoal(goalId, PersonalGoalType.UpgradeRank, 1, true);

            const result = GoalsService.adjustGoalEstimates([goal], [estimate], inventory, noXpUse, [], [], noXpIncome);

            const goalResult = result.goalEstimates.find(estimate => estimate.goalId === goalId);
            expect(goalResult).toBeDefined();
            expect(goalResult?.included).toBe(true);
        });
    });

    describe('included MoW abilities goal', () => {
        it('contributes ability badges to neededBadges', () => {
            const goalId = 'goal-mow';
            const badgesNeeded: Record<Rarity, number> = { ...makeEmptyRarityRecord(), [Rarity.Epic]: 3 };
            const estimate = makeGoalEstimate(goalId, true, {
                mowEstimate: {
                    components: 0,
                    salvage: 0,
                    gold: 0,
                    badges: badgesNeeded,
                    forgeBadges: makeEmptyRarityRecord(),
                    orbs: makeEmptyRarityRecord(),
                },
            });

            const mowGoal: ICharacterUpgradeMow = {
                goalId,
                unitId: 'tyranBiovore',
                unitName: 'Biovore',
                unitIcon: '',
                unitRoundIcon: '',
                unitAlliance: Alliance.Xenos,
                priority: 1,
                include: true,
                notes: '',
                primaryStart: 1,
                primaryEnd: 5,
                secondaryStart: 1,
                secondaryEnd: 5,
                type: PersonalGoalType.MowAbilities,
                upgradesRarity: [],
                shards: 0,
                stars: RarityStars.None,
                rarity: Rarity.Common,
            };

            const goal = makePersonalGoal(goalId, PersonalGoalType.MowAbilities, 1, true);
            const inventory = makeEmptyInventory();

            const result = GoalsService.adjustGoalEstimates(
                [goal],
                [estimate],
                inventory,
                noXpUse,
                [mowGoal],
                [],
                noXpIncome
            );

            expect(result.neededBadges[Alliance.Xenos][Rarity.Epic]).toBe(3);
        });

        it('contributes forge badges to neededForgeBadges', () => {
            const goalId = 'goal-mow-forge';
            const forgeBadgesNeeded: Record<Rarity, number> = { ...makeEmptyRarityRecord(), [Rarity.Legendary]: 2 };
            const estimate = makeGoalEstimate(goalId, true, {
                mowEstimate: {
                    components: 0,
                    salvage: 0,
                    gold: 0,
                    badges: makeEmptyRarityRecord(),
                    forgeBadges: forgeBadgesNeeded,
                    orbs: makeEmptyRarityRecord(),
                },
            });

            const mowGoal: ICharacterUpgradeMow = {
                goalId,
                unitId: 'tyranBiovore',
                unitName: 'Biovore',
                unitIcon: '',
                unitRoundIcon: '',
                unitAlliance: Alliance.Xenos,
                priority: 1,
                include: true,
                notes: '',
                primaryStart: 1,
                primaryEnd: 5,
                secondaryStart: 1,
                secondaryEnd: 5,
                type: PersonalGoalType.MowAbilities,
                upgradesRarity: [],
                shards: 0,
                stars: RarityStars.None,
                rarity: Rarity.Common,
            };

            const goal = makePersonalGoal(goalId, PersonalGoalType.MowAbilities, 1, true);
            const inventory = makeEmptyInventory();

            const result = GoalsService.adjustGoalEstimates(
                [goal],
                [estimate],
                inventory,
                noXpUse,
                [mowGoal],
                [],
                noXpIncome
            );

            expect(result.neededForgeBadges[Rarity.Legendary]).toBe(2);
        });

        it('contributes components to neededComponents', () => {
            const goalId = 'goal-mow-components';
            const estimate = makeGoalEstimate(goalId, true, {
                mowEstimate: {
                    components: 7,
                    salvage: 0,
                    gold: 0,
                    badges: makeEmptyRarityRecord(),
                    forgeBadges: makeEmptyRarityRecord(),
                    orbs: makeEmptyRarityRecord(),
                },
            });

            const mowGoal: ICharacterUpgradeMow = {
                goalId,
                unitId: 'tyranBiovore',
                unitName: 'Biovore',
                unitIcon: '',
                unitRoundIcon: '',
                unitAlliance: Alliance.Xenos,
                priority: 1,
                include: true,
                notes: '',
                primaryStart: 1,
                primaryEnd: 5,
                secondaryStart: 1,
                secondaryEnd: 5,
                type: PersonalGoalType.MowAbilities,
                upgradesRarity: [],
                shards: 0,
                stars: RarityStars.None,
                rarity: Rarity.Common,
            };

            const goal = makePersonalGoal(goalId, PersonalGoalType.MowAbilities, 1, true);
            const inventory = makeEmptyInventory();

            const result = GoalsService.adjustGoalEstimates(
                [goal],
                [estimate],
                inventory,
                noXpUse,
                [mowGoal],
                [],
                noXpIncome
            );

            expect(result.neededComponents[Alliance.Xenos]).toBe(7);
        });
    });

    describe('included ascend goal', () => {
        it('contributes orbs to neededOrbs', () => {
            const goalId = 'goal-ascend';
            const orbsNeeded: Record<Rarity, number> = { ...makeEmptyRarityRecord(), [Rarity.Legendary]: 4 };
            const estimate = makeGoalEstimate(goalId, true, {
                orbsEstimate: {
                    alliance: Alliance.Imperial,
                    orbs: orbsNeeded,
                },
            });

            const ascendGoal: ICharacterAscendGoal = {
                goalId,
                unitId: 'unit-a',
                unitName: 'Unit A',
                unitIcon: '',
                unitRoundIcon: '',
                unitAlliance: Alliance.Imperial,
                priority: 1,
                include: true,
                notes: '',
                rarityStart: Rarity.Legendary,
                rarityEnd: Rarity.Mythic,
                shards: 0,
                mythicShards: 0,
                starsStart: RarityStars.OneBlueStar,
                starsEnd: RarityStars.TwoBlueStars,
                onslaughtShards: 0,
                onslaughtMythicShards: 0,
                farmType: 'both',
                campaignsUsage: CampaignsLocationsUsage.LeastEnergy,
                mythicCampaignsUsage: CampaignsLocationsUsage.LeastEnergy,
                type: PersonalGoalType.Ascend,
            };

            const goal = makePersonalGoal(goalId, PersonalGoalType.Ascend, 1, true);
            const inventory = makeEmptyInventory();

            const result = GoalsService.adjustGoalEstimates(
                [goal],
                [estimate],
                inventory,
                noXpUse,
                [],
                [ascendGoal],
                noXpIncome
            );

            expect(result.neededOrbs[Alliance.Imperial][Rarity.Legendary]).toBe(4);
        });
    });

    describe('excluded goals have no impact on missing resources', () => {
        it('excluded MoW abilities goal does not add to neededBadges', () => {
            const goalId = 'goal-inactive-mow';
            const badgesNeeded: Record<Rarity, number> = { ...makeEmptyRarityRecord(), [Rarity.Epic]: 5 };
            const estimate = makeGoalEstimate(goalId, false, {
                mowEstimate: {
                    components: 0,
                    salvage: 0,
                    gold: 0,
                    badges: badgesNeeded,
                    forgeBadges: makeEmptyRarityRecord(),
                    orbs: makeEmptyRarityRecord(),
                },
            });

            const mowGoal: ICharacterUpgradeMow = {
                goalId,
                unitId: 'tyranBiovore',
                unitName: 'Biovore',
                unitIcon: '',
                unitRoundIcon: '',
                unitAlliance: Alliance.Xenos,
                priority: 1,
                include: false,
                notes: '',
                primaryStart: 1,
                primaryEnd: 5,
                secondaryStart: 1,
                secondaryEnd: 5,
                type: PersonalGoalType.MowAbilities,
                upgradesRarity: [],
                shards: 0,
                stars: RarityStars.None,
                rarity: Rarity.Common,
            };

            const goal = makePersonalGoal(goalId, PersonalGoalType.MowAbilities, 1, false);
            const inventory = makeEmptyInventory();

            const result = GoalsService.adjustGoalEstimates(
                [goal],
                [estimate],
                inventory,
                noXpUse,
                [mowGoal],
                [],
                noXpIncome
            );

            expect(result.neededBadges[Alliance.Xenos][Rarity.Epic]).toBe(0);
        });

        it('excluded MoW abilities goal does not add to neededForgeBadges or neededComponents', () => {
            const goalId = 'goal-inactive-mow-forge';
            const estimate = makeGoalEstimate(goalId, false, {
                mowEstimate: {
                    components: 10,
                    salvage: 0,
                    gold: 0,
                    badges: makeEmptyRarityRecord(),
                    forgeBadges: { ...makeEmptyRarityRecord(), [Rarity.Epic]: 6 },
                    orbs: makeEmptyRarityRecord(),
                },
            });

            const mowGoal: ICharacterUpgradeMow = {
                goalId,
                unitId: 'tyranBiovore',
                unitName: 'Biovore',
                unitIcon: '',
                unitRoundIcon: '',
                unitAlliance: Alliance.Xenos,
                priority: 1,
                include: false,
                notes: '',
                primaryStart: 1,
                primaryEnd: 5,
                secondaryStart: 1,
                secondaryEnd: 5,
                type: PersonalGoalType.MowAbilities,
                upgradesRarity: [],
                shards: 0,
                stars: RarityStars.None,
                rarity: Rarity.Common,
            };

            const goal = makePersonalGoal(goalId, PersonalGoalType.MowAbilities, 1, false);
            const inventory = makeEmptyInventory();

            const result = GoalsService.adjustGoalEstimates(
                [goal],
                [estimate],
                inventory,
                noXpUse,
                [mowGoal],
                [],
                noXpIncome
            );

            expect(result.neededForgeBadges[Rarity.Epic]).toBe(0);
            expect(result.neededComponents[Alliance.Xenos]).toBe(0);
        });

        it('excluded ascend goal does not add to neededOrbs', () => {
            const goalId = 'goal-inactive-ascend';
            const orbsNeeded: Record<Rarity, number> = { ...makeEmptyRarityRecord(), [Rarity.Legendary]: 8 };
            const estimate = makeGoalEstimate(goalId, false, {
                orbsEstimate: {
                    alliance: Alliance.Imperial,
                    orbs: orbsNeeded,
                },
            });

            const ascendGoal: ICharacterAscendGoal = {
                goalId,
                unitId: 'unit-a',
                unitName: 'Unit A',
                unitIcon: '',
                unitRoundIcon: '',
                unitAlliance: Alliance.Imperial,
                priority: 1,
                include: false,
                notes: '',
                rarityStart: Rarity.Legendary,
                rarityEnd: Rarity.Mythic,
                shards: 0,
                mythicShards: 0,
                starsStart: RarityStars.OneBlueStar,
                starsEnd: RarityStars.TwoBlueStars,
                onslaughtShards: 0,
                onslaughtMythicShards: 0,
                farmType: 'both',
                campaignsUsage: CampaignsLocationsUsage.LeastEnergy,
                mythicCampaignsUsage: CampaignsLocationsUsage.LeastEnergy,
                type: PersonalGoalType.Ascend,
            };

            const goal = makePersonalGoal(goalId, PersonalGoalType.Ascend, 1, false);
            const inventory = makeEmptyInventory();

            const result = GoalsService.adjustGoalEstimates(
                [goal],
                [estimate],
                inventory,
                noXpUse,
                [],
                [ascendGoal],
                noXpIncome
            );

            expect(result.neededOrbs[Alliance.Imperial][Rarity.Legendary]).toBe(0);
        });

        it('excluded rank-up goal with xpEstimate does not add to neededXp', () => {
            const goalId = 'goal-inactive-xp';
            const estimate = makeGoalEstimate(goalId, false, {
                xpEstimate: {
                    books: 5,
                    bookRarity: Rarity.Legendary,
                    gold: 0,
                    currentLevel: 10,
                    targetLevel: 20,
                    xpLeft: 50_000,
                },
            });

            const goal = makePersonalGoal(goalId, PersonalGoalType.UpgradeRank, 1, false);
            const inventory = makeEmptyInventory();

            const result = GoalsService.adjustGoalEstimates([goal], [estimate], inventory, noXpUse, [], [], noXpIncome);

            expect(result.neededXp).toBe(0);
        });

        it('excluded goal does not consume held xp books that active goals need', () => {
            const inactiveGoalId = 'goal-inactive-xp-books';
            const activeGoalId = 'goal-active-xp-books';

            const inactiveEstimate = makeGoalEstimate(inactiveGoalId, false, {
                xpEstimate: {
                    books: 3,
                    bookRarity: Rarity.Legendary,
                    gold: 0,
                    currentLevel: 5,
                    targetLevel: 10,
                    xpLeft: 30_000,
                },
            });
            const activeEstimate = makeGoalEstimate(activeGoalId, true, {
                xpEstimate: {
                    books: 2,
                    bookRarity: Rarity.Legendary,
                    gold: 0,
                    currentLevel: 10,
                    targetLevel: 15,
                    xpLeft: 20_000,
                },
            });

            const goals = [
                makePersonalGoal(inactiveGoalId, PersonalGoalType.UpgradeRank, 1, false),
                makePersonalGoal(activeGoalId, PersonalGoalType.UpgradeRank, 2, true),
            ];

            // Give inventory exactly enough books to cover the active goal (20 000 XP)
            const inventory = makeEmptyInventory();
            inventory.xpBooks[Rarity.Legendary] = 2; // 2 × 10 000 = 20 000 XP

            const xpUseWithLegendary: XpUseState = { ...noXpUse, useLegendary: true };

            const result = GoalsService.adjustGoalEstimates(
                goals,
                [inactiveEstimate, activeEstimate],
                inventory,
                xpUseWithLegendary,
                [],
                [],
                noXpIncome
            );

            // The inactive goal must NOT consume the held books — the active goal should be fully covered
            expect(result.neededXp).toBe(0);
        });
    });

    describe('included goal with xpEstimate', () => {
        it('adds xpLeft to neededXp', () => {
            const goalId = 'goal-active-xp';
            const estimate = makeGoalEstimate(goalId, true, {
                xpEstimate: {
                    books: 5,
                    bookRarity: Rarity.Legendary,
                    gold: 0,
                    currentLevel: 10,
                    targetLevel: 20,
                    xpLeft: 50_000,
                },
            });

            const goal = makePersonalGoal(goalId, PersonalGoalType.UpgradeRank, 1, true);
            const inventory = makeEmptyInventory();

            const result = GoalsService.adjustGoalEstimates([goal], [estimate], inventory, noXpUse, [], [], noXpIncome);

            expect(result.neededXp).toBe(50_000);
        });
    });
});
