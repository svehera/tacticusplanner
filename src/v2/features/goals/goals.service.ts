import { cloneDeep, orderBy } from 'lodash';

import { rarityToStars } from 'src/models/constants';
import { CampaignsLocationsUsage, PersonalGoalType } from 'src/models/enums';
import { IInventory, IPersonalGoal } from 'src/models/interfaces';

import { Alliance, Rank, Rarity } from '@/fsd/5-shared/model';

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

import { XpIncomeState } from '@/fsd/1-pages/input-xp-income';

export interface RevisedGoals {
    goalEstimates: IGoalEstimate[];
    neededBadges: Record<Alliance, Record<Rarity, number>>;
    neededForgeBadges: Record<Rarity, number>;
    neededComponents: Record<Alliance, number>;
    neededXp: number;
}

export interface IXpLevel {
    currentLevel: number;
    xpAtLevel: number;
    xpFromPriorGoalApplied?: boolean;
}

interface XpBookAccrual {
    accruedDate: Date;
    booksAccrued: number;
}

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

    private static daysDifference(dateA: Date, dateB: Date): number {
        const msPerDay = 1000 * 60 * 60 * 24;
        return (dateA.getTime() - dateB.getTime()) / msPerDay;
    }

    private static addDays(date: Date, days: number): Date {
        const msPerDay = 1000 * 60 * 60 * 24;
        return new Date(date.getTime() + days * msPerDay);
    }

    /**
     * Calculates the new XpBookAccrual state after using books for a single goal.
     * The process determines the goal's final completion date ONLY based on the book requirement
     * and calculates the resulting surplus/deficit.
     *
     * @param goal The GoalEstimate being completed.
     * @param currentAccrual The current balance of books and the date it was last calculated.
     * @param booksPerDay The constant daily income of books (floating point).
     * @returns A new XpBookAccrual object reflecting the state after the goal is completed.
     */
    private static processGoalAccrual(
        booksNeeded: number,
        currentAccrual: XpBookAccrual,
        booksPerDay: number
    ): XpBookAccrual {
        const netBooksNeeded = booksNeeded - currentAccrual.booksAccrued;

        let bookCompletionDate: Date;

        if (netBooksNeeded <= 0) {
            bookCompletionDate = currentAccrual.accruedDate;
        } else {
            const daysToAccrueFractional = netBooksNeeded / booksPerDay;
            const daysToWaitWhole = Math.ceil(daysToAccrueFractional);
            bookCompletionDate = this.addDays(currentAccrual.accruedDate, daysToWaitWhole);
        }
        const totalDaysElapsed = this.daysDifference(bookCompletionDate, currentAccrual.accruedDate);
        const totalAccruedBooks = currentAccrual.booksAccrued + totalDaysElapsed * booksPerDay;
        const newBooksAccrued = totalAccruedBooks - booksNeeded;
        return {
            accruedDate: bookCompletionDate,
            booksAccrued: newBooksAccrued,
        };
    }

    /**
     * Computes the total number of remaining resources needed AND adjusts all goals to use as
     * many possible badges from our existing inventory.
     */
    public static adjustGoalEstimates(
        goals: IPersonalGoal[],
        goalsEstimate: IGoalEstimate[],
        inventory: IInventory,
        upgradeRankOrMowGoals: (ICharacterUpgradeRankGoal | ICharacterUpgradeMow)[],
        xpIncomeState: XpIncomeState
    ): RevisedGoals {
        const createRarityRecord = (): Record<Rarity, number> => ({
            [Rarity.Common]: 0,
            [Rarity.Uncommon]: 0,
            [Rarity.Rare]: 0,
            [Rarity.Epic]: 0,
            [Rarity.Legendary]: 0,
            [Rarity.Mythic]: 0,
        });

        const heldBooks = { ...inventory.xpBooks };

        const neededBadges: Record<Alliance, Record<Rarity, number>> = {
            [Alliance.Chaos]: createRarityRecord(),
            [Alliance.Imperial]: createRarityRecord(),
            [Alliance.Xenos]: createRarityRecord(),
        };

        const neededForgeBadges: Record<Rarity, number> = createRarityRecord();
        const neededComponents: Record<Alliance, number> = {
            [Alliance.Chaos]: 0,
            [Alliance.Imperial]: 0,
            [Alliance.Xenos]: 0,
        };
        const heldBadges = cloneDeep(inventory.abilityBadges);
        const heldForgeBadges = cloneDeep(inventory.forgeBadges);
        const heldComponents = cloneDeep(inventory.components);

        const newGoalsEstimates: IGoalEstimate[] = cloneDeep(goalsEstimate);
        const goalsByPrio = orderBy(
            goals.map(x => ({ id: x.id, priority: x.priority })),
            ['priority'],
            ['asc']
        );
        let totalXpNeeded = 0;
        const today = new Date();
        let xpBooksAccrual = { accruedDate: today, booksAccrued: 0 } as XpBookAccrual;
        for (const goalIdAndPriority of goalsByPrio) {
            const goal = newGoalsEstimates.find(x => x.goalId === goalIdAndPriority.id);

            if (goal === undefined) {
                console.error('could not find goal estimate for goal id ' + goalIdAndPriority.id);
                continue;
            }
            if (goal.xpEstimate || goal.xpEstimateAbilities) {
                let xpNeeded = goal.xpEstimate?.xpLeft ?? goal.xpEstimateAbilities?.xpLeft ?? 0;
                while (xpNeeded >= 62500 && heldBooks[Rarity.Mythic] > 0) {
                    xpNeeded -= 62500;
                    heldBooks[Rarity.Mythic] -= 1;
                }
                while (xpNeeded >= 12500 && heldBooks[Rarity.Legendary] > 0) {
                    xpNeeded -= 12500;
                    heldBooks[Rarity.Legendary] -= 1;
                }
                while (xpNeeded >= 2500 && heldBooks[Rarity.Epic] > 0) {
                    xpNeeded -= 2500;
                    heldBooks[Rarity.Epic] -= 1;
                }
                while (xpNeeded >= 500 && heldBooks[Rarity.Rare] > 0) {
                    xpNeeded -= 500;
                    heldBooks[Rarity.Rare] -= 1;
                }
                while (xpNeeded >= 100 && heldBooks[Rarity.Uncommon] > 0) {
                    xpNeeded -= 100;
                    heldBooks[Rarity.Uncommon] -= 1;
                }
                while (xpNeeded >= 20 && heldBooks[Rarity.Common] > 0) {
                    xpNeeded -= 20;
                    heldBooks[Rarity.Common] -= 1;
                }
                if (xpNeeded > 0) {
                    while (xpNeeded > 0 && heldBooks[Rarity.Common] > 0) {
                        xpNeeded = Math.max(0, xpNeeded - 20);
                        heldBooks[Rarity.Common] -= 1;
                    }
                    while (xpNeeded > 0 && heldBooks[Rarity.Uncommon] > 0) {
                        xpNeeded = Math.max(0, xpNeeded - 100);
                        heldBooks[Rarity.Uncommon] -= 1;
                    }
                    while (xpNeeded > 0 && heldBooks[Rarity.Rare] > 0) {
                        xpNeeded = Math.max(0, xpNeeded - 500);
                        heldBooks[Rarity.Rare] -= 1;
                    }
                    while (xpNeeded > 0 && heldBooks[Rarity.Epic] > 0) {
                        xpNeeded = Math.max(0, xpNeeded - 2500);
                        heldBooks[Rarity.Epic] -= 1;
                    }
                    while (xpNeeded > 0 && heldBooks[Rarity.Legendary] > 0) {
                        xpNeeded = Math.max(0, xpNeeded - 12500);
                        heldBooks[Rarity.Legendary] -= 1;
                    }
                    while (xpNeeded > 0 && heldBooks[Rarity.Mythic] > 0) {
                        xpNeeded = Math.max(0, xpNeeded - 62500);
                        heldBooks[Rarity.Mythic] -= 1;
                    }
                }
                totalXpNeeded += xpNeeded;
                goal.xpBooksTotal = Math.floor(xpNeeded / 12500);
                if (totalXpNeeded === 0) {
                    goal.xpEstimate = undefined;
                    goal.xpEstimateAbilities = undefined;
                    continue;
                } else {
                    if (goal.xpEstimate) {
                        goal.xpEstimate.legendaryBooks = Math.floor(xpNeeded / 12500);
                        goal.xpEstimate.xpLeft = xpNeeded;
                        if (xpIncomeState.manualBooksPerDay > 0) {
                            const newAccrual = this.processGoalAccrual(
                                Math.ceil(xpNeeded / 12500),
                                xpBooksAccrual,
                                xpIncomeState.manualBooksPerDay
                            );
                            goal.xpDaysLeft = Math.ceil(
                                (newAccrual.accruedDate.getTime() - today.getTime()) / 86400000
                            );
                            xpBooksAccrual = newAccrual;
                        }
                    } else {
                        goal.xpEstimateAbilities!.legendaryBooks = Math.floor(xpNeeded / 12500);
                        goal.xpEstimateAbilities!.xpLeft = xpNeeded;
                        if (xpIncomeState.manualBooksPerDay > 0) {
                            const newAccrual = this.processGoalAccrual(
                                Math.ceil(xpNeeded / 12500),
                                xpBooksAccrual,
                                xpIncomeState.manualBooksPerDay
                            );
                            goal.xpDaysLeft = Math.ceil(
                                (newAccrual.accruedDate.getTime() - today.getTime()) / 86400000
                            );
                            xpBooksAccrual = newAccrual;
                        }
                    }
                }
            }

            if (goal.abilitiesEstimate === undefined && goal.mowEstimate === undefined) continue;
            const badges = goal.mowEstimate?.badges ?? goal.abilitiesEstimate!.badges;
            for (const [rarityStr, count] of Object.entries(badges)) {
                const rarity = Number(rarityStr) as Rarity;
                const alliance =
                    goal.abilitiesEstimate?.alliance ??
                    GoalsService.getGoalAlliance(goal.goalId, upgradeRankOrMowGoals)!;
                if (!neededBadges[alliance][rarity]) {
                    neededBadges[alliance][rarity] = 0;
                }
                if (heldBadges[alliance][rarity]) {
                    const toRemove = Math.min(heldBadges[alliance][rarity], count);
                    heldBadges[alliance][rarity] -= toRemove;
                    neededBadges[alliance][rarity] += count - toRemove;
                    badges[rarity] = count - toRemove;
                } else {
                    neededBadges[alliance][rarity] += count;
                }
            }
            if (goal.mowEstimate === undefined) continue;
            const forgeBadges = goal.mowEstimate.forgeBadges;
            forgeBadges.entries().forEach(([rarity, count]) => {
                const toRemove = Math.min(count, heldForgeBadges[rarity] ?? 0);
                goal.mowEstimate!.forgeBadges.set(rarity, count - toRemove);
                heldForgeBadges[rarity] = (heldForgeBadges[rarity] ?? 0) - toRemove;
                neededForgeBadges[rarity] += goal.mowEstimate!.forgeBadges.get(rarity) ?? 0;
            });
            const components = goal.mowEstimate.components;
            const alliance = GoalsService.getGoalAlliance(goal.goalId, upgradeRankOrMowGoals)!;
            const held = heldComponents[alliance] ?? 0;
            const toRemove = Math.min(components, held);
            goal.mowEstimate!.components = components - toRemove;
            heldComponents[alliance] -= toRemove;
            neededComponents[alliance] = (neededComponents[alliance] ?? 0) + goal.mowEstimate!.components;
        }

        return {
            neededBadges,
            neededForgeBadges,
            neededComponents,
            goalEstimates: newGoalsEstimates,
            neededXp: totalXpNeeded,
        };
    }
}
