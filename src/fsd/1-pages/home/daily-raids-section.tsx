/* eslint-disable import-x/no-internal-modules */
/* eslint-disable boundaries/element-types */
import { sum } from 'lodash';
import { useContext } from 'react';
import { isMobile } from 'react-device-detect';
import { useNavigate } from 'react-router-dom';

import { menuItemById } from 'src/models/menu-items';
import { StoreContext } from 'src/reducers/store.provider';

import { RarityMapper } from '@/fsd/5-shared/model';
import { RarityString } from '@/fsd/5-shared/model/enums';
import { MiscIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { ChipCampaignLocation, ICampaignBattleComposed } from '@/fsd/4-entities/campaign';
import { CharactersService } from '@/fsd/4-entities/character';
import { recipeDataByName, UpgradeImage } from '@/fsd/4-entities/upgrade/@x/campaign';

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

export function DailyRaidsSection() {
    const navigate = useNavigate();
    const { dailyRaids } = useContext(StoreContext);
    const dailyRaidsMenuItem = menuItemById['dailyRaids'];

    const locationCount = dailyRaids.raidedLocations?.length ?? 0;
    const totalEnergy = sum(dailyRaids.raidedLocations?.map(x => x.energySpent));

    return (
        <div className="w-full max-w-[350px]">
            <p className="mb-1 text-center text-sm font-semibold tracking-wide text-(--muted-fg) uppercase">
                Daily Raids
            </p>
            <div
                role="button"
                tabIndex={0}
                className="flex w-full cursor-pointer flex-col overflow-hidden rounded-xl border border-(--card-border) bg-(--card-bg) shadow-sm transition-colors"
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
                        <div className="flex shrink-0 flex-col items-end text-sm text-(--muted-fg)">
                            <span>
                                {locationCount} location{locationCount === 1 ? '' : 's'}
                            </span>
                            {totalEnergy > 0 && (
                                <span className="flex items-center gap-0.5 text-xs">
                                    <MiscIcon icon="energy" width={12} height={12} />
                                    {totalEnergy} spent
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="px-2 py-3 text-sm sm:px-4">
                    {locationCount === 0 ? (
                        <p className="text-xs text-(--muted-fg)">No raids recorded today.</p>
                    ) : (
                        <div className="grid grid-cols-1 gap-x-3 gap-y-1.5 min-[356px]:grid-cols-2">
                            {dailyRaids.raidedLocations.map(x => {
                                const reward = getRewardDisplay(x);
                                return (
                                    <div key={x.id} className="flex items-center gap-1">
                                        <span className="w-6 shrink-0 text-right text-xs text-(--muted-fg) tabular-nums">
                                            {x.raidsAlreadyPerformed}×
                                        </span>
                                        <ChipCampaignLocation
                                            location={x}
                                            unlocked={true}
                                            compact={true}
                                            clickable={false}
                                        />
                                        {reward?.kind === 'upgrade' && (
                                            <UpgradeImage
                                                material={reward.label}
                                                iconPath={reward.iconPath}
                                                rarity={reward.rarity}
                                                size={20}
                                                tooltip={reward.label}
                                            />
                                        )}
                                        {reward?.kind === 'shard' && (
                                            <UnitShardIcon icon={reward.roundIcon} width={20} height={20} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
