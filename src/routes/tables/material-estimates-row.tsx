import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { FC } from 'react';

import { AccessibleTooltip } from '@/fsd/5-shared/ui';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';

import { ICharacterUpgradeEstimate } from '@/fsd/3-features/goals/goals.models';

interface MaterialEstimatesRowProps {
    estimate: ICharacterUpgradeEstimate;
}

const iconSize = 18;

const MaterialEstimatesRow: FC<MaterialEstimatesRowProps> = ({ estimate }) => {
    const date = new Date();
    date.setDate(date.getDate() + (estimate.daysTotal ?? 0) - 1);
    const calendarDate = date.toLocaleDateString();

    return (
        <div className="mt-1 flex w-full flex-row items-center justify-evenly gap-3 rounded bg-[var(--card-border)] px-2 py-1 text-[11px] text-[var(--card-fg)]">
            <AccessibleTooltip title={`${estimate.daysTotal} days. Estimated date ${calendarDate ?? ''}`}>
                <span className="inline-flex items-center gap-1 whitespace-nowrap text-inherit">
                    <CalendarMonthIcon style={{ opacity: 0.8 }} fontSize="small" sx={{ fontSize: iconSize }} />
                    <span className="text-xs font-medium text-inherit">{estimate.daysTotal}</span>
                </span>
            </AccessibleTooltip>
            <AccessibleTooltip title="Total energy required">
                <span className="inline-flex items-center gap-1 whitespace-nowrap text-inherit">
                    <MiscIcon icon="energy" width={iconSize} height={iconSize} className="opacity-80" />
                    <span className="text-xs font-medium text-inherit">{estimate.energyTotal}</span>
                </span>
            </AccessibleTooltip>
            <AccessibleTooltip title="Total raids required">
                <span className="inline-flex items-center gap-1 whitespace-nowrap text-inherit">
                    <MiscIcon icon="raidTicket" width={iconSize} height={iconSize} className="opacity-80" />
                    <span className="text-xs font-medium text-inherit">{estimate.raidsTotal}</span>
                </span>
            </AccessibleTooltip>
        </div>
    );
};

export default MaterialEstimatesRow;
