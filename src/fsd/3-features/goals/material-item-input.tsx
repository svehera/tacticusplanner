/* eslint-disable import-x/no-internal-modules */
import { Tooltip } from '@mui/material';
import React, { useState } from 'react';

import { Rarity, RarityMapper } from '@/fsd/5-shared/model';
import { ButtonPill } from '@/fsd/5-shared/ui';
import { UnitShardIcon } from '@/fsd/5-shared/ui/icons/unit-shard.icon';

import { CompactCampaignLocation } from '@/fsd/4-entities/campaign/compact-campaign-location';
import { UpgradeImage } from '@/fsd/4-entities/upgrade/upgrade-image';

import { IUpgradeRaid } from '@/fsd/3-features/goals/goals.models';

import { UpgradesService } from './upgrades.service';

interface Props {
    upgradeRaid: IUpgradeRaid;
    isExhausted?: boolean;
    maxLocations?: number;
}

export const MaterialItemInput: React.FC<Props> = ({ upgradeRaid, isExhausted = false, maxLocations = 4 }) => {
    const [expanded, setExpanded] = useState(false);
    const isShard = UpgradesService.isShard(upgradeRaid.id);
    const isMythicShard = UpgradesService.isMythicShard(upgradeRaid.id);
    const canStillFarm = !isExhausted;

    const tooltipContent = (
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
    );

    // Determine how many badges to show before the +N pill
    let visibleLocations = maxLocations;
    if (!expanded && upgradeRaid.raidLocations.length > maxLocations) {
        visibleLocations = maxLocations - 1;
    }

    return (
        <div className="flex gap-2" style={{ opacity: canStillFarm ? 1 : 0.5 }}>
            {/* Left: icon + count */}
            <div className="flex shrink-0 flex-col items-center gap-0.5">
                {isShard && <UnitShardIcon icon={upgradeRaid.iconPath} mythic={false} />}
                {isMythicShard && <UnitShardIcon icon={upgradeRaid.iconPath} mythic={true} />}
                {UpgradesService.isMaterial(upgradeRaid.id) && (
                    <div className="mb-1">
                        <UpgradeImage
                            material={upgradeRaid.label}
                            iconPath={upgradeRaid.iconPath}
                            rarity={RarityMapper.rarityToRarityString(upgradeRaid.rarity as unknown as Rarity)}
                            tooltip={tooltipContent}
                        />
                    </div>
                )}
                <span className="text-sm leading-tight font-medium">
                    {Math.floor(upgradeRaid.acquiredCount)}/{upgradeRaid.requiredCount}
                </span>
            </div>
            {/* Right: name + locations */}
            <div className="flex w-full min-w-0 flex-col gap-0.5">
                <Tooltip title={upgradeRaid.label}>
                    <span className="mb-1 truncate text-sm leading-tight font-medium">{upgradeRaid.label}</span>
                </Tooltip>
                <div className="text-muted-fg flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                    {(expanded ? upgradeRaid.raidLocations : upgradeRaid.raidLocations.slice(0, visibleLocations)).map(
                        location => (
                            <span
                                key={
                                    'material-item-input-' +
                                    upgradeRaid.relatedGoals.join(',') +
                                    '-' +
                                    upgradeRaid.id +
                                    '-' +
                                    location.id
                                }
                                style={{ opacity: location.isCompleted ? 0.5 : 1 }}>
                                <CompactCampaignLocation location={location} unlocked={true} />
                            </span>
                        )
                    )}
                    {upgradeRaid.raidLocations.length > maxLocations && !expanded && (
                        <ButtonPill onClick={() => setExpanded(true)}>
                            +{upgradeRaid.raidLocations.length - visibleLocations}
                        </ButtonPill>
                    )}
                    {upgradeRaid.raidLocations.length > maxLocations && expanded && (
                        <ButtonPill onClick={() => setExpanded(false)}>less</ButtonPill>
                    )}
                </div>
            </div>
        </div>
    );
};
