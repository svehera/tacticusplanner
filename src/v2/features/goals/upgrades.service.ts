import { cloneDeep, mean, orderBy, sum, uniq, uniqBy } from 'lodash';

import { DailyRaidsStrategy, PersonalGoalType } from 'src/models/enums';
import {
    IDailyRaidsFarmOrder,
    IDailyRaidsHomeScreenEvent,
    IEstimatedRanksSettings,
    ITrainingRushPreferences,
    ITrainingRushStrategy,
} from 'src/models/interfaces';

import { getEnumValues } from '@/fsd/5-shared/lib';
import { TacticusUpgrade } from '@/fsd/5-shared/lib/tacticus-api/tacticus-api.models';
import { Alliance, Faction, Rank } from '@/fsd/5-shared/model';

import {
    ICampaignsProgress,
    CampaignsService,
    CampaignType,
    Campaign,
    ICampaignBattleComposed,
} from '@/fsd/4-entities/campaign';
import { campaignEventsLocations, campaignsByGroup } from '@/fsd/4-entities/campaign/campaigns.constants';
import {
    CharactersService,
    CharacterUpgradesService,
    ICharacterData,
    IUnitUpgradeRank,
} from '@/fsd/4-entities/character';
import { MowsService } from '@/fsd/4-entities/mow';
import { NpcService } from '@/fsd/4-entities/npc/@x/unit';
import {
    IBaseUpgrade,
    ICraftedUpgrade,
    IMaterial,
    UpgradesService as FsdUpgradesService,
} from '@/fsd/4-entities/upgrade';
import { recipeDataByName } from '@/fsd/4-entities/upgrade/data';

import {
    ICharacterUpgradeEstimate,
    ICharacterUpgradeMow,
    ICharacterUpgradeRankEstimate,
    ICharacterUpgradeRankGoal,
    ICombinedUpgrade,
    IEstimatedUpgrades,
    IItemRaidLocation,
    IUnitUpgrade,
    IUpgradeRaid,
    IUpgradesRaidsDay,
} from 'src/v2/features/goals/goals.models';

export class UpgradesService {
    static readonly recipeDataByTacticusId: Record<string, IMaterial> = this.composeByTacticusId();

    static readonly rankEntries: number[] = getEnumValues(Rank).filter(x => x > 0);

    public static canonicalizeInventoryUpgrades(inventoryUpgrades: Record<string, number>): Record<string, number> {
        return Object.fromEntries(
            Object.entries(inventoryUpgrades).map(([key, value]) => {
                return [
                    recipeDataByName[key]
                        ? key
                        : (Object.values(recipeDataByName).find(x => x.material === key)?.snowprintId ?? key),
                    value,
                ];
            })
        );
    }

    /**
     * Typically, a material is presented to the user as one raiding option with multiple locations.
     * When optimizing for warp surge, we potentially split the material into two, one with
     * locations with the minimum number of non-summon chaos enemies, and one with locations without.
     *
     * Returns the materials sorted first by descreasing number of chaos enemies in the location, then
     * by the remaining materials in the original order.
     *
     * @param settings The estimated ranks settings.
     * @param allMaterials The materials to split.
     * @returns The split materials.
     */
    private static splitMaterials(
        passesFilter: (location: ICampaignBattleComposed) => boolean,
        getPriority: (location: ICampaignBattleComposed) => number,
        allMaterials: ICharacterUpgradeEstimate[]
    ): ICharacterUpgradeEstimate[] {
        // Get the materials where at least one battle has the minimum number of chaos enemies.
        const materialsPassingFilter = allMaterials.filter(material =>
            material.locations.some(location => passesFilter(location))
        );

        const battlesWithPriority: Array<ICharacterUpgradeEstimate & { priority: number }> = [];
        const locationsPassingFilter = new Set<string>();

        // Find all the battle IDs that satisfy the minimum number of chaos enemies, noting that a material
        // may be available from nodes that have chaos enemies, and also from nodes that do not.
        for (const material of materialsPassingFilter) {
            const chaosEnemyLocations = material.locations.filter(passesFilter);

            for (const location of chaosEnemyLocations) {
                const newMaterial = cloneDeep(material);
                newMaterial.locations = [location];
                battlesWithPriority.push({
                    ...newMaterial,
                    priority: getPriority(location),
                });
                locationsPassingFilter.add(location.id);
            }
        }

        const sortedChaosEnemyMaterials = orderBy(battlesWithPriority, ['priority'], ['desc']);

        const remainingMaterials = cloneDeep(allMaterials);

        for (const material of remainingMaterials) {
            material.locations = material.locations.filter(location => !locationsPassingFilter.has(location.id));
        }

        const finalMaterials = remainingMaterials.filter(material => material.locations.length > 0);

        return [...sortedChaosEnemyMaterials, ...finalMaterials];
    }

    /**
     * Typically, a material is presented to the user as one raiding option with multiple locations.
     * When optimizing for purge order, we potentially split the material into two, one with
     * locations with the minimum number of non-summon tyranids, and one with locations without.
     *
     * Returns the materials sorted first by descreasing number of tyranids in the location, then
     * by the remaining materials in the original order.
     *
     * @param minNids The minimum number of non-summon tyranids a location must have to be event-relevant.
     * @param allMaterials The materials to split.
     * @returns The split materials.
     */
    private static splitMaterialsForPurgeOrder(
        minNids: number,
        allMaterials: ICharacterUpgradeEstimate[]
    ): ICharacterUpgradeEstimate[] {
        return this.splitMaterials(
            location => this.getNonSummonTyranidCount(location) >= minNids,
            location => this.getNonSummonTyranidCount(location),
            allMaterials
        );
    }

    /**
     * Typically, a material is presented to the user as one raiding option with multiple locations.
     * When optimizing for warp surge, we potentially split the material into two, one with
     * locations with the minimum number of non-summon chaos enemies, and one with locations without.
     *
     * Returns the materials sorted first by descreasing number of chaos enemies in the location (when
     * the location meets the minimum criterion), then by the remaining materials in the original order.
     *
     * @param minChaosEnemies The minimum number of non-summon chaos enemies a location must have to be event-relevant.
     * @param allMaterials The materials to split.
     * @returns The split materials.
     */
    private static splitMaterialsForWarpSurge(
        minChaosEnemies: number,
        allMaterials: ICharacterUpgradeEstimate[]
    ): ICharacterUpgradeEstimate[] {
        return this.splitMaterials(
            location => this.getNonSummonChaosEnemyCount(location) >= minChaosEnemies,
            location => this.getNonSummonChaosEnemyCount(location),
            allMaterials
        );
    }

    private static splitMaterialsForTrainingRush(
        preferences: ITrainingRushPreferences | undefined,
        allMaterials: ICharacterUpgradeEstimate[]
    ): ICharacterUpgradeEstimate[] {
        if (!preferences) return allMaterials;

        switch (preferences.strategy) {
            case ITrainingRushStrategy.maximizeRewards:
                {
                    const battlesWithPriority: Array<ICharacterUpgradeEstimate & { priority: number }> = [];

                    for (const material of allMaterials) {
                        for (const location of material.locations) {
                            const newMaterial = cloneDeep(material);
                            newMaterial.locations = [location];
                            battlesWithPriority.push({
                                ...newMaterial,
                                priority: this.getNonSummonEnemyCount(location),
                            });
                        }
                    }

                    return orderBy(battlesWithPriority, ['priority'], ['desc']);
                }
                break;
            case ITrainingRushStrategy.maximizeXpForCharacter:
                {
                    if (preferences === undefined || preferences.characterId === undefined) return allMaterials;
                    const unit = CharactersService.getUnit(preferences.characterId);
                    if (unit === undefined) {
                        console.error('Unable to find unit: ', preferences.characterId);
                        return allMaterials;
                    }

                    const battlesWithPriority: Array<ICharacterUpgradeEstimate & { priority: number }> = [];
                    for (const material of allMaterials) {
                        for (const location of material.locations) {
                            const newMaterial = cloneDeep(material);
                            newMaterial.locations = [location];
                            battlesWithPriority.push({
                                ...newMaterial,
                                priority: this.canCharacterParticipateInBattle(unit, location)
                                    ? location.enemyPower
                                    : 0,
                            });
                        }
                    }

                    return orderBy(battlesWithPriority, ['priority'], ['desc']);
                }
                break;
        }
        return allMaterials;
    }

    /**
     * Typically, a material is presented to the user as one raiding option with multiple locations.
     * When optimizing for warp surge, we potentially split the material into two, one with
     * locations with the minimum number of non-summon chaos enemies, and one with locations without.
     *
     * Returns the materials sorted first by descreasing number of chaos enemies in the location (when
     * the location meets the minimum criterion), then by the remaining materials in the original order.
     *
     * @param minMechanicalEnemies The minimum number of non-summon mechanical enemies a location must
     *                             have to be event-relevant.
     * @param allMaterials The materials to split.
     * @returns The split materials.
     */
    private static splitMaterialsForMachineHunt(
        minMechanicalEnemies: number,
        allMaterials: ICharacterUpgradeEstimate[]
    ): ICharacterUpgradeEstimate[] {
        return this.splitMaterials(
            location => this.getNonSummonMechanicalEnemyCount(location) >= minMechanicalEnemies,
            location => this.getNonSummonMechanicalEnemyCount(location),
            allMaterials
        );
    }

    private static canCharacterParticipateInBattle(unit: ICharacterData, location: ICampaignBattleComposed): boolean {
        return location.alliesAlliance === unit.alliance || location.alliesFactions.includes(unit.faction as Faction);
    }

    /**
     * Typically, a material is presented to the user as one raiding option with multiple locations.
     * When optimizing for a home screen event, we potentially split the material into two, one with
     * locations related to the event, and one with locations not related to the event.
     *
     * Returns the materials with event-related locations first, sorted in priority order, followed by
     * the remaining materials in their original order.
     *
     * @param settings The estimated ranks settings.
     * @param allMaterials The materials to split.
     * @returns The split materials.
     */
    private static splitMaterialsForHomeScreenEvent(
        settings: IEstimatedRanksSettings,
        allMaterials: ICharacterUpgradeEstimate[]
    ): ICharacterUpgradeEstimate[] {
        const event = settings.preferences.farmPreferences?.homeScreenEvent ?? IDailyRaidsHomeScreenEvent.none;
        switch (event) {
            case IDailyRaidsHomeScreenEvent.purgeOrder:
                return this.splitMaterialsForPurgeOrder(
                    settings.preferences.farmPreferences.purgeOrderPreferences?.minimumTyranidCount ?? 1,
                    allMaterials
                );
            case IDailyRaidsHomeScreenEvent.warpSurge:
                return this.splitMaterialsForWarpSurge(
                    settings.preferences.farmPreferences.warpSurgePreferences?.minimumChaosEnemyCount ?? 1,
                    allMaterials
                );
            case IDailyRaidsHomeScreenEvent.trainingRush:
                return this.splitMaterialsForTrainingRush(
                    settings.preferences.farmPreferences.trainingRushPreferences,
                    allMaterials
                );
            case IDailyRaidsHomeScreenEvent.machineHunt:
                return this.splitMaterialsForMachineHunt(
                    settings.preferences.farmPreferences.machineHuntPreferences?.minimumMechanicalEnemyCount ?? 1,
                    allMaterials
                );
            case IDailyRaidsHomeScreenEvent.none:
            default:
                return allMaterials;
        }

        return allMaterials;
    }

    static getUpgradesEstimatedDays(
        settings: IEstimatedRanksSettings,
        ...goals: Array<ICharacterUpgradeRankGoal | ICharacterUpgradeMow>
    ): IEstimatedUpgrades {
        const inventoryUpgrades = this.canonicalizeInventoryUpgrades(cloneDeep(settings.upgrades));

        const unitsUpgrades = this.getUpgrades(inventoryUpgrades, goals);

        const combinedBaseMaterials = this.combineBaseMaterials(unitsUpgrades);
        this.populateLocationsData(combinedBaseMaterials, settings);

        let allMaterials: ICharacterUpgradeEstimate[] = [];
        let byCharactersPriority: ICharacterUpgradeRankEstimate[] = [];

        const order = settings.preferences.farmPreferences?.order ?? IDailyRaidsFarmOrder.goalPriority;
        if (order === IDailyRaidsFarmOrder.goalPriority) {
            byCharactersPriority = this.getEstimatesByPriority(goals, combinedBaseMaterials, inventoryUpgrades);
            allMaterials = byCharactersPriority.flatMap(x => x.upgrades);
        } else {
            // order === IDailyRaidsFarmOrder.totalMaterials
            allMaterials = this.getTotalEstimates(combinedBaseMaterials, inventoryUpgrades);

            if (settings.preferences.farmStrategy === DailyRaidsStrategy.leastTime) {
                allMaterials = this.improveEstimates(allMaterials, combinedBaseMaterials, inventoryUpgrades);
            }
        }

        allMaterials = this.splitMaterialsForHomeScreenEvent(settings, allMaterials);

        const upgradesRaids = this.generateDailyRaidsList(settings, allMaterials);

        const blockedMaterials = allMaterials.filter(x => x.isBlocked);
        const finishedMaterials = allMaterials.filter(x => x.isFinished);
        const inProgressMaterials = allMaterials.filter(x => !x.isBlocked && !x.isFinished);

        const energyTotal = sum(inProgressMaterials.map(material => material.energyTotal));
        const raidsTotal = sum(upgradesRaids.map(day => day.raidsTotal));
        const freeEnergyDays = upgradesRaids.filter(x => settings.dailyEnergy - x.energyTotal > 60).length;

        const relatedUpgrades = uniq(unitsUpgrades.flatMap(ranksUpgrade => ranksUpgrade.relatedUpgrades));

        return {
            upgradesRaids,
            characters: unitsUpgrades,
            inProgressMaterials,
            blockedMaterials,
            finishedMaterials,
            relatedUpgrades,
            byCharactersPriority,
            daysTotal: upgradesRaids.length,
            energyTotal,
            raidsTotal,
            freeEnergyDays,
        };
    }
    /**
     * Generates a day-by-day plan for raiding to acquire character upgrade materials.
     *
     * This function simulates the process of spending daily energy on raids to farm the
     * necessary materials for a list of character upgrades. It iterates day by day,
     * planning which raids to perform based on the available energy and the remaining
     * material requirements. The simulation continues until all required materials for the
     * provided upgrades are farmed.
     *
     * @remarks
     * The order of the `allUpgrades` array is crucial as it dictates the priority of farming.
     * Materials for upgrades that appear earlier in the array will be prioritized each day.
     *
     * The function has special logic for the "first day" (today) to account for any raids
     * that the user has already completed, ensuring the plan is accurate from the start.
     *
     * A safeguard is in place to prevent infinite loops, terminating after 1000 simulated days.
     *
     * @param settings - The user's settings for the estimation, including available daily energy and any raids already completed on the first day.
     * @param allUpgrades - A list of all character upgrades to be farmed. **The order of this array determines the farming priority.**
     * @returns An array of `IUpgradesRaidsDay`, where each object represents a single day's raiding plan. Returns an empty array if daily energy is too low to perform any raids.
     */
    private static generateDailyRaidsList(
        settings: IEstimatedRanksSettings,
        allUpgrades: ICharacterUpgradeEstimate[]
    ): IUpgradesRaidsDay[] {
        if (settings.dailyEnergy <= 10) {
            return [];
        }
        const resultDays: IUpgradesRaidsDay[] = [];

        let iteration = 0;
        let upgradesToFarm = allUpgrades.filter(x => !x.isBlocked && !x.isFinished && x.energyLeft > 0);

        while (upgradesToFarm.length > 0) {
            const isFirstDay = iteration === 0;
            let energyLeft = settings.dailyEnergy;
            let raids: IUpgradeRaid[] = [];

            if (isFirstDay) {
                const firstDayResult = this._handleFirstDayCompletedRaids(settings, allUpgrades);
                raids = firstDayResult.raids;
                energyLeft -= firstDayResult.energySpent;
            }

            for (const material of upgradesToFarm) {
                if (energyLeft < 5) {
                    break;
                }

                const { raidLocations, energySpent } = this._planRaidsForMaterial(
                    material,
                    energyLeft,
                    isFirstDay,
                    settings.completedLocations,
                    raids
                );

                if (raidLocations.length) {
                    raids.push({
                        ...material,
                        raidLocations,
                    });
                    energyLeft -= energySpent;
                }
            }

            if (raids.length) {
                const raidsTotal = sum(raids.flatMap(x => x.raidLocations.map(x => x.raidsCount)));
                const energyTotal = sum(raids.flatMap(x => x.raidLocations.map(x => x.energySpent)));
                resultDays.push({
                    raids: isFirstDay
                        ? orderBy(raids, raid => raid.raidLocations.every(location => location.isCompleted))
                        : raids,
                    raidsTotal,
                    energyTotal,
                });
            }

            iteration++;
            upgradesToFarm = upgradesToFarm.filter(
                x => x.energyLeft > Math.min(...x.locations.filter(c => c.isSuggested).map(l => l.energyCost))
            );
            if (iteration > 1000) {
                console.error('Infinite loop detected in generateDailyRaidsList', resultDays);
                break;
            }
        }

        return resultDays;
    }

    /**
     * Handles the logic for the first day of raiding, accounting for any raids that have already been completed.
     * @param settings - The user's estimated ranks settings, including completed locations.
     * @param allUpgrades - The list of all upgrade estimates.
     * @returns An object containing the initial list of raids and the total energy spent on them.
     */
    private static _handleFirstDayCompletedRaids(
        settings: IEstimatedRanksSettings,
        allUpgrades: ICharacterUpgradeEstimate[]
    ): { raids: IUpgradeRaid[]; energySpent: number } {
        const raids: IUpgradeRaid[] = [];
        const completedRaids = settings.completedLocations.filter(x => !x.isShardsLocation);
        const raidedLocationsIds = completedRaids.map(x => x.id);

        const raidedUpgrades = allUpgrades.filter(x =>
            x.locations
                .filter(location => location.isSuggested)
                .some(location => raidedLocationsIds.includes(location.id))
        );

        for (const raidedUpgrade of uniqBy(raidedUpgrades, 'id')) {
            const raidLocations = completedRaids.filter(
                x =>
                    x.dailyBattleCount === x.raidsCount &&
                    raidedUpgrade.locations.some(location => location.id === x.id)
            );

            if (raidLocations.length > 0) {
                raids.push({
                    ...raidedUpgrade,
                    raidLocations,
                });
            }
        }

        const energySpent = sum(completedRaids.map(x => x.energySpent));
        return { raids, energySpent };
    }

    /**
     * Plans the raids for a single material for a given day based on available energy.
     * @param material - The upgrade material to farm.
     * @param energyLeft - The remaining energy for the day.
     * @param isFirstDay - A flag indicating if it's the first day of farming.
     * @param completedLocations - A list of already completed locations for the day.
     * @param dailyRaids - The raids already planned for the day.
     * @returns An object with the list of raid locations and the total energy spent.
     */
    private static _planRaidsForMaterial(
        material: ICharacterUpgradeEstimate,
        energyLeft: number,
        isFirstDay: boolean,
        completedLocations: IItemRaidLocation[],
        dailyRaids: IUpgradeRaid[]
    ): { raidLocations: IItemRaidLocation[]; energySpent: number } {
        const raidLocations: IItemRaidLocation[] = [];
        let totalEnergySpent = 0;

        const plannedLocationIds = dailyRaids
            .filter(x => x.id === material.id)
            .flatMap(x => x.raidLocations)
            .map(x => x.id);

        const availableLocations = material.locations.filter(
            location => location.isSuggested && !plannedLocationIds.includes(location.id)
        );

        for (const location of availableLocations) {
            if (energyLeft <= 0) break;

            const completedLocation = completedLocations.find(x => x.id === location.id);
            if (isFirstDay && location.isCompleted) {
                if (completedLocation) {
                    raidLocations.push(completedLocation);
                }
                continue;
            }

            const attemptsLeft = isFirstDay
                ? location.dailyBattleCount - (completedLocation?.raidsCount ?? 0)
                : location.dailyBattleCount;

            if (attemptsLeft <= 0) continue;

            const energyForFullAttempts = attemptsLeft * location.energyCost;
            const energyToFarmMaterial = Math.min(material.energyLeft, energyLeft);
            const energyToSpend = Math.min(energyToFarmMaterial, energyForFullAttempts);

            if (energyToSpend < location.energyCost) continue;

            const battlesToRaid = Math.floor(energyToSpend / location.energyCost);
            const energySpentOnLocation = battlesToRaid * location.energyCost;

            energyLeft -= energySpentOnLocation;
            material.energyLeft -= energySpentOnLocation;
            totalEnergySpent += energySpentOnLocation;

            raidLocations.push({
                ...location,
                raidsCount: battlesToRaid,
                farmedItems: energySpentOnLocation / location.energyPerItem,
                energySpent: energySpentOnLocation,
                isShardsLocation: false,
            });
        }

        return { raidLocations, energySpent: totalEnergySpent };
    }

    /**
     * Computes and returns a list of unit upgrades based on the provided inventory and goal definitions.
     *
     * This method processes each goal, determines the required upgrade ranks, filters upgrades by rarity if specified,
     * and aggregates related upgrades for each goal. The result is an array of unit upgrade objects, each containing
     * details about the goal, the unit, the required upgrades, and related upgrades.
     *
     * @param inventoryUpgrades - A record mapping upgrade IDs to their quantities in the user's inventory.
     * @param goals - An array of character upgrade rank or mow upgrade goals to process.
     * @returns An array of `IUnitUpgrade` objects, each representing the upgrade requirements and related data for a goal.
     */
    public static getUpgrades(
        inventoryUpgrades: Record<string, number>,
        goals: Array<ICharacterUpgradeRankGoal | ICharacterUpgradeMow>
    ): IUnitUpgrade[] {
        const result: IUnitUpgrade[] = [];
        const canonUpgrades = this.canonicalizeInventoryUpgrades(inventoryUpgrades);
        for (const goal of goals) {
            const upgradeRanks =
                goal.type === PersonalGoalType.UpgradeRank
                    ? CharacterUpgradesService.getCharacterUpgradeRank(goal)
                    : this.getMowUpgradeRank(goal);
            const baseUpgradesTotal: Record<string, number> = this.getBaseUpgradesTotal(upgradeRanks, canonUpgrades);

            if (goal.upgradesRarity.length) {
                // remove upgrades that do not match to selected rarities
                for (const upgradeId in baseUpgradesTotal) {
                    const upgradeData = FsdUpgradesService.baseUpgradesData[upgradeId];
                    if (upgradeData && !goal.upgradesRarity.includes(upgradeData.rarity)) {
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

    /**
     * Recursively refines upgrade time estimates by suggesting additional farming locations.
     *
     * This method identifies upgrades that are significant outliers (taking much longer than the average time to acquire).
     * For each outlier, it suggests a new, unlocked, and valid farming location that isn't already suggested.
     * After suggesting new locations, it recalculates all estimates and calls itself again with the new data.
     * This process repeats until no more outlier upgrades can be improved.
     *
     * @remarks
     * This is a pure function in terms of its inputs and outputs but has a side effect of mutating the `isSuggested` property
     * on the locations within the `upgrades` object passed as a parameter. The recursion terminates when no more
     * farming locations can be suggested for outlier upgrades. The final result is sorted by total days and total energy in descending order.
     *
     * @param estimates - The current array of character upgrade estimates.
     * @param upgrades - A record of all available upgrades, which will be mutated by this function.
     * @param inventoryUpgrades - A record of the user's current inventory of upgrade materials.
     * @returns A new array of refined and sorted character upgrade estimates.
     */
    private static improveEstimates(
        estimates: ICharacterUpgradeEstimate[],
        upgrades: Record<string, ICombinedUpgrade>,
        inventoryUpgrades: Record<string, number>
    ): ICharacterUpgradeEstimate[] {
        const average = Math.ceil(mean(estimates.map(x => x.daysTotal)));
        const correctUpgradesLocations = estimates
            .filter(
                x =>
                    x.daysTotal - average > average &&
                    x.locations.some(location => location.isUnlocked && location.isPassFilter && !location.isSuggested)
            )
            .map(x => x.id);

        if (!correctUpgradesLocations.length) {
            return estimates;
        }

        for (const upgradeId of correctUpgradesLocations) {
            const upgrade = upgrades[upgradeId];
            const newLocation = upgrade.locations.find(
                location => location.isUnlocked && location.isPassFilter && !location.isSuggested
            );
            if (newLocation) {
                newLocation.isSuggested = true;
            }
        }

        const newEstimates = this.getTotalEstimates(upgrades, inventoryUpgrades);
        const result = this.improveEstimates(newEstimates, upgrades, inventoryUpgrades);

        return orderBy(result, ['daysTotal', 'energyTotal'], ['desc', 'desc']);
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
            isBlocked: !selectedLocations.length && leftCount > 0,
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

    private static combineBaseMaterials(charactersUpgrades: IUnitUpgrade[]): Record<string, ICombinedUpgrade> {
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
                combinedUpgrade.countByGoalId[character.goalId] = upgradeCount;
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
    private static mapNodeNumber(campaign: Campaign, nodeNumber: number): number {
        switch (campaign) {
            case Campaign.AMSC:
            case Campaign.AMEC:
            case Campaign.TEC:
            case Campaign.TSC:
            case Campaign.TAEC:
            case Campaign.TASC:
            case Campaign.DGEC:
            case Campaign.DGSC:
                if (nodeNumber === 3) {
                    nodeNumber = 1;
                } else if (nodeNumber === 13) {
                    nodeNumber = 2;
                } else {
                    nodeNumber = 3;
                }
                break;
            default:
                break;
        }
        return nodeNumber;
    }

    /** @returns the number of non-summon enemies you'll face in the battle. */
    private static getNonSummonEnemyCount(battle: ICampaignBattleComposed): number {
        let ret = 0;
        for (const enemy of battle.detailedEnemyTypes ?? []) {
            const npc = NpcService.getNpcById(enemy.id);
            if (npc && !npc.traits.includes('Summon')) {
                ret += enemy.count;
            }
        }
        return ret;
    }

    /** @returns the number of non-summon tyranids you'll face in the battle. */
    private static getNonSummonTyranidCount(battle: ICampaignBattleComposed): number {
        let ret = 0;
        for (const enemy of battle.detailedEnemyTypes ?? []) {
            const npc = NpcService.getNpcById(enemy.id);
            if (npc && npc.faction === Faction.Tyranids && !npc.traits.includes('Summon')) {
                ret += enemy.count;
            }
        }
        return ret;
    }

    /** @returns the number of non-summon chaos enemies you'll face in the battle. */
    private static getNonSummonChaosEnemyCount(battle: ICampaignBattleComposed): number {
        let ret = 0;
        for (const enemy of battle.detailedEnemyTypes ?? []) {
            const npc = NpcService.getNpcById(enemy.id);
            if (npc && npc.alliance === Alliance.Chaos && !npc.traits.includes('Summon')) {
                ret += enemy.count;
            }
        }
        return ret;
    }

    /** @returns the number of non-summon chaos enemies you'll face in the battle. */
    private static getNonSummonMechanicalEnemyCount(battle: ICampaignBattleComposed): number {
        let ret = 0;
        for (const enemy of battle.detailedEnemyTypes ?? []) {
            const npc = NpcService.getNpcById(enemy.id);
            if (npc && npc.traits.includes('Mechanical') && !npc.traits.includes('Summon')) {
                ret += enemy.count;
            }
        }
        return ret;
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
    private static populateLocationsData(
        upgrades: Record<string, ICombinedUpgrade>,
        settings: IEstimatedRanksSettings
    ): void {
        const completedLocations = settings.completedLocations;
        // get locations of the selected Campaign Event if there are any
        const currCampaignEventLocations = campaignsByGroup[settings.preferences.campaignEvent ?? ''] ?? [];
        for (const upgradeId in upgrades) {
            const combinedUpgrade = upgrades[upgradeId];

            for (const location of combinedUpgrade.locations) {
                // Challenge CE campaigns should unlock based on their corresponding base campaign progress
                const challengeToBase: Partial<Record<Campaign, Campaign>> = {
                    [Campaign.AMSC]: Campaign.AMS,
                    [Campaign.AMEC]: Campaign.AME,
                    [Campaign.TSC]: Campaign.TS,
                    [Campaign.TEC]: Campaign.TE,
                    [Campaign.TASC]: Campaign.TAS,
                    [Campaign.TAEC]: Campaign.TAE,
                    [Campaign.DGSC]: Campaign.DGS,
                    [Campaign.DGEC]: Campaign.DGE,
                };
                const unlockCampaign =
                    (challengeToBase[location.campaign as Campaign] as keyof ICampaignsProgress | undefined) ??
                    (location.campaign as keyof ICampaignsProgress);

                const campaignProgress = settings.campaignsProgress[unlockCampaign];
                const isCampaignEventLocation = campaignEventsLocations.includes(location.campaign as Campaign);
                const isCampaignEventLocationAvailable = currCampaignEventLocations.includes(location.campaign);

                location.isUnlocked = this.mapNodeNumber(location.campaign, location.nodeNumber) <= campaignProgress;
                location.isPassFilter =
                    !settings.filters ||
                    CampaignsService.passLocationFilter(location, settings.filters, combinedUpgrade.rarity);
                location.isCompleted = completedLocations.some(
                    completedLocation =>
                        location.id === completedLocation.id &&
                        completedLocation.dailyBattleCount === completedLocation.raidsCount
                );
                location.isStarted = completedLocations.some(
                    completedLocation =>
                        location.id === completedLocation.id &&
                        completedLocation.dailyBattleCount !== completedLocation.raidsCount
                );

                // location can be suggested for raids only if it is unlocked, passed other filters
                // and in case it is Campaign Event location user should have specific Campaign Event selected
                location.isSuggested =
                    location.isUnlocked &&
                    location.isPassFilter &&
                    (!isCampaignEventLocation || isCampaignEventLocationAvailable);
            }
            const minEnergy = Math.min(
                ...combinedUpgrade.locations.filter(x => x.isSuggested).map(x => x.energyPerItem)
            );

            if (
                [DailyRaidsStrategy.leastEnergy, DailyRaidsStrategy.leastTime].includes(
                    settings.preferences.farmStrategy
                )
            ) {
                for (const location of combinedUpgrade.locations) {
                    location.isSuggested =
                        location.isSuggested &&
                        (location.energyPerItem === minEnergy || this.shouldRaidForHomeScreenEvent(location, settings));
                }
            }

            if (
                settings.preferences.farmStrategy === DailyRaidsStrategy.custom &&
                settings.preferences.customSettings
            ) {
                let locationTypes = [
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
                if (ignoredLocations.length !== selectedLocations.length) {
                    // We have some nodes to raid, so don't suggest the others.
                    ignoredLocations.forEach(location => (location.isSuggested = false));
                } else {
                    // No nodes available after initial filter, try to adjust for slightly worse nodes.
                    const needsUpdate = new Set<CampaignType>();

                    // If the user selected some battle types, but they aren't available, try to use other types.
                    // THIS FEELS WRONG, WE PROBABLY SHOULD NOT BE DOING THIS.
                    if (locationTypes.includes(CampaignType.Elite) && !locationTypes.includes(CampaignType.Extremis)) {
                        needsUpdate.add(CampaignType.Extremis);
                    }
                    if (locationTypes.includes(CampaignType.Extremis) && !locationTypes.includes(CampaignType.Mirror)) {
                        needsUpdate.add(CampaignType.Mirror);
                    }
                    if (
                        locationTypes.includes(CampaignType.Extremis) &&
                        !locationTypes.includes(CampaignType.Standard)
                    ) {
                        needsUpdate.add(CampaignType.Standard);
                    }

                    if (needsUpdate.size > 0) {
                        locationTypes = [...locationTypes, ...needsUpdate];

                        // Set all location types we aren't going to use to "not suggested".
                        selectedLocations
                            .filter(x => !locationTypes.includes(x.campaignType))
                            .forEach(location => (location.isSuggested = false));
                    }
                }
            }

            combinedUpgrade.locations = orderBy(
                combinedUpgrade.locations,
                ['isSelected', 'energyPerItem', 'nodeNumber'],
                ['desc', 'asc', 'desc']
            );
        }
    }

    private static shouldRaidForHomeScreenEvent(
        location: ICampaignBattleComposed,
        settings: IEstimatedRanksSettings
    ): boolean {
        const event = settings.preferences.farmPreferences.homeScreenEvent;
        switch (event) {
            case IDailyRaidsHomeScreenEvent.purgeOrder: {
                const minNids = settings.preferences.farmPreferences.purgeOrderPreferences?.minimumTyranidCount ?? 1;
                return this.getNonSummonTyranidCount(location) >= minNids;
            }
            case IDailyRaidsHomeScreenEvent.warpSurge: {
                const minChaos = settings.preferences.farmPreferences.warpSurgePreferences?.minimumChaosEnemyCount ?? 1;
                return this.getNonSummonChaosEnemyCount(location) >= minChaos;
            }
            case IDailyRaidsHomeScreenEvent.trainingRush: {
                const unit = CharactersService.getUnit(
                    settings.preferences.farmPreferences.trainingRushPreferences?.characterId ?? ''
                );
                return unit !== undefined && this.canCharacterParticipateInBattle(unit, location);
            }
            case IDailyRaidsHomeScreenEvent.machineHunt: {
                const minMechanical =
                    settings.preferences.farmPreferences.machineHuntPreferences?.minimumMechanicalEnemyCount ?? 1;
                return this.getNonSummonMechanicalEnemyCount(location) >= minMechanical;
            }
            case IDailyRaidsHomeScreenEvent.none:
                return false;
        }
    }

    /**
     * Applies all existing inventory in `inventoryUpgrades`, then returns the total
     * count, per non-craftable material, required to reach the rank-up goal.
     */
    private static getBaseUpgradesTotal(
        upgradeRanks: IUnitUpgradeRank[],
        inventoryUpgrades: Record<string, number>
    ): Record<string, number> {
        const baseUpgradesTotal: Record<string, number> = {};

        const processCraftedUpgrade = (craftedUpgrades: Record<string, number>, depth = 0): void => {
            const nextLevelCraftedUpgrades: Record<string, number> = {};

            for (const craftedUpgrade in craftedUpgrades) {
                const acquiredCount = inventoryUpgrades[craftedUpgrade];
                const requiredCount = craftedUpgrades[craftedUpgrade];

                if (acquiredCount >= requiredCount) {
                    inventoryUpgrades[craftedUpgrade] = acquiredCount - requiredCount;
                    continue;
                }

                if (acquiredCount > 0 && acquiredCount < requiredCount) {
                    inventoryUpgrades[craftedUpgrade] = 0;
                    craftedUpgrades[craftedUpgrade] = requiredCount - acquiredCount;
                }

                const craftedUpgradeData = FsdUpgradesService.craftedUpgradesData[craftedUpgrade];
                const craftedUpgradeCount = craftedUpgrades[craftedUpgrade];

                if (craftedUpgradeData) {
                    if (!craftedUpgradeData.craftedUpgrades.length) {
                        for (const baseUpgrade of craftedUpgradeData.baseUpgrades) {
                            baseUpgradesTotal[baseUpgrade.id] =
                                (baseUpgradesTotal[baseUpgrade.id] ?? 0) + baseUpgrade.count * craftedUpgradeCount;
                        }
                    } else {
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
                                baseUpgradesTotal[recipeUpgrade.id] =
                                    (baseUpgradesTotal[recipeUpgrade.id] ?? 0) +
                                    recipeUpgrade.count * craftedUpgradeCount;
                            }
                        }
                    }
                }
            }

            if (Object.keys(nextLevelCraftedUpgrades).length > 0) {
                processCraftedUpgrade(nextLevelCraftedUpgrades, depth + 1);
            }
        };

        const topLevelCraftedUpgrades: Record<string, number> = {};

        for (const upgradeRank of upgradeRanks) {
            for (const upgrade of upgradeRank.upgrades) {
                const upgradeData = FsdUpgradesService.getUpgrade(upgrade);
                if (!upgradeData) {
                    continue;
                }

                if (upgradeData.crafted) {
                    topLevelCraftedUpgrades[upgrade] = (topLevelCraftedUpgrades[upgrade] ?? 0) + 1;
                } else {
                    baseUpgradesTotal[upgrade] = (baseUpgradesTotal[upgrade] ?? 0) + 1;
                }
            }
        }

        processCraftedUpgrade(topLevelCraftedUpgrades);

        return baseUpgradesTotal;
    }

    /**
     * Calculates upgrade estimates for a list of goals, processing them sequentially.
     * This method assumes goals are provided in a priority order. As it processes each goal,
     * it consumes items from the shared `inventoryUpgrades` pool. This means that items used
     * for a higher-priority goal are no longer available for subsequent, lower-priority goals.
     *
     * @param goals - An array of character upgrade goals, sorted by priority.
     * @param upgrades - A record of all possible upgrades, detailing their requirements for each goal.
     * @param inventoryUpgrades - A record representing the user's current inventory of upgrade materials.
     *                            **Note:** This object is mutated by the function to simulate the consumption of items.
     * @returns An array of `ICharacterUpgradeRankEstimate`, each corresponding to a goal and containing
     *          a list of the necessary upgrades sorted in descending order by total days and energy required.
     */
    private static getEstimatesByPriority(
        goals: Array<ICharacterUpgradeRankGoal | ICharacterUpgradeMow>,
        upgrades: Record<string, ICombinedUpgrade>,
        inventoryUpgrades: Record<string, number>
    ): ICharacterUpgradeRankEstimate[] {
        const result: ICharacterUpgradeRankEstimate[] = [];
        for (const goal of goals) {
            const goalUpgrades: ICharacterUpgradeEstimate[] = [];
            for (const upgradeId in upgrades) {
                const upgrade = upgrades[upgradeId];
                const requiredCount = upgrade.countByGoalId[goal.goalId];
                if (!requiredCount) continue;
                const acquiredCount = inventoryUpgrades[upgradeId] ?? 0;
                inventoryUpgrades[upgradeId] = Math.max(acquiredCount - requiredCount, 0);
                const estimate = this.getUpgradeEstimate(upgrade, requiredCount, acquiredCount);
                estimate.relatedCharacters = [CharactersService.resolveCharacter(goal.unitName)?.name ?? goal.unitName];
                estimate.relatedGoals = [goal.goalId];
                goalUpgrades.push(estimate);
            }

            result.push({
                goalId: goal.goalId,
                upgrades: orderBy(goalUpgrades, ['daysTotal', 'energyTotal'], ['desc', 'desc']),
            });
        }
        return result;
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
}
