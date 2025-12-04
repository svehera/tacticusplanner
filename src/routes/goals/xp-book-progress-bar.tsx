import React from 'react';

import { AccessibleTooltip } from '@/fsd/5-shared/ui';
import { MiscIcon } from '@/fsd/5-shared/ui/icons/misc.icon';

interface XpGoalProgressBarProps {
    applied: number;
    required: number;
}

export const XpGoalProgressBar: React.FC<XpGoalProgressBarProps> = ({ applied, required }) => {
    const percentage = required > 0 ? Math.min(100, Math.round((applied / required) * 100)) : 100;

    const barWidth = `${percentage}%`;

    const displayValue = `${applied} / ${required} (${percentage}%)`;

    const tooltipText = `XP Books Applied: ${applied} / Required: ${required} (${percentage}%)`;

    return (
        <AccessibleTooltip title={tooltipText}>
            <div className="flex-box w-full max-w-[140px] items-center gap-1">
                <div className="relative flex-grow h-4 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                    <div className="h-full bg-green-800 transition-all duration-500" style={{ width: barWidth }}></div>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold leading-none px-1 text-gray-900 dark:text-white">
                        {displayValue}
                    </span>
                </div>
                <div className="w-[18px] h-[18px] flex items-center justify-center">
                    <MiscIcon icon={'legendaryBook'} height={18} width={15} />
                </div>
            </div>
        </AccessibleTooltip>
    );
};
