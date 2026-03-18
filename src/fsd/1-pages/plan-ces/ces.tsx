/* eslint-disable import-x/no-internal-modules */
import { orderBy } from 'lodash';
import { useCallback, useContext, useMemo } from 'react';

import { DailyRaidsStrategy } from '@/models/enums';
import { ICustomDailyRaidsSettings } from '@/models/interfaces';
import { DispatchContext, StoreContext } from '@/reducers/store.provider';

import { Rarity, RarityMapper, RarityString } from '@/fsd/5-shared/model';
import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CampaignsService, CampaignType } from '@/fsd/4-entities/campaign';
import { CharactersService } from '@/fsd/4-entities/character';
import { MowsService } from '@/fsd/4-entities/mow/mows.service';
import { UpgradesService as FsdUpgradesService, UpgradeImage } from '@/fsd/4-entities/upgrade';

import { ActiveGoalsDialog } from '@/fsd/3-features/goals/active-goals-dialog';
import { CharacterRaidGoalSelect } from '@/fsd/3-features/goals/goals.models';
import { GoalsService } from '@/fsd/3-features/goals/goals.service';
import { UpgradesService } from '@/fsd/3-features/goals/upgrades.service';

interface MaterialPlan {
    materialId: string;
    needed: number;
    bestDropRate: number;
    estimatedEnergy: number;
}

interface CampaignPlan {
    campaign: string;
    campaignType: CampaignType.Standard | CampaignType.Extremis;
    totalNeededMaterials: number;
    totalEstimatedEnergy: number;
    efficiency: number;
    materials: MaterialPlan[];
}

interface MaterialAvailability {
    hasStandard: boolean;
    hasExtremis: boolean;
}

export const CEs = () => {
    const {
        characters: unresolvedChars,
        mows: unresolvedMows,
        campaignsProgress,
        dailyRaids,
        dailyRaidsPreferences,
        gameModeTokens,
        inventory,
        goals,
    } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);
    const chars = useMemo(() => CharactersService.resolveStoredCharacters(unresolvedChars), [unresolvedChars]);
    const mows = useMemo(() => MowsService.resolveAllFromStorage(unresolvedMows), [unresolvedMows]);
    const units = useMemo(() => [...chars, ...mows], [chars, mows]);

    const onslaughtTokensToday = UpgradesService.computeOnslaughtTokensToday(gameModeTokens);

    const { allGoals, shardsGoals, upgradeRankOrMowGoals } = useMemo(
        () => GoalsService.prepareGoals(goals, units, false),
        [goals, units]
    );

    const includedShardsGoals = useMemo(() => shardsGoals.filter(x => x.include), [shardsGoals]);
    const includedUpgradeRankOrMowGoals = useMemo(
        () => upgradeRankOrMowGoals.filter(x => x.include),
        [upgradeRankOrMowGoals]
    );

    const handleGoalsSelectionChange = useCallback(
        (selection: CharacterRaidGoalSelect[]) => {
            dispatch.goals({
                type: 'UpdateDailyRaids',
                value: selection.map(x => ({ goalId: x.goalId, include: x.include })),
            });
        },
        [dispatch]
    );

    const upgradesEstimates = useMemo(() => {
        return UpgradesService.getUpgradesEstimatedDays(
            {
                dailyEnergy: dailyRaidsPreferences.dailyEnergy,
                campaignsProgress: campaignsProgress,
                preferences: {
                    ...dailyRaidsPreferences,
                },
                upgrades: inventory.upgrades,
                completedLocations: dailyRaids.raidedLocations,
                onslaughtTokensToday,
            },
            chars,
            mows,
            ...[includedUpgradeRankOrMowGoals, includedShardsGoals].flat()
        );
    }, [
        dailyRaidsPreferences,
        campaignsProgress,
        inventory.upgrades,
        dailyRaids.raidedLocations,
        onslaughtTokensToday,
        chars,
        mows,
        includedUpgradeRankOrMowGoals,
        includedShardsGoals,
    ]);

    const neededByMaterial = useMemo(() => {
        const ret = new Map<string, number>();
        for (const mat of [...upgradesEstimates.inProgressMaterials, ...upgradesEstimates.blockedMaterials]) {
            const needed = Math.max(0, (mat.requiredCount ?? 0) - (mat.acquiredCount ?? 0));
            if (needed > 0) {
                ret.set(mat.id, (ret.get(mat.id) ?? 0) + needed);
            }
        }
        return ret;
    }, [upgradesEstimates.inProgressMaterials, upgradesEstimates.blockedMaterials]);

    const campaignPlans = useMemo(() => {
        const rawPlans = new Map<
            string,
            {
                campaign: string;
                campaignType: CampaignType.Standard | CampaignType.Extremis;
                materials: Map<string, number>;
            }
        >();
        const materialAvailability = new Map<string, MaterialAvailability>();

        for (const battles of Object.values(CampaignsService.campaignsGrouped)) {
            for (const battle of battles) {
                if (battle.campaignType !== CampaignType.Standard && battle.campaignType !== CampaignType.Extremis) {
                    continue;
                }

                const campaignProgress = campaignsProgress[battle.campaign] ?? 0;
                if (UpgradesService.mapNodeNumber(battle.campaign, battle.nodeNumber) > campaignProgress) {
                    continue;
                }

                const normalizedCampaign = normalizeCampaignName(battle.campaign);
                const planKey = `${battle.campaignType}::${normalizedCampaign}`;
                const existingPlan =
                    rawPlans.get(planKey) ??
                    ({
                        campaign: normalizedCampaign,
                        campaignType: battle.campaignType,
                        materials: new Map<string, number>(),
                    } as const);

                for (const reward of battle.rewards.potential) {
                    const needed = neededByMaterial.get(reward.id) ?? 0;
                    if (needed <= 0) {
                        continue;
                    }

                    const currentRate = existingPlan.materials.get(reward.id) ?? 0;
                    existingPlan.materials.set(reward.id, Math.max(currentRate, Math.max(battle.dropRate, 0)));

                    const currentAvailability = materialAvailability.get(reward.id) ?? {
                        hasStandard: false,
                        hasExtremis: false,
                    };
                    if (battle.campaignType === CampaignType.Standard) {
                        currentAvailability.hasStandard = true;
                    }
                    if (battle.campaignType === CampaignType.Extremis) {
                        currentAvailability.hasExtremis = true;
                    }
                    materialAvailability.set(reward.id, currentAvailability);
                }

                rawPlans.set(planKey, existingPlan);
            }
        }

        const isLeastEnergy = dailyRaidsPreferences.farmStrategy === DailyRaidsStrategy.leastEnergy;
        const isCustom = dailyRaidsPreferences.farmStrategy === DailyRaidsStrategy.custom;
        const isExtremisEnabledForMaterial = (materialId: string): boolean => {
            const materialRarity = getMaterialPreferenceKey(materialId);
            const customSettings = dailyRaidsPreferences.customSettings;
            if (!customSettings) {
                return false;
            }
            return (customSettings[materialRarity] ?? []).includes(CampaignType.Extremis);
        };

        const shouldIncludeInStandard = (materialId: string): boolean => {
            const availability = materialAvailability.get(materialId);
            if (!availability?.hasStandard) {
                return false;
            }

            const hasExtremisSource = availability.hasExtremis;
            if (!hasExtremisSource) {
                return true;
            }

            if (isLeastEnergy) {
                return false;
            }

            if (isCustom && isExtremisEnabledForMaterial(materialId)) {
                return false;
            }

            return true;
        };

        const shouldIncludeInExtremis = (materialId: string): boolean => {
            return materialAvailability.get(materialId)?.hasExtremis ?? false;
        };

        const plans: CampaignPlan[] = [];
        for (const plan of rawPlans.values()) {
            const materials: MaterialPlan[] = [];
            for (const [materialId, bestDropRate] of plan.materials) {
                const needed = neededByMaterial.get(materialId) ?? 0;
                if (needed <= 0) {
                    continue;
                }

                const include =
                    plan.campaignType === CampaignType.Standard
                        ? shouldIncludeInStandard(materialId)
                        : shouldIncludeInExtremis(materialId);
                if (!include) {
                    continue;
                }

                materials.push({
                    materialId,
                    needed,
                    bestDropRate,
                    estimatedEnergy: bestDropRate > 0 ? (needed / bestDropRate) * 6 : Number.POSITIVE_INFINITY,
                });
            }

            if (!materials.length) {
                continue;
            }

            const orderedMaterials = orderBy(
                materials,
                [x => getMaterialSortWeight(x.materialId), x => x.needed],
                ['asc', 'desc']
            );
            const totalNeededMaterials = orderedMaterials.reduce((acc, x) => acc + x.needed, 0);
            const totalEstimatedEnergy = orderedMaterials.reduce((acc, x) => acc + x.estimatedEnergy, 0);
            const efficiency = totalEstimatedEnergy > 0 ? totalNeededMaterials / totalEstimatedEnergy : 0;

            plans.push({
                campaign: plan.campaign,
                campaignType: plan.campaignType,
                totalNeededMaterials,
                totalEstimatedEnergy,
                efficiency,
                materials: orderedMaterials,
            });
        }

        return orderBy(
            plans,
            [x => x.efficiency, x => x.totalNeededMaterials, x => -x.totalEstimatedEnergy],
            ['desc', 'desc', 'asc']
        );
    }, [campaignsProgress, dailyRaidsPreferences, neededByMaterial]);

    const standardPlans = useMemo(
        () => campaignPlans.filter(x => x.campaignType === CampaignType.Standard),
        [campaignPlans]
    );
    const extremisPlans = useMemo(
        () => campaignPlans.filter(x => x.campaignType === CampaignType.Extremis),
        [campaignPlans]
    );

    const renderMaterial = (material: string) => {
        if (material.startsWith('upg')) {
            const mat = FsdUpgradesService.getUpgradeMaterial(material);
            const rarity = RarityMapper.stringToRarityString(mat?.rarity ?? 'Common') ?? RarityString.Common;
            return <UpgradeImage material={material} iconPath={mat?.icon ?? ''} rarity={rarity} />;
        } else if (material.startsWith('shards_')) {
            return (
                <UnitShardIcon
                    mythic={false}
                    icon={
                        chars.find(char => char.snowprintId === material.substring(7))?.roundIcon ??
                        mows.find(mow => mow.snowprintId === material.substring(7))?.roundIcon ??
                        ''
                    }
                />
            );
        } else if (material.startsWith('mythicShards_')) {
            return (
                <UnitShardIcon
                    mythic={true}
                    icon={
                        chars.find(char => char.snowprintId === material.substring(13))?.roundIcon ??
                        mows.find(mow => mow.snowprintId === material.substring(13))?.roundIcon ??
                        ''
                    }
                />
            );
        } else {
            return material;
        }
    };

    const renderCampaignSection = (title: string, plans: CampaignPlan[], defaultOpen = true) => {
        const sectionMats = plans.reduce((acc, plan) => acc + plan.totalNeededMaterials, 0);
        return (
            <section>
                <details open={defaultOpen}>
                    <summary className="mb-3 cursor-pointer text-xl font-semibold">
                        {title} · Mats: <b>{sectionMats}</b>
                    </summary>
                    {plans.length === 0 ? (
                        <p className="text-sm opacity-70">No missing materials currently map to these campaigns.</p>
                    ) : (
                        <div className="space-y-4">
                            {plans.map(plan => (
                                <div
                                    key={`${plan.campaignType}::${plan.campaign}`}
                                    className="rounded-lg border border-slate-300 p-4 dark:border-slate-700">
                                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                        <h3 className="text-lg font-semibold">{plan.campaign}</h3>
                                        <div className="text-sm opacity-80">
                                            Mats: <b>{plan.totalNeededMaterials}</b>
                                        </div>
                                    </div>

                                    <ul className="space-y-2">
                                        {plan.materials.map(materialPlan => (
                                            <li
                                                key={materialPlan.materialId}
                                                className="flex items-center justify-between rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-800">
                                                <div className="flex items-center gap-2">
                                                    {renderMaterial(materialPlan.materialId)}
                                                </div>
                                                <div className="text-sm">
                                                    Need <b>{materialPlan.needed.toFixed(0)}</b> · Est energy{' '}
                                                    <b>{Math.ceil(materialPlan.estimatedEnergy)}</b>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </details>
            </section>
        );
    };

    return (
        <div className="space-y-6">
            <div>
                <ActiveGoalsDialog units={units} goals={allGoals} onGoalsSelectChange={handleGoalsSelectionChange} />
            </div>
            {renderCampaignSection('Extremis Campaign Events', extremisPlans, true)}
            {renderCampaignSection('Standard Campaign Events', standardPlans, false)}
        </div>
    );
};

function normalizeCampaignName(campaignName: string): string {
    return campaignName.replace(/\s+challenge$/i, '').trim();
}

function getMaterialPreferenceKey(materialId: string): keyof ICustomDailyRaidsSettings {
    if (materialId.startsWith('mythicShards_')) {
        return 'Mythic Shard';
    }
    if (materialId.startsWith('shards_')) {
        return 'Shard';
    }
    const material = FsdUpgradesService.getUpgradeMaterial(materialId);
    return RarityMapper.stringToNumber[(material?.rarity ?? 'Common') as RarityString] ?? Rarity.Common;
}

function getMaterialSortWeight(materialId: string): number {
    if (materialId.startsWith('mythicShards_')) return 0;
    if (materialId.startsWith('shards_')) return 1;
    const material = FsdUpgradesService.getUpgradeMaterial(materialId);
    const rarity = (material?.rarity ?? 'Common').toLowerCase();
    switch (rarity) {
        case 'mythic':
            return 2;
        case 'legendary':
            return 3;
        case 'epic':
            return 4;
        case 'rare':
            return 5;
        case 'uncommon':
            return 6;
        case 'common':
            return 7;
        default:
            return 99;
    }
}
