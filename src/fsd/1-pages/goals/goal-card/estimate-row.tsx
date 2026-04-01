import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import React from 'react';

import { AccessibleTooltip } from '@/fsd/5-shared/ui';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';

interface Props {
    daysLeft: number;
    calendarDate?: string;
    energyTotal?: number;
}

/** Displays the days-left estimate and optional energy cost for a goal. */
export const GoalEstimateRow: React.FC<Props> = ({ daysLeft, calendarDate, energyTotal }) => (
    <>
        <AccessibleTooltip title={`${daysLeft} days. Estimated date ${calendarDate ?? ''}`}>
            <div className="flex-box gap-[3px] text-(--muted-fg)">
                <CalendarMonthIcon /> {daysLeft}
            </div>
        </AccessibleTooltip>
        {energyTotal !== undefined && (
            <AccessibleTooltip title={`${energyTotal} energy`}>
                <div className="flex-box gap-[3px] text-(--muted-fg)">
                    <MiscIcon icon={'energy'} height={18} width={15} /> {energyTotal}
                </div>
            </AccessibleTooltip>
        )}
    </>
);
