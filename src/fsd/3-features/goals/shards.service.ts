import { orderBy, sum } from 'lodash';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { charsProgression, charsUnlockShards } from 'src/models/constants';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { CampaignsLocationsUsage, PersonalGoalType } from 'src/models/enums';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { StaticDataService } from 'src/services';

import { Alliance, Rarity, RarityMapper } from '@/fsd/5-shared/model';

import {
    CampaignsService,
    ICampaignBattleComposed,
    CampaignType,
    Campaign,
    campaignEventsLocations,
    campaignsByGroup,
    ICampaignsProgress,
} from '@/fsd/4-entities/campaign';

import {
    ICharacterAscendGoal,
    ICharacterShardsEstimate,
    ICharacterUnlockGoal,
    ICharacterUpgradeMow,
    IEstimatedAscensionSettings,
    IEstimatedShards,
    IItemRaidLocation,
    IShardMaterial,
    IShardsRaid,
    // eslint-disable-next-line import-x/no-internal-modules
} from '@/fsd/3-features/goals/goals.models';

export class ShardsService {
    /**
     * Calculates and aggregates shard acquisition estimates for a set of character goals,
     * based on provided ascension settings and optional raided locations.
     *
     * This function:
     * - Converts the provided character goals into a list of required materials.
     * - Determines which shards can be obtained from today's available raids, filtered by
     *   `settings.raidedLocations`.
     * - Sums up total and per-day energy requirements, total onslaught tokens, and total raids
     *   needed across all materials.
     * - Calculates the total number of days required to achieve all goals, taking the maximum of:
     *   - The longest individual material's days-to-completion estimate.
     *   - The number of days required to accumulate enough onslaught tokens, assuming a daily gain
     *     of 1.5 tokens (rounded up).
     *
     * Subtle behavior:
     * - The `daysTotal` is not simply the sum of days for each material, but the maximum of all
     *   individual requirements and the onslaught token constraint. This ensures the estimate
     *   reflects the true bottleneck.
     * - The function assumes that onslaught tokens are earned at a fixed rate (1.5 per day), which
     *   may not match actual in-game rates if bonuses or events apply.
     *
     * @param settings - User-defined settings affecting ascension and resource calculation.
     * @param goals - One or more character ascend or unlock goals to estimate for.
     * @returns An object summarizing all relevant shard acquisition estimates and requirements.
     */
    static getShardsEstimatedDays(
        settings: IEstimatedAscensionSettings,
        ...goals: Array<ICharacterAscendGoal | ICharacterUnlockGoal>
    ): IEstimatedShards {
        const materials = this.convertGoalsToMaterials(settings, goals);

        // Respect user's daily energy preference for farming shards
        // Sort materials by priority (e.g., daysTotal ascending, or as-is)
        // Then, only include as many as can fit in the user's daily energy budget for shards
        const energyBudget = settings.preferences.shardsEnergy ?? 0;
        let runningEnergy = 0;
        const allowedMaterials: ICharacterShardsEstimate[] = [];

        for (const material of materials) {
            if (runningEnergy + material.energyPerDay <= energyBudget) {
                allowedMaterials.push(material);
                runningEnergy += material.energyPerDay;
            } else if (energyBudget > runningEnergy && material.energyPerDay > 0) {
                // Partial allocation: allow as much as possible for this material
                // Clone the material and adjust energyPerDay to fit remaining budget
                const fraction = (energyBudget - runningEnergy) / material.energyPerDay;
                if (fraction > 0) {
                    allowedMaterials.push({
                        ...material,
                        // Scale down energyPerDay and itemsPerDay for this partial allocation
                        energyPerDay: energyBudget - runningEnergy,
                        raidsLocations: material.raidsLocations.map(loc => ({
                            ...loc,
                            energyPerDay: loc.energyPerDay * fraction,
                            itemsPerDay: loc.itemsPerDay * fraction,
                            dailyBattleCount: loc.dailyBattleCount * fraction,
                        })),
                    });
                }
                runningEnergy = energyBudget;
                break;
            } else {
                break;
            }
        }

        // Only pass the allowedMaterials to getTodayRaids
        const shardsRaids = this.getTodayRaids(allowedMaterials, settings.raidedLocations);

        const energyTotal = sum(materials.map(material => material.energyTotal));
        const energyPerDay = sum(materials.map(material => material.energyPerDay));
        const onslaughtTokens = sum(materials.map(material => material.onslaughtTokensTotal));
        const raidsTotal = sum(materials.map(material => material.raidsTotal));
        const daysTotal = Math.max(...materials.map(material => material.daysTotal), Math.ceil(onslaughtTokens / 1.5));

        return {
            shardsRaids,
            materials,
            daysTotal,
            energyTotal,
            raidsTotal,
            onslaughtTokens,
            energyPerDay,
        };
    }

    /**
     * Converts a list of character ascension or unlock goals into a detailed farming estimate for the required character shards.
     *
     * @description
     * This method takes user settings and a list of character goals, then calculates the resources and time needed to acquire the necessary shards.
     *
     * The process involves several steps:
     * 1. **Initial Conversion**: Each goal is converted into a base material requirement. Goals for characters that are already fully acquired are filtered out.
     * 2. **Location Filtering**: For each character's shards, determines the available farming locations by filtering all possible locations based on:
     *    - The user's current progress in each campaign (`settings.campaignsProgress`).
     *    - Any active global filters (`settings.filters`).
     *    - The user's selected campaign event, if a location is part of a limited-time event.
     * 3. **Optimal Location Selection**: Based on the character's `campaignsUsage` strategy ('LeastEnergy' or 'BestTime'), it selects the most efficient set of `raidsLocations` from the available ones. It also adds Onslaught locations if applicable.
     * 4. **Farming Simulation**: It simulates the farming process day-by-day to estimate:
     *    - `daysTotal`: The total number of days required.
     *    - `energyTotal`: The total energy cost.
     *    - `raidsTotal`: The total number of battles (raids).
     *    - `onslaughtTokensTotal`: The total number of Onslaught tokens needed.
     *    The simulation accounts for daily energy limits on nodes and the unique mechanics of Onslaught, including token costs which are influenced by the farming order of other characters.
     * 5. **Result Compilation**: Returns an array of `ICharacterShardsEstimate` objects, one for each character goal. Each object contains the detailed simulation results, the list of available and selected farming locations, and a flag (`isBlocked`) to indicate if farming is currently impossible due to no unlocked locations.
     *
     * @param settings - The user's settings, including campaign progress, preferences, and filters.
     * @param goals - An array of character goals, which can be for ascending or unlocking characters.
     * @returns An array of `ICharacterShardsEstimate`, each providing a detailed farming plan for a single character's shards.
     */
    public static convertGoalsToMaterials(
        settings: IEstimatedAscensionSettings,
        goals: Array<ICharacterAscendGoal | ICharacterUnlockGoal>
    ): ICharacterShardsEstimate[] {
        const materials = goals
            .flatMap(goal => [this.convertGoalToMaterial(goal), this.convertGoalToMythicMaterial(goal)])
            .filter(
                x =>
                    (x.requiredCount > 0 && x.acquiredCount < x.requiredCount) ||
                    (x.requiredMythicCount > 0 && x.acquiredMythicCount < x.requiredMythicCount)
            );
        const currCampaignEventLocations = campaignsByGroup[settings.preferences.campaignEvent ?? ''] ?? [];

        const result: ICharacterShardsEstimate[] = [];

        for (let i = 0; i < materials.length; i++) {
            const material = materials[i];
            const previousShardsTokens = sum(result.filter((_, index) => index < i).map(x => x.onslaughtTokensTotal));
            const unlockedLocations = material.possibleLocations.filter(location => {
                const isCampaignEventLocation = campaignEventsLocations.includes(location.campaign);
                const isCampaignEventLocationAvailable = currCampaignEventLocations.includes(location.campaign);

                const campaignProgress = settings.campaignsProgress[location.campaign as keyof ICampaignsProgress];
                const isPassFilter =
                    !settings.filters || CampaignsService.passLocationFilter(location, settings.filters);

                // location can be suggested for raids only if it is unlocked, passed other filters
                // and in case it is Campaign Event location user should have specific Campaign Event selected
                return (
                    location.nodeNumber <= campaignProgress &&
                    isPassFilter &&
                    (!isCampaignEventLocation || isCampaignEventLocationAvailable)
                );
            });

            const raidsLocations =
                material.campaignsUsage === CampaignsLocationsUsage.LeastEnergy
                    ? CampaignsService.selectBestLocations(unlockedLocations)
                    : material.campaignsUsage === CampaignsLocationsUsage.BestTime
                      ? unlockedLocations
                      : [];

            const energyPerDay = sum(raidsLocations.map(x => x.energyPerDay));

            if (material.onslaughtShards > 0) {
                raidsLocations.push(
                    this.getOnslaughtLocation(material, /*mythic=*/ false, 1),
                    this.getOnslaughtLocation(material, /*mythic=*/ false, 2),
                    this.getOnslaughtLocation(material, /*mythic=*/ false, 3)
                );
            }
            if (material.onslaughtMythicShards > 0) {
                raidsLocations.push(
                    this.getOnslaughtLocation(material, /*mythic=*/ true, 1),
                    this.getOnslaughtLocation(material, /*mythic=*/ true, 2),
                    this.getOnslaughtLocation(material, /*mythic=*/ true, 3)
                );
            }

            const isBlocked = !raidsLocations.length;
            const shardsLeft =
                material.requiredMythicCount > 0
                    ? material.requiredMythicCount - material.acquiredMythicCount
                    : material.requiredCount - material.acquiredCount;
            let energyTotal = 0;
            let raidsTotal = 0;
            let shardsCollected = 0;
            let daysTotal = 0;
            let onslaughtTokens = 0;
            for (const location of raidsLocations) {
                console.log('location: ', location);
            }
            while (!isBlocked && shardsCollected < shardsLeft) {
                let leftToCollect = shardsLeft - shardsCollected;
                for (const location of raidsLocations) {
                    if (leftToCollect <= 0) {
                        break;
                    }

                    if (location.campaignType === 'Onslaught') {
                        if (daysTotal > 0 && daysTotal <= previousShardsTokens / 1.5) {
                            continue;
                        }

                        onslaughtTokens += location.dailyBattleCount;
                        leftToCollect -= location.itemsPerDay;
                        shardsCollected += location.itemsPerDay;
                        raidsTotal += location.dailyBattleCount;
                        continue;
                    }

                    if (leftToCollect >= location.itemsPerDay) {
                        leftToCollect -= location.itemsPerDay;
                        energyTotal += location.energyPerDay;
                        shardsCollected += location.itemsPerDay;
                        raidsTotal += location.dailyBattleCount;
                    } else {
                        const energyLeftToFarm = leftToCollect * location.energyPerItem;
                        const battlesLeftToFarm = Math.ceil(energyLeftToFarm / location.energyCost);
                        shardsCollected += leftToCollect;
                        energyTotal += battlesLeftToFarm * location.energyCost;
                        raidsTotal += battlesLeftToFarm;
                    }
                }
                daysTotal++;
                if (daysTotal > 1000) {
                    console.error('Infinite loop', material, raidsLocations);
                    break;
                }
            }

            if (raidsTotal > 1 && raidsTotal % 1 !== 0) {
                daysTotal++;
            }

            result.push({
                ...material,
                availableLocations: unlockedLocations,
                raidsLocations,
                energyTotal,
                daysTotal,
                raidsTotal: Math.ceil(raidsTotal),
                onslaughtTokensTotal: Math.ceil(onslaughtTokens),
                isBlocked,
                energyPerDay,
            });
        }

        return result;
    }

    private static getOnslaughtLocation(material: IShardMaterial, mythic: boolean, nodeNumber: 1 | 2 | 3) {
        const onslaughtMaxTokens = 3;
        const onslaughtTokenRefreshHours = 16;
        const onslaughtTokensPerDay = 24 / onslaughtTokenRefreshHours;
        const shardCount = mythic ? material.onslaughtMythicShards : material.onslaughtShards;
        const itemsPerDay =
            ((mythic ? material.onslaughtMythicShards : material.onslaughtShards) * onslaughtTokensPerDay) /
            onslaughtMaxTokens;

        const onslaughtLocation: ICampaignBattleComposed = {
            id: 'Onslaught' + nodeNumber,
            itemsPerDay: itemsPerDay,
            dropRate: itemsPerDay,
            dailyBattleCount: onslaughtTokensPerDay / onslaughtMaxTokens,
            rarity: 'Shard',
            rarityEnum: Rarity.Legendary,
            rewards: {
                guaranteed: [
                    {
                        id: (mythic ? 'mythicShards_' : 'shards_') + material.characterId,
                        min: shardCount,
                        max: shardCount,
                    },
                ],
                potential: [],
            },
            nodeNumber,
            campaign: Campaign.Onslaught,
            campaignType: CampaignType.Onslaught,
            enemyPower: 0,
            energyCost: 0,
            energyPerDay: 0,
            energyPerItem: 0,
            enemiesFactions: [],
            enemiesAlliances: [],
            alliesFactions: [],
            alliesAlliance: Alliance.Chaos, // Doesn't matter, just need a placeholder.
            enemiesTypes: [],
            enemiesTotal: 0,
        };
        return onslaughtLocation;
    }

    private static convertGoalToMaterial(goal: ICharacterAscendGoal | ICharacterUnlockGoal): IShardMaterial {
        const targetShards =
            goal.type === PersonalGoalType.Ascend ? this.getTargetShards(goal) : charsUnlockShards[goal.rarity];
        const possibleLocations = StaticDataService.getItemLocations(`shards_${goal.unitId}`);

        return {
            goalId: goal.goalId,
            characterId: goal.unitId,
            label: goal.unitName,
            acquiredCount: goal.shards,
            requiredCount: targetShards,
            iconPath: goal.unitRoundIcon,
            relatedCharacters: [goal.unitName],
            possibleLocations,
            onslaughtShards: goal.type === PersonalGoalType.Ascend ? goal.onslaughtShards : 0,
            onslaughtMythicShards: 0,
            acquiredMythicCount: 0,
            requiredMythicCount: 0,
            campaignsUsage: goal.campaignsUsage,
        };
    }

    private static convertGoalToMythicMaterial(goal: ICharacterAscendGoal | ICharacterUnlockGoal): IShardMaterial {
        const targetMythicShards = goal.type === PersonalGoalType.Ascend ? this.getTargetMythicShards(goal) : 0;
        const possibleLocations = StaticDataService.getItemLocations(`mythicShards_${goal.unitId}`);

        return {
            goalId: goal.goalId,
            characterId: goal.unitId,
            label: goal.unitName,
            acquiredCount: 0,
            requiredCount: 0,
            iconPath: goal.unitRoundIcon,
            relatedCharacters: [goal.unitName],
            possibleLocations,
            onslaughtShards: 0,
            onslaughtMythicShards: goal.type === PersonalGoalType.Ascend ? goal.onslaughtMythicShards : 0,
            acquiredMythicCount: goal.mythicShards ?? 0,
            requiredMythicCount: targetMythicShards,
            campaignsUsage:
                'mythicCampaignsUsage' in goal ? goal.mythicCampaignsUsage : CampaignsLocationsUsage.LeastEnergy,
        };
    }

    /**
     * Processes a list of character shard estimates and their associated raid locations, returning
     * a list of raid plans for today.
     *
     * For each material, this function:
     * - Maps its raid locations, augmenting each with calculated properties:
     *   - `raidsCount` is the ceiling of `dailyBattleCount` (note: this may round up fractional
     *      battles).
     *   - `isCompleted` is set if the location's ID is present in `completedLocations`.
     *   - Other properties (`farmedItems`, `energySpent`, `isShardsLocation`) are copied or set as
     *     appropriate.
     * - Orders the locations so incomplete ones come first (`isCompleted: false` before `true`).
     * - Marks the material as completed only if all its locations are completed.
     *
     * The final result is a list of these material raid plans, also ordered so incomplete
     * materials come first.
     *
     * **Subtle behaviors:**
     * - Locations with fractional `dailyBattleCount` are always rounded up, which may overestimate
     *   required raids.
     * - The `isCompleted` status for both locations and materials is determined solely by presence
     *   in `completedLocations`, not by any progress or partial completion.
     * - The function mutates the structure of each location, so downstream consumers should not
     *   expect the original shape.
     * - Both the locations within each material and the overall result are sorted by completion
     *   status, which may affect UI or further processing order.
     */
    private static getTodayRaids(
        materials: ICharacterShardsEstimate[],
        completedLocations: IItemRaidLocation[]
    ): IShardsRaid[] {
        const result: IShardsRaid[] = [];

        for (const material of materials) {
            const locations: IItemRaidLocation[] = material.raidsLocations.map(location => ({
                ...location,
                raidsCount: Math.ceil(location.dailyBattleCount),
                farmedItems: location.itemsPerDay,
                energySpent: location.energyPerDay,
                isCompleted: completedLocations.some(cLocation => cLocation.id === location.id),
                isShardsLocation: true,
            }));

            const materialRaid: IShardsRaid = {
                ...material,
                locations: orderBy(locations, ['isCompleted'], ['asc']),
                isCompleted: locations.every(location => location.isCompleted),
            };

            result.push(materialRaid);
        }

        return orderBy(result, ['isCompleted'], ['asc']);
    }

    public static getTargetShards(goal: ICharacterAscendGoal): number {
        const currentCharProgression = goal.rarityStart + goal.starsStart;
        const targetProgression = goal.rarityEnd + (goal.starsEnd || RarityMapper.toStars[goal.rarityEnd]);

        let targetShards = 0;

        for (let i = currentCharProgression + 1; i <= targetProgression; i++) {
            const progressionRequirements = charsProgression[i];
            targetShards += progressionRequirements.shards ?? 0;
        }

        return targetShards;
    }

    public static getTargetMythicShards(goal: ICharacterAscendGoal): number {
        const currentCharProgression = goal.rarityStart + goal.starsStart;
        const targetProgression = goal.rarityEnd + (goal.starsEnd || RarityMapper.toStars[goal.rarityEnd]);

        let targetShards = 0;

        for (let i = currentCharProgression + 1; i <= targetProgression; i++) {
            const progressionRequirements = charsProgression[i];
            targetShards += progressionRequirements.mythicShards ?? 0;
        }

        return targetShards;
    }

    public static getTargetShardsForMow(goal: ICharacterUpgradeMow): number {
        const currentCharProgression = goal.rarity + goal.stars;
        const targetRarity = RarityMapper.getRarityFromLevel(Math.max(goal.primaryEnd, goal.secondaryEnd));
        const targetProgression = targetRarity + RarityMapper.toStars[targetRarity];

        let targetShards = 0;

        for (let i = currentCharProgression + 1; i <= targetProgression; i++) {
            const progressionRequirements = charsProgression[i];
            targetShards += progressionRequirements.shards ?? 0;
        }

        return targetShards;
    }
}
