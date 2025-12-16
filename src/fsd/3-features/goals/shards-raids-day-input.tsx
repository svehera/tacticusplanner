import { Card, CardContent, CardHeader } from '@mui/material';
import React, { useMemo } from 'react';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { formatDateWithOrdinal } from 'src/shared-logic/functions';

import { MiscIcon } from '@/fsd/5-shared/ui/icons';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { CampaignLocation } from '@/fsd/4-entities/campaign/campaign-location';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { CampaignImage } from '@/fsd/4-entities/campaign/campaign.icon';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { IShardsRaid } from '@/fsd/3-features/goals/goals.models';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { ShardItemTitle } from '@/fsd/3-features/goals/shard-item-title';

interface Props {
    shardRaids: IShardsRaid;
    // handleAdd: (shardId: string, value: number, location: IItemRaidLocation) => void;
}

export const ShardsRaidsDayInput: React.FC<Props> = ({ shardRaids }) => {
    const calendarDate: string = useMemo(() => {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + shardRaids.daysTotal);

        return formatDateWithOrdinal(nextDate);
    }, [shardRaids.daysTotal]);

    return (
        <Card
            variant="outlined"
            sx={{
                minWidth: 300,
            }}>
            <CardHeader
                title={
                    <div className="flex-box between">
                        <ShardItemTitle shardRaid={shardRaids} />
                        <div className="flex-box column text-base">
                            {!!shardRaids.energyTotal && (
                                <div className="flex-box full-width between">
                                    <MiscIcon icon={'energy'} height={18} width={18} /> <b>{shardRaids.energyTotal}</b>
                                </div>
                            )}
                            {!!shardRaids.onslaughtTokensTotal && (
                                <div className="flex-box full-width between">
                                    <CampaignImage campaign={'Onslaught'} size={25} />{' '}
                                    <b>{shardRaids.onslaughtTokensTotal}</b>
                                </div>
                            )}
                        </div>
                    </div>
                }
                subheader={
                    <div>
                        <span className="italic">
                            {calendarDate} ({shardRaids.daysTotal} days)
                        </span>
                    </div>
                }
            />
            <CardContent>
                <ul className="ps-[15px]">
                    {shardRaids.locations.map(location => {
                        return (
                            <li
                                key={location.campaign + location.nodeNumber}
                                className="flex-box gap5 justify-between"
                                style={{ opacity: location.isCompleted ? 0.5 : 1 }}>
                                <CampaignLocation location={location} unlocked={true} />
                            </li>
                        );
                    })}
                </ul>
            </CardContent>
        </Card>
    );
};
