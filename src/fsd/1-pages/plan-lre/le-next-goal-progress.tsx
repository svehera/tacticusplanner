import { Info as InfoIcon } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import React from 'react';

import { EventProgress } from './token-estimation-service';

interface Props {
    progress: EventProgress;
}

export const LeNextGoalProgress: React.FC<Props> = ({ progress }) => {
    return (
        <div className="m-2.5 flex flex-wrap gap-2">
            <div className="flex gap-[5px]">
                Deed Points to {progress.nextMilestone}:
                <span className="font-bold">
                    {progress.addlPointsForNextMilestone === Infinity
                        ? 'Complete'
                        : `${progress.totalPoints} / ${progress.totalPoints + progress.addlPointsForNextMilestone}`}
                </span>
                <Tooltip title={`${progress.totalPoints} in total.`}>
                    <InfoIcon />
                </Tooltip>
            </div>

            <div className="flex gap-[5px]">
                Currency to {progress.nextMilestone}:
                <span className="font-bold">
                    {progress.addlCurrencyForNextMilestone === Infinity
                        ? 'Complete'
                        : `${progress.totalCurrency} / ${progress.totalCurrency + progress.addlCurrencyForNextMilestone}`}
                </span>
            </div>

            <div className="flex gap-[5px]">
                Shards to {progress.nextMilestone}:
                <span className="font-bold">
                    {progress.addlShardsForNextMilestone === Infinity
                        ? 'Complete'
                        : `${progress.currentShards} / ${progress.currentShards + progress.addlShardsForNextMilestone}`}
                </span>
            </div>
        </div>
    );
};
