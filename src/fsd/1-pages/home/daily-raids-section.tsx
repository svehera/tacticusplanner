/* eslint-disable import-x/no-internal-modules */
/* eslint-disable boundaries/element-types */
import { sum } from 'lodash';
import { useContext, useMemo } from 'react';
import { isMobile } from 'react-device-detect';
import { useNavigate } from 'react-router-dom';

import { menuItemById } from 'src/models/menu-items';
import { StoreContext } from 'src/reducers/store.provider';

import { RarityMapper } from '@/fsd/5-shared/model';
import { RarityString } from '@/fsd/5-shared/model/enums';
import { MiscIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { Campaign, ChipCampaignLocation, ICampaignBattleComposed } from '@/fsd/4-entities/campaign';
import { CharactersService } from '@/fsd/4-entities/character';
import { MowsService } from '@/fsd/4-entities/mow';
import { recipeDataByName, UpgradeImage } from '@/fsd/4-entities/upgrade/@x/campaign';

import { IItemRaidLocation } from '@/fsd/3-features/goals/goals.models';
import { GoalsService } from '@/fsd/3-features/goals/goals.service';
import { UpgradesService } from '@/fsd/3-features/goals/upgrades.service';

type RewardDisplay =
    | { kind: 'upgrade'; label: string; iconPath: string; rarity: RarityString | undefined }
    | { kind: 'shard'; roundIcon: string; name: string };

function getRewardDisplay(location: ICampaignBattleComposed): RewardDisplay | undefined {
    let rewardId: string | undefined;
    for (const r of location.rewards.guaranteed) {
        if (r.id !== 'gold') {
            rewardId = r.id;
            break;
        }
    }
    if (!rewardId) {
        for (const r of location.rewards.potential) {
            if (r.id !== 'gold') {
                rewardId = r.id;
                break;
            }
        }
    }
    if (!rewardId) return undefined;

    if (rewardId.startsWith('shards_') || rewardId.startsWith('mythicShards_')) {
        const isMythic = rewardId.startsWith('mythicShards_');
        const unitId = rewardId.slice(isMythic ? 'mythicShards_'.length : 'shards_'.length);
        const char = CharactersService.charactersData.find(c => c.snowprintId === unitId);
        if (!char) return undefined;
        return { kind: 'shard', roundIcon: char.roundIcon, name: char.shortName };
    }

    const material = recipeDataByName[rewardId];
    if (!material) return undefined;
    return {
        kind: 'upgrade',
        label: material.label ?? material.material ?? '',
        iconPath: material.icon ?? '',
        rarity: RarityMapper.stringToRarityString(material.rarity ?? ''),
    };
}

function LocationRow({ x }: { x: IItemRaidLocation }) {
    const reward = getRewardDisplay(x);
    return (
        <div className="flex items-center gap-1">
            <span className="w-6 shrink-0 text-right text-xs text-(--soft-fg) tabular-nums">{x.raidsToPerform}×</span>
            <ChipCampaignLocation location={x} unlocked={true} compact={true} clickable={false} />
            {reward?.kind === 'upgrade' && (
                <UpgradeImage
                    material={reward.label}
                    iconPath={reward.iconPath}
                    rarity={reward.rarity}
                    size={20}
                    tooltip={reward.label}
                />
            )}
            {reward?.kind === 'shard' && <UnitShardIcon icon={reward.roundIcon} width={20} height={20} />}
        </div>
    );
}

function DoneLocationRow({ x }: { x: IItemRaidLocation }) {
    const reward = getRewardDisplay(x);
    return (
        <div className="flex items-center gap-1 opacity-50">
            <span className="w-6 shrink-0 text-right text-xs text-(--soft-fg) tabular-nums">
                {x.raidsAlreadyPerformed}×
            </span>
            <ChipCampaignLocation location={x} unlocked={true} compact={true} clickable={false} />
            {reward?.kind === 'upgrade' && (
                <UpgradeImage
                    material={reward.label}
                    iconPath={reward.iconPath}
                    rarity={reward.rarity}
                    size={20}
                    tooltip={reward.label}
                />
            )}
            {reward?.kind === 'shard' && <UnitShardIcon icon={reward.roundIcon} width={20} height={20} />}
        </div>
    );
}

function GridSeparator({ label }: { label: string }) {
    return (
        <div className="col-span-full flex items-center gap-2 text-[10px] font-medium tracking-wide uppercase opacity-40">
            <div className="h-px flex-1 bg-(--card-border)" />
            {label}
            <div className="h-px flex-1 bg-(--card-border)" />
        </div>
    );
}

export function DailyRaidsSection() {
    const navigate = useNavigate();
    const {
        dailyRaids,
        goals,
        characters,
        mows,
        campaignsProgress,
        inventory,
        dailyRaidsPreferences,
        gameModeTokens,
        onslaughtPreferences,
    } = useContext(StoreContext);
    const dailyRaidsMenuItem = menuItemById['dailyRaids'];

    const resolvedCharacters = useMemo(() => CharactersService.resolveStoredCharacters(characters), [characters]);
    const resolvedMows = useMemo(() => MowsService.resolveAllFromStorage(mows), [mows]);
    const units = useMemo(() => [...resolvedCharacters, ...resolvedMows], [resolvedCharacters, resolvedMows]);

    const onslaughtTokensToday = useMemo(
        () => UpgradesService.computeOnslaughtTokensToday(gameModeTokens),
        [gameModeTokens]
    );

    const { shardsGoals, upgradeMaterialGoals, upgradeRankOrMowGoals } = useMemo(
        () => GoalsService.prepareGoals(goals, units, true, onslaughtPreferences),
        [goals, units, onslaughtPreferences]
    );

    const estimatedUpgradesTotal = useMemo(
        () =>
            UpgradesService.getUpgradesEstimatedDays(
                {
                    dailyEnergy: dailyRaidsPreferences.dailyEnergy,
                    campaignsProgress,
                    preferences: dailyRaidsPreferences,
                    upgrades: inventory.upgrades,
                    completedLocations: dailyRaids.raidedLocations.filter(x => !x.isShardsLocation),
                    filters: dailyRaids.filters,
                    onslaughtTokensToday,
                    onslaughtPreferences,
                },
                resolvedCharacters,
                resolvedMows,
                ...upgradeMaterialGoals,
                ...upgradeRankOrMowGoals,
                ...shardsGoals
            ),
        [
            dailyRaidsPreferences,
            campaignsProgress,
            inventory.upgrades,
            dailyRaids.raidedLocations,
            dailyRaids.filters,
            onslaughtTokensToday,
            onslaughtPreferences,
            resolvedCharacters,
            resolvedMows,
            upgradeMaterialGoals,
            upgradeRankOrMowGoals,
            shardsGoals,
        ]
    );

    const toBeRaidedLocations = useMemo(() => {
        const todayRaids = estimatedUpgradesTotal.upgradesRaids[0]?.raids ?? [];
        const seen = new Map<string, IItemRaidLocation>();
        for (const raid of todayRaids) {
            for (const loc of raid.raidLocations) {
                if (loc.raidsToPerform <= 0) continue;
                const isOnslaught = loc.campaign === Campaign.Onslaught;
                const key = isOnslaught ? `onslaught:${raid.id}` : loc.id;
                if (seen.has(key)) {
                    if (isOnslaught) {
                        const existing = seen.get(key)!;
                        seen.set(key, { ...existing, raidsToPerform: existing.raidsToPerform + loc.raidsToPerform });
                    }
                } else {
                    seen.set(key, { ...loc });
                }
            }
        }
        return [...seen.values()];
    }, [estimatedUpgradesTotal]);

    const locationCount = dailyRaids.raidedLocations?.length ?? 0;
    const totalEnergy = sum(dailyRaids.raidedLocations?.map(x => x.energySpent));
    const toRaidCount = toBeRaidedLocations.length;
    const plannedEnergy = sum(toBeRaidedLocations.map(x => x.energySpent));

    const isEmpty = locationCount === 0 && toRaidCount === 0;

    return (
        <div className="w-full max-w-[350px]">
            <p className="mb-1 text-center text-sm font-semibold tracking-wide text-(--soft-fg) uppercase">
                Daily Raids
            </p>
            <div
                role="button"
                tabIndex={0}
                className="flex w-full cursor-pointer flex-col overflow-hidden rounded-xl border border-(--card-border) bg-(--card) shadow-sm transition-colors"
                onClick={() => navigate(isMobile ? dailyRaidsMenuItem.routeMobile : dailyRaidsMenuItem.routeWeb)}
                onKeyDown={event_ => {
                    if (event_.key === 'Enter' || event_.key === ' ') {
                        event_.preventDefault();
                        navigate(isMobile ? dailyRaidsMenuItem.routeMobile : dailyRaidsMenuItem.routeWeb);
                    }
                }}>
                <div className="border-b border-(--card-border) px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 font-medium">
                            {dailyRaidsMenuItem.icon} {dailyRaidsMenuItem.label}
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                            {toRaidCount > 0 && (
                                <span className="flex items-center gap-1 text-sm text-(--soft-fg)">
                                    {plannedEnergy > 0 && (
                                        <>
                                            <MiscIcon icon="energy" width={12} height={12} />
                                            <span className="tabular-nums">{plannedEnergy}</span>
                                            <span aria-hidden>·</span>
                                        </>
                                    )}
                                    {toRaidCount} to raid
                                </span>
                            )}
                            {locationCount > 0 && (
                                <span className="flex items-center gap-1 text-xs text-(--soft-fg)">
                                    {totalEnergy > 0 && (
                                        <>
                                            <MiscIcon icon="energy" width={10} height={10} />
                                            <span className="tabular-nums">{totalEnergy}</span>
                                            <span aria-hidden>·</span>
                                        </>
                                    )}
                                    {locationCount} done
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="px-2 py-3 text-sm sm:px-4">
                    {isEmpty ? (
                        <p className="text-xs text-(--soft-fg)">No raids recorded today.</p>
                    ) : (
                        <div className="grid grid-cols-1 gap-x-3 gap-y-1.5 min-[356px]:grid-cols-2">
                            {toBeRaidedLocations.map(x => (
                                <LocationRow key={x.id} x={x} />
                            ))}
                            {toRaidCount > 0 && locationCount > 0 && <GridSeparator label="Raided" />}
                            {dailyRaids.raidedLocations.map(x => (
                                <DoneLocationRow key={x.id} x={x} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
