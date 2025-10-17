﻿import { describe, it, expect } from 'vitest';

import { CampaignsLocationsUsage, PersonalGoalType } from 'src/models/enums';
import { IPersonalGoal } from 'src/models/interfaces';

import { Alliance, Faction, Rank, Rarity, RarityStars, UnitType } from '@/fsd/5-shared/model';

import { ICharacter2 } from '@/fsd/4-entities/character';

import {
    ICharacterAscendGoal,
    ICharacterUnlockGoal,
    ICharacterUpgradeRankGoal,
} from 'src/v2/features/goals/goals.models';
import { GoalsService } from 'src/v2/features/goals/goals.service';

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
                targetRank: Rank.Silver1,
                rankPoint5: true,
            };

            const expectedResult: ICharacterUpgradeRankGoal = {
                priority: goalMock.priority,
                goalId: goalMock.id,
                include: goalMock.dailyRaids,
                unitId: characterMock.snowprintId!,
                unitAlliance: characterMock.alliance,
                unitName: characterMock.shortName,
                unitIcon: characterMock.icon,
                unitRoundIcon: characterMock.roundIcon,
                notes: goalMock.notes!,
                rankStart: characterMock.rank,
                rankEnd: goalMock.targetRank!,
                rankPoint5: goalMock.rankPoint5!,
                appliedUpgrades: characterMock.upgrades,
                level: characterMock.level,
                xp: characterMock.xp,
                rarity: characterMock.rarity,
                type: PersonalGoalType.UpgradeRank,
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
                faction: Faction.Thousand_Sons,
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
                unitId: characterMock.snowprintId!,
                unitAlliance: characterMock.alliance,
                unitName: characterMock.shortName,
                unitIcon: characterMock.icon,
                unitRoundIcon: characterMock.roundIcon,
                faction: characterMock.faction,
                notes: goalMock.notes!,
                shards: characterMock.shards,
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
                unitId: characterMock.snowprintId!,
                unitAlliance: characterMock.alliance,
                unitName: characterMock.shortName,
                unitIcon: characterMock.icon,
                unitRoundIcon: characterMock.roundIcon,
                notes: goalMock.notes!,
                rarityStart: characterMock.rarity,
                rarityEnd: goalMock.targetRarity!,
                shards: characterMock.shards,
                starsStart: characterMock.stars,
                starsEnd: RarityStars.RedThreeStars,
                onslaughtShards: 1,
                campaignsUsage: CampaignsLocationsUsage.LeastEnergy,
                type: PersonalGoalType.Ascend,
            };

            const result = GoalsService.convertToTypedGoal(goalMock, characterMock);

            expect(result).toEqual(expectedResult);
        });
    });
});
