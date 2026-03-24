import React from 'react';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { CampaignLocation } from '@/fsd/4-entities/campaign/campaign-location';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { IUpgradeRaid } from '@/fsd/3-features/goals/goals.models';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { MaterialItemTitle } from '@/fsd/3-features/goals/material-item-title';

interface Props {
    upgradeRaid: IUpgradeRaid;
    showBattleInfo?: boolean;
}

export const MaterialItemView: React.FC<Props> = ({ upgradeRaid, showBattleInfo }) => {
    return (
        <div style={{ opacity: upgradeRaid.isBlocked ? 0.5 : 1 }}>
            <MaterialItemTitle upgradeRaid={upgradeRaid} />
            <ul className="ps-[15px]">
                {upgradeRaid.raidLocations.map(location => {
                    return (
                        <li
                            key={'material-item-view-' + upgradeRaid.relatedGoals.join(',') + '-' + location.id}
                            className="flex-box gap5 justify-between">
                            <CampaignLocation location={location} unlocked={true} showBattleInfo={showBattleInfo} />
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};
