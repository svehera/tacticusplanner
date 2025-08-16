import { orderBy, sum } from 'lodash';

import { charsProgression, charsUnlockShards } from 'src/models/constants';
import { CampaignsLocationsUsage, PersonalGoalType } from 'src/models/enums';
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
} from 'src/v2/features/goals/goals.models';

export class ShardsService {
    static getShardsEstimatedDays(
        settings: IEstimatedAscensionSettings,
        ...goals: Array<ICharacterAscendGoal | ICharacterUnlockGoal>
    ): IEstimatedShards {
        const materials = this.convertGoalsToMaterials(settings, goals);

        const shardsRaids = this.getTodayRaids(materials, settings.raidedLocations);

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

    public static convertGoalsToMaterials(
        settings: IEstimatedAscensionSettings,
        goals: Array<ICharacterAscendGoal | ICharacterUnlockGoal>
    ): ICharacterShardsEstimate[] {
        const materials = goals
            .map(goal => this.convertGoalToMaterial(goal))
            .filter(x => x.acquiredCount < x.requiredCount);
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
                    this.getOnslaughtLocation(material, 1),
                    this.getOnslaughtLocation(material, 2),
                    this.getOnslaughtLocation(material, 3)
                );
            }

            const isBlocked = !raidsLocations.length;
            const shardsLeft = material.requiredCount - material.acquiredCount;
            let energyTotal = 0;
            let raidsTotal = 0;
            let shardsCollected = 0;
            let daysTotal = 0;
            let onslaughtTokens = 0;
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

    private static getOnslaughtLocation(material: IShardMaterial, nodeNumber: 1 | 2 | 3) {
        const onslaughtMaxTokens = 3;
        const onslaughtTokenRefreshHours = 16;
        const onslaughtTokensPerDay = 24 / onslaughtTokenRefreshHours;

        const onslaughtLocation: ICampaignBattleComposed = {
            id: 'Onslaught' + nodeNumber,
            itemsPerDay: (material.onslaughtShards * onslaughtTokensPerDay) / onslaughtMaxTokens,
            dropRate: (material.onslaughtShards * onslaughtTokensPerDay) / onslaughtMaxTokens,
            dailyBattleCount: onslaughtTokensPerDay / onslaughtMaxTokens,
            rarity: 'Shard',
            rarityEnum: Rarity.Legendary,
            rewards: {
                guaranteed: [
                    {
                        id: material.characterId,
                        min: material.onslaughtShards,
                        max: material.onslaughtShards,
                    },
                ],
                potential: [],
            },
            nodeNumber,
            campaign: Campaign.Onslaught,
            campaignType: CampaignType.Onslaught,
            energyCost: 0,
            energyPerDay: 0,
            energyPerItem: 0,
            enemiesFactions: [],
            enemiesAlliances: [],
            alliesFactions: [],
            alliesAlliance: Alliance.Chaos,
            enemiesTypes: [],
            enemiesTotal: 0,
        };
        return onslaughtLocation;
    }

    private static convertGoalToMaterial(goal: ICharacterAscendGoal | ICharacterUnlockGoal): IShardMaterial {
        const targetShards =
            goal.type === PersonalGoalType.Ascend ? this.getTargetShards(goal) : charsUnlockShards[goal.rarity];
        const possibleLocations = StaticDataService.getItemLocations(goal.unitName);

        return {
            goalId: goal.goalId,
            characterId: goal.unitName,
            label: goal.unitName,
            acquiredCount: goal.shards,
            requiredCount: targetShards,
            iconPath: goal.unitIcon,
            relatedCharacters: [goal.unitName],
            possibleLocations,
            onslaughtShards: goal.type === PersonalGoalType.Ascend ? goal.onslaughtShards : 0,
            campaignsUsage: goal.campaignsUsage,
        };
    }

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
                isCompleted: completedLocations.some(clocation => clocation.id === location.id),
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
            targetShards += progressionRequirements.shards;
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
            targetShards += progressionRequirements.shards;
        }

        return targetShards;
    }
}
