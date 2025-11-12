import { rarityToStars } from 'src/models/constants';
import { CampaignsLocationsUsage, PersonalGoalType } from 'src/models/enums';
import { IPersonalGoal } from 'src/models/interfaces';

import { Alliance, Rank } from '@/fsd/5-shared/model';

import { CharactersService } from '@/fsd/4-entities/character';
import { IMow2, MowsService } from '@/fsd/4-entities/mow';
import { isCharacter, isMow } from '@/fsd/4-entities/unit/units.functions';

import { IUnit } from 'src/v2/features/characters/characters.models';
import {
    CharacterRaidGoalSelect,
    ICharacterAscendGoal,
    ICharacterRaidGoalSelectBase,
    ICharacterUnlockGoal,
    ICharacterUpgradeAbilities,
    ICharacterUpgradeMow,
    ICharacterUpgradeRankGoal,
    IGoalEstimate,
} from 'src/v2/features/goals/goals.models';

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
                const resolvedChar = CharactersService.resolveCharacter(g.character);
                const resolvedMow =
                    MowsService.resolveToStatic(g.character) ?? MowsService.resolveOldIdToStatic(g.character);
                const relatedCharacter = characters.find(
                    x =>
                        x.snowprintId === (resolvedChar?.snowprintId ?? '') ||
                        x.snowprintId === (resolvedMow?.snowprintId ?? '')
                );
                if (
                    ![
                        PersonalGoalType.UpgradeRank,
                        PersonalGoalType.Ascend,
                        PersonalGoalType.Unlock,
                        PersonalGoalType.MowAbilities,
                        PersonalGoalType.CharacterAbilities,
                    ].includes(g.type) ||
                    !relatedCharacter
                ) {
                    console.warn('Goal not applicable for character or mow:', g);
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
            [PersonalGoalType.UpgradeRank, PersonalGoalType.MowAbilities].includes(x.type)
        ) as Array<ICharacterUpgradeRankGoal>;

        const upgradeAbilities = selectedGoals.filter(x =>
            [PersonalGoalType.CharacterAbilities].includes(x.type)
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
                unitId: unit.snowprintId!,
                unitName: unit.name,
                unitIcon: unit.icon,
                unitRoundIcon: unit.roundIcon,
                notes: g.notes ?? '',
                unitAlliance: unit.alliance as Alliance,
            };

            if (g.type === PersonalGoalType.MowAbilities) {
                const mow = unit as IMow2;
                const result: ICharacterUpgradeMow = {
                    type: PersonalGoalType.MowAbilities,
                    primaryStart: mow.primaryAbilityLevel,
                    primaryEnd: g.firstAbilityLevel ?? mow.primaryAbilityLevel,
                    secondaryStart: mow.secondaryAbilityLevel,
                    secondaryEnd: g.secondAbilityLevel ?? mow.secondaryAbilityLevel,
                    upgradesRarity: g.upgradesRarity ?? [],
                    rarity: unit.rarity,
                    stars: unit.stars,
                    shards: unit.shards,
                    ...base,
                };
                return result;
            }

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
        }

        if (isCharacter(unit)) {
            const base: ICharacterRaidGoalSelectBase = {
                priority: g.priority,
                goalId: g.id,
                include: g.dailyRaids,
                unitId: unit.snowprintId!,
                unitName: unit.shortName,
                unitIcon: unit.icon,
                unitRoundIcon: unit.roundIcon,
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

            if (g.type === PersonalGoalType.CharacterAbilities) {
                const result: ICharacterUpgradeAbilities = {
                    type: PersonalGoalType.CharacterAbilities,
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
            case PersonalGoalType.MowAbilities: {
                return {
                    ...base,
                    firstAbilityLevel: goal.primaryEnd,
                    secondAbilityLevel: goal.secondaryEnd,
                    upgradesRarity: goal.upgradesRarity,
                };
            }
            case PersonalGoalType.CharacterAbilities: {
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
    static isGoalCompleted(goal: CharacterRaidGoalSelect, goalEstimate: IGoalEstimate): boolean {
        if (goal.type == PersonalGoalType.UpgradeRank) {
            return (
                (!goal.rankPoint5 && goal.rankStart >= goal.rankEnd) ||
                (goal.rankPoint5 &&
                    (goal.rankStart > goal.rankEnd ||
                        (goal.rankStart === goal.rankEnd &&
                            goal.appliedUpgrades.length >= 3 &&
                            goalEstimate.energyTotal <= 0)))
            );
        }

        if (goal.type == PersonalGoalType.Ascend) {
            return goal.rarityStart >= goal.rarityEnd && goal.starsStart >= goal.starsEnd;
        }

        if (goal.type == PersonalGoalType.MowAbilities) {
            return goal.primaryStart >= goal.primaryEnd && goal.secondaryStart >= goal.secondaryEnd;
        }

        if (goal.type == PersonalGoalType.CharacterAbilities) {
            return goal.activeStart >= goal.activeEnd && goal.passiveStart >= goal.passiveEnd;
        }

        if (goal.type == PersonalGoalType.Unlock) {
            return goal.rank > Rank.Locked;
        }

        return false;
    }

    public static getGoalAlliance(goalId: string, goals: CharacterRaidGoalSelect[]): Alliance | undefined {
        const goal = goals.find(g => g.goalId === goalId);
        return goal?.unitAlliance;
    }

    public static getGoalUnitName(goalId: string, goals: CharacterRaidGoalSelect[]): string | undefined {
        const goal = goals.find(g => g.goalId === goalId);
        return goal?.unitName;
    }
}
