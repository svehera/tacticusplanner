import { Info as InfoIcon } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import React from 'react';

import { LeProgress } from './le-progress.service';

interface Props {
    progress: LeProgress;
}

export const LeNextGoalProgress: React.FC<Props> = ({ progress }) => {
    return (
        <div className="flex-box wrap gap15 m-2.5">
            <div className="flex gap-[5px]">
                Deed Points to {progress.goal}:
                <span className="font-bold">
                    {progress.currentPoints} / {progress.pointsForNextMilestone}
                </span>
                <Tooltip
                    title={
                        /*totalPoints + ' in total. Battles per track: ' + averageBattles*/
                        `${progress.totalPoints} in total. Battles per track: ${progress.averageBattles}`
                    }>
                    <InfoIcon />
                </Tooltip>
            </div>

            <div className="flex gap-[5px]">
                Currency to {progress.goal}:
                <span className="font-bold">
                    {' '}
                    {progress.currentCurrency} / {progress.currencyForNextMilestone}
                </span>
                <Tooltip title={/*totalCurrency + ' in total'*/ `${progress.totalCurrency} in total`}>
                    <InfoIcon />
                </Tooltip>
            </div>

            <div className="flex gap-[5px]">
                Shards to {progress.goal}:
                <span className="font-bold">
                    {' '}
                    {progress.currentTotalShards} /{' '}
                    {progress.currentTotalShards - progress.incrementalShards + progress.incrementalShardsGoal}
                </span>
                <Tooltip title={/*totalChests + ' in total'*/ `${progress.totalChests} in total`}>
                    <InfoIcon />
                </Tooltip>
            </div>
        </div>
    );
};
