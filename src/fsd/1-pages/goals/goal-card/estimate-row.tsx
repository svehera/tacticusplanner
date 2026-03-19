import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import React from 'react';

import { AccessibleTooltip } from '@/fsd/5-shared/ui';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';

interface Props {
    daysLeft: number;
    calendarDate: string | null;
    energyTotal?: number;
}

export const GoalEstimateRow: React.FC<Props> = ({ daysLeft, calendarDate, energyTotal }) => (
    <>
        <AccessibleTooltip title={`${daysLeft} days. Estimated date ${calendarDate ?? ''}`}>
            <div className="flex-box gap-[3px]">
                <CalendarMonthIcon /> {daysLeft}
            </div>
        </AccessibleTooltip>
        {!!energyTotal && (
            <AccessibleTooltip title={`${energyTotal} energy`}>
                <div className="flex-box gap-[3px]">
                    <MiscIcon icon={'energy'} height={18} width={15} /> {energyTotal}
                </div>
            </AccessibleTooltip>
        )}
    </>
);
