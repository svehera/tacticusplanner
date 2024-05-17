import {
    CharacterRaidGoalSelect,
    ICharacterAscendGoal,
    ICharacterRaidGoalSelectBase,
    ICharacterUnlockGoal,
    ICharacterUpgradeRankGoal,
} from 'src/v2/features/goals/goals.models';
import { ICharacter2, IPersonalGoal } from 'src/models/interfaces';
import { rarityToStars } from 'src/models/constants';
import { CampaignsLocationsUsage, PersonalGoalType, Rank, Rarity } from 'src/models/enums';
import { useMemo } from 'react';

export class GoalsService {
    static prepareGoals(
        goals: IPersonalGoal[],
        characters: ICharacter2[]
    ): {
        allGoals: CharacterRaidGoalSelect[];
        shardsGoals: Array<ICharacterUnlockGoal | ICharacterAscendGoal>;
        upgradeRankGoals: Array<ICharacterUpgradeRankGoal>;
    } {
        const allGoals = goals
            .map(g => {
                const relatedCharacter = characters.find(x => x.name === g.character);
                if (
                    ![PersonalGoalType.UpgradeRank, PersonalGoalType.Ascend, PersonalGoalType.Unlock].includes(g.type)
                ) {
                    return null;
                }
                return this.convertToTypedGoal(g, relatedCharacter);
            })
            .filter(g => !!g) as CharacterRaidGoalSelect[];

        const selectedGoals = allGoals.filter(x => x.include);

        const shardsGoals = selectedGoals.filter(x =>
            [PersonalGoalType.Ascend, PersonalGoalType.Unlock].includes(x.type)
        ) as Array<ICharacterUnlockGoal | ICharacterAscendGoal>;

        const upgradeRankGoals = selectedGoals.filter(x =>
            [PersonalGoalType.UpgradeRank].includes(x.type)
        ) as Array<ICharacterUpgradeRankGoal>;

        return {
            allGoals,
            shardsGoals,
            upgradeRankGoals,
        };
    }
    static convertToTypedGoal(g: IPersonalGoal, relatedCharacter?: ICharacter2): CharacterRaidGoalSelect | null {
        if (!relatedCharacter) {
            return null;
        }
        const base: ICharacterRaidGoalSelectBase = {
            priority: g.priority,
            goalId: g.id,
            include: g.dailyRaids,
            characterName: relatedCharacter.name,
            characterIcon: relatedCharacter.icon,
            notes: g.notes ?? '',
        };

        if (g.type === PersonalGoalType.Ascend) {
            const result: ICharacterAscendGoal = {
                type: PersonalGoalType.Ascend,
                rarityStart: relatedCharacter.rarity,
                rarityEnd: g.targetRarity!,
                shards: relatedCharacter.shards,
                starsStart: relatedCharacter.stars,
                starsEnd: g.targetStars ?? rarityToStars[g.targetRarity!],
                onslaughtShards: g.shardsPerToken ?? 1,
                campaignsUsage: g.campaignsUsage ?? CampaignsLocationsUsage.LeastEnergy,
                ...base,
            };
            return result;
        }

        if (g.type === PersonalGoalType.Unlock) {
            const result: ICharacterUnlockGoal = {
                type: PersonalGoalType.Unlock,

                shards: relatedCharacter.shards,
                rarity: relatedCharacter.rarity,
                rank: relatedCharacter.rank,
                faction: relatedCharacter.faction,
                campaignsUsage: g.campaignsUsage ?? CampaignsLocationsUsage.LeastEnergy,
                ...base,
            };
            return result;
        }

        if (g.type === PersonalGoalType.UpgradeRank) {
            const result: ICharacterUpgradeRankGoal = {
                type: PersonalGoalType.UpgradeRank,
                rankStart: relatedCharacter.rank,
                rankEnd: g.targetRank!,
                rankPoint5: g.rankPoint5!,
                upgradesRarity: g.upgradesRarity ?? [],
                appliedUpgrades: relatedCharacter.upgrades,
                level: relatedCharacter.level,
                xp: relatedCharacter.xp,
                rarity: relatedCharacter.rarity,
                ...base,
            };
            return result;
        }
        return null;
    }

    static convertToGenericGoal(goal: CharacterRaidGoalSelect): IPersonalGoal | null {
        const base: IPersonalGoal = {
            id: goal.goalId,
            type: goal.type,
            priority: goal.priority,
            dailyRaids: goal.include,
            character: goal.characterName,
            notes: goal.notes,
        };
        switch (goal.type) {
            case PersonalGoalType.Unlock: {
                return {
                    ...base,
                    campaignsUsage: goal.campaignsUsage,
                };
            }
            case PersonalGoalType.UpgradeRank: {
                return {
                    ...base,
                    targetRank: goal.rankEnd,
                    rankPoint5: goal.rankPoint5,
                    upgradesRarity: goal.upgradesRarity,
                };
            }
            case PersonalGoalType.Ascend: {
                return {
                    ...base,
                    targetRarity: goal.rarityEnd,
                    targetStars: goal.starsEnd,
                    campaignsUsage: goal.campaignsUsage,
                    shardsPerToken: goal.onslaughtShards,
                };
            }
            default: {
                return null;
            }
        }
    }
    static isGoalCompleted(goal: CharacterRaidGoalSelect): boolean {
        if (goal.type == PersonalGoalType.UpgradeRank) {
            return (
                (!goal.rankPoint5 && goal.rankStart >= goal.rankEnd) ||
                (goal.rankPoint5 &&
                    (goal.rankStart > goal.rankEnd ||
                        (goal.rankStart === goal.rankEnd && goal.appliedUpgrades.length >= 3)))
            );
        }

        if (goal.type == PersonalGoalType.Ascend) {
            return goal.rarityStart >= goal.rarityEnd && goal.starsStart >= goal.starsEnd;
        }

        if (goal.type == PersonalGoalType.Unlock) {
            return goal.rank > Rank.Locked;
        }

        return false;
    }
}
