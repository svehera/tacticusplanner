import React from 'react';

import { Rarity } from '@/fsd/5-shared/model';
import { AccessibleTooltip } from '@/fsd/5-shared/ui';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';

interface XpGoalProgressBarProps {
    applied: number;
    required: number;
    bookRarity: Rarity;
}

export const XpGoalProgressBar: React.FC<XpGoalProgressBarProps> = ({
    applied,
    required,
    bookRarity = Rarity.Legendary,
}) => {
    const percentage = required > 0 ? Math.min(100, Math.round((applied / required) * 100)) : 100;

    const barWidth = `${percentage}%`;

    const displayValue = `${applied} / ${required} (${percentage}%)`;

    const tooltipText = `XP Books Applied: ${applied} / Required: ${required} (${percentage}%)`;
    const labelTextColorClass = percentage >= 50 ? 'text-(--success-fg)' : 'text-(--fg)';

    const bookIconName = Rarity[bookRarity].toLowerCase() + 'Book';
    return (
        <AccessibleTooltip title={tooltipText}>
            <div className="flex-box w-full max-w-[140px] items-center gap-1">
                <div className="relative h-4 flex-grow overflow-hidden rounded-full bg-(--soft)">
                    <div
                        className="h-full bg-(--success) transition-all duration-500"
                        style={{ width: barWidth }}></div>
                    <span
                        className={`absolute inset-0 flex items-center justify-center px-1 text-[10px] leading-none font-bold ${labelTextColorClass}`}>
                        {displayValue}
                    </span>
                </div>
                <div className="flex items-center justify-center">
                    <MiscIcon icon={bookIconName} className="!h-[1.5em] !w-auto" />
                </div>
            </div>
        </AccessibleTooltip>
    );
};
