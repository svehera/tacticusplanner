import { Info as InfoIcon } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import React from 'react';

import { EventProgress } from './token-estimation-service';

interface Props {
    progress: EventProgress;
}

export const LeNextGoalProgress: React.FC<Props> = ({ progress }) => {
    return (
        <div className="flex-box wrap gap2 m-2.5">
            <div className="flex gap-[5px]">
                Deed Points to {progress.nextMilestone}:
                <span className="font-bold">
                    {progress.totalPoints} / {progress.totalPoints + progress.addlPointsForNextMilestone}
                </span>
                <Tooltip title={`${progress.totalPoints} in total.`}>
                    <InfoIcon />
                </Tooltip>
            </div>

            <div className="flex gap-[5px]">
                Currency to {progress.nextMilestone}:
                <span className="font-bold">
                    {' '}
                    {progress.totalCurrency} / {progress.totalCurrency + progress.addlCurrencyForNextMilestone}
                </span>
            </div>

            <div className="flex gap-[5px]">
                Shards to {progress.nextMilestone}:
                <span className="font-bold">
                    {' '}
                    {progress.currentShards} / {progress.currentShards + progress.addlShardsForNextMilestone}
                </span>
            </div>
        </div>
    );
};
