import {
    ICharacterAscendGoal,
    ICharacterUnlockGoal,
    IEstimatedAscensionSettings,
    IEstimatedShards,
    IShardMaterial,
    ICharacterShardsEstimate,
    IShardsRaid,
    IItemRaidLocation,
} from 'src/v2/features/goals/goals.models';
import { ICampaignBattleComposed, ICampaignsProgress } from 'src/models/interfaces';
import { charsProgression, charsUnlockShards, rarityToStars } from 'src/models/constants';
import { Alliance, Campaign, CampaignsLocationsUsage, CampaignType, PersonalGoalType, Rarity } from 'src/models/enums';
import { StaticDataService } from 'src/services';
import { CampaignsService } from 'src/v2/features/goals/campaigns.service';
import { orderBy, sum } from 'lodash';

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
        const result: ICharacterShardsEstimate[] = [];

        for (let i = 0; i < materials.length; i++) {
            const material = materials[i];
            const previousShardsTokens = sum(result.filter((_, index) => index < i).map(x => x.onslaughtTokensTotal));
            const unlockedLocations = material.possibleLocations.filter(location => {
                const campaignProgress = settings.campaignsProgress[location.campaign as keyof ICampaignsProgress];
                return location.nodeNumber <= campaignProgress;
            });

            const raidsLocations =
                material.campaignsUsage === CampaignsLocationsUsage.LeastEnergy
                    ? CampaignsService.selectBestLocations(unlockedLocations, {
                          ...settings.preferences,
                          useMostEfficientNodes: true,
                          useMoreEfficientNodes: false,
                          useLeastEfficientNodes: false,
                      })
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
                        if (daysTotal <= previousShardsTokens / 1.5) {
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

            if (raidsTotal % 1 !== 0) {
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
            reward: material.characterId,
            nodeNumber,
            campaign: Campaign.Onslaught,
            campaignType: CampaignType.Onslaught,
            energyCost: 0,
            energyPerDay: 0,
            energyPerItem: 0,
            expectedGold: 0,
            enemiesFactions: [],
            enemiesAlliances: [],
            alliesFactions: [],
            alliesAlliance: Alliance.Chaos,
        };
        return onslaughtLocation;
    }

    private static convertGoalToMaterial(goal: ICharacterAscendGoal | ICharacterUnlockGoal): IShardMaterial {
        const targetShards =
            goal.type === PersonalGoalType.Ascend ? this.getTargetShards(goal) : charsUnlockShards[goal.rarity];
        const possibleLocations = StaticDataService.getItemLocations(goal.characterName);

        return {
            goalId: goal.goalId,
            characterId: goal.characterName,
            label: goal.characterName,
            acquiredCount: goal.shards,
            requiredCount: targetShards,
            iconPath: goal.characterIcon,
            relatedCharacters: [goal.characterName],
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
        const targetProgression = goal.rarityEnd + (goal.starsEnd || rarityToStars[goal.rarityEnd]);

        let targetShards = 0;

        for (let i = currentCharProgression + 1; i <= targetProgression; i++) {
            const progressionRequirements = charsProgression[i];
            targetShards += progressionRequirements.shards;
        }

        return targetShards;
    }
}
