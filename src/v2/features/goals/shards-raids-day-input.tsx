import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@mui/material';
import { IItemRaidLocation, IShardsRaid } from 'src/v2/features/goals/goals.models';
import { ShardItemTitle } from 'src/v2/features/goals/shard-item-title';
import { formatDateWithOrdinal } from 'src/shared-logic/functions';
import { MiscIcon } from 'src/v2/components/images/misc-image';
import { CampaignImage } from 'src/v2/components/images/campaign-image';
import { CampaignLocation } from 'src/shared-components/goals/campaign-location';

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

    const handleAddCount = (value: number, location: IItemRaidLocation) => {
        // handleAdd(shardRaids.characterId, value, location);
        shardRaids.acquiredCount += value;
        location.isCompleted = true;
    };
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
                        <div className="flex-box column" style={{ fontSize: '1rem' }}>
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
                <ul style={{ paddingInlineStart: 15 }}>
                    {shardRaids.locations.map(location => {
                        return (
                            <li
                                key={location.campaign + location.nodeNumber}
                                className="flex-box gap5"
                                style={{
                                    justifyContent: 'space-between',
                                    opacity: location.isCompleted ? 0.5 : 1,
                                }}>
                                <CampaignLocation location={location} unlocked={true} />
                            </li>
                        );
                    })}
                </ul>
            </CardContent>
        </Card>
    );
};
