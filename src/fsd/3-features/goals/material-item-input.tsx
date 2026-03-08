/* eslint-disable import-x/no-internal-modules */
import React from 'react';

import { Rarity, RarityMapper } from '@/fsd/5-shared/model';
import { UnitShardIcon } from '@/fsd/5-shared/ui/icons/unit-shard.icon';

import { CampaignLocation } from '@/fsd/4-entities/campaign/campaign-location';
import { UpgradeImage } from '@/fsd/4-entities/upgrade/upgrade-image';

import { IUpgradeRaid } from '@/fsd/3-features/goals/goals.models';

import { UpgradesService } from './upgrades.service';

interface Props {
    upgradeRaid: IUpgradeRaid;
    isExhausted?: boolean;
}

export const MaterialItemInput: React.FC<Props> = ({ upgradeRaid, isExhausted = false }) => {
    const isShard = UpgradesService.isShard(upgradeRaid.id);
    const isMythicShard = UpgradesService.isMythicShard(upgradeRaid.id);
    const canStillFarm = !isExhausted;

    return (
        <div className="flex-box between" style={{ opacity: canStillFarm ? 1 : 0.5 }}>
            <div className="flex-box column">
                {isShard && <UnitShardIcon icon={upgradeRaid.iconPath} mythic={false} />}

                {isMythicShard && <UnitShardIcon icon={upgradeRaid.iconPath} mythic={true} />}
                {UpgradesService.isMaterial(upgradeRaid.id) && (
                    <UpgradeImage
                        material={upgradeRaid.label}
                        iconPath={upgradeRaid.iconPath}
                        rarity={RarityMapper.rarityToRarityString(upgradeRaid.rarity as unknown as Rarity)}
                        tooltip={
                            <div>
                                {upgradeRaid.label}
                                <ul className="ps-[15px]">
                                    {upgradeRaid.relatedCharacters.map(x => (
                                        <li
                                            key={
                                                'material-item-input-' +
                                                upgradeRaid.id +
                                                '-' +
                                                upgradeRaid.raidLocations.map(loc => loc.id).join(',') +
                                                '-' +
                                                x
                                            }>
                                            {x}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        }
                    />
                )}
                <span>
                    {upgradeRaid.acquiredCount}/{upgradeRaid.requiredCount}
                </span>
            </div>
            <ul className="w-full ps-[15px]">
                {upgradeRaid.raidLocations.map(location => {
                    return (
                        <li
                            key={
                                'material-item-input-' +
                                upgradeRaid.relatedGoals.join(',') +
                                '-' +
                                upgradeRaid.id +
                                '-' +
                                location.id
                            }
                            className="flex-box between"
                            style={{ opacity: location.isCompleted ? 0.5 : 1 }}>
                            <CampaignLocation location={location} unlocked={true} />
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};
