import {
    CharacterRaidGoalSelect,
    ICharacterAscendGoal,
    ICharacterRaidGoalSelectBase,
    ICharacterUnlockGoal,
    ICharacterUpgradeAbilities,
    ICharacterUpgradeMow,
    ICharacterUpgradeRankGoal,
} from 'src/v2/features/goals/goals.models';
import { IPersonalGoal } from 'src/models/interfaces';
import { rarityToStars } from 'src/models/constants';
import { CampaignsLocationsUsage, PersonalGoalType, Rank } from 'src/models/enums';
import { IUnit } from 'src/v2/features/characters/characters.models';
import { isCharacter, isMow } from 'src/v2/features/characters/units.functions';

export class GoalsService {
    static prepareGoals(
        goals: IPersonalGoal[],
        characters: IUnit[],
        onlySelected: boolean
    ): {
        allGoals: CharacterRaidGoalSelect[];
        shardsGoals: Array<ICharacterUnlockGoal | ICharacterAscendGoal>;
        upgradeRankOrMowGoals: Array<ICharacterUpgradeRankGoal | ICharacterUpgradeMow>;
        upgradeAbilities: Array<ICharacterUpgradeAbilities>;
    } {
        const allGoals = goals
            .map(g => {
                const relatedCharacter = characters.find(x => x.id === g.character);
                if (
                    ![
                        PersonalGoalType.UpgradeRank,
                        PersonalGoalType.Ascend,
                        PersonalGoalType.Unlock,
                        PersonalGoalType.UpgradeMow,
                        PersonalGoalType.UpgradeAbilities,
                    ].includes(g.type) ||
                    !relatedCharacter
                ) {
                    return null;
                }
                return this.convertToTypedGoal(g, relatedCharacter);
            })
            .filter(g => !!g) as CharacterRaidGoalSelect[];

        const selectedGoals = onlySelected ? allGoals.filter(x => x.include) : allGoals;

        const shardsGoals = selectedGoals.filter(x =>
            [PersonalGoalType.Ascend, PersonalGoalType.Unlock].includes(x.type)
        ) as Array<ICharacterUnlockGoal | ICharacterAscendGoal>;

        const upgradeRankOrMowGoals = selectedGoals.filter(x =>
            [PersonalGoalType.UpgradeRank, PersonalGoalType.UpgradeMow].includes(x.type)
        ) as Array<ICharacterUpgradeRankGoal>;

        const upgradeAbilities = selectedGoals.filter(x =>
            [PersonalGoalType.UpgradeAbilities].includes(x.type)
        ) as Array<ICharacterUpgradeAbilities>;

        return {
            allGoals,
            shardsGoals,
            upgradeRankOrMowGoals,
            upgradeAbilities,
        };
    }
    static convertToTypedGoal(g: IPersonalGoal, unit?: IUnit): CharacterRaidGoalSelect | null {
        if (!unit) {
            return null;
        }

        if (isMow(unit)) {
            const base: ICharacterRaidGoalSelectBase = {
                priority: g.priority,
                goalId: g.id,
                include: g.dailyRaids,
                unitId: unit.id,
                unitName: unit.name,
                unitIcon: unit.badgeIcon,
                notes: g.notes ?? '',
                unitAlliance: unit.alliance,
            };

            if (g.type === PersonalGoalType.UpgradeMow) {
                const result: ICharacterUpgradeMow = {
                    type: PersonalGoalType.UpgradeMow,
                    primaryStart: unit.primaryAbilityLevel,
                    primaryEnd: g.firstAbilityLevel ?? unit.primaryAbilityLevel,
                    secondaryStart: unit.secondaryAbilityLevel,
                    secondaryEnd: g.secondAbilityLevel ?? unit.secondaryAbilityLevel,
                    upgradesRarity: g.upgradesRarity ?? [],
                    ...base,
                };
                return result;
            }
        }

        if (isCharacter(unit)) {
            const base: ICharacterRaidGoalSelectBase = {
                priority: g.priority,
                goalId: g.id,
                include: g.dailyRaids,
                unitId: unit.id,
                unitName: unit.name,
                unitIcon: unit.icon,
                unitAlliance: unit.alliance,
                notes: g.notes ?? '',
            };

            if (g.type === PersonalGoalType.Ascend) {
                const result: ICharacterAscendGoal = {
                    type: PersonalGoalType.Ascend,
                    rarityStart: unit.rarity,
                    rarityEnd: g.targetRarity!,
                    shards: unit.shards,
                    starsStart: unit.stars,
                    starsEnd: g.targetStars ?? rarityToStars[g.targetRarity!],
                    onslaughtShards: g.shardsPerToken ?? 1,
                    campaignsUsage: g.campaignsUsage ?? CampaignsLocationsUsage.LeastEnergy,
                    ...base,
                };
                return result;
            }

            if (g.type === PersonalGoalType.UpgradeAbilities) {
                const result: ICharacterUpgradeAbilities = {
                    type: PersonalGoalType.UpgradeAbilities,
                    level: unit.level,
                    xp: unit.xp,
                    activeStart: unit.activeAbilityLevel,
                    activeEnd: g.firstAbilityLevel ?? unit.activeAbilityLevel,
                    passiveStart: unit.passiveAbilityLevel,
                    passiveEnd: g.secondAbilityLevel ?? unit.passiveAbilityLevel,
                    ...base,
                };
                return result;
            }

            if (g.type === PersonalGoalType.Unlock) {
                const result: ICharacterUnlockGoal = {
                    type: PersonalGoalType.Unlock,

                    shards: unit.shards,
                    rarity: unit.rarity,
                    rank: unit.rank,
                    faction: unit.faction,
                    campaignsUsage: g.campaignsUsage ?? CampaignsLocationsUsage.LeastEnergy,
                    ...base,
                };
                return result;
            }

            if (g.type === PersonalGoalType.UpgradeRank) {
                const result: ICharacterUpgradeRankGoal = {
                    type: PersonalGoalType.UpgradeRank,
                    rankStart: unit.rank,
                    rankEnd: g.targetRank!,
                    rankPoint5: g.rankPoint5!,
                    upgradesRarity: g.upgradesRarity ?? [],
                    appliedUpgrades: unit.upgrades,
                    level: unit.level,
                    xp: unit.xp,
                    rarity: unit.rarity,
                    ...base,
                };
                return result;
            }
        }

        return null;
    }

    static convertToGenericGoal(goal: CharacterRaidGoalSelect): IPersonalGoal | null {
        const base: IPersonalGoal = {
            id: goal.goalId,
            type: goal.type,
            priority: goal.priority,
            dailyRaids: goal.include,
            character: goal.unitId,
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
            case PersonalGoalType.UpgradeMow: {
                return {
                    ...base,
                    firstAbilityLevel: goal.primaryEnd,
                    secondAbilityLevel: goal.secondaryEnd,
                    upgradesRarity: goal.upgradesRarity,
                };
            }
            case PersonalGoalType.UpgradeAbilities: {
                return {
                    ...base,
                    firstAbilityLevel: goal.activeEnd,
                    secondAbilityLevel: goal.passiveEnd,
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

        if (goal.type == PersonalGoalType.UpgradeMow) {
            return goal.primaryStart >= goal.primaryEnd && goal.secondaryStart >= goal.secondaryEnd;
        }

        if (goal.type == PersonalGoalType.UpgradeAbilities) {
            return goal.activeStart >= goal.activeEnd && goal.passiveStart >= goal.passiveEnd;
        }

        if (goal.type == PersonalGoalType.Unlock) {
            return goal.rank > Rank.Locked;
        }

        return false;
    }
}
