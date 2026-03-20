/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
import { cloneDeep, orderBy } from 'lodash';

import { rankToLevel, rarityToStars } from 'src/models/constants';
import { CampaignsLocationsUsage, PersonalGoalType } from 'src/models/enums';
import { IInventory, IPersonalGoal } from 'src/models/interfaces';

import { Alliance, Rank, Rarity, XP_BOOK_VALUE, XP_BOOK_ORDER } from '@/fsd/5-shared/model';

import { CharactersService } from '@/fsd/4-entities/character';
import { ICharacter2 } from '@/fsd/4-entities/character/model';
import { IMow2, MowsService } from '@/fsd/4-entities/mow';
import { OrbAscensionCalculator } from '@/fsd/4-entities/unit/unit-ascension.service';
import { isCharacter, isMow } from '@/fsd/4-entities/unit/units.functions';

import { CharactersAbilitiesService } from '@/fsd/3-features/characters/characters-abilities.service';
import { CharactersXpService } from '@/fsd/3-features/characters/characters-xp.service';
import { IUnit } from '@/fsd/3-features/characters/characters.models';
import {
    CharacterRaidGoalSelect,
    ICharacterAscendGoal,
    ICharacterRaidGoalSelectBase,
    ICharacterUnlockGoal,
    ICharacterUpgradeAbilities,
    ICharacterUpgradeMow,
    ICharacterUpgradeRankGoal,
    IEstimatedUpgrades,
    IGoalEstimate,
} from '@/fsd/3-features/goals/goals.models';
import { UpgradesService } from '@/fsd/3-features/goals/upgrades.service';

import { XpUseState } from '@/fsd/1-pages/input-resources';
import { XpIncomeState } from '@/fsd/1-pages/input-xp-income';
import { MowLookupService } from '@/fsd/1-pages/learn-mow/mow-lookup.service';

interface RevisedGoals {
    goalEstimates: IGoalEstimate[];
    neededBadges: Record<Alliance, Record<Rarity, number>>;
    neededForgeBadges: Record<Rarity, number>;
    neededComponents: Record<Alliance, number>;
    neededXp: number;
    neededOrbs: Record<Alliance, Record<Rarity, number>>;
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
    private static currentCharacterXp(
        characterId: string,
        goals: (ICharacterUpgradeRankGoal | ICharacterUpgradeMow | ICharacterUpgradeAbilities)[],
        currentGoalPriority: number,
        characters: ICharacter2[]
    ): IXpLevel {
        const priorGoals = goals.filter(g => g.priority < currentGoalPriority && g.unitId === characterId);
        const character = characters.find(c => c.snowprintId! === characterId);
        const returnValue: IXpLevel = {
            currentLevel: Math.max(character?.level ?? 1, 1),
            xpAtLevel: character?.xp ?? 0,
        };
        for (const goal of priorGoals) {
            if (goal.type === PersonalGoalType.UpgradeRank) {
                const upgradeGoal = goal as ICharacterUpgradeRankGoal;
                const targetLevel = rankToLevel[(upgradeGoal.rankEnd ?? Rank.Stone2) as Rank];
                if (targetLevel > returnValue.currentLevel) {
                    returnValue.currentLevel = targetLevel;
                    returnValue.xpAtLevel = 0;
                    returnValue.xpFromPriorGoalApplied = true;
                }
            } else if (goal.type === PersonalGoalType.CharacterAbilities) {
                const abilityGoal = goal as ICharacterUpgradeAbilities;
                const targetLevel = Math.max(abilityGoal.activeEnd, abilityGoal.passiveEnd);
                if (targetLevel > returnValue.currentLevel) {
                    returnValue.currentLevel = targetLevel;
                    returnValue.xpAtLevel = 0;
                    returnValue.xpFromPriorGoalApplied = true;
                }
            }
        }

        return returnValue;
    }

    public static buildGoalEstimates(
        estimatedUpgradesTotal: IEstimatedUpgrades,
        shardsGoals: Array<ICharacterUnlockGoal | ICharacterAscendGoal>,
        upgradeRankOrMowGoals: Array<ICharacterUpgradeRankGoal | ICharacterUpgradeMow>,

        upgradeAbilities: Array<ICharacterUpgradeAbilities>,
        characters: ICharacter2[],
        isGoalPriority: boolean = false
    ): IGoalEstimate[] {
        const result: IGoalEstimate[] = [];

        for (const goal of [shardsGoals, upgradeRankOrMowGoals].flat()) {
            const estimate: IGoalEstimate = {
                goalId: goal.goalId,
                energyTotal: 0,
                daysTotal: 0,
                oTokensTotal: 0,
                daysLeft: 0,
                xpBooksTotal: 0,
            };
            for (const [index, day] of estimatedUpgradesTotal.upgradesRaids.entries()) {
                let raidedToday = false;
                for (const raid of day.raids) {
                    if (!raid.relatedGoals.includes(goal.goalId)) continue;
                    for (const location of raid.raidLocations) {
                        if (UpgradesService.isOnslaughtLocation(location)) {
                            estimate.oTokensTotal += location.raidsToPerform;
                        }
                    }
                    if (raid.raidLocations.some(location => location.raidsToPerform > 0)) {
                        raidedToday = true;
                    }
                    const totalRequired = Object.values(raid.countByGoalId ?? {}).reduce(
                        (sum, count) => sum + count,
                        0
                    );
                    const goalRequired = raid.countByGoalId?.[goal.goalId] ?? 0;
                    if (totalRequired > 0 && goalRequired > 0) {
                        estimate.energyTotal += Math.round(raid.energyTotal * (goalRequired / totalRequired));
                    } else {
                        estimate.energyTotal += Math.round(
                            raid.energyTotal / Math.max(1, raid.relatedCharacters.length)
                        );
                    }
                }
                if (raidedToday) {
                    ++estimate.daysTotal;
                    estimate.daysLeft = index + 1;
                }
            }
            if (goal.type === PersonalGoalType.UpgradeRank) {
                const targetLevel = rankToLevel[(goal.rankEnd ?? Rank.Stone2) as Rank];
                const currentXp = this.currentCharacterXp(
                    goal.unitId,
                    [...upgradeRankOrMowGoals, ...upgradeAbilities],
                    goal.priority,
                    characters
                );
                const xpEstimate = CharactersXpService.getLegendaryTomesCount(
                    currentXp.currentLevel,
                    currentXp.xpAtLevel,
                    targetLevel
                );
                if (xpEstimate) {
                    xpEstimate.xpFromPreviousGoalApplied = currentXp.xpFromPriorGoalApplied;
                    estimate.xpEstimate = xpEstimate;
                }
            }
            if (goal.type === PersonalGoalType.MowAbilities) {
                const mowMaterials = MowsService.getMaterialsList(goal.unitId, goal.unitName, goal.unitAlliance);

                estimate.mowEstimate = MowLookupService.getTotals([
                    ...mowMaterials.slice(goal.primaryStart - 1, goal.primaryEnd - 1),
                    ...mowMaterials.slice(goal.secondaryStart - 1, goal.secondaryEnd - 1),
                ]);
            }
            if (goal.type === PersonalGoalType.Ascend) {
                const ascendGoal = goal as ICharacterAscendGoal;
                const orbs = OrbAscensionCalculator.calculateOrbs(
                    ascendGoal.rarityStart,
                    ascendGoal.starsStart,
                    ascendGoal.rarityEnd,
                    ascendGoal.starsEnd
                );
                estimate.orbsEstimate = {
                    orbs: orbs,
                    alliance: ascendGoal.unitAlliance,
                };
            }
            estimate.included = goal.include;
            const blockedEntry = estimatedUpgradesTotal.blockedMaterials.find(m =>
                m.relatedGoals.includes(goal.goalId)
            );
            if (!blockedEntry) {
                estimate.blocked = false;
            } else if (!isGoalPriority) {
                estimate.blocked = true;
            } else {
                const available = blockedEntry.acquiredCount ?? 0;
                const allGoals = [...shardsGoals, ...upgradeRankOrMowGoals];
                const goalPriorityMap = new Map(allGoals.map(g => [g.goalId, g.priority]));

                const requiredForThisGoal = estimatedUpgradesTotal.characters.reduce((sum, unit) => {
                    if (unit.goalId !== goal.goalId) return sum;
                    return sum + (unit.baseUpgradesTotal[blockedEntry.id] ?? 0);
                }, 0);

                const requiredForHigher = estimatedUpgradesTotal.characters.reduce((sum, unit) => {
                    const pr = goalPriorityMap.get(unit.goalId);
                    if (pr === undefined) return sum;
                    if (pr < (goal.priority ?? Number.POSITIVE_INFINITY)) {
                        return sum + (unit.baseUpgradesTotal[blockedEntry.id] ?? 0);
                    }
                    return sum;
                }, 0);

                estimate.blocked = isGoalPriority && available < requiredForHigher + requiredForThisGoal;
            }
            estimate.completed =
                !estimate.blocked && estimate.included && estimate.oTokensTotal === 0 && estimate.energyTotal === 0;
            result.push(estimate);
        }

        if (upgradeAbilities.length > 0) {
            for (const goal of upgradeAbilities) {
                const targetLevel = Math.max(goal.activeEnd, goal.passiveEnd);
                const currentXp = this.currentCharacterXp(
                    goal.unitId,
                    [...upgradeRankOrMowGoals, ...upgradeAbilities],
                    goal.priority,
                    characters
                );
                const xpEstimate = CharactersXpService.getLegendaryTomesCount(
                    currentXp.currentLevel,
                    currentXp.xpAtLevel,
                    targetLevel
                );
                const activeAbility = CharactersAbilitiesService.getMaterials(goal.activeStart, goal.activeEnd);
                const passiveAbility = CharactersAbilitiesService.getMaterials(goal.passiveStart, goal.passiveEnd);

                const abilitiesEstimate = CharactersAbilitiesService.getTotals(
                    [...activeAbility, ...passiveAbility],
                    goal.unitAlliance
                );

                result.push({
                    goalId: goal.goalId,
                    abilitiesEstimate,
                    xpEstimateAbilities: xpEstimate!,
                    daysLeft: 0,
                    energyTotal: 0,
                    oTokensTotal: 0,
                    daysTotal: 0,
                    xpBooksTotal: 0,
                    included: goal.include,
                });
            }
        }

        return result;
    }

    static prepareGoals(
        goals: IPersonalGoal[],
        characters: IUnit[],
        onlySelected: boolean
    ): {
        allGoals: CharacterRaidGoalSelect[];
        shardsGoals: Array<ICharacterUnlockGoal | ICharacterAscendGoal>;
        upgradeRankOrMowGoals: Array<ICharacterUpgradeRankGoal | ICharacterUpgradeMow>;
        upgradeAbilities: Array<ICharacterUpgradeAbilities>;
        ascendGoals: Array<ICharacterAscendGoal>;
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

        const ascendGoals = selectedGoals.filter(x =>
            [PersonalGoalType.Ascend].includes(x.type)
        ) as Array<ICharacterAscendGoal>;

        return {
            allGoals,
            shardsGoals,
            upgradeRankOrMowGoals,
            upgradeAbilities,
            ascendGoals,
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
                    mythicShards: unit.mythicShards ?? 0,
                    starsStart: unit.stars,
                    starsEnd: g.targetStars ?? rarityToStars[g.targetRarity!],
                    onslaughtShards: g.shardsPerToken ?? 1,
                    onslaughtMythicShards: g.mythicShardsPerToken ?? 1,
                    campaignsUsage: g.campaignsUsage ?? CampaignsLocationsUsage.LeastEnergy,
                    mythicCampaignsUsage: g.mythicCampaignsUsage ?? CampaignsLocationsUsage.LeastEnergy,
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
                    mythicShards: unit.mythicShards ?? 0,
                    starsStart: unit.stars,
                    starsEnd: g.targetStars ?? rarityToStars[g.targetRarity!],
                    onslaughtShards: g.shardsPerToken ?? 1,
                    onslaughtMythicShards: g.mythicShardsPerToken ?? 0,
                    campaignsUsage: g.campaignsUsage ?? CampaignsLocationsUsage.LeastEnergy,
                    mythicCampaignsUsage: g.mythicCampaignsUsage ?? CampaignsLocationsUsage.LeastEnergy,
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
                    mythicShards: 0,
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
                    rankStart: Math.max(g.startingRank ?? unit.rank, unit.rank),
                    rankEnd: g.targetRank!,
                    rankPoint5: g.rankPoint5!,
                    rankStartPoint5: g.startingRankPoint5 ?? false,
                    upgradesRarity: g.upgradesRarity ?? [],
                    appliedUpgrades:
                        Math.max(g.startingRank ?? unit.rank, unit.rank) === unit.rank ? unit.upgrades : [],
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
                    startingRank: goal.rankStart,
                    startingRankPoint5: goal.rankStartPoint5,
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
                    mythicCampaignsUsage: goal.mythicCampaignsUsage,
                    shardsPerToken: goal.onslaughtShards,
                    mythicShardsPerToken: goal.onslaughtMythicShards,
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

    private static adjustNeededXp(xpNeeded: number, heldBooks: Record<Rarity, number>): number {
        for (const rarity of XP_BOOK_ORDER) {
            const usable = Math.min(Math.floor(xpNeeded / XP_BOOK_VALUE[rarity]), heldBooks[rarity]);
            heldBooks[rarity] -= usable;
            xpNeeded -= usable * XP_BOOK_VALUE[rarity];
        }

        if (xpNeeded > 0) {
            for (const rarity of [...XP_BOOK_ORDER].reverse()) {
                while (xpNeeded > 0 && heldBooks[rarity] > 0) {
                    xpNeeded = Math.max(0, xpNeeded - XP_BOOK_VALUE[rarity]);
                    heldBooks[rarity] -= 1;
                }
            }
        }

        return xpNeeded;
    }

    private static computeHeldBooks(inventory: IInventory, xpUseState: XpUseState): Record<Rarity, number> {
        const heldBooks = { ...inventory.xpBooks };
        if (!xpUseState.useCommon) heldBooks[Rarity.Common] = 0;
        if (!xpUseState.useUncommon) heldBooks[Rarity.Uncommon] = 0;
        if (!xpUseState.useRare) heldBooks[Rarity.Rare] = 0;
        if (!xpUseState.useEpic) heldBooks[Rarity.Epic] = 0;
        if (!xpUseState.useLegendary) heldBooks[Rarity.Legendary] = 0;
        if (!xpUseState.useMythic) heldBooks[Rarity.Mythic] = 0;
        return heldBooks;
    }

    private static _adjustItemCount(
        count: number,
        getHeld: () => number,
        setHeld: (value: number) => void,
        getNeeded: () => number,
        setNeeded: (value: number) => void
    ): number {
        const held = getHeld();
        const toRemove = Math.min(count, held);
        setHeld(held - toRemove);
        const newCount = count - toRemove;
        setNeeded(getNeeded() + newCount);
        return newCount;
    }

    private static _adjustAllianceRarityItems(
        items: Record<Rarity, number> | undefined,
        alliance: Alliance | undefined,
        heldItems: Record<Alliance, Record<Rarity, number>>,
        neededItems: Record<Alliance, Record<Rarity, number>>
    ): void {
        if (!items || alliance === undefined) {
            return;
        }

        for (const [rarityString, rawCount] of Object.entries(items)) {
            const rarity = Number(rarityString) as Rarity;
            if (neededItems[alliance]?.[rarity] === undefined) {
                neededItems[alliance][rarity] = 0;
            }
            items[rarity] = this._adjustItemCount(
                rawCount,
                () => heldItems[alliance]?.[rarity] ?? 0,
                v => {
                    if (heldItems[alliance]) {
                        heldItems[alliance][rarity] = v;
                    }
                },
                () => neededItems[alliance]?.[rarity] ?? 0,
                v => {
                    if (neededItems[alliance]) {
                        neededItems[alliance][rarity] = v;
                    }
                }
            );
        }
    }

    private static _adjustForgeBadges(
        goalMowEstimate: IGoalEstimate['mowEstimate'],
        heldForgeBadges: Record<Rarity, number>,
        neededForgeBadges: Record<Rarity, number>
    ): void {
        if (!goalMowEstimate) {
            return;
        }
        for (const [rarityString, count] of Object.entries(goalMowEstimate.forgeBadges)) {
            const rarity = Number(rarityString) as Rarity;
            goalMowEstimate.forgeBadges[rarity] = this._adjustItemCount(
                count ?? 0,
                () => heldForgeBadges[rarity] ?? 0,
                v => (heldForgeBadges[rarity] = v),
                () => neededForgeBadges[rarity] ?? 0,
                v => (neededForgeBadges[rarity] = v)
            );
        }
    }

    private static _adjustMowComponents(
        goalMowEstimate: IGoalEstimate['mowEstimate'],
        alliance: Alliance | undefined,
        heldComponents: Record<Alliance, number>,
        neededComponents: Record<Alliance, number>
    ): void {
        if (!goalMowEstimate || !alliance) {
            return;
        }
        goalMowEstimate.components = this._adjustItemCount(
            goalMowEstimate.components,
            () => heldComponents[alliance] ?? 0,
            v => (heldComponents[alliance] = v),
            () => neededComponents[alliance] ?? 0,
            v => (neededComponents[alliance] = v)
        );
    }

    private static _adjustGoalXp(
        goal: IGoalEstimate,
        heldBooks: Record<Rarity, number>,
        xpIncomeState: XpIncomeState,
        xpBooksAccrual: XpBookAccrual,
        today: Date,
        xpBookRarityToUse: Rarity
    ): { xpNeeded: number; newXpBooksAccrual: XpBookAccrual } {
        const remainingXp = goal.xpEstimate?.xpLeft ?? goal.xpEstimateAbilities?.xpLeft ?? 0;
        const currentEstimate = goal.xpEstimate ?? goal.xpEstimateAbilities;

        if (!remainingXp || !currentEstimate) {
            if (currentEstimate) {
                if (goal.xpEstimate) goal.xpEstimate = undefined;
                if (goal.xpEstimateAbilities) goal.xpEstimateAbilities = undefined;
            }
            return { xpNeeded: 0, newXpBooksAccrual: xpBooksAccrual };
        }

        goal.xpBooksRequired = Math.floor(remainingXp / XP_BOOK_VALUE[xpBookRarityToUse]);
        const xpNeeded = this.adjustNeededXp(remainingXp, heldBooks);
        goal.xpBooksApplied = goal.xpBooksRequired - Math.floor(xpNeeded / XP_BOOK_VALUE[xpBookRarityToUse]);

        let newAccrual = xpBooksAccrual;

        goal.xpBooksTotal = Math.floor(xpNeeded / XP_BOOK_VALUE[xpBookRarityToUse]);
        if (xpNeeded === 0) {
            goal.xpEstimate = undefined;
            goal.xpEstimateAbilities = undefined;
            return { xpNeeded: 0, newXpBooksAccrual: xpBooksAccrual };
        }

        currentEstimate.legendaryBooks = Math.floor(xpNeeded / XP_BOOK_VALUE[xpBookRarityToUse]);
        currentEstimate.xpLeft = xpNeeded;

        if (xpIncomeState.manualBooksPerDay > 0) {
            const booksToAccrue = Math.ceil(xpNeeded / XP_BOOK_VALUE[xpBookRarityToUse]);
            newAccrual = this.processGoalAccrual(booksToAccrue, xpBooksAccrual, xpIncomeState.manualBooksPerDay);
            goal.xpDaysLeft = Math.ceil((newAccrual.accruedDate.getTime() - today.getTime()) / 86400000);
        }

        return { xpNeeded, newXpBooksAccrual: newAccrual };
    }

    private static _processGoalAdjustments(
        goal: IGoalEstimate,
        heldBadges: Record<Alliance, Record<Rarity, number>>,
        neededBadges: Record<Alliance, Record<Rarity, number>>,
        heldOrbs: Record<Alliance, Record<Rarity, number>>,
        neededOrbs: Record<Alliance, Record<Rarity, number>>,
        heldForgeBadges: Record<Rarity, number>,
        neededForgeBadges: Record<Rarity, number>,
        heldComponents: Record<Alliance, number>,
        neededComponents: Record<Alliance, number>,
        upgradeRankOrMowGoals: (ICharacterUpgradeRankGoal | ICharacterUpgradeMow)[],
        ascendGoals: ICharacterAscendGoal[]
    ) {
        if (goal.abilitiesEstimate || goal.mowEstimate) {
            const badges = goal.mowEstimate?.badges ?? goal.abilitiesEstimate!.badges;
            const alliance =
                goal.abilitiesEstimate?.alliance ?? GoalsService.getGoalAlliance(goal.goalId, upgradeRankOrMowGoals)!;
            this._adjustAllianceRarityItems(badges, alliance, heldBadges, neededBadges);
        }

        if (goal.orbsEstimate) {
            const orbs = goal.orbsEstimate.orbs;
            const alliance = goal.orbsEstimate.alliance ?? GoalsService.getGoalAlliance(goal.goalId, ascendGoals);
            this._adjustAllianceRarityItems(orbs, alliance, heldOrbs, neededOrbs);
        }

        if (goal.mowEstimate) {
            this._adjustForgeBadges(goal.mowEstimate, heldForgeBadges, neededForgeBadges);
            const alliance = GoalsService.getGoalAlliance(goal.goalId, upgradeRankOrMowGoals)!;
            this._adjustMowComponents(goal.mowEstimate, alliance, heldComponents, neededComponents);
        }
    }

    /**
     * Computes the total number of remaining resources needed AND adjusts all goals to use as
     * many possible resources from our existing inventory.
     */
    public static adjustGoalEstimates(
        goals: IPersonalGoal[],
        goalsEstimate: IGoalEstimate[],
        inventory: IInventory,
        xpUseState: XpUseState,
        upgradeRankOrMowGoals: (ICharacterUpgradeRankGoal | ICharacterUpgradeMow)[],
        ascendGoals: ICharacterAscendGoal[],
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

        const heldBooks = this.computeHeldBooks(inventory, xpUseState);

        const neededBadges: Record<Alliance, Record<Rarity, number>> = {
            [Alliance.Chaos]: createRarityRecord(),
            [Alliance.Imperial]: createRarityRecord(),
            [Alliance.Xenos]: createRarityRecord(),
        };

        const neededOrbs: Record<Alliance, Record<Rarity, number>> = {
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
        const heldOrbs = cloneDeep(inventory?.orbs) || {};
        const heldForgeBadges = cloneDeep(inventory.forgeBadges);
        const heldComponents = cloneDeep(inventory.components);

        const newGoalsEstimates: IGoalEstimate[] = cloneDeep(goalsEstimate);
        const goalsByPrio = orderBy(
            goals.map(x => ({ id: x.id, priority: x.priority, unit: x.character })),
            ['priority'],
            ['asc']
        );
        let totalXpNeeded = 0;
        const today = new Date();
        let xpBooksAccrual = { accruedDate: today, booksAccrued: 0 } as XpBookAccrual;
        try {
            for (const goalIdAndPriority of goalsByPrio) {
                const goal = newGoalsEstimates.find(x => x.goalId === goalIdAndPriority.id);

                if (goal === undefined) {
                    console.error('could not find goal estimate for goal id ' + goalIdAndPriority.id);
                    continue;
                }

                const { xpNeeded, newXpBooksAccrual } = this._adjustGoalXp(
                    goal,
                    heldBooks,
                    xpIncomeState,
                    xpBooksAccrual,
                    today,
                    xpIncomeState.defaultBookToUse
                );
                totalXpNeeded += xpNeeded;
                xpBooksAccrual = newXpBooksAccrual;

                this._processGoalAdjustments(
                    goal,
                    heldBadges,
                    neededBadges,
                    heldOrbs,
                    neededOrbs,
                    heldForgeBadges,
                    neededForgeBadges,
                    heldComponents,
                    neededComponents,
                    upgradeRankOrMowGoals,
                    ascendGoals
                );
                if (
                    goal.completed &&
                    goal.orbsEstimate &&
                    Object.values(goal.orbsEstimate.orbs).some(count => count > 0)
                ) {
                    goal.completed = false;
                }
            }
        } catch (error) {
            console.error('Error adjusting goal estimates:', error);
            console.error('goals: ', JSON.stringify(goals));
            console.error('goalsEstimate: ', JSON.stringify(goalsEstimate));
            console.error('inventory: ', JSON.stringify(inventory));
            console.error('xpUseState: ', JSON.stringify(xpUseState));
            console.error('upgradeRankOrMowGoals: ', JSON.stringify(upgradeRankOrMowGoals));
            console.error('xpIncomeState: ', JSON.stringify(xpIncomeState));
        }

        return {
            neededBadges,
            neededForgeBadges,
            neededComponents,
            goalEstimates: newGoalsEstimates,
            neededXp: totalXpNeeded,
            neededOrbs,
        };
    }
}
