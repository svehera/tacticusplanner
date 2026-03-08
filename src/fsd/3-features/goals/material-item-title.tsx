/* eslint-disable import-x/no-internal-modules */
import { Warning } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import React from 'react';

import { Rarity, RarityMapper } from '@/fsd/5-shared/model';
import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { UpgradeImage } from '@/fsd/4-entities/upgrade/upgrade-image';

import { IUpgradeRaid } from '@/fsd/3-features/goals/goals.models';

import { UpgradesService } from './upgrades.service';

interface Props {
    upgradeRaid: IUpgradeRaid;
}

export const MaterialItemTitle: React.FC<Props> = ({ upgradeRaid }) => {
    const isShard = UpgradesService.isShard(upgradeRaid.id);
    const isMythicShard = UpgradesService.isMythicShard(upgradeRaid.id);

    return (
        <div className="flex-box gap10">
            <div className="flex-box column">
                {isShard && <UnitShardIcon icon={upgradeRaid.iconPath} mythic={false} />}
                {isMythicShard && <UnitShardIcon icon={upgradeRaid.iconPath} mythic={true} />}
                {UpgradesService.isMaterial(upgradeRaid.id) && (
                    <UpgradeImage
                        material={upgradeRaid.label}
                        iconPath={upgradeRaid.iconPath}
                        rarity={RarityMapper.rarityToRarityString(upgradeRaid.rarity as unknown as Rarity)}
                    />
                )}
                <span>
                    {Math.floor(upgradeRaid.acquiredCount)}/{upgradeRaid.requiredCount}
                </span>
            </div>
            {upgradeRaid.isBlocked ? (
                <span>
                    <Warning color={'warning'} /> All locations locked
                </span>
            ) : (
                upgradeRaid.relatedCharacters.length > 0 && (
                    <Tooltip title={upgradeRaid.relatedCharacters.join(', ')}>
                        <span>
                            (
                            {upgradeRaid.relatedCharacters.length <= 3
                                ? upgradeRaid.relatedCharacters.join(', ')
                                : upgradeRaid.relatedCharacters.slice(0, 3).join(', ') +
                                  ` and ${upgradeRaid.relatedCharacters.slice(3).length} more...`}
                            )
                        </span>
                    </Tooltip>
                )
            )}
        </div>
    );
};
