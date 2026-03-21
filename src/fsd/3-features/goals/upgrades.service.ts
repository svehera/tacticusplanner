/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
import { orderBy, sum, uniq, uniqBy } from 'lodash';

import { DailyRaidsStrategy, PersonalGoalType } from 'src/models/enums';
import {
    IDailyRaidsFarmOrder,
    IDailyRaidsHomeScreenEvent,
    IEstimatedRanksSettings,
    IGameModeTokensState,
} from 'src/models/interfaces';

import { getEnumValues } from '@/fsd/5-shared/lib';
import { TacticusUpgrade } from '@/fsd/5-shared/lib/tacticus-api/tacticus-api.models';
import { Alliance, Rank, Rarity, RarityStars } from '@/fsd/5-shared/model';

import { CampaignsService, CampaignType, Campaign, ICampaignBattleComposed } from '@/fsd/4-entities/campaign';
import { campaignEventsLocations, campaignsByGroup } from '@/fsd/4-entities/campaign/campaigns.constants';
import { CharactersService, CharacterUpgradesService, IUnitUpgradeRank } from '@/fsd/4-entities/character';
import { ICharacter2, IUnitShards } from '@/fsd/4-entities/character/model';
import { IMow2, MowsService } from '@/fsd/4-entities/mow';
import { NpcService } from '@/fsd/4-entities/npc/@x/unit';
import {
    IBaseUpgrade,
    ICraftedUpgrade,
    IMaterial,
    UpgradesService as FsdUpgradesService,
} from '@/fsd/4-entities/upgrade';
import { recipeDataByName } from '@/fsd/4-entities/upgrade/data';

import {
    ICharacterAscendGoal,
    ICharacterUnlockGoal,
    ICharacterUpgradeEstimate,
    ICharacterUpgradeMow,
    ICharacterUpgradeRankGoal,
    ICombinedUpgrade,
    IEstimatedUpgrades,
    IItemRaidLocation,
    IUnitUpgrade,
    IUpgradeRaid,
    IUpgradesRaidsDay,
} from '@/fsd/3-features/goals/goals.models';

const INITIAL_STARS_FOR_RARITY: Partial<Record<Rarity, RarityStars>> = {
    [Rarity.Common]: RarityStars.None,
    [Rarity.Uncommon]: RarityStars.TwoStars,
    [Rarity.Rare]: RarityStars.FourStars,
    [Rarity.Epic]: RarityStars.RedOneStar,
    [Rarity.Legendary]: RarityStars.RedThreeStars,
};

const SHARDS_AT_RARITY_AND_STARS: Record<Rarity, Partial<Record<RarityStars, number>>> = {
    [Rarity.Common]: {
        [RarityStars.None]: 40,
        [RarityStars.OneStar]: 50,
        [RarityStars.TwoStars]: 65,
    },
    [Rarity.Uncommon]: {
        [RarityStars.TwoStars]: 80,
        [RarityStars.ThreeStars]: 95,
        [RarityStars.FourStars]: 110,
    },
    [Rarity.Rare]: {
        [RarityStars.FourStars]: 130,
        [RarityStars.FiveStars]: 160,
        [RarityStars.RedOneStar]: 200,
    },
    [Rarity.Epic]: {
        [RarityStars.RedOneStar]: 250,
        [RarityStars.RedTwoStars]: 315,
        [RarityStars.RedThreeStars]: 400,
    },
    [Rarity.Legendary]: {
        [RarityStars.RedThreeStars]: 500,
        [RarityStars.RedFourStars]: 650,
        [RarityStars.RedFiveStars]: 900,
        [RarityStars.OneBlueStar]: 1400,
    },
    [Rarity.Mythic]: {
        // Once at Mythic, you never need more normal shards.
        [RarityStars.OneBlueStar]: 1400,
        [RarityStars.TwoBlueStars]: 1400,
        [RarityStars.ThreeBlueStars]: 1400,
        [RarityStars.MythicWings]: 1400,
    },
};
const MYTHIC_SHARDS_AT_RARITY_AND_STARS: Partial<Record<RarityStars, number>> = {
    [RarityStars.OneBlueStar]: 20,
    [RarityStars.TwoBlueStars]: 50,
    [RarityStars.ThreeBlueStars]: 100,
    [RarityStars.MythicWings]: 200,
};

interface TaggedLocation {
    loc: ICampaignBattleComposed;
    priority?: number;
    highestPriorityGoalId?: string;
    daysToComplete: number;
    hsePoints?: number;
}

type TaggedLocationMetadata = Omit<TaggedLocation, 'loc'>;

interface GoalPriorityLocationsState {
    locs: ICampaignBattleComposed[];
    upgradeIds: Set<string>;
    sortedLocs?: ICampaignBattleComposed[];
    lastInventoryByUpgrade?: Map<string, number>;
}

export class UpgradesService {
    static readonly recipeDataByTacticusId: Record<string, IMaterial> = this.composeByTacticusId();

    // eslint-disable-next-line unicorn/consistent-function-scoping -- don't extract static methods
    static readonly rankEntries: number[] = getEnumValues(Rank).filter(x => x > 0);

    private static readonly goalPriorityByIdCache = new WeakMap<
        ReadonlyArray<ICharacterUpgradeRankGoal | ICharacterUpgradeMow | ICharacterAscendGoal | ICharacterUnlockGoal>,
        Map<string, number>
    >();

    private static readonly taggedLocationMetadataCache = new Map<
        | Map<string, { neededByHigherPriorityGoals: number; stillNeededForGoal: number; totalRemaining: number }>
        | undefined,
        Map<string, TaggedLocationMetadata>
    >();

    private static getGoalPriorityById(
        goals: Array<ICharacterUpgradeRankGoal | ICharacterUpgradeMow | ICharacterAscendGoal | ICharacterUnlockGoal>
    ): Map<string, number> {
        const cached = this.goalPriorityByIdCache.get(goals);
        if (cached) {
            return cached;
        }
        const map = new Map(goals.map(goal => [goal.goalId, goal.priority]));
        this.goalPriorityByIdCache.set(goals, map);
        return map;
    }

    private static getTaggedLocationMetadataCache(
        cache:
            | Map<string, { neededByHigherPriorityGoals: number; stillNeededForGoal: number; totalRemaining: number }>
            | undefined
    ): Map<string, TaggedLocationMetadata> {
        if (!cache) {
            return new Map<string, TaggedLocationMetadata>();
        }
        const cached = this.taggedLocationMetadataCache.get(cache);
        if (cached) {
            return cached;
        }
        const map = new Map<string, TaggedLocationMetadata>();
        this.taggedLocationMetadataCache.set(cache, map);
        return map;
    }

    private static precomputeHigherPriorityNeeds(
        combinedBaseMaterials: Record<string, ICombinedUpgrade>,
        goals: Array<ICharacterUpgradeRankGoal | ICharacterUpgradeMow | ICharacterAscendGoal | ICharacterUnlockGoal>,
        cache: Map<string, { neededByHigherPriorityGoals: number; stillNeededForGoal: number; totalRemaining: number }>
    ): void {
        const goalPriorityById = this.getGoalPriorityById(goals);

        for (const [upgradeId, mat] of Object.entries(combinedBaseMaterials)) {
            const countsByGoalId = mat.countByGoalId;
            const totalByPriority = new Map<number, number>();

            for (const [goalId, count] of Object.entries(countsByGoalId)) {
                const priority = goalPriorityById.get(goalId);
                if (priority === undefined) {
                    continue;
                }
                totalByPriority.set(priority, (totalByPriority.get(priority) ?? 0) + count);
            }

            if (totalByPriority.size === 0) {
                continue;
            }

            const priorities = [...totalByPriority.keys()].sort((a, b) => a - b);
            const higherNeedsByPriority = new Map<number, number>();
            let cumulative = 0;
            for (const priority of priorities) {
                higherNeedsByPriority.set(priority, cumulative);
                cumulative += totalByPriority.get(priority) ?? 0;
            }

            for (const goalId of Object.keys(countsByGoalId)) {
                const priority = goalPriorityById.get(goalId);
                if (priority === undefined) {
                    continue;
                }
                const neededByHigherPriorityGoals = higherNeedsByPriority.get(priority) ?? 0;
                cache.set(`hpg:${upgradeId}|${goalId}`, {
                    neededByHigherPriorityGoals,
                    stillNeededForGoal: 0,
                    totalRemaining: 0,
                });
            }
        }
    }

    public static computeOnslaughtTokensToday(gameModeTokens: IGameModeTokensState): number {
        const currentTokens = gameModeTokens.tokens?.onslaught?.current ?? 0;
        const nextTokenInSeconds = gameModeTokens.tokens?.onslaught?.nextTokenInSeconds ?? Infinity;
        const regenInSeconds = gameModeTokens.tokens?.onslaught?.regenDelayInSeconds ?? Infinity;
        const maxTokens = gameModeTokens.tokens?.onslaught?.max ?? 3;
        const now = new Date();
        const endOfUtcDay = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999);

        const secondsLeftToday = Math.max(0, (endOfUtcDay - now.getTime()) / 1000);

        const safeRegenInSeconds = Number.isFinite(regenInSeconds) && regenInSeconds > 0 ? regenInSeconds : Infinity;

        const firstTokenInSeconds =
            currentTokens >= maxTokens
                ? safeRegenInSeconds
                : Number.isFinite(nextTokenInSeconds) && nextTokenInSeconds >= 0
                  ? nextTokenInSeconds
                  : Infinity;

        if (!Number.isFinite(firstTokenInSeconds) || !Number.isFinite(safeRegenInSeconds)) {
            return currentTokens;
        }

        const regeneratedToday =
            secondsLeftToday < firstTokenInSeconds
                ? 0
                : 1 + Math.floor((secondsLeftToday - firstTokenInSeconds) / safeRegenInSeconds);

        return currentTokens + regeneratedToday;
    }

    public static canonicalizeInventoryUpgrades(
        inventoryUpgrades: Record<string, number>,
        chars: ICharacter2[],
        mows: IMow2[]
    ): Record<string, number> {
        /*
        const ret: Record<string, number> = Object.fromEntries(
            Object.entries(inventoryUpgrades).map(([key, value]) => {
                return [
                    recipeDataByName[key]
                        ? key
                        : (Object.values(recipeDataByName).find(x => x.material === key)?.snowprintId ?? key),
                    value,
                ];
            })
        );
        */

        const materialToIdMap: Record<string, string> = {};
        for (const recipe of Object.values(recipeDataByName)) {
            if (recipe.material) {
                materialToIdMap[recipe.material] = recipe.snowprintId;
            }
        }

        const returnValue: Record<string, number> = {};
        for (const [key, value] of Object.entries(inventoryUpgrades)) {
            const finalKey = recipeDataByName[key] ? key : (materialToIdMap[key] ?? key);
            returnValue[finalKey] = value;
        }

        for (const char of chars) {
            returnValue['shards_' + char.snowprintId!] = char.shards;
            returnValue['mythicShards_' + char.snowprintId!] = char.mythicShards;
        }
        for (const mow of mows) {
            returnValue['shards_' + mow.snowprintId!] = mow.shards;
            returnValue['mythicShards_' + mow.snowprintId!] = mow.mythicShards;
        }
        return returnValue;
    }

    static getUpgradesEstimatedDays(
        settings: IEstimatedRanksSettings,
        chars: ICharacter2[],
        mows: IMow2[],
        ...goals: Array<ICharacterUpgradeRankGoal | ICharacterUpgradeMow | ICharacterAscendGoal | ICharacterUnlockGoal>
    ): IEstimatedUpgrades {
        performance.mark('getUpgradesEstimatedDays-start');
        const inventoryUpgrades = this.canonicalizeInventoryUpgrades(settings.upgrades, chars, mows);

        const unitsUpgrades = this.getUpgrades(inventoryUpgrades, chars, mows, goals);

        const combinedBaseMaterials = this.combineBaseMaterials(unitsUpgrades);

        this.populateLocationsData(combinedBaseMaterials, settings);

        // Cache for expensive per-goal remaining computations keyed by
        // `${upgradeId}|${inventoryCount}|${goalId ?? 'total'}`.
        const remainingNeededCache = new Map<
            string,
            {
                neededByHigherPriorityGoals: number;
                stillNeededForGoal: number;
                totalRemaining: number;
            }
        >();

        this.precomputeHigherPriorityNeeds(combinedBaseMaterials, goals, remainingNeededCache);

        const { upgradesRaids, remainingMats } = this.generateDailyRaidsList(
            settings,
            chars,
            mows,
            goals,
            combinedBaseMaterials,
            inventoryUpgrades,
            remainingNeededCache
        );

        const blockedMats = Object.values(remainingMats).map(x => x.id);
        const finishedMats = Object.entries(combinedBaseMaterials).filter(
            ([_, value]) => value.id && (inventoryUpgrades[value.id] ?? 0) >= value.requiredCount
        );
        const blockedIds = new Set(blockedMats);
        const finishedIds = new Set(finishedMats.map(([_, value]) => value.id));
        const inProgressMats = Object.entries(combinedBaseMaterials).filter(
            ([_, value]) => !!value.id && !blockedIds.has(value.id) && !finishedIds.has(value.id)
        );

        const mergedInProgress = inProgressMats.reduce(
            (accumulator, [id, upgrade]) => {
                const existing = accumulator[id];
                if (existing) {
                    existing.locations = uniqBy([...existing.locations, ...upgrade.locations], 'id');
                } else {
                    accumulator[id] = this.cloneCombinedUpgrade(upgrade);
                }
                return accumulator;
            },
            {} as Record<string, ICombinedUpgrade>
        );

        const blockedMaterials = this.getTotalEstimates(remainingMats, inventoryUpgrades).map(x => {
            return {
                ...x,
                locations: x.locations.map(loc => ({ ...loc, isSuggested: false })),
            };
        });

        const isGoalPriority = settings.preferences.farmPreferences?.order === IDailyRaidsFarmOrder.goalPriority;
        const goalPriorityEstimates = isGoalPriority
            ? this.getGoalPriorityEstimates(combinedBaseMaterials, inventoryUpgrades, goals, chars, mows)
            : undefined;

        const finishedMaterials = isGoalPriority
            ? goalPriorityEstimates!.filter(x => x.isFinished && !x.isBlocked)
            : this.getTotalEstimates(
                  Object.entries(combinedBaseMaterials)
                      .filter(([_, value]) => value.id && (inventoryUpgrades[value.id] ?? 0) >= value.requiredCount)
                      .reduce(
                          (accumulator, [id, upgrade]) => {
                              accumulator[id] = this.cloneCombinedUpgrade(upgrade);
                              return accumulator;
                          },
                          {} as Record<string, ICombinedUpgrade>
                      ),
                  inventoryUpgrades
              );

        const inProgressMaterials = isGoalPriority
            ? goalPriorityEstimates!.filter(x => !x.isFinished && !x.isBlocked)
            : this.getTotalEstimates(mergedInProgress, inventoryUpgrades).map(x => {
                  for (const loc of x.locations) {
                      const inProgressLoc = combinedBaseMaterials[x.id].locations.find(l => l.id === loc.id);
                      if (inProgressLoc) loc.isSuggested = inProgressLoc.isSuggested;
                  }
                  return x;
              });

        const energyTotal = sum(upgradesRaids.map(day => day.energyTotal));
        const raidsTotal = sum(upgradesRaids.map(day => day.raidsTotal));
        const freeEnergyDays = upgradesRaids.filter(x => settings.dailyEnergy - x.energyTotal > 60).length;

        const relatedUpgrades = uniq(unitsUpgrades.flatMap(ranksUpgrade => ranksUpgrade.relatedUpgrades));
        performance.mark('getUpgradesEstimatedDays-end');
        performance.measure(
            'getUpgradesEstimatedDays',
            'getUpgradesEstimatedDays-start',
            'getUpgradesEstimatedDays-end'
        );

        return {
            upgradesRaids,
            characters: unitsUpgrades,
            inProgressMaterials: inProgressMaterials,
            blockedMaterials: blockedMaterials,
            finishedMaterials: finishedMaterials,
            relatedUpgrades,
            byCharactersPriority: [],
            daysTotal: upgradesRaids.length,
            energyTotal,
            raidsTotal,
            freeEnergyDays,
        };
    }

    /**
     * @returns the difference in raids on the first day between the two estimates. This is a
     * simple diff that just removes raids in highEnergyRaids that are also in lowEnergyRaids
     * and return a new IUpgradeRaid array. If we happen to have any battles that are present
     * but not completely exploited in lowEnergyRaids, but are exploited in highEnergyRaids,
     * those raids will most likely be removed from highEnergyRaids.
     */
    public static getDayRaidsDifference(
        highEnergyRaids: IUpgradesRaidsDay,
        lowEnergyRaids: IUpgradesRaidsDay
    ): IUpgradeRaid[] {
        const lowRaidIds = new Set(lowEnergyRaids.raids.map(raid => raid.id));
        return highEnergyRaids.raids.filter(raid => !lowRaidIds.has(raid.id));
    }

    /**
     * @returns whether we can use energy or onslaught tokens to farm this particular
     * material, given the suggestibility of any/all of its locations.
     */
    public static canRaidMaterial(
        mat: ICombinedUpgrade,
        characters: ICharacter2[],
        mows: IMow2[],
        goals: Array<ICharacterUpgradeRankGoal | ICharacterUpgradeMow | ICharacterAscendGoal | ICharacterUnlockGoal>
    ): boolean {
        if (!mat.id.startsWith('shards_') && !mat.id.startsWith('mythicShards_')) {
            return mat.locations.some(loc => loc.isSuggested);
        } else if (!mat.locations.some(loc => loc.isSuggested)) {
            // We have shard goals but no place to farm them, check for onslaught.
            const goal = goals.find(goal => mat.relatedGoals.find(relatedGoal => goal.goalId === relatedGoal));
            if (goal === undefined || goal.type === PersonalGoalType.Unlock) {
                // we either don't have a goal, or we have an unlock goal that we can't farm, so the goal is blocked.
                return false;
            } else if (
                mat.id.startsWith('shards_') &&
                !this.canOnslaughtCharacterForRegularShards(
                    goal?.unitId,
                    characters,
                    mows,
                    goal as ICharacterAscendGoal
                )
            ) {
                // We have an ascension goal requiring regular shards, but we can't farm them with onslaught, so the goal is blocked.
                return false;
            } else if (
                mat.id.startsWith('mythicShards_') &&
                !this.canOnslaughtCharacterForMythicShards(goal?.unitId, characters, mows, goal as ICharacterAscendGoal)
            ) {
                // We have an ascension goal requiring mythic shards, but we can't farm them with onslaught, so the goal is blocked.
                return false;
            }
        }
        return true;
    }

    /**
     * Creates skeleton raids for all acquired inventory, removing things from
     * combinedBaseMaterials as necessary.
     */
    public static createRaidsForExistingInventory(
        combinedBaseMaterials: Record<string, ICombinedUpgrade>,
        existingInventory: Record<string, number>
    ): IUpgradesRaidsDay {
        const raids: IUpgradeRaid[] = [];
        for (const [upgradeId, mat] of Object.entries(combinedBaseMaterials)) {
            const raid: IUpgradeRaid = {
                id: 'inventory_in_stock-' + upgradeId,
                snowprintId: upgradeId,
                label: mat.label,
                rarity: mat.rarity,
                iconPath: mat.iconPath,
                locations: [],
                crafted: false,
                stat: mat.stat,
                raidLocations: [],
                countByGoalId: {},
                energyTotal: 0,
                energyLeft: 0,
                daysTotal: 0,
                raidsTotal: 0,
                acquiredCount: 0,
                requiredCount: mat.requiredCount,
                relatedCharacters: mat.relatedCharacters,
                relatedGoals: mat.relatedGoals,
                isBlocked: false,
                isFinished: false,
            };
            let quantity = existingInventory[upgradeId] ?? 0;
            if (quantity > 0) {
                for (const [goalId, count] of Object.entries(mat.countByGoalId)) {
                    const toClaim = Math.min(quantity, count);
                    quantity -= toClaim;
                    raid.countByGoalId![goalId] = toClaim;
                    if (quantity === 0) break;
                }
                raid.acquiredCount = existingInventory[upgradeId] ?? 0;
                if (raid.acquiredCount >= mat.requiredCount) {
                    raid.isFinished = true;
                    delete combinedBaseMaterials[upgradeId];
                }
                raids.push(raid);
            }
        }

        return {
            raids,
            energyTotal: 0,
            raidsTotal: 0,
            onslaughtTokens: 0,
        };
    }

    /** cloneDeep is super expensive, so instead we manually clone the necessary properties. */
    private static cloneCombinedUpgrade(upgrade: ICombinedUpgrade): ICombinedUpgrade {
        return {
            ...upgrade,
            countByGoalId: { ...upgrade.countByGoalId },
            relatedCharacters: [...upgrade.relatedCharacters],
            relatedGoals: [...upgrade.relatedGoals],
            locations: [...upgrade.locations.map(x => ({ ...x }))],
        };
    }

    /*
     * @returns An array of `IUpgradesRaidsDay`, where each object represents a single day's
     * raiding plan. Returns an empty array if daily energy is too low to perform any raids.
     */
    public static generateDailyRaidsList(
        settings: IEstimatedRanksSettings,
        characters: ICharacter2[],
        mows: IMow2[],
        goals: Array<ICharacterUpgradeRankGoal | ICharacterUpgradeMow | ICharacterAscendGoal | ICharacterUnlockGoal>,
        combinedBaseMaterials: Record<string, ICombinedUpgrade>,
        inventoryUpgrades: Record<string, number>,
        remainingNeededCache: Map<
            string,
            { neededByHigherPriorityGoals: number; stillNeededForGoal: number; totalRemaining: number }
        >
    ): { upgradesRaids: IUpgradesRaidsDay[]; remainingMats: Record<string, ICombinedUpgrade> } {
        const returnValue: IUpgradesRaidsDay[] = [];
        let onslaughtTokens = settings.onslaughtTokensToday === undefined ? 1 : settings.onslaughtTokensToday;
        let remainingMats: Record<string, ICombinedUpgrade> = {};

        for (const [id, upgrade] of Object.entries(combinedBaseMaterials)) {
            remainingMats[id] = this.cloneCombinedUpgrade(upgrade);
        }
        const inventory = { ...inventoryUpgrades };

        let day = this.createRaidsForExistingInventory(remainingMats, inventory);
        this.handleFirstDayCompletedRaids(day, settings, combinedBaseMaterials);
        let energy = settings.dailyEnergy - day.energyTotal;
        let days = 0;
        const MAX_DAYS = 1000;
        const blockedMats: Record<string, ICombinedUpgrade> = {};
        const newRemainignMats: Record<string, ICombinedUpgrade> = {};
        for (const key in remainingMats) {
            const mat = remainingMats[key];
            if (mat.requiredCount <= 0) continue;
            if (!this.canRaidMaterial(mat, characters, mows, goals)) {
                blockedMats[key] = mat;
                continue;
            }
            newRemainignMats[key] = mat;
        }
        remainingMats = newRemainignMats;

        const precomputedGoalLocations = this.precomputeGoalPriorityLocations(settings, goals, remainingMats);

        while (Object.entries(remainingMats).length > 0 && days++ < MAX_DAYS) {
            this.addOnslaughtsForDay(
                day,
                characters,
                mows,
                onslaughtTokens,
                goals.filter(goal => goal.type === PersonalGoalType.Ascend),
                remainingMats,
                settings,
                inventory
            );
            const locs = Object.values(remainingMats)
                .flatMap(mat => mat.locations)
                .filter(loc => loc.isSuggested);

            this.planDayRaiding(
                day,
                settings,
                energy,
                locs,
                remainingMats,
                inventory,
                goals,
                remainingNeededCache,
                precomputedGoalLocations
            );
            this.postProcessRaidsForHse(day, settings, goals, remainingMats, inventory, remainingNeededCache);
            const upgradeIds = [...Object.keys(remainingMats)];
            for (const upgradeId of upgradeIds) {
                const mat = remainingMats[upgradeId];
                if (inventory[upgradeId] === undefined) continue;
                if (inventory[upgradeId] >= mat.requiredCount) {
                    delete remainingMats[upgradeId];
                }
            }
            for (const raid of day.raids) {
                raid.relatedCharacters = raid.relatedCharacters.map(
                    charId => CharactersService.resolveCharacter(charId)?.name ?? charId
                );
                for (const loc of raid.raidLocations) {
                    loc.energySpent = loc.raidsToPerform * loc.energyCost;
                }
                raid.energyTotal = raid.raidLocations.reduce((sum, loc) => sum + loc.energySpent, 0);
            }
            day.energyTotal = day.raids.reduce((sum, raid) => {
                for (const loc of raid.raidLocations) {
                    loc.energySpent = loc.raidsToPerform * loc.energyCost;
                }
                const raidEnergy = raid.raidLocations.reduce((raidSum, loc) => raidSum + loc.energySpent, 0);
                return sum + raidEnergy;
            }, 0);
            energy = settings.dailyEnergy;
            if (day.raids.length === 0) break;
            returnValue.push(day);
            day = {
                energyTotal: 0,
                raidsTotal: 0,
                onslaughtTokens,
                raids: [],
            };
            // regenerate 1 token every 18 hours, or 3 every two days.
            onslaughtTokens = Math.max(1, Math.min(2, 3 - onslaughtTokens));
        }

        for (const upgradeId of Object.keys(blockedMats)) {
            remainingMats[upgradeId] = blockedMats[upgradeId];
        }

        for (const day of returnValue) {
            for (const raid of day.raids) {
                for (const loc of raid.raidLocations) {
                    loc.energySpent = (loc.raidsAlreadyPerformed + loc.raidsToPerform) * loc.energyCost;
                }
                raid.energyTotal = raid.raidLocations.reduce((sum, loc) => sum + loc.energySpent, 0);
                raid.raidsTotal = sum(raid.raidLocations.map(loc => loc.raidsToPerform + loc.raidsAlreadyPerformed));
            }
            day.energyTotal = day.raids.reduce((sum, raid) => sum + raid.energyTotal, 0);
            day.raidsTotal = sum(day.raids.map(raid => raid.raidsTotal));
        }

        return { upgradesRaids: returnValue, remainingMats };
    }

    public static postProcessRaidsForHse(
        day: IUpgradesRaidsDay,
        settings: IEstimatedRanksSettings,
        goals: Array<ICharacterUpgradeRankGoal | ICharacterUpgradeMow | ICharacterAscendGoal | ICharacterUnlockGoal>,
        combinedBaseMaterials: Record<string, ICombinedUpgrade>,
        inventory: Record<string, number>,
        remainingNeededCache: Map<
            string,
            { neededByHigherPriorityGoals: number; stillNeededForGoal: number; totalRemaining: number }
        >
    ): void {
        const hse = settings.preferences.farmPreferences?.homeScreenEvent;
        if (hse === undefined || hse === IDailyRaidsHomeScreenEvent.none) return;

        // eslint-disable-next-line unicorn/consistent-function-scoping -- don't extract static methods
        const hsePointsPerUnit = (campaignType: CampaignType): number => {
            if (campaignType === CampaignType.Elite) return 5;
            return 3;
        };

        const getHsePoints = (loc: ICampaignBattleComposed): number => {
            switch (hse) {
                case IDailyRaidsHomeScreenEvent.purgeOrder: {
                    return (this.getNonSummonTyranidCount(loc) * hsePointsPerUnit(loc.campaignType)) / loc.energyCost;
                }
                case IDailyRaidsHomeScreenEvent.warpSurge: {
                    return (
                        (this.getNonSummonChaosEnemyCount(loc) * hsePointsPerUnit(loc.campaignType)) / loc.energyCost
                    );
                }
                case IDailyRaidsHomeScreenEvent.machineHunt: {
                    return this.getNonSummonMechanicalEnemyCount(loc) / loc.energyCost;
                }
                case IDailyRaidsHomeScreenEvent.trainingRush: {
                    return (this.getNonSummonEnemyCount(loc) * hsePointsPerUnit(loc.campaignType)) / loc.energyCost;
                }
                default: {
                    return 0;
                }
            }
        };

        const splitRaids: IUpgradeRaid[] = [];
        for (const raid of day.raids) {
            const grouped = new Map<number, IItemRaidLocation[]>();
            for (const loc of raid.raidLocations) {
                const points = getHsePoints(loc);
                const key = Number.isFinite(points) ? points : 0;
                const list = grouped.get(key) ?? [];
                list.push(loc);
                grouped.set(key, list);
            }

            for (const [_, raidLocations] of grouped) {
                const energyTotal = raidLocations.reduce((sum, loc) => sum + loc.energySpent, 0);
                const raidsTotal = raidLocations.reduce(
                    (sum, loc) => sum + loc.raidsToPerform + loc.raidsAlreadyPerformed,
                    0
                );
                splitRaids.push({
                    ...raid,
                    raidLocations,
                    locations: raidLocations,
                    energyTotal,
                    raidsTotal,
                });
            }
        }

        const allLocs = splitRaids.flatMap(raid => raid.raidLocations);
        const sortedLocs = this.sortLocationsForRaiding(
            allLocs,
            goals,
            combinedBaseMaterials,
            inventory,
            settings,
            remainingNeededCache
        );
        const locIndex = new Map(sortedLocs.map((loc, index) => [loc.id, index]));

        day.raids = orderBy(
            splitRaids,
            [
                raid => (raid.raidLocations.every(loc => loc.raidsAlreadyPerformed === loc.dailyBattleCount) ? 1 : 0),
                raid => Math.min(...raid.raidLocations.map(loc => locIndex.get(loc.id) ?? Number.POSITIVE_INFINITY)),
            ],
            ['desc', 'asc']
        );
        day.energyTotal = sum(day.raids.map(raid => raid.energyTotal));
        day.raidsTotal = sum(day.raids.map(raid => raid.raidsTotal));
    }

    private static precomputeGoalPriorityLocations(
        settings: IEstimatedRanksSettings,
        goals: Array<ICharacterUpgradeRankGoal | ICharacterUpgradeMow | ICharacterAscendGoal | ICharacterUnlockGoal>,
        remainingMats: Record<string, ICombinedUpgrade>
    ): Map<string, GoalPriorityLocationsState> | undefined {
        if (settings.preferences.farmPreferences?.order !== IDailyRaidsFarmOrder.goalPriority) {
            return undefined;
        }

        const sortedGoals = orderBy(goals, ['priority'], ['asc']);
        const allSuggestedLocs = Object.values(remainingMats)
            .flatMap(mat => mat.locations)
            .filter(loc => loc.isSuggested);
        const result = new Map<string, GoalPriorityLocationsState>();

        for (const goal of sortedGoals) {
            const upgradeIds = new Set(
                Object.entries(remainingMats)
                    .filter(([_, mat]) => mat.relatedGoals.includes(goal.goalId))
                    .map(([upgradeId]) => upgradeId)
            );
            const locsForGoal = allSuggestedLocs.filter(loc => upgradeIds.has(loc.rewards.potential[0].id));
            result.set(goal.goalId, { locs: locsForGoal, upgradeIds });
        }

        return result;
    }

    /**
     * Plans raids for a single day by spending energy across the provided locations.
     *
     * Behavior depends on the farm order:
     * - total materials: raids locations in order, based on total remaining need.
     * - goal priority: iterates goals by priority and raids locations tied to each goal.
     *
     * @param day - The day object being populated.
     * @param settings - User settings that control farm order and strategy.
     * @param energy - Starting energy budget for the day.
     * @param locs - Suggested raid locations to consider (already filtered/sorted).
     * @param remainingMats - Remaining materials mapped by upgrade ID.
     * @param inventory - Inventory counts to update as raids are planned.
     * @param goals - Active goals used for priority-based planning.
     */
    public static planDayRaiding(
        day: IUpgradesRaidsDay,
        settings: IEstimatedRanksSettings,
        energy: number,
        locs: ICampaignBattleComposed[],
        remainingMats: Record<string, ICombinedUpgrade>,
        inventory: Record<string, number>,
        goals: Array<ICharacterUpgradeRankGoal | ICharacterUpgradeMow | ICharacterAscendGoal | ICharacterUnlockGoal>,
        remainingNeededCache: Map<
            string,
            { neededByHigherPriorityGoals: number; stillNeededForGoal: number; totalRemaining: number }
        > = new Map(),
        goalPriorityLocationsByGoal?: Map<string, GoalPriorityLocationsState>
    ): void {
        const minEnergy = locs.reduce((min, loc) => Math.min(min, loc.energyCost), Infinity);
        const maxEnergy = locs.reduce((max, loc) => Math.max(max, loc.energyCost), -Infinity);
        if (settings.preferences.farmPreferences?.order === IDailyRaidsFarmOrder.totalMaterials) {
            for (const loc of this.sortLocationsForRaiding(
                locs,
                goals,
                remainingMats,
                inventory,
                settings,
                remainingNeededCache
            )) {
                if (energy < minEnergy) break;
                energy = this.raidLocation(
                    day,
                    energy,
                    inventory,
                    loc,
                    remainingMats,
                    goals,
                    undefined,
                    undefined,
                    remainingNeededCache
                );
            }
            if (energy < maxEnergy) locs = locs.filter(loc => loc.energyCost <= energy);
            return;
        } else {
            const sortedGoals = orderBy(goals, ['priority'], ['asc']);
            for (const goal of sortedGoals) {
                const precomputedState = goalPriorityLocationsByGoal?.get(goal.goalId);
                const matsForGoalIds =
                    precomputedState?.upgradeIds ??
                    new Set(
                        Object.entries(remainingMats)
                            .filter(([_, mat]) => mat.relatedGoals.includes(goal.goalId))
                            .map(([upgradeId]) => upgradeId)
                    );
                const candidateLocs = (
                    precomputedState?.locs ??
                    locs.filter(loc => loc.rewards.potential.some(reward => matsForGoalIds.has(reward.id)))
                ).filter(loc => {
                    const upgradeId = loc.rewards.potential[0].id;
                    if (!matsForGoalIds.has(upgradeId)) {
                        return false;
                    }
                    const mat = remainingMats[upgradeId];
                    if (!mat) {
                        return false;
                    }
                    const { stillNeededForGoal } = this.getRemainingNeededForGoal(
                        upgradeId,
                        mat,
                        inventory,
                        goals,
                        goal.goalId,
                        remainingNeededCache
                    );
                    return stillNeededForGoal > 0;
                });

                let sortedCandidateLocs: ICampaignBattleComposed[];

                if (precomputedState) {
                    precomputedState.locs = candidateLocs;
                    const needsResort =
                        !precomputedState.sortedLocs ||
                        [...precomputedState.upgradeIds].some(
                            upgradeId =>
                                (precomputedState.lastInventoryByUpgrade?.get(upgradeId) ?? 0) !==
                                (inventory[upgradeId] ?? 0)
                        );

                    if (needsResort) {
                        sortedCandidateLocs = this.sortLocationsForRaiding(
                            candidateLocs,
                            goals,
                            remainingMats,
                            inventory,
                            settings,
                            remainingNeededCache
                        );
                        precomputedState.sortedLocs = sortedCandidateLocs;
                        precomputedState.lastInventoryByUpgrade = new Map(
                            [...precomputedState.upgradeIds].map(upgradeId => [upgradeId, inventory[upgradeId] ?? 0])
                        );
                    } else {
                        const candidateIds = new Set(candidateLocs.map(loc => loc.id));
                        const previousSorted = precomputedState.sortedLocs ?? [];
                        sortedCandidateLocs = previousSorted.filter(loc => candidateIds.has(loc.id));
                        precomputedState.sortedLocs = sortedCandidateLocs;
                    }
                } else {
                    sortedCandidateLocs = this.sortLocationsForRaiding(
                        candidateLocs,
                        goals,
                        remainingMats,
                        inventory,
                        settings,
                        remainingNeededCache
                    );
                }

                for (const loc of sortedCandidateLocs) {
                    if (energy < minEnergy) break;
                    const raidKey = `${loc.rewards.potential[0].id}::${goal.goalId}`;
                    energy = this.raidLocation(
                        day,
                        energy,
                        inventory,
                        loc,
                        remainingMats,
                        goals,
                        goal.goalId,
                        { raidKey, goal: { goalId: goal.goalId, unitId: goal.unitId } },
                        remainingNeededCache
                    );
                }
                if (energy < maxEnergy) locs = locs.filter(loc => loc.energyCost <= energy);
            }
        }
    }

    /**
     * Adds a raid entry for a single location, updating the day's raids, inventory, and energy.
     *
     * @param day - The day being planned.
     * @param energy - Remaining energy before this raid.
     * @param inventory - Inventory counts to update with farmed items.
     * @param loc - The campaign location to raid.
     * @param needed - Remaining materials needed for this location's material.
     * @param mat - Combined upgrade info for this material.
     * @param upgradeId - The material ID to update.
     * @param goals - Active goals used for priority-based planning.
     * @param goalId - The specific goal ID being targeted, if any.
     * @returns The remaining energy after raiding this location.
     */
    public static addRaidForLocation(
        day: IUpgradesRaidsDay,
        energy: number,
        inventory: Record<string, number>,
        loc: ICampaignBattleComposed,
        needed: number,
        mat: ICombinedUpgrade,
        upgradeId: string,
        goals: Array<ICharacterUpgradeRankGoal | ICharacterUpgradeMow | ICharacterAscendGoal | ICharacterUnlockGoal>,
        goalId: string | undefined,
        options: { raidKey?: string; goal?: { goalId: string; unitId: string } } | undefined,
        remainingNeededCache: Map<
            string,
            { neededByHigherPriorityGoals: number; stillNeededForGoal: number; totalRemaining: number }
        >
    ): number {
        const raidKey = options?.raidKey ?? upgradeId;
        const existingRaid = day.raids.find(raid => raid.id === raidKey);
        const existingRaidLoc = existingRaid?.raidLocations.find(raidLoc => raidLoc.id === loc.id);
        const totalRaidsForLocation = day.raids
            .flatMap(raid => raid.raidLocations)
            .filter(raidLoc => raidLoc.id === loc.id)
            .reduce((sum, raidLoc) => sum + raidLoc.raidsAlreadyPerformed + raidLoc.raidsToPerform, 0);
        const raidsAlreadyDone = existingRaidLoc
            ? Math.max(totalRaidsForLocation - (existingRaidLoc.raidsToPerform ?? 0), 0)
            : totalRaidsForLocation;
        const remainingAttempts = Math.max(
            Math.min(loc.dailyBattleCount - raidsAlreadyDone, Math.floor(energy / loc.energyCost)),
            0
        );
        const raidsNeeded = Math.ceil(needed / loc.dropRate);
        const raidsToPerform = Math.max(0, Math.min(remainingAttempts, raidsNeeded));
        if (raidsToPerform <= 0) return energy;
        const toAdd = raidsToPerform * loc.dropRate;
        const raidLoc: IItemRaidLocation = {
            ...loc,
            raidsAlreadyPerformed: raidsAlreadyDone,
            raidsToPerform: raidsToPerform,
            farmedItems: Math.floor(toAdd),
            energySpent: raidsToPerform * loc.energyCost,
            isShardsLocation: upgradeId.startsWith('shards_') || upgradeId.startsWith('mythicShards_'),
        };
        if (existingRaid === undefined) {
            const relatedCharacters = options?.goal ? [options.goal.unitId] : mat.relatedCharacters;
            const relatedGoals = options?.goal ? [options.goal.goalId] : mat.relatedGoals;
            const requiredCount = options?.goal
                ? (mat.countByGoalId[options.goal.goalId] ?? 0)
                : sum(Object.values(mat.countByGoalId));
            const countByGoalId = options?.goal
                ? { [options.goal.goalId]: mat.countByGoalId[options.goal.goalId] ?? 0 }
                : { ...mat.countByGoalId };
            const inInventory = inventory[upgradeId] ?? 0;
            const acquiredCount =
                inInventory -
                this.getRemainingNeededForGoal(upgradeId, mat, inventory, goals, goalId, remainingNeededCache)
                    .neededByHigherPriorityGoals;
            day.raids.push({
                raidLocations: [raidLoc],
                energyTotal: raidLoc.energySpent,
                energyLeft: energy - raidLoc.energySpent,
                daysTotal: -1,
                raidsTotal: raidLoc.raidsToPerform,
                acquiredCount: Math.max(0, acquiredCount),
                requiredCount,
                relatedCharacters,
                relatedGoals,
                isBlocked: false,
                isFinished: false,
                id: raidKey,
                snowprintId: mat.snowprintId,
                label: mat.label,
                rarity: mat.rarity,
                iconPath: mat.iconPath,
                locations: mat.locations,
                crafted: mat.crafted,
                stat: mat.stat,
                countByGoalId,
            } as IUpgradeRaid);
        } else {
            if (existingRaidLoc) {
                existingRaidLoc.raidsAlreadyPerformed = raidsAlreadyDone;
                existingRaidLoc.raidsToPerform += raidLoc.raidsToPerform;
                existingRaidLoc.farmedItems += raidLoc.farmedItems;
                existingRaidLoc.energySpent += raidLoc.energySpent;
            } else {
                existingRaid.raidLocations.push(raidLoc);
            }
            existingRaid.energyTotal += raidLoc.energySpent;
            existingRaid.raidsTotal += raidLoc.raidsToPerform;
            const relatedCharacters = options?.goal ? [options.goal.unitId] : mat.relatedCharacters;
            const relatedGoals = options?.goal ? [options.goal.goalId] : mat.relatedGoals;
            existingRaid.relatedCharacters = uniq([...existingRaid.relatedCharacters, ...relatedCharacters]);
            existingRaid.relatedGoals = uniq([...existingRaid.relatedGoals, ...relatedGoals]);
            if (options?.goal) {
                if (!existingRaid.countByGoalId) {
                    existingRaid.countByGoalId = {
                        [options.goal.goalId]: mat.countByGoalId[options.goal.goalId] ?? 0,
                    };
                }
            } else if (!existingRaid.countByGoalId) {
                existingRaid.countByGoalId = { ...mat.countByGoalId };
            }
        }
        inventory[upgradeId] = (inventory[upgradeId] ?? 0) + toAdd;
        return energy - raidsToPerform * loc.energyCost;
    }

    /**
     * Plans a raid for a location, applying goal-priority rules when a goal is provided.
     *
     * @param day - The day being planned.
     * @param energy - Remaining energy before this raid.
     * @param inventory - Inventory counts to update with farmed items.
     * @param loc - The campaign location to raid.
     * @param remainingMats - Remaining materials mapped by upgrade ID.
     * @param goals - All active goals (used for priority comparisons).
     * @param goalId - Optional goal ID to apply priority-based remaining logic.
     * @returns The remaining energy after attempting this raid.
     */
    public static raidLocation(
        day: IUpgradesRaidsDay,
        energy: number,
        inventory: Record<string, number>,
        loc: ICampaignBattleComposed,
        remainingMats: Record<string, ICombinedUpgrade>,
        goals: Array<ICharacterUpgradeRankGoal | ICharacterUpgradeMow | ICharacterAscendGoal | ICharacterUnlockGoal>,
        goalId: string | undefined,
        options: { raidKey?: string; goal?: { goalId: string; unitId: string } } | undefined,
        remainingNeededCache: Map<
            string,
            { neededByHigherPriorityGoals: number; stillNeededForGoal: number; totalRemaining: number }
        > = new Map()
    ): number {
        if (energy < loc.energyCost) return energy;
        const upgradeId = loc.rewards.potential[0].id;
        const mat = remainingMats[upgradeId];
        if (mat === undefined) {
            console.error('Material', upgradeId, 'not found for location:', loc);
            return energy;
        }
        if (goalId) {
            const { neededByHigherPriorityGoals, stillNeededForGoal } = this.getRemainingNeededForGoal(
                upgradeId,
                mat,
                inventory,
                goals,
                goalId,
                remainingNeededCache
            );
            if (stillNeededForGoal <= 0) return energy;
            if (neededByHigherPriorityGoals + (mat.countByGoalId[goalId] ?? 0) <= (inventory[upgradeId] ?? 0)) {
                return energy;
            }
            return this.addRaidForLocation(
                day,
                energy,
                inventory,
                loc,
                stillNeededForGoal,
                mat,
                upgradeId,
                goals,
                goalId,
                options,
                remainingNeededCache
            );
        }
        if (mat.requiredCount <= (inventory[upgradeId] ?? 0)) {
            return energy;
        }
        const remainingNeeded = this.getRemainingNeededForGoal(
            upgradeId,
            mat,
            inventory,
            goals,
            undefined,
            remainingNeededCache
        ).totalRemaining;
        if (remainingNeeded <= 0) return energy;
        return this.addRaidForLocation(
            day,
            energy,
            inventory,
            loc,
            remainingNeeded,
            mat,
            upgradeId,
            goals,
            undefined,
            options,
            remainingNeededCache
        );
    }

    /**
     * Computes remaining counts for an upgrade relative to a specific goal and overall totals.
     *
     * @param upgradeId - The upgrade material ID to evaluate.
     * @param mat - The combined upgrade data for this material.
     * @param inventory - Current inventory counts keyed by upgrade ID.
     * @param goals - All active goals (used for priority comparisons).
     * @param goalId - The goal to compute remaining needs for; if undefined, returns totals only.
     * @returns Remaining counts for higher-priority goals, the specified goal, and overall total.
     */
    public static getRemainingNeededForGoal(
        upgradeId: string,
        mat: ICombinedUpgrade,
        inventory: Record<string, number>,
        goals: Array<ICharacterUpgradeRankGoal | ICharacterUpgradeMow | ICharacterAscendGoal | ICharacterUnlockGoal>,
        goalId: string | undefined,
        cache?: Map<string, { neededByHigherPriorityGoals: number; stillNeededForGoal: number; totalRemaining: number }>
    ): { neededByHigherPriorityGoals: number; stillNeededForGoal: number; totalRemaining: number } {
        const available = inventory[upgradeId] ?? 0;
        const totalRemaining = Math.max(mat.requiredCount - available, 0);

        if (!goalId) {
            const cacheKey = `total:${upgradeId}|${available}`;
            const fullyCached = cache?.get(cacheKey);
            if (fullyCached) return fullyCached;

            const returnValue = {
                neededByHigherPriorityGoals: 0,
                stillNeededForGoal: totalRemaining,
                totalRemaining,
            };
            if (cache) cache.set(cacheKey, returnValue);
            return returnValue;
        }

        // neededByHigherPriorityGoals depends only on goal priorities and mat.countByGoalId,
        // NOT on current inventory.  The original cache key encoded inventory, so this value
        // was recomputed from scratch on every single inventory change during raid simulation —
        // the pathological O(goals²) case seen in the profiler.
        // Fix: cache it under an inventory-free key so it is computed only once per
        // (upgradeId, goalId) pair for the entire planning pass.
        const hpgKey = `hpg:${upgradeId}|${goalId}`;
        let neededByHigherPriorityGoals = cache?.get(hpgKey)?.neededByHigherPriorityGoals;
        if (neededByHigherPriorityGoals === undefined) {
            const currentPriority = this.getGoalPriorityById(goals).get(goalId) ?? Number.POSITIVE_INFINITY;
            const priorityByGoalId = this.getGoalPriorityById(goals);
            let total = 0;
            for (const [otherGoalId, count] of Object.entries(mat.countByGoalId)) {
                const otherPriority = priorityByGoalId.get(otherGoalId);
                if (otherPriority !== undefined && otherPriority < currentPriority) {
                    total += count;
                }
            }
            neededByHigherPriorityGoals = total;
            if (cache) cache.set(hpgKey, { neededByHigherPriorityGoals, stillNeededForGoal: 0, totalRemaining: 0 });
        }

        const cacheKey = `goal:${upgradeId}|${goalId}|${available}`;
        const fullyCached = cache?.get(cacheKey);
        if (fullyCached) return fullyCached;

        const stillNeededForGoal = Math.max(
            (mat.countByGoalId[goalId] ?? 0) - Math.max(available - neededByHigherPriorityGoals, 0),
            0
        );
        const result = { neededByHigherPriorityGoals, stillNeededForGoal, totalRemaining };
        if (cache) cache.set(cacheKey, result);
        return result;
    }

    /**
     * Returns the highest-priority goal ID that still needs the specified material.
     *
     * This accounts for inventory already applied to higher-priority goals so we don’t
     * select a goal whose material needs are already satisfied.
     */
    public static getHighestPriorityGoalIdNeedingMaterial(
        upgradeId: string,
        combinedBaseMaterials: Record<string, ICombinedUpgrade>,
        inventory: Record<string, number>,
        goals: Array<ICharacterUpgradeRankGoal | ICharacterUpgradeMow | ICharacterAscendGoal | ICharacterUnlockGoal>,
        cache?: Map<string, { neededByHigherPriorityGoals: number; stillNeededForGoal: number; totalRemaining: number }>
    ): string | undefined {
        const mat = combinedBaseMaterials[upgradeId];
        if (!mat) return undefined;
        const priorityByGoalId = this.getGoalPriorityById(goals);
        let selectedGoalId: string | undefined;
        let selectedPriority = Number.POSITIVE_INFINITY;

        for (const candidateGoalId of mat.relatedGoals) {
            const priority = priorityByGoalId.get(candidateGoalId);
            if (priority === undefined || priority >= selectedPriority) {
                continue;
            }

            const stillNeededForGoal = this.getRemainingNeededForGoal(
                upgradeId,
                mat,
                inventory,
                goals,
                candidateGoalId,
                cache
            ).stillNeededForGoal;

            if (stillNeededForGoal > 0) {
                selectedGoalId = candidateGoalId;
                selectedPriority = priority;
            }
        }

        return selectedGoalId;
    }

    /**
     * Returns the number of days it would take to farm the material rewarded by the given
     * location, assuming we dedicate all energy to raiding *all* suggested battles for that
     * material. If highestPriorityGoalId is provided, only counts the materials needed for
     * that goal, as opposed to all goals.
     */
    public static calculateDaysToCompleteMaterial(
        upgradeId: string,
        combinedBaseMaterials: Record<string, ICombinedUpgrade>,
        inventory: Record<string, number>,
        goals: Array<ICharacterUpgradeRankGoal | ICharacterUpgradeMow | ICharacterAscendGoal | ICharacterUnlockGoal>,
        highestPriorityGoalId: string | undefined,
        cache: Map<
            string,
            { neededByHigherPriorityGoals: number; stillNeededForGoal: number; totalRemaining: number }
        > = new Map()
    ): number {
        if (!combinedBaseMaterials[upgradeId]) return 0;
        const remaining = this.getRemainingNeededForGoal(
            upgradeId,
            combinedBaseMaterials[upgradeId],
            inventory,
            goals,
            highestPriorityGoalId,
            cache
        );
        const totalMatsNeeded = highestPriorityGoalId ? remaining.stillNeededForGoal : remaining.totalRemaining;
        const matsPerDay = combinedBaseMaterials[upgradeId].locations
            .filter(loc => loc.isSuggested)
            .map(loc => loc.energyPerDay / loc.energyPerItem)
            .reduce((accumulator, x) => accumulator + x, 0);
        return totalMatsNeeded / matsPerDay;
    }

    /**
     * Adds fields to each location indicating the goal ID of the highest priority related goal,
     * the priority of that goal, and the number of days it would take to farm the material from
     * all suggested locations. If the user chooses to sort by total materials, then we look at all
     * goals, not only the highest priority one.
     */
    public static tagLocationsWithGoalPriorityAndDaysToCompletion(
        locs: ICampaignBattleComposed[],
        goals: Array<ICharacterUpgradeRankGoal | ICharacterUpgradeMow | ICharacterAscendGoal | ICharacterUnlockGoal>,
        combinedBaseMaterials: Record<string, ICombinedUpgrade>,
        inventory: Record<string, number>,
        settings: IEstimatedRanksSettings,
        cache: Map<
            string,
            { neededByHigherPriorityGoals: number; stillNeededForGoal: number; totalRemaining: number }
        > = new Map()
    ): Array<TaggedLocation> {
        // Give everything a two-part priority. The first part is priority. If we're ordering by
        // goal priority, it's simply the priority of the most urgent goal to which this maps. If
        // we're ordering by total materials, then all materials will have the same priority (zero).
        const tagByUpgradeId = new Map<string, TaggedLocationMetadata>();
        const cachedMetadataByKey = this.getTaggedLocationMetadataCache(cache);
        const priorityByGoalId = this.getGoalPriorityById(goals);
        const isTotalMaterialsOrder =
            settings.preferences.farmPreferences?.order === IDailyRaidsFarmOrder.totalMaterials;

        return locs.map(loc => {
            const upgradeId = loc.rewards.potential[0].id;
            const cachedTag = tagByUpgradeId.get(upgradeId);
            if (cachedTag) {
                return { loc, ...cachedTag };
            }

            const available = inventory[upgradeId] ?? 0;
            const tagCacheKey = `${isTotalMaterialsOrder ? 'total' : 'goal'}:${upgradeId}|${available}`;
            const cachedMetadata = cachedMetadataByKey.get(tagCacheKey);
            if (cachedMetadata) {
                tagByUpgradeId.set(upgradeId, cachedMetadata);
                return { loc, ...cachedMetadata };
            }

            if (isTotalMaterialsOrder) {
                const tag = {
                    priority: undefined,
                    highestPriorityGoalId: undefined,
                    daysToComplete: this.calculateDaysToCompleteMaterial(
                        upgradeId,
                        combinedBaseMaterials,
                        inventory,
                        goals,
                        undefined,
                        cache
                    ),
                };
                tagByUpgradeId.set(upgradeId, tag);
                cachedMetadataByKey.set(tagCacheKey, tag);
                return { loc, ...tag };
            }

            const highestPriorityGoalId = this.getHighestPriorityGoalIdNeedingMaterial(
                upgradeId,
                combinedBaseMaterials,
                inventory,
                goals,
                cache
            );
            const tag = {
                priority: highestPriorityGoalId ? (priorityByGoalId.get(highestPriorityGoalId) ?? 0) : 0,
                highestPriorityGoalId,
                daysToComplete: this.calculateDaysToCompleteMaterial(
                    upgradeId,
                    combinedBaseMaterials,
                    inventory,
                    goals,
                    highestPriorityGoalId,
                    cache
                ),
            };
            tagByUpgradeId.set(upgradeId, tag);
            cachedMetadataByKey.set(tagCacheKey, tag);
            return { loc, ...tag };
        });
    }

    /**
     * Sorts locations for raiding based on the user's preferences and campaign progress. `locs`
     * is assumed to be the battles that can be raided.
     */
    public static sortLocationsForRaiding(
        locs: ICampaignBattleComposed[],
        goals: Array<ICharacterUpgradeRankGoal | ICharacterUpgradeMow | ICharacterAscendGoal | ICharacterUnlockGoal>,
        combinedBaseMaterials: Record<string, ICombinedUpgrade>,
        inventory: Record<string, number>,
        settings: IEstimatedRanksSettings,
        cache: Map<
            string,
            { neededByHigherPriorityGoals: number; stillNeededForGoal: number; totalRemaining: number }
        > = new Map()
    ): ICampaignBattleComposed[] {
        let taggedLocs = this.tagLocationsWithGoalPriorityAndDaysToCompletion(
            locs,
            goals,
            combinedBaseMaterials,
            inventory,
            settings,
            cache
        ).sort((a, b) => {
            // Sort by priority ascending (undefined treated as Infinity), then daysToComplete descending
            const aPriority = a.priority === undefined ? Number.POSITIVE_INFINITY : a.priority;
            const bPriority = b.priority === undefined ? Number.POSITIVE_INFINITY : b.priority;
            if (aPriority !== bPriority) {
                return aPriority - bPriority;
            }
            // daysToComplete descending
            if (a.daysToComplete !== b.daysToComplete) {
                return b.daysToComplete - a.daysToComplete;
            }
            return 0;
        });
        if (
            settings.preferences.farmPreferences?.homeScreenEvent === undefined ||
            settings.preferences.farmPreferences?.homeScreenEvent === IDailyRaidsHomeScreenEvent.none
        ) {
            // If we don't have a homescreen event, then we're done, locations are sorted in raiding order.
            return taggedLocs.map(x => x.loc);
        } else {
            const hsePointsPerUnit = (campaignType: CampaignType): number => {
                if (campaignType === CampaignType.Elite) return 5;
                return 3;
            };
            const orderingFields =
                settings.preferences.farmPreferences?.order === IDailyRaidsFarmOrder.totalMaterials
                    ? ['hsePoints', 'daysToComplete']
                    : ['priority', 'hsePoints', 'daysToComplete'];
            const orderingDirections = ['desc', 'asc', 'desc'] as const;
            switch (settings.preferences.farmPreferences.homeScreenEvent) {
                case IDailyRaidsHomeScreenEvent.purgeOrder: {
                    taggedLocs = taggedLocs.map(x => ({
                        ...x,
                        hsePoints:
                            (this.getNonSummonTyranidCount(x.loc) * hsePointsPerUnit(x.loc.campaignType)) /
                            x.loc.energyCost,
                    }));
                    break;
                }
                case IDailyRaidsHomeScreenEvent.warpSurge: {
                    taggedLocs = taggedLocs.map(x => ({
                        ...x,
                        hsePoints:
                            (this.getNonSummonChaosEnemyCount(x.loc) * hsePointsPerUnit(x.loc.campaignType)) /
                            x.loc.energyCost,
                    }));
                    break;
                }
                case IDailyRaidsHomeScreenEvent.machineHunt: {
                    // Machine hunt is old and as of 1.36, doesn't differentiate between elite and non-elite raiding.
                    taggedLocs = taggedLocs.map(x => ({
                        ...x,
                        hsePoints: this.getNonSummonMechanicalEnemyCount(x.loc) / x.loc.energyCost,
                    }));
                    break;
                }
                case IDailyRaidsHomeScreenEvent.trainingRush: {
                    taggedLocs = taggedLocs.map(x => ({
                        ...x,
                        hsePoints:
                            (this.getNonSummonEnemyCount(x.loc) * hsePointsPerUnit(x.loc.campaignType)) /
                            x.loc.energyCost,
                    }));
                    break;
                }
                default: {
                    break;
                }
            }
            return orderBy(taggedLocs, orderingFields, orderingDirections).map(x => x.loc);
        }
        return taggedLocs.map(x => x.loc);
    }

    /**
     * Returns true if the character can be onslaughted for non-mythic shards. This is true if the
     * user allows it, the character is unlocked, and the character is not yet at blue star.
     */
    public static canOnslaughtCharacterForRegularShards(
        unitId: string,
        chars: ICharacter2[],
        mows: IMow2[],
        goal: ICharacterAscendGoal
    ): boolean {
        const char = chars.find(char => unitId === char.snowprintId);
        if (char !== undefined) {
            return char.rank !== Rank.Locked && char.stars < RarityStars.OneBlueStar && goal.onslaughtShards > 0;
        }
        const mow = mows.find(mow => unitId === mow.snowprintId);
        return mow !== undefined && mow.stars < RarityStars.OneBlueStar && goal.onslaughtShards > 0 && mow.unlocked;
    }

    /**
     * Returns true if the character can be onslaughted for mythic shards. This is true if the
     * user allows it, the character is unlocked, and the character is at blue star or higher.
     */
    public static canOnslaughtCharacterForMythicShards(
        unitId: string,
        chars: ICharacter2[],
        mows: IMow2[],
        goal: ICharacterAscendGoal
    ): boolean {
        const char = chars.find(char => unitId === char.snowprintId);
        if (char !== undefined) {
            return char.rank !== Rank.Locked && char.stars >= RarityStars.OneBlueStar && goal.onslaughtMythicShards > 0;
        }
        const mow = mows.find(mow => unitId === mow.snowprintId);
        return (
            mow !== undefined && mow.stars >= RarityStars.OneBlueStar && goal.onslaughtMythicShards > 0 && mow.unlocked
        );
    }

    /** Used in reduce statements to select the most urgent goal (numerically lowest priority). */
    private static reduceGoalsByPriority(
        accumulator: ICharacterAscendGoal | undefined,
        goal: ICharacterAscendGoal
    ): ICharacterAscendGoal | undefined {
        if (accumulator === undefined || goal.priority < accumulator.priority) accumulator = goal;
        return accumulator;
    }

    /**
     * Computes the number of onslaught tokens needed to collect the required shards and mythic
     * shards for a goal.
     */
    public static getOnslaughtTokensForGoal(
        inventory: Record<string, number>,
        characters: ICharacter2[],
        mows: IMow2[],
        goal: ICharacterAscendGoal
    ): number {
        const shardData = this.getShardsForGoal(characters, mows, goal);
        const tokensForRegularShards = this.canOnslaughtCharacterForRegularShards(goal.unitId, characters, mows, goal)
            ? Math.ceil(
                  Math.max(0, shardData.totalIncrementalShardsNeeded - (inventory['shards_' + goal.unitId] ?? 0)) /
                      goal.onslaughtShards
              )
            : 0;
        const tokensForMythicShards = this.canOnslaughtCharacterForMythicShards(goal.unitId, characters, mows, goal)
            ? Math.ceil(
                  Math.max(
                      0,
                      shardData.totalIncrementalMythicShardsNeeded - (inventory['mythicShards_' + goal.unitId] ?? 0)
                  ) / goal.onslaughtMythicShards
              )
            : 0;
        return tokensForRegularShards + tokensForMythicShards;
    }

    /**
     * Finds the highest priority goal that can be onslaughted. Shards vs mythic shards
     * doesn't matter.
     */
    public static findHighestPriorityOnslaughtGoal(
        inventory: Record<string, number>,
        characters: ICharacter2[],
        mows: IMow2[],
        goals: ICharacterAscendGoal[]
    ): ICharacterAscendGoal | undefined {
        const shardGoal = goals
            .filter(goal => this.canOnslaughtCharacterForRegularShards(goal.unitId, characters, mows, goal))
            .filter(goal => this.getOnslaughtTokensForGoal(inventory, characters, mows, goal) > 0)
            .reduce(
                (accumulator, goal) => this.reduceGoalsByPriority(accumulator, goal),
                undefined as ICharacterAscendGoal | undefined
            );
        const mythicShardGoal = goals
            .filter(goal => this.canOnslaughtCharacterForMythicShards(goal.unitId, characters, mows, goal))
            .filter(goal => this.getOnslaughtTokensForGoal(inventory, characters, mows, goal) > 0)
            .reduce(
                (accumulator, goal) => this.reduceGoalsByPriority(accumulator, goal),
                undefined as ICharacterAscendGoal | undefined
            );
        const order = [shardGoal, mythicShardGoal].filter(x => x !== undefined).sort((a, b) => a.priority - b.priority);
        return order.length === 0 ? undefined : order[0];
    }

    /**
     * Returns the longest goal based on the number of onslaught tokens needed to satisfy both the
     * regular and mythic shards required for the goal. If the goal does not allow onslaught for
     * one or both types of shards, it is considered to require zero onslaught tokens for that type
     * of shard/those types of shards.
     */
    public static findLongestOnslaughtGoal(
        inventory: Record<string, number>,
        characters: ICharacter2[],
        mows: IMow2[],
        goals: ICharacterAscendGoal[]
    ): ICharacterAscendGoal | undefined {
        // First filter out any goals that need either type of shard but don't allow onslaught for
        // that type.
        return goals
            .map(goal => ({
                goal,
                tokens: this.getOnslaughtTokensForGoal(inventory, characters, mows, goal),
            }))
            .filter(x => x.tokens > 0)
            .sort((a, b) => b.tokens - a.tokens)[0]?.goal;
    }

    /** Returns our name for a custom onslaught location based on the shards reward. */
    public static getOnslaughtLocationId(upgradeId: string, index: number): string {
        return 'Onslaught-' + upgradeId + '-' + index;
    }

    public static isOnslaughtLocation(location: IItemRaidLocation): boolean {
        const comps = location.id.split('-');
        return (
            location.id.startsWith('Onslaught-') &&
            comps.length === 3 &&
            (comps[1].startsWith('shards_') || comps[1].startsWith('mythicShards_'))
        );
    }

    /** Cobbles together an IItemRaidLocation for an onslaught battle. */
    public static createOnslaughtLocation(
        upgradeId: string,
        count: number,
        upgradeType: 'Shard' | 'Mythic Shard',
        index: number
    ): IItemRaidLocation {
        return {
            raidsAlreadyPerformed: 0,
            raidsToPerform: 1,
            farmedItems: count,
            energySpent: 0,
            isShardsLocation: true,
            id: this.getOnslaughtLocationId(upgradeId, index),
            campaign: Campaign.Onslaught,
            campaignType: CampaignType.Onslaught,
            energyCost: 0,
            dailyBattleCount: 1,
            dropRate: 0,
            energyPerItem: 0,
            itemsPerDay: 0,
            energyPerDay: 0,
            nodeNumber: index,
            rarity: '',
            rarityEnum: upgradeType,
            rewards: {
                guaranteed: [],
                potential: [{ id: upgradeId, chance_numerator: 1, chance_denominator: 0, effective_rate: count }],
            },
            enemiesFactions: ['Tyranids'],
            enemiesAlliances: [Alliance.Xenos],
            enemyPower: 0,
            alliesFactions: [],
            alliesAlliance: Alliance.Xenos,
            enemiesTotal: 0,
            enemiesTypes: [],
            isSuggested: true,
            isUnlocked: true,
            isPassFilter: true,
            isCompleted: false,
            isStarted: false,
        };
    }

    /** Adds the daily onslaught battles to the specified day's raids plan. */
    public static addOnslaughtsForDay(
        day: IUpgradesRaidsDay,
        characters: ICharacter2[],
        mows: IMow2[],
        onslaughtTokens: number,
        goals: Array<ICharacterAscendGoal>,
        combinedBaseMaterials: Record<string, ICombinedUpgrade>,
        settings: IEstimatedRanksSettings,
        inventory: Record<string, number>
    ) {
        const onslaughts: Record<string, IItemRaidLocation[]> = {};
        const relatedGoals: Record<string, ICharacterAscendGoal[]> = {};
        if (goals.length === 0) return;
        let index = 0;
        // The original number of shards we had inventory. We use this instead of cloning the
        // entire inventory, which could be huge.
        const originalShards: Record<string, number> = {};
        while (onslaughtTokens > 0) {
            let goal = undefined;
            goal =
                settings.preferences.farmPreferences.order === IDailyRaidsFarmOrder.totalMaterials
                    ? this.findLongestOnslaughtGoal(inventory, characters, mows, goals)
                    : this.findHighestPriorityOnslaughtGoal(inventory, characters, mows, goals);
            if (goal === undefined) break;
            let upgradeId = '';
            let shards = 0;
            if (this.canOnslaughtCharacterForRegularShards(goal.unitId, characters, mows, goal)) {
                upgradeId = 'shards_' + goal.unitId;
                shards = goal.onslaughtShards;
            } else {
                // canOnslaughtCharacterForMythicShards must be true
                upgradeId = 'mythicShards_' + goal.unitId;
                shards = goal.onslaughtMythicShards;
            }

            const fractional = (inventory[upgradeId] ?? 0) - Math.floor(inventory[upgradeId] ?? 0);
            onslaughts[upgradeId] = (onslaughts[upgradeId] ?? []).concat(
                this.createOnslaughtLocation(upgradeId, Math.floor(shards + fractional), 'Shard', ++index)
            );
            relatedGoals[upgradeId] = [...(relatedGoals[upgradeId] ?? []), goal];
            if (!(upgradeId in originalShards)) {
                originalShards[upgradeId] = inventory[upgradeId] ?? 0;
            }
            inventory[upgradeId] = (inventory[upgradeId] ?? 0) + shards;
            day.onslaughtTokens++;
            onslaughtTokens--;
        }

        for (const [upgradeId, raids] of Object.entries(onslaughts)) {
            day.raids.push({
                raidLocations: raids,
                energyTotal: 0,
                energyLeft: 0,
                daysTotal: 0,
                raidsTotal: 0,
                acquiredCount: Math.floor(originalShards[upgradeId] ?? 0),
                requiredCount: Math.ceil(combinedBaseMaterials[upgradeId]?.requiredCount ?? 0),
                countByGoalId: { ...combinedBaseMaterials[upgradeId]?.countByGoalId },
                relatedCharacters: uniq(relatedGoals[upgradeId]?.map(goal => goal.unitId) ?? []),
                relatedGoals: uniq((relatedGoals[upgradeId] ?? []).map(goal => goal.goalId)),
                isBlocked: false,
                isFinished: false,
                id: upgradeId,
                snowprintId: upgradeId,
                label: 'Onslaught',
                rarity: 'Shard',
                iconPath: FsdUpgradesService.getUpgrade(raids[0].rewards.potential[0].id)?.iconPath ?? '',
                locations: raids,
                crafted: false,
                stat: 'Shard',
            });
        }
    }

    /**
     * Ensures that any raids the user has already completed today are reflected in the raiding
     * plans and reported via the UI.
     */
    public static handleFirstDayCompletedRaids(
        day: IUpgradesRaidsDay,
        settings: IEstimatedRanksSettings,
        combinedBaseMaterials: Record<string, ICombinedUpgrade>
    ) {
        let energySpent = 0;
        let nonRewardRaidIndex = 0;

        const raidsByMaterial = Object.entries(
            settings.completedLocations.reduce(
                (accumulator, loc) => {
                    const reward = CampaignsService.getRepeatableReward(loc.rewards);
                    if (reward.length === 0) {
                        accumulator['no-reward-' + nonRewardRaidIndex++] = [loc];
                    } else {
                        accumulator[reward] = [...(accumulator[reward] ?? []), loc];
                    }
                    return accumulator;
                },
                {} as Record<string, IItemRaidLocation[]>
            )
        );

        let raidIndex = 0;
        const raids: IUpgradeRaid[] = [];
        for (const [reward, locations] of raidsByMaterial) {
            const acquired = settings.upgrades[reward] ?? 0;
            const required = combinedBaseMaterials[reward]?.requiredCount ?? 0;
            const upgrade = FsdUpgradesService.getUpgrade(reward);
            const newLocations = locations.map(loc => ({ ...loc }));
            const raid: IUpgradeRaid = {
                id: `first-day-${reward}-${raidIndex++}`,
                snowprintId: reward,
                label: upgrade?.label ?? 'Unknown',
                rarity: upgrade?.rarity ?? 'Shard',
                iconPath: upgrade?.iconPath ?? '',
                locations: newLocations,
                raidLocations: newLocations,
                crafted: false,
                stat: 'Shard',
                energyTotal: sum(newLocations.map(loc => loc.raidsAlreadyPerformed * loc.energyCost)),
                energyLeft: 0,
                daysTotal: 1,
                raidsTotal: sum(newLocations.map(loc => loc.raidsAlreadyPerformed)),
                acquiredCount: acquired,
                requiredCount: required,
                countByGoalId: {},
                relatedCharacters: [],
                relatedGoals: [],
                isBlocked: false,
                isFinished: acquired >= required,
            };

            raids.push(raid);
            energySpent += sum(newLocations.map(loc => loc.energySpent));
        }
        day.raids = raids.concat(day.raids);
        day.energyTotal += energySpent;
        day.raidsTotal += sum(raids.map(raid => raid.raidsTotal));
    }

    private static getCurrentShardsForGoal(rarityStart: Rarity, starsStart: RarityStars): number {
        return SHARDS_AT_RARITY_AND_STARS[rarityStart][starsStart] ?? 0;
    }

    private static getCurrentMythicShardsForGoal(starsStart: RarityStars): number {
        return MYTHIC_SHARDS_AT_RARITY_AND_STARS[starsStart] ?? 0;
    }

    /**
     * Returns the current total number of shards the unit has, where locked with no shards is
     * zero, and legendary blue star is 1400.
     */
    private static getCurrentShards(
        chars: ICharacter2[],
        mows: IMow2[],
        goal: ICharacterAscendGoal | ICharacterUnlockGoal
    ): number {
        const unit = chars.find(x => x.snowprintId === goal.unitId) || mows.find(x => x.snowprintId === goal.unitId);
        const rank = unit && 'rank' in unit ? (unit?.rank ?? Rank.Locked) : Rank.Locked;
        const currentShards = unit ? (unit.shards ?? 0) : 0;
        if (goal.type === PersonalGoalType.Unlock || rank === Rank.Locked) {
            return currentShards;
        } else if (goal.type === PersonalGoalType.Ascend) {
            const shardsAtStartOfGoal = this.getCurrentShardsForGoal(
                Math.max(goal.rarityStart, unit?.rarity ?? Rarity.Common),
                Math.max(goal.starsStart, unit?.stars ?? RarityStars.None)
            );
            if (goal.rarityStart <= (unit?.rarity ?? 0) && goal.starsStart <= (unit?.stars ?? 0)) {
                return currentShards + shardsAtStartOfGoal;
            }
            return shardsAtStartOfGoal;
        }
        throw new Error('Unsupported goal type: ' + goal);
    }

    /**
     * Returns the current total number of shards the unit has, where non-mythic with no mythic
     * shards is zero, and mythic wings is 200.
     */
    private static getCurrentMythicShards(
        chars: ICharacter2[],
        mows: IMow2[],
        goal: ICharacterAscendGoal | ICharacterUnlockGoal
    ): number {
        const unit = chars.find(x => x.snowprintId === goal.unitId) || mows.find(x => x.snowprintId === goal.unitId);
        const currentMythicShards = unit ? (unit.mythicShards ?? 0) : 0;
        if (goal.type === PersonalGoalType.Unlock) {
            return 0;
        } else if (goal.type === PersonalGoalType.Ascend) {
            const mythicShardsAtStartOfGoal = this.getCurrentMythicShardsForGoal(
                Math.max(goal.starsStart, unit?.stars ?? RarityStars.None)
            );
            if (goal.starsStart <= (unit?.stars ?? 0) || (unit?.rarity ?? Rarity.Common) < Rarity.Mythic) {
                return currentMythicShards + mythicShardsAtStartOfGoal;
            }
            return mythicShardsAtStartOfGoal;
        } else {
            throw new Error('Unsupported goal type: ' + goal);
        }
    }

    /**
     * Returns the total number of shards needed for the goal, e.g. Rare four stars is 130,
     * legendary blue star is 1400.
     */
    private static getTotalShardsNeededForGoal(
        chars: ICharacter2[],
        _mows: IMow2[],
        goal: ICharacterAscendGoal | ICharacterUnlockGoal
    ): number {
        const char = chars.find(x => x.snowprintId === goal.unitId);
        let goalRarity = Rarity.Common;
        let goalStars = RarityStars.None;
        if (goal.type === PersonalGoalType.Unlock) {
            goalRarity = char?.initialRarity ?? Rarity.Common; // MoWs always unlock at common.
            goalStars = INITIAL_STARS_FOR_RARITY[goalRarity] ?? RarityStars.None;
        } else {
            goalRarity = goal.rarityEnd;
            goalStars = goal.starsEnd;
        }
        return SHARDS_AT_RARITY_AND_STARS[goalRarity][goalStars] ?? 0;
    }

    /**
     * Returns the total number of mythic shards needed for the goal, which is only relevant for ascension goals
     * that end at mythic or higher, and ranges from 20 for one blue star to 200 for mythic wings.
     */
    private static getTotalMythicShardsNeededForGoal(goal: ICharacterAscendGoal | ICharacterUnlockGoal): number {
        if (goal.type === PersonalGoalType.Unlock) return 0;
        if (goal.rarityEnd < Rarity.Mythic) return 0;
        return MYTHIC_SHARDS_AT_RARITY_AND_STARS[goal.starsEnd] ?? 0;
    }

    /** Returns the number of incremental shards this unit has over its current rarity and stars. */
    private static getIncrementalShards(
        chars: ICharacter2[],
        mows: IMow2[],
        goal: ICharacterAscendGoal | ICharacterUnlockGoal
    ): number {
        const unit = chars.find(x => x.snowprintId === goal.unitId) ?? mows.find(x => x.snowprintId === goal.unitId);
        if (!unit) return 0;
        return unit.shards;
    }

    /** Returns the number of incremental mythic shards this unit has over its current rarity and stars. */
    private static getIncrementalMythicShards(
        chars: ICharacter2[],
        mows: IMow2[],
        goal: ICharacterAscendGoal | ICharacterUnlockGoal
    ): number {
        const unit = chars.find(x => x.snowprintId === goal.unitId) ?? mows.find(x => x.snowprintId === goal.unitId);
        if (!unit) return 0;
        return unit.mythicShards;
    }

    /**
     * Returns the total shards needed to hit the goal from the current character's rarity and
     * stars. A locked unit needs the full stars for the target. Unlocked units need fewer than
     * total shards. For example, if a unit is currently at rare 4 stars (which requires 130
     * shards), and the goal is legendary blue star (which requires 1400 shards), then the
     * target incremental shards needed is 1400 - 130 = 1270.
     */
    private static getTargetIncrementalShardsForGoal(
        chars: ICharacter2[],
        mows: IMow2[],
        goal: ICharacterAscendGoal | ICharacterUnlockGoal
    ): number {
        const char = chars.find(x => x.snowprintId === goal.unitId);
        const mow = mows.find(x => x.snowprintId === goal.unitId);
        const unit = char ?? mow;
        if (!unit) return 0;
        if (goal.type === PersonalGoalType.Unlock) {
            return this.getTotalShardsNeededForGoal(chars, mows, goal);
        }
        const locked = char ? char.rank === Rank.Locked : !mow?.unlocked;
        if (locked) return this.getTotalShardsNeededForGoal(chars, mows, goal);
        const rarity = unit.rarity ?? Rarity.Common;
        const stars = unit.stars ?? RarityStars.None;
        const totalShardsNeeded = this.getTotalShardsNeededForGoal(chars, mows, goal);
        const shardsForCurrentRarityAndStars = SHARDS_AT_RARITY_AND_STARS[rarity]?.[stars] ?? 0;
        return Math.max(totalShardsNeeded - shardsForCurrentRarityAndStars, 0);
    }

    /**
     * Returns the total mythic shards needed to hit the goal from the current character's rarity
     * and stars. A locked unit needs the full stars for the target. Unlocked units need fewer than
     * total shards. For example, if a unit is currently at two blue stars (which requires 50
     * mythic shards), and the goal is mythic wings (which requires 200 mythic shards), then the
     * target incremental mythic shards needed is 200 - 50 = 150. Mythic shards are only
     * relevant for units that are mythic or higher, so if the unit is currently below mythic, then
     * the target incremental mythic shards needed is the full amount for the goal.
     */
    private static getTargetIncrementalMythicShardsForGoal(
        chars: ICharacter2[],
        mows: IMow2[],
        goal: ICharacterAscendGoal | ICharacterUnlockGoal
    ): number {
        if (goal.type === PersonalGoalType.Unlock) return 0;
        const char = chars.find(x => x.snowprintId === goal.unitId);
        const mow = mows.find(x => x.snowprintId === goal.unitId);
        const unit = char ?? mow;
        if (!unit) return 0;
        const locked = char ? char.rank === Rank.Locked : !mow?.unlocked;
        if (locked) return this.getTotalMythicShardsNeededForGoal(goal);
        const rarity = unit.rarity ?? Rarity.Common;
        const stars = unit.stars ?? RarityStars.None;
        if (rarity < Rarity.Mythic) return this.getTotalMythicShardsNeededForGoal(goal);
        const totalShardsNeeded = this.getTotalMythicShardsNeededForGoal(goal);
        const shardsForCurrentRarityAndStars = MYTHIC_SHARDS_AT_RARITY_AND_STARS[stars] ?? 0;
        return Math.max(totalShardsNeeded - shardsForCurrentRarityAndStars, 0);
    }

    public static getShardsForGoal(
        chars: ICharacter2[],
        mows: IMow2[],
        goal: ICharacterAscendGoal | ICharacterUnlockGoal
    ): IUnitShards {
        return {
            shardName: `shards_${goal.unitId}`,
            mythicShardName: `mythicShards_${goal.unitId}`,
            incrementalShardsAcquired: this.getIncrementalShards(chars, mows, goal),
            totalIncrementalShardsNeeded: this.getTargetIncrementalShardsForGoal(chars, mows, goal),
            shardsAcquired: this.getCurrentShards(chars, mows, goal),
            totalShardsNeeded: this.getTotalShardsNeededForGoal(chars, mows, goal),
            incrementalMythicShardsAcquired: this.getIncrementalMythicShards(chars, mows, goal),
            totalIncrementalMythicShardsNeeded: this.getTargetIncrementalMythicShardsForGoal(chars, mows, goal),
            mythicShardsAcquired: this.getCurrentMythicShards(chars, mows, goal),
            totalMythicShardsNeeded: this.getTotalMythicShardsNeededForGoal(goal),
        };
    }

    /**
     * Computes and returns a list of unit upgrades, one per goal, based on the provided inventory and goal definitions.
     *
     * This method processes each goal, determines the required upgrade ranks, filters upgrades by rarity if specified,
     * and aggregates related upgrades for each goal. The result is an array of unit upgrade objects, each containing
     * details about the goal, the unit, the required upgrades, and related upgrades.
     *
     * @param inventoryUpgrades - A record mapping upgrade IDs to their quantities in the user's inventory.
     * @param chars - An array of character data to consider for the upgrades.
     * @param mows - An array of mow data to consider for the upgrades.
     * @param goals - An array of character upgrade rank or mow upgrade goals to process.
     * @returns An array of `IUnitUpgrade` objects, each representing the upgrade requirements and related data for a goal.
     */
    public static getUpgrades(
        inventoryUpgrades: Record<string, number>,
        chars: ICharacter2[],
        mows: IMow2[],
        goals: Array<ICharacterUpgradeRankGoal | ICharacterUpgradeMow | ICharacterAscendGoal | ICharacterUnlockGoal>
    ): IUnitUpgrade[] {
        const result: IUnitUpgrade[] = [];
        const clonedUpgrades = { ...inventoryUpgrades };
        for (const goal of goals) {
            const upgradeRanks =
                (() => {
                    switch (goal.type) {
                        case PersonalGoalType.UpgradeRank: {
                            return CharacterUpgradesService.getCharacterUpgradeRank(goal);
                        }
                        case PersonalGoalType.MowAbilities: {
                            return this.getMowUpgradeRank(goal);
                        }
                        default: {
                            return undefined;
                        }
                    }
                })()?.filter(x => x != undefined) ?? [];
            const upgradeShards = (() => {
                switch (goal.type) {
                    case PersonalGoalType.Ascend:
                    case PersonalGoalType.Unlock: {
                        return this.getShardsForGoal(chars, mows, goal);
                    }
                    default: {
                        return undefined;
                    }
                }
            })();
            const baseUpgradesTotal: Record<string, number> = this.getBaseUpgradesTotal(
                upgradeRanks,
                upgradeShards,
                clonedUpgrades
            );

            if ('upgradesRarity' in goal && goal.upgradesRarity && goal.upgradesRarity.length > 0) {
                // remove upgrades that do not match to selected rarities
                for (const upgradeId in baseUpgradesTotal) {
                    const upgradeData = FsdUpgradesService.baseUpgradesData[upgradeId];
                    if (
                        upgradeData.rarity !== 'Shard' &&
                        upgradeData.rarity !== 'Mythic Shard' &&
                        !goal.upgradesRarity.includes(upgradeData.rarity)
                    ) {
                        delete baseUpgradesTotal[upgradeId];
                    }
                }
            }

            const relatedUpgrades: string[] = upgradeRanks.flatMap(x => {
                const result: string[] = [...x.upgrades];
                const upgrades: Array<IBaseUpgrade | ICraftedUpgrade> = x.upgrades
                    .map(upgrade => FsdUpgradesService.getUpgrade(upgrade))
                    .filter(x => !!x);
                for (const upgrade of upgrades) {
                    if (upgrade.crafted) {
                        result.push(...upgrade.baseUpgrades.map(x => x.id));
                        result.push(...upgrade.craftedUpgrades.map(x => x.id));
                    }
                }

                return result;
            });

            result.push({
                goalId: goal.goalId,
                unitId: goal.unitId,
                label: goal.unitName,
                upgradeRanks,
                upgradeShards,
                baseUpgradesTotal,
                relatedUpgrades,
            });
        }
        return result;
    }

    /**
     * @param rankLookup The start and end ability level of the goal, as well as any
     *                   materials that have already been applied.
     * @returns The number of each upgrade material necessary to level up the
     *          abilities.
     */
    public static getMowUpgradeRank(rankLookup: ICharacterUpgradeMow): IUnitUpgradeRank[] {
        const primaryUpgrades = MowsService.getUpgradesRaw(
            rankLookup.unitId,
            rankLookup.primaryStart,
            rankLookup.primaryEnd,
            'primary'
        );
        const secondaryUpgrades = MowsService.getUpgradesRaw(
            rankLookup.unitId,
            rankLookup.secondaryStart,
            rankLookup.secondaryEnd,
            'secondary'
        );

        return [
            {
                rankStart: Rank.Diamond3,
                rankEnd: Rank.Diamond3,
                upgrades: [...primaryUpgrades, ...secondaryUpgrades],
                rankPoint5: false,
                startRankPoint5: false,
            },
        ];
    }

    private static resolveUnitIdToShortName(id: string): string {
        const char = CharactersService.getUnit(id);
        if (char?.shortName) return char.shortName;
        const mow2 = MowsService.resolveToStatic(id);
        if (mow2) {
            // Prefer legacy shortName if available, else use new static name
            const mowLegacy = MowsService.resolveOldIdToStatic(id);
            const legacyShort = (mowLegacy as any)?.shortName as string | undefined;
            return legacyShort ?? mow2.name;
        }
        return id;
    }

    private static getTotalEstimates(
        upgrades: Record<string, ICombinedUpgrade>,
        inventoryUpgrades: Record<string, number>
    ): ICharacterUpgradeEstimate[] {
        const result: ICharacterUpgradeEstimate[] = [];

        for (const upgradeId in upgrades) {
            const upgrade = upgrades[upgradeId];
            const requiredCount = upgrade.requiredCount;
            const acquiredCount = inventoryUpgrades[upgradeId] ?? 0;

            const estimate = this.getUpgradeEstimate(upgrade, requiredCount, acquiredCount);

            result.push(estimate);
        }

        for (const est of result) {
            est.relatedCharacters = est.relatedCharacters.map(id => this.resolveUnitIdToShortName(id));
        }
        return orderBy(result, ['daysTotal', 'energyTotal'], ['desc', 'desc']);
    }

    private static getGoalPriorityEstimates(
        upgrades: Record<string, ICombinedUpgrade>,
        inventoryUpgrades: Record<string, number>,
        goals: Array<ICharacterUpgradeRankGoal | ICharacterUpgradeMow | ICharacterAscendGoal | ICharacterUnlockGoal>,
        chars: ICharacter2[],
        mows: IMow2[]
    ): ICharacterUpgradeEstimate[] {
        const sortedGoals = orderBy(goals, ['priority'], ['asc']);
        const goalPriorityMap = new Map(sortedGoals.map(goal => [goal.goalId, goal.priority]));
        const result: ICharacterUpgradeEstimate[] = [];

        for (const upgradeId in upgrades) {
            const upgrade = upgrades[upgradeId];
            let available = inventoryUpgrades[upgradeId] ?? 0;

            for (const goal of sortedGoals) {
                const requiredCount = upgrade.countByGoalId[goal.goalId];
                if (!requiredCount) continue;

                const acquiredCount = Math.min(available, requiredCount);
                available = Math.max(available - acquiredCount, 0);

                const perGoalUpgrade: ICombinedUpgrade = {
                    ...upgrade,
                    requiredCount,
                    countByGoalId: { [goal.goalId]: requiredCount },
                    relatedGoals: [goal.goalId],
                    relatedCharacters: [goal.unitId],
                };

                const estimate = this.getUpgradeEstimate(perGoalUpgrade, requiredCount, acquiredCount);
                if (estimate.isBlocked && (this.isShard(upgradeId) || this.isMythicShard(upgradeId))) {
                    const ascendGoal =
                        goal.type === PersonalGoalType.Ascend ? (goal as ICharacterAscendGoal) : undefined;
                    if (
                        ascendGoal &&
                        ((this.isShard(upgradeId) &&
                            this.canOnslaughtCharacterForRegularShards(ascendGoal.unitId, chars, mows, ascendGoal)) ||
                            (this.isMythicShard(upgradeId) &&
                                this.canOnslaughtCharacterForMythicShards(ascendGoal.unitId, chars, mows, ascendGoal)))
                    ) {
                        estimate.isBlocked = false;
                    }
                }
                estimate.relatedCharacters = estimate.relatedCharacters.map(id => this.resolveUnitIdToShortName(id));
                result.push(estimate);
            }
        }

        return orderBy(
            result,
            [
                estimate => goalPriorityMap.get(estimate.relatedGoals[0]) ?? Number.POSITIVE_INFINITY,
                'daysTotal',
                'energyTotal',
            ],
            ['asc', 'desc', 'desc']
        );
    }

    /**
     * Calculates the estimated resources and time required to farm a specific upgrade material.
     *
     * This method simulates a daily farming process across user-selected locations to determine
     * the total energy, number of raids, and days needed to acquire the required amount of an upgrade item.
     * It handles cases where the goal is already met (`isFinished`) or cannot be progressed due to a lack of
     * available farming locations (`isBlocked`).
     *
     * @param {ICombinedUpgrade} upgrade - The upgrade item to be estimated, containing its properties and potential farming locations.
     * @param {number} requiredCount - The total number of the upgrade item needed.
     * @param {number} acquiredCount - The number of the upgrade item the user already has.
     * @returns {ICharacterUpgradeEstimate} An object containing the original upgrade data plus the calculated
     * estimates for days, raids, and energy required to obtain the remaining items.
     */
    private static getUpgradeEstimate(
        upgrade: ICombinedUpgrade,
        requiredCount: number,
        acquiredCount: number
    ): ICharacterUpgradeEstimate {
        const { id, snowprintId, label, rarity, iconPath, locations, relatedCharacters, relatedGoals } = upgrade;

        const selectedLocations = locations.filter(x => x.isSuggested);

        const leftCount = Math.max(requiredCount - acquiredCount, 0);

        const estimate: ICharacterUpgradeEstimate = {
            id,
            snowprintId,
            label,
            rarity,
            iconPath,
            locations,
            acquiredCount,
            requiredCount,
            relatedCharacters,
            relatedGoals,
            daysTotal: 0,
            raidsTotal: 0,
            energyTotal: 0,
            energyLeft: 0,
            isBlocked: selectedLocations.length === 0 && leftCount > 0,
            isFinished: leftCount === 0,
            crafted: false,
            stat: upgrade.stat,
        };

        if (estimate.isFinished || estimate.isBlocked) {
            return estimate;
        }

        let energyTotal = 0;
        let raidsTotal = 0;
        let farmedItems = 0;
        let daysTotal = 0;

        while (farmedItems < leftCount) {
            let leftToFarm = leftCount - farmedItems;
            for (const loc of selectedLocations) {
                const dailyEnergy = loc.dailyBattleCount * loc.energyCost;
                const dailyFarmedItems = dailyEnergy / loc.energyPerItem;
                if (leftToFarm >= dailyFarmedItems) {
                    leftToFarm -= dailyFarmedItems;
                    energyTotal += dailyEnergy;
                    farmedItems += dailyFarmedItems;
                    raidsTotal += loc.dailyBattleCount;
                } else {
                    const energyLeftToFarm = leftToFarm * loc.energyPerItem;
                    const battlesLeftToFarm = Math.ceil(energyLeftToFarm / loc.energyCost);
                    farmedItems += leftToFarm;
                    energyTotal += battlesLeftToFarm * loc.energyCost;
                    raidsTotal += battlesLeftToFarm;
                    break;
                }
            }
            daysTotal++;
            if (daysTotal > 1000) {
                console.error('Infinite loop', id, selectedLocations);
                break;
            }
        }

        estimate.daysTotal = daysTotal;
        estimate.raidsTotal = raidsTotal;
        estimate.energyTotal = energyTotal;
        estimate.energyLeft = energyTotal;

        return estimate;
    }

    /**
     * Aggregates base upgrade materials across multiple character upgrades into a single lookup by upgrade ID.
     *
     * @remarks
     * - The returned object is keyed by `upgradeId` and accumulates a `requiredCount` sum across all characters.
     * - `countByGoalId` is accumulated per character using `character.goalId`.
     * - `relatedCharacters` and `relatedGoals` are de-duplicated via `includes` checks.
     * - The method assumes `FsdUpgradesService.baseUpgradesData[upgradeId]` exists; missing entries will
     *   spread `undefined` properties into the combined object.
     *
     * @param charactersUpgrades - The list of character upgrades whose `baseUpgradesTotal` counts will be merged.
     * @returns A record mapping upgrade IDs to combined upgrade data including totals and relationships.
     */
    public static combineBaseMaterials(charactersUpgrades: IUnitUpgrade[]): Record<string, ICombinedUpgrade> {
        const result: Record<string, ICombinedUpgrade> = {};
        for (const character of charactersUpgrades) {
            for (const upgradeId in character.baseUpgradesTotal) {
                const upgradeCount = character.baseUpgradesTotal[upgradeId];

                const combinedUpgrade: ICombinedUpgrade = result[upgradeId] ?? {
                    ...FsdUpgradesService.baseUpgradesData[upgradeId],
                    requiredCount: 0,
                    countByGoalId: {},
                    relatedCharacters: [],
                    relatedGoals: [],
                };

                combinedUpgrade.requiredCount += upgradeCount;
                combinedUpgrade.countByGoalId[character.goalId] =
                    (combinedUpgrade.countByGoalId[character.goalId] ?? 0) + upgradeCount;
                if (!combinedUpgrade.relatedCharacters.includes(character.unitId)) {
                    combinedUpgrade.relatedCharacters.push(character.unitId);
                }

                if (!combinedUpgrade.relatedGoals.includes(character.goalId)) {
                    combinedUpgrade.relatedGoals.push(character.goalId);
                }

                result[upgradeId] = combinedUpgrade;
            }
        }

        return result;
    }

    /**
     * @returns the mapping from the campaign number to the canonical node number. The node number
     * is directly provided by snowprint, so extremis node numbers come out as e.g. 13 instead of 2.
     */
    public static mapNodeNumber(campaign: Campaign, nodeNumber: number): number {
        switch (campaign) {
            case Campaign.AMSC:
            case Campaign.AMEC:
            case Campaign.TEC:
            case Campaign.TSC:
            case Campaign.TAEC:
            case Campaign.TASC:
            case Campaign.DGEC:
            case Campaign.DGSC: {
                if (nodeNumber === 3) {
                    nodeNumber = 1;
                } else if (nodeNumber === 13) {
                    nodeNumber = 2;
                } else {
                    nodeNumber = 3;
                }
                break;
            }
            default: {
                break;
            }
        }
        return nodeNumber;
    }

    /** @returns the number of non-summon enemies you'll face in the battle. */
    private static getNonSummonEnemyCount(battle: ICampaignBattleComposed): number {
        let returnValue = 0;
        for (const enemy of battle.detailedEnemyTypes ?? []) {
            const npc = NpcService.getNpcById(enemy.id);
            if (npc && !npc.traits.includes('Summon')) {
                returnValue += enemy.count;
            }
        }
        return returnValue;
    }

    /** @returns the number of non-summon tyranids you'll face in the battle. */
    private static getNonSummonTyranidCount(battle: ICampaignBattleComposed): number {
        let returnValue = 0;
        for (const enemy of battle.detailedEnemyTypes ?? []) {
            const npc = NpcService.getNpcById(enemy.id);
            if (npc && npc.faction === 'Tyranids' && !npc.traits.includes('Summon')) {
                returnValue += enemy.count;
            }
        }
        return returnValue;
    }

    /** @returns the number of non-summon chaos enemies you'll face in the battle. */
    private static getNonSummonChaosEnemyCount(battle: ICampaignBattleComposed): number {
        let returnValue = 0;
        for (const enemy of battle.detailedEnemyTypes ?? []) {
            const npc = NpcService.getNpcById(enemy.id);
            if (npc && npc.alliance === Alliance.Chaos && !npc.traits.includes('Summon')) {
                returnValue += enemy.count;
            }
        }
        return returnValue;
    }

    /** @returns the number of non-summon chaos enemies you'll face in the battle. */
    private static getNonSummonMechanicalEnemyCount(battle: ICampaignBattleComposed): number {
        let returnValue = 0;
        for (const enemy of battle.detailedEnemyTypes ?? []) {
            const npc = NpcService.getNpcById(enemy.id);
            if (npc && npc.traits.includes('Mechanical') && !npc.traits.includes('Summon')) {
                returnValue += enemy.count;
            }
        }
        return returnValue;
    }

    /**
     * Populates location data for each upgrade based on user settings and game progress.
     * This method mutates the `upgrades` object by enriching the `locations` array within each `ICombinedUpgrade`.
     *
     * @param upgrades - A record of combined upgrades to be processed. The `locations` property of each upgrade will be modified.
     * @param settings - The user's settings, including campaign progress, filters, and farming preferences.
     *
     * The method performs the following actions for each location of each upgrade:
     * 1.  **Unlocking:** Sets `isUnlocked` based on the player's progress in the relevant campaign. It correctly maps challenge campaigns to their base campaigns for progress checking.
     * 2.  **Filtering:** Sets `isPassFilter` based on global location filters defined in `settings`.
     * 3.  **Completion Status:** Sets `isCompleted` and `isStarted` by checking against the `completedLocations` list in settings.
     * 4.  **Initial Suggestion:** Sets `isSuggested` if the location is unlocked, passes filters, and (if it's a campaign event) is part of the currently selected event.
     * 5.  **Strategy-based Refinement:**
     *     - For 'leastEnergy' or 'leastTime' strategies, it further filters suggested locations to only include those with the minimum energy cost per item.
     *     - For 'custom' strategy, it filters suggested locations based on the user's preferred campaign types (`Normal`, `Elite`, etc.), with logic to handle dependencies (e.g., including `Extremis` if `Elite` is selected).
     * 6.  **Sorting:** Finally, it sorts the `locations` array for each upgrade primarily by `isSelected`, then by `energyPerItem` (ascending), and `nodeNumber` (descending).
     */
    public static populateLocationsData(
        upgrades: Record<string, ICombinedUpgrade>,
        settings: IEstimatedRanksSettings
    ): void {
        const completedLocations = settings.completedLocations;
        // get locations of the selected Campaign Event if there are any
        const currentCampaignEventLocations = campaignsByGroup[settings.preferences.campaignEvent ?? ''] ?? [];
        for (const upgradeId in upgrades) {
            const combinedUpgrade = upgrades[upgradeId];

            for (const location of combinedUpgrade.locations) {
                const campaignProgress = settings.campaignsProgress[location.campaign];
                const isCampaignEventLocation = campaignEventsLocations.includes(location.campaign as Campaign);
                const isCampaignEventLocationAvailable = currentCampaignEventLocations.includes(location.campaign);

                location.isUnlocked = this.mapNodeNumber(location.campaign, location.nodeNumber) <= campaignProgress;
                location.isPassFilter =
                    !settings.filters ||
                    CampaignsService.passLocationFilter(location, settings.filters, combinedUpgrade.rarity);
                location.isCompleted = completedLocations.some(
                    completedLocation =>
                        location.id === completedLocation.id &&
                        completedLocation.dailyBattleCount === completedLocation.raidsToPerform
                );
                location.isStarted = completedLocations.some(
                    completedLocation =>
                        location.id === completedLocation.id &&
                        completedLocation.dailyBattleCount !== completedLocation.raidsToPerform
                );

                // location can be suggested for raids only if it is unlocked, passed other filters
                // and in case it is Campaign Event location user should have specific Campaign Event selected.
                location.isSuggested =
                    location.isUnlocked &&
                    location.isPassFilter &&
                    (!isCampaignEventLocation || isCampaignEventLocationAvailable);
            }

            if (settings.preferences.farmStrategy === DailyRaidsStrategy.leastEnergy) {
                const minEnergyPerItem = Math.min(
                    ...combinedUpgrade.locations.filter(x => x.isSuggested).map(x => x.energyPerItem)
                );
                for (const location of combinedUpgrade.locations) {
                    if (location.energyPerItem > minEnergyPerItem) {
                        location.isSuggested = false;
                    }
                }
            } else if (
                settings.preferences.farmStrategy === DailyRaidsStrategy.custom &&
                settings.preferences.customSettings
            ) {
                const locationTypes = [
                    ...(settings.preferences.customSettings[combinedUpgrade.rarity] ?? [
                        CampaignType.Normal,
                        CampaignType.Early,
                        CampaignType.Mirror,
                        CampaignType.Standard,
                        CampaignType.Elite,
                        CampaignType.Extremis,
                    ]),
                ];
                const selectedLocations = combinedUpgrade.locations.filter(x => x.isSuggested);
                const ignoredLocations = selectedLocations.filter(x => !locationTypes.includes(x.campaignType));

                for (const location of ignoredLocations) location.isSuggested = false;
            }

            combinedUpgrade.locations = orderBy(
                combinedUpgrade.locations,
                ['isSelected', 'energyPerItem', 'nodeNumber'],
                ['desc', 'asc', 'desc']
            );
        }
    }

    /**
     * Applies all existing inventory in `inventoryUpgrades`, then returns the total
     * count, per non-craftable material, required to reach the rank-up goal.
     */
    private static getBaseUpgradesTotal(
        upgradeRanks: IUnitUpgradeRank[],
        upgradeShards: IUnitShards | undefined,
        inventoryUpgrades: Record<string, number>
    ): Record<string, number> {
        // Accumulator for base (non-craftable) material requirements after inventory has been applied.
        const baseUpgradesTotal: Record<string, number> = {};

        const addBaseUpgrade = (upgradeId: string, count: number): void => {
            if (count > 0) {
                baseUpgradesTotal[upgradeId] = (baseUpgradesTotal[upgradeId] ?? 0) + count;
            }
        };

        // Expands crafted upgrades into their constituent requirements until only base upgrades remain.
        // This recursively walks craft trees and uses inventory to satisfy crafted items when possible.
        const processCraftedUpgrade = (craftedUpgrades: Record<string, number>, depth = 0): void => {
            const nextLevelCraftedUpgrades: Record<string, number> = {};

            for (const craftedUpgrade in craftedUpgrades) {
                const acquiredCount = inventoryUpgrades[craftedUpgrade];
                const requiredCount = craftedUpgrades[craftedUpgrade];

                // If we already own enough of this crafted upgrade, consume from inventory and move on.
                if (acquiredCount >= requiredCount) {
                    inventoryUpgrades[craftedUpgrade] = acquiredCount - requiredCount;
                    continue;
                }

                // If we own some but not all, consume what we can and keep the remainder to craft.
                if (acquiredCount > 0 && acquiredCount < requiredCount) {
                    inventoryUpgrades[craftedUpgrade] = 0;
                    craftedUpgrades[craftedUpgrade] = requiredCount - acquiredCount;
                }

                const craftedUpgradeData = FsdUpgradesService.craftedUpgradesData[craftedUpgrade];
                const craftedUpgradeCount = craftedUpgrades[craftedUpgrade];

                // For each crafted upgrade, expand into either base materials or nested crafted upgrades.
                if (craftedUpgradeData) {
                    // If this crafted upgrade has no crafted subcomponents, expand directly to base upgrades.
                    if (craftedUpgradeData.craftedUpgrades.length === 0) {
                        for (const baseUpgrade of craftedUpgradeData.baseUpgrades) {
                            addBaseUpgrade(baseUpgrade.id, baseUpgrade.count * craftedUpgradeCount);
                        }
                    } else {
                        // Otherwise, expand each recipe item into either another crafted upgrade or a base upgrade.
                        for (const recipeUpgrade of craftedUpgradeData.recipe) {
                            const subCraftedUpgrade = craftedUpgradeData.craftedUpgrades.find(
                                x => x.id === recipeUpgrade.id
                            );
                            const baseUpgrade = craftedUpgradeData.baseUpgrades.find(x => x.id === recipeUpgrade.id);
                            if (subCraftedUpgrade) {
                                nextLevelCraftedUpgrades[recipeUpgrade.id] =
                                    (nextLevelCraftedUpgrades[recipeUpgrade.id] ?? 0) +
                                    recipeUpgrade.count * craftedUpgradeCount;
                            } else if (baseUpgrade) {
                                addBaseUpgrade(recipeUpgrade.id, recipeUpgrade.count * craftedUpgradeCount);
                            }
                        }
                    }
                }
            }

            // If additional crafted upgrades were discovered, continue expanding them until only base upgrades remain.
            if (Object.keys(nextLevelCraftedUpgrades).length > 0) {
                processCraftedUpgrade(nextLevelCraftedUpgrades, depth + 1);
            }
        };

        // Top-level crafted upgrades are gathered from the rank-up list and expanded afterward.
        const topLevelCraftedUpgrades: Record<string, number> = {};

        for (const upgradeRank of upgradeRanks) {
            for (const upgrade of upgradeRank.upgrades) {
                const upgradeData = FsdUpgradesService.getUpgrade(upgrade);
                if (!upgradeData) {
                    continue;
                }

                // Crafted upgrades are expanded later; base upgrades are applied immediately.
                if (upgradeData.crafted) {
                    topLevelCraftedUpgrades[upgrade] = (topLevelCraftedUpgrades[upgrade] ?? 0) + 1;
                } else {
                    addBaseUpgrade(upgrade, 1);
                }
            }
        }

        // Expand crafted upgrades into their base material requirements, honoring inventory.
        processCraftedUpgrade(topLevelCraftedUpgrades);

        // Finally, include shard requirements (if any) as base materials.
        if (upgradeShards !== undefined) {
            if (upgradeShards.totalIncrementalMythicShardsNeeded > 0) {
                baseUpgradesTotal[upgradeShards.mythicShardName] = upgradeShards.totalIncrementalMythicShardsNeeded;
            }
            if (upgradeShards.totalIncrementalShardsNeeded > 0) {
                baseUpgradesTotal[upgradeShards.shardName] = upgradeShards.totalIncrementalShardsNeeded;
            }
        }

        // Result is the remaining base material counts after applying all inventory consumption.
        return baseUpgradesTotal;
    }

    static findUpgrade(upgrade: TacticusUpgrade): string | null {
        const byName = FsdUpgradesService.recipeDataByName[upgrade.name];
        if (byName) {
            return byName.material;
        }

        const byTacticusId = this.recipeDataByTacticusId[upgrade.id];
        if (byTacticusId) {
            return byTacticusId.material;
        }

        return null;
    }

    private static composeByTacticusId(): Record<string, IMaterial> {
        const result: Record<string, IMaterial> = {};

        for (const materialName in FsdUpgradesService.recipeDataByName) {
            const material = FsdUpgradesService.recipeDataByName[materialName];
            if (material.snowprintId) {
                result[material.snowprintId] = material;
            }
        }

        return result;
    }

    public static isShard(upgradeId: string): boolean {
        return upgradeId.startsWith('shards_');
    }
    public static isMythicShard(upgradeId: string): boolean {
        return upgradeId.startsWith('mythicShards_');
    }
    public static isMaterial(upgradeId: string): boolean {
        return !this.isShard(upgradeId) && !this.isMythicShard(upgradeId);
    }
}
