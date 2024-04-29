import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@mui/material';
import { ILocationRaid, IShardsRaid } from 'src/v2/features/goals/goals.models';
import { ShardItemTitle } from 'src/v2/features/goals/shard-item-title';
import { RaidItemView } from 'src/v2/features/goals/raid-item-view';
import { RaidItemInput } from 'src/v2/features/goals/raid-item-input';
import { formatDateWithOrdinal } from 'src/shared-logic/functions';
import { MiscIcon } from 'src/v2/components/images/misc-image';
import { CampaignImage } from 'src/v2/components/images/campaign-image';

interface Props {
    shardRaids: IShardsRaid;
    handleAdd: (shardId: string, value: number, locationId: string) => void;
}

export const ShardsRaidsDayInput: React.FC<Props> = ({ shardRaids, handleAdd }) => {
    const calendarDate: string = useMemo(() => {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + shardRaids.daysTotal);

        return formatDateWithOrdinal(nextDate);
    }, [shardRaids.daysTotal]);

    const handleAddCount = (value: number, location: ILocationRaid) => {
        handleAdd(shardRaids.id, value, location.id);
        shardRaids.ownedCount += value;
        location.isCompleted = true;
    };
    return (
        <Card
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
                        const maxObtained = Math.round(location.farmedItems);
                        const defaultItemsObtained =
                            maxObtained + shardRaids.ownedCount > shardRaids.requiredCount
                                ? shardRaids.requiredCount - shardRaids.ownedCount
                                : maxObtained;

                        return (
                            <li
                                key={location.campaign + location.battleNumber}
                                className="flex-box gap5"
                                style={{
                                    justifyContent: 'space-between',
                                    opacity: location.isCompleted ? 0.5 : 1,
                                }}>
                                <RaidItemView location={location} />
                                <RaidItemInput
                                    defaultItemsObtained={defaultItemsObtained}
                                    acquiredCount={shardRaids.ownedCount}
                                    requiredCount={shardRaids.requiredCount}
                                    isDisabled={location.isCompleted}
                                    addCount={value => handleAddCount(value, location)}
                                />
                            </li>
                        );
                    })}
                </ul>
            </CardContent>
        </Card>
    );
};
