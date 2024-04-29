import { GoalsService } from 'src/v2/features/goals/goals.service';
import { CampaignsLocationsUsage, PersonalGoalType, Rank, Rarity, RarityStars } from 'src/models/enums';
import { ICharacter2, IPersonalGoal } from 'src/models/interfaces';

describe('Goal service', () => {
    describe('convertToTypedGoal', () => {
        it('should convert to Upgrade rank object', () => {
            const characterMock: ICharacter2 = {
                name: 'Character',
                icon: 'path',
                rank: Rank.Bronze1,
                upgrades: ['item1', 'item2'],
                level: 51,
                xp: 124,
                rarity: Rarity.Rare,
            } as ICharacter2;

            const goalMock: IPersonalGoal = {
                id: '124124',
                character: 'Character',
                type: PersonalGoalType.UpgradeRank,
                priority: 1,
                dailyRaids: false,
                notes: '1fasfqwf',
                targetRank: Rank.Silver1,
                rankPoint5: true,
            };

            const result = GoalsService.convertToTypedGoal(goalMock, characterMock);

            expect(result).toEqual({
                priority: goalMock.priority,
                goalId: goalMock.id,
                include: goalMock.dailyRaids,
                characterName: characterMock.name,
                characterIcon: characterMock.icon,
                notes: goalMock.notes,
                rankStart: characterMock.rank,
                rankEnd: goalMock.targetRank,
                rankPoint5: goalMock.rankPoint5,
                appliedUpgrades: characterMock.upgrades,
                level: characterMock.level,
                xp: characterMock.xp,
                rarity: characterMock.rarity,
                type: PersonalGoalType.UpgradeRank,
                upgradesRarity: [],
            });
        });

        it('should convert to Unlock object', () => {
            const characterMock: ICharacter2 = {
                name: 'Character',
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
                notes: '1fasfqwf',
            };

            const result = GoalsService.convertToTypedGoal(goalMock, characterMock);

            expect(result).toEqual({
                priority: goalMock.priority,
                goalId: goalMock.id,
                include: goalMock.dailyRaids,
                characterName: characterMock.name,
                characterIcon: characterMock.icon,
                notes: goalMock.notes,
                shards: characterMock.shards,
                rarity: characterMock.rarity,
                rank: characterMock.rank,
                campaignsUsage: CampaignsLocationsUsage.LeastEnergy,
                type: PersonalGoalType.Unlock,
            });
        });

        it('should convert to Ascend object', () => {
            const characterMock: ICharacter2 = {
                name: 'Character',
                icon: 'path',
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
                notes: '1fasfqwf',
                targetRarity: Rarity.Legendary,
            };

            const result = GoalsService.convertToTypedGoal(goalMock, characterMock);

            expect(result).toEqual({
                priority: goalMock.priority,
                goalId: goalMock.id,
                include: goalMock.dailyRaids,
                characterName: characterMock.name,
                characterIcon: characterMock.icon,
                notes: goalMock.notes,
                rarityStart: characterMock.rarity,
                rarityEnd: goalMock.targetRarity,
                shards: characterMock.shards,
                starsStart: characterMock.stars,
                starsEnd: RarityStars.RedThreeStars,
                onslaughtShards: 0,
                campaignsUsage: CampaignsLocationsUsage.LeastEnergy,
                type: PersonalGoalType.Ascend,
            });
        });
    });
});
