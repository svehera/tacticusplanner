import { Warning } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import React from 'react';

import { UpgradeImage } from '@/fsd/4-entities/upgrade/upgrade-image';

import { IUpgradeRaid } from 'src/v2/features/goals/goals.models';

interface Props {
    upgradeRaid: IUpgradeRaid;
}

export const MaterialItemTitle: React.FC<Props> = ({ upgradeRaid }) => {
    return (
        <div className="flex-box gap10">
            <div className="flex-box column">
                <UpgradeImage material={upgradeRaid.label} iconPath={upgradeRaid.iconPath} />
                <span>
                    {upgradeRaid.acquiredCount}/{upgradeRaid.requiredCount}
                </span>
            </div>
            {upgradeRaid.isBlocked ? (
                <span>
                    <Warning color={'warning'} /> All locations locked
                </span>
            ) : (
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
            )}
        </div>
    );
};
