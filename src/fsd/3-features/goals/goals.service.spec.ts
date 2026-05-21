import { describe, it, expect } from 'vitest';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { CampaignsLocationsUsage, PersonalGoalType } from 'src/models/enums';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { IPersonalGoal } from 'src/models/interfaces';

import { Alliance, Rank, Rarity, RarityStars, UnitType } from '@/fsd/5-shared/model';

import { ICharacter2 } from '@/fsd/4-entities/character';

import {
    ICharacterAscendGoal,
    ICharacterUnlockGoal,
    ICharacterUpgradeRankGoal,
    ICharacterUpgradeMow,
    IEstimatedUpgrades,
    // eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
} from '@/fsd/3-features/goals/goals.models';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { GoalsService } from '@/fsd/3-features/goals/goals.service';

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
                onslaughtSector: undefined,
                onslaughtTier: undefined,
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
