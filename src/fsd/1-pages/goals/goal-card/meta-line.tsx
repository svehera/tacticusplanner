import { Calendar } from 'lucide-react';
import React from 'react';

import { AccessibleTooltip } from '@/fsd/5-shared/ui';

import { IGoalEstimate } from '@/fsd/3-features/goals';

import { doneByTooltip } from './done-by-tooltip';

interface Props {
    calendarDate?: string;
    daysLeft?: number;
    /** Full estimate — drives the detailed done-by tooltip shared with the table. */
    estimate?: IGoalEstimate;
}

/** Header meta line: estimated completion date, shown only when the goal has an active estimate. */
export const GoalCardMetaLine: React.FC<Props> = ({ calendarDate, daysLeft, estimate }) => {
    if (calendarDate === undefined) return;

    return (
        <AccessibleTooltip
            title={estimate ? doneByTooltip(estimate) : `${daysLeft ?? 0} days. Estimated date ${calendarDate}`}>
            <div className="mt-0.5 flex min-w-0 items-center gap-1 text-sm text-(--soft-fg) tabular-nums">
                <Calendar className="size-[18px] shrink-0" />
                <span className="truncate">{calendarDate}</span>
            </div>
        </AccessibleTooltip>
    );
};
