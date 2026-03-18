/* eslint-disable import-x/no-internal-modules */
import { orderBy } from 'lodash';
import { useCallback, useContext, useMemo } from 'react';

import { DailyRaidsStrategy } from '@/models/enums';
import { ICustomDailyRaidsSettings } from '@/models/interfaces';
import { DispatchContext, StoreContext } from '@/reducers/store.provider';

import { Rarity, RarityMapper, RarityString } from '@/fsd/5-shared/model';
import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CampaignImage, CampaignsService, CampaignType } from '@/fsd/4-entities/campaign';
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
    bestBattleId: string;
    estimatedEnergy: number;
    relatedGoalIds: string[];
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

interface MaterialNeedInfo {
    needed: number;
    relatedGoalIds: Set<string>;
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
        const ret = new Map<string, MaterialNeedInfo>();
        for (const mat of [...upgradesEstimates.inProgressMaterials, ...upgradesEstimates.blockedMaterials]) {
            const needed = Math.max(0, (mat.requiredCount ?? 0) - (mat.acquiredCount ?? 0));
            if (needed > 0) {
                const existing = ret.get(mat.id) ?? { needed: 0, relatedGoalIds: new Set<string>() };
                existing.needed += needed;
                for (const goalId of mat.relatedGoals ?? []) {
                    existing.relatedGoalIds.add(goalId);
                }
                ret.set(mat.id, existing);
            }
        }
        return ret;
    }, [upgradesEstimates.inProgressMaterials, upgradesEstimates.blockedMaterials]);

    const goalUnitById = useMemo(() => {
        return new Map(allGoals.map(goal => [goal.goalId, { name: goal.unitName, icon: goal.unitRoundIcon }]));
    }, [allGoals]);

    const campaignPlans = useMemo(() => {
        const rawPlans = new Map<
            string,
            {
                campaign: string;
                campaignType: CampaignType.Standard | CampaignType.Extremis;
                materials: Map<string, { bestDropRate: number; bestBattleId: string }>;
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
                const existingPlan = rawPlans.get(planKey) ?? {
                    campaign: normalizedCampaign,
                    campaignType: battle.campaignType,
                    materials: new Map<string, { bestDropRate: number; bestBattleId: string }>(),
                };

                for (const reward of battle.rewards.potential) {
                    const needed = neededByMaterial.get(reward.id)?.needed ?? 0;
                    if (needed <= 0) {
                        continue;
                    }

                    const current = existingPlan.materials.get(reward.id);
                    const nextDropRate = Math.max(battle.dropRate, 0);
                    const battleId = battle.id;

                    if (!current || nextDropRate > current.bestDropRate) {
                        existingPlan.materials.set(reward.id, {
                            bestDropRate: nextDropRate,
                            bestBattleId: battleId,
                        });
                    }

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
        const isStandardEnabledForMaterial = (materialId: string): boolean => {
            const materialRarity = getMaterialPreferenceKey(materialId);
            const customSettings = dailyRaidsPreferences.customSettings;
            if (!customSettings) {
                return false;
            }
            return (customSettings[materialRarity] ?? []).includes(CampaignType.Standard);
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

            if (isCustom && !isStandardEnabledForMaterial(materialId)) {
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
            for (const [materialId, source] of plan.materials) {
                const neededInfo = neededByMaterial.get(materialId);
                const needed = neededInfo?.needed ?? 0;
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
                    bestDropRate: source.bestDropRate,
                    bestBattleId: source.bestBattleId,
                    estimatedEnergy:
                        source.bestDropRate > 0 ? (needed / source.bestDropRate) * 6 : Number.POSITIVE_INFINITY,
                    relatedGoalIds: [...(neededInfo?.relatedGoalIds ?? new Set<string>())],
                });
            }

            if (!materials.length) {
                continue;
            }

            const orderedMaterials = orderBy(
                materials,
                [x => x.estimatedEnergy, x => x.needed, x => getMaterialSortWeight(x.materialId)],
                ['desc', 'desc', 'asc']
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

        return orderBy(plans, [x => x.totalEstimatedEnergy, x => x.totalNeededMaterials], ['desc', 'desc']);
    }, [campaignsProgress, dailyRaidsPreferences, neededByMaterial]);

    const standardPlans = useMemo(
        () =>
            orderBy(
                campaignPlans.filter(x => x.campaignType === CampaignType.Standard),
                [x => x.totalEstimatedEnergy, x => x.totalNeededMaterials],
                ['desc', 'desc']
            ),
        [campaignPlans]
    );
    const extremisPlans = useMemo(
        () =>
            orderBy(
                campaignPlans.filter(x => x.campaignType === CampaignType.Extremis),
                [x => x.totalEstimatedEnergy, x => x.totalNeededMaterials],
                ['desc', 'desc']
            ),
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
        return (
            <section>
                <details open={defaultOpen}>
                    <summary className="mb-3 cursor-pointer text-xl font-semibold">{title}</summary>
                    {plans.length === 0 ? (
                        <p className="text-sm opacity-70">No missing materials currently map to these campaigns.</p>
                    ) : (
                        <div className="space-y-4">
                            {plans.map(plan => (
                                <details
                                    key={`${plan.campaignType}::${plan.campaign}`}
                                    className="group rounded-lg border border-slate-300 p-4 dark:border-slate-700">
                                    <summary className="mb-2 flex cursor-pointer flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="inline-block text-xl leading-none opacity-70 transition-transform group-open:rotate-90">
                                                ▸
                                            </span>
                                            <CampaignImage campaign={plan.campaign} size={28} />
                                            <h3 className="text-lg font-semibold">{plan.campaign}</h3>
                                        </div>
                                        <div className="text-sm opacity-80">
                                            Energy: <b>{Math.ceil(plan.totalEstimatedEnergy)}</b> · Mats:{' '}
                                            <b>{plan.totalNeededMaterials}</b>
                                        </div>
                                    </summary>

                                    <div className="space-y-2">
                                        {plan.materials.map(materialPlan => (
                                            <div
                                                key={materialPlan.materialId}
                                                className="rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-800">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        {renderMaterial(materialPlan.materialId)}
                                                        <span className="text-xs opacity-70">
                                                            <b>{extractBattleNumber(materialPlan.bestBattleId)}</b>
                                                        </span>
                                                        {Array.from(
                                                            new Map(
                                                                materialPlan.relatedGoalIds
                                                                    .map(goalId => goalUnitById.get(goalId))
                                                                    .filter(
                                                                        (
                                                                            unit
                                                                        ): unit is {
                                                                            name: string;
                                                                            icon: string;
                                                                        } => !!unit?.icon
                                                                    )
                                                                    .map(unit => [unit.icon, unit])
                                                            ).values()
                                                        ).map(unit => (
                                                            <UnitShardIcon
                                                                key={unit.icon}
                                                                icon={unit.icon}
                                                                mythic={false}
                                                            />
                                                        ))}
                                                    </div>

                                                    <div className="text-sm">
                                                        Need <b>{materialPlan.needed.toFixed(0)}</b> · Est energy{' '}
                                                        <b>{Math.ceil(materialPlan.estimatedEnergy)}</b>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </details>
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

function extractBattleNumber(battleId: string): string {
    const trimmed = battleId.trim();
    const match = trimmed.match(/(\d{1,2})(b)?$/i);
    if (!match) {
        return battleId;
    }

    const number = match[1];
    const isChallenge = /challenge/i.test(trimmed);
    return `${number}${isChallenge ? 'B' : ''}`;
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
