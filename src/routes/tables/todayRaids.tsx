import { sum } from 'lodash';
import { isMobile } from 'react-device-detect';

import { MiscIcon } from '@/fsd/5-shared/ui/icons';

import { IUpgradeRaid } from '@/fsd/3-features/goals/goals.models';
import { MaterialItemInput } from '@/fsd/3-features/goals/material-item-input';

interface Props {
    completedRaids: IUpgradeRaid[];
    upgradesRaids: IUpgradeRaid[];
}

export const TodayRaids: React.FC<Props> = ({ completedRaids, upgradesRaids }: Props) => {
    const locs = [...completedRaids, ...upgradesRaids].flatMap(raid => raid.raidLocations);
    const energySpent = sum(locs.map(loc => loc.energySpent));
    const raidsCount = sum(locs.map(loc => loc.raidsCount));

    return (
        <>
            <p style={{ fontSize: isMobile ? 16 : 20 }}>
                Today (<b>{energySpent}</b> <MiscIcon icon={'energy'} height={15} width={15} /> spent |{' '}
                <b>{raidsCount}</b> raids done)
            </p>
            <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2">
                {upgradesRaids.map((raid, index) => (
                    <div
                        className="w-full max-w-[300px] overflow-hidden p-[5px] [box-shadow:1px_2px_3px_rgba(0,_0,_0,_0.6)]"
                        key={raid.id + '-' + index}>
                        <MaterialItemInput upgradeRaid={raid} />
                    </div>
                ))}
                {completedRaids.map((raid, index) => (
                    <div
                        className="w-full max-w-[300px] overflow-hidden p-[5px] [box-shadow:1px_2px_3px_rgba(0,_0,_0,_0.6)]"
                        key={raid.id + '-' + index}>
                        <MaterialItemInput upgradeRaid={raid} />
                    </div>
                ))}
            </div>
        </>
    );
};
