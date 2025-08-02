import React from 'react';

import { StarsIcon } from '@/fsd/5-shared/ui/icons';

import { milestonesAndPoints } from './token-estimation-service';

/**
 * Displays the already-met points milestones of the event.
 */
export const LeTokenMilestones = ({ currentPoints }: { currentPoints: number }) => {
    function getRowData() {
        return milestonesAndPoints.filter(milestone => currentPoints >= milestone.points);
    }

    return getRowData().length === 0 ? (
        <></>
    ) : (
        <table key="le-milestones-table" style={{ paddingLeft: 2, paddingRight: 2 }}>
            <thead>
                <tr>
                    <th className="px-4">Points</th>
                    <th className="px-4">Stars</th>
                    <th className="px-4">Round</th>
                    <th className="px-4">Packs Per Round</th>
                </tr>
            </thead>
            <tbody>
                {getRowData().map((milestone, index) => (
                    <tr key={index}>
                        <td className="px-4 text-right">{milestone.points}</td>
                        <td className="px-4 flex justify-center">
                            {milestone.points >= 21000 ? '100%' : <StarsIcon stars={milestone.stars + 5} />}
                        </td>
                        <td className="px-4 text-center">{milestone.round}</td>
                        <td className="px-4 text-center">{milestone.packsPerRound}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};
