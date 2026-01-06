import { Info as InfoIcon } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import React, { useContext } from 'react';

// eslint-disable-next-line import-x/no-internal-modules
import { StoreContext } from '@/reducers/store.provider';

import { LeProgressService } from './le-progress.service';
import { ILreProgressModel } from './lre.models';

interface Props {
    model: ILreProgressModel;
}

export const LeNextGoalProgress: React.FC<Props> = ({ model }) => {
    const { leSettings } = useContext(StoreContext);
    const progress = LeProgressService.computeProgress(model, leSettings.showP2POptions ?? true);

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
                    {progress.currentChests * model.shardsPerChest} /{' '}
                    {progress.chestsForNextGoal * model.shardsPerChest}
                </span>
                <Tooltip title={/*totalChests + ' in total'*/ `${progress.totalChests} in total`}>
                    <InfoIcon />
                </Tooltip>
            </div>
        </div>
    );
};
