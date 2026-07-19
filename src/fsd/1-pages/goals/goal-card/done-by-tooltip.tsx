import React from 'react';

import { getEstimatedDate } from '@/fsd/5-shared/lib';

import { getDoneByDays, IGoalEstimate } from '@/fsd/3-features/goals';

/**
 * Detailed "done by" breakdown, shared verbatim by the card header tooltip and the table's
 * "Done By" cell tooltip so both views explain the estimate identically: the completion date +
 * countdown, the material vs XP sub-estimates (with the bottleneck marked), and total farm effort.
 */
export const doneByTooltip = (estimate: IGoalEstimate): React.ReactNode => {
    const doneByDays = Math.ceil(getDoneByDays(estimate));
    const materialDays = estimate.daysLeft > 0 ? Math.ceil(estimate.daysLeft) : 0;
    const xpDays = (estimate.xpDaysLeft ?? 0) > 0 ? Math.ceil(estimate.xpDaysLeft as number) : 0;
    const xpGates = xpDays > materialDays;

    return (
        <span className="flex flex-col gap-0.5 text-left">
            <span className="font-semibold">
                Done by {getEstimatedDate(doneByDays)} — in {doneByDays} {doneByDays === 1 ? 'day' : 'days'}
            </span>
            {materialDays > 0 && (
                <span>
                    Raids (materials): {materialDays}d{xpDays > 0 && !xpGates ? ' — bottleneck' : ''}
                </span>
            )}
            {xpDays > 0 && (
                <span>
                    XP books: {xpDays}d{xpGates ? ' — bottleneck' : ''}
                </span>
            )}
            {estimate.daysTotal > 0 && <span>Total farm effort: {estimate.daysTotal} days</span>}
        </span>
    );
};
