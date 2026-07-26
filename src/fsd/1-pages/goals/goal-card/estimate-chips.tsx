import { Calendar } from 'lucide-react';
import React from 'react';

import { MiscIcon } from '@/fsd/5-shared/ui/icons';

interface Props {
    /** Days-remaining estimate (rightmost, so it stacks with the XP-day in the rank card). Hidden when 0. */
    days?: number;
    /** Energy cost. Hidden when 0/undefined. */
    energy?: number;
}

/** Right-aligned `⚡ energy | 📅 Nd` readout — day last so it aligns with the XP-day row below it. */
export const GoalEstimateChips: React.FC<Props> = ({ days, energy }) => {
    const showDays = days !== undefined && days > 0;
    const showEnergy = energy !== undefined && energy > 0;
    if (!showDays && !showEnergy) return;

    return (
        <div className="flex shrink-0 items-center gap-2 text-xs whitespace-nowrap text-(--soft-fg) tabular-nums">
            {showEnergy && (
                <span
                    role="img"
                    aria-label={`${energy.toLocaleString()} energy`}
                    className="inline-flex items-center gap-0.5">
                    <MiscIcon icon="energy" width={14} height={14} />
                    <span className="font-bold text-(--fg)">{energy.toLocaleString()}</span>
                </span>
            )}
            {showEnergy && showDays && <span aria-hidden className="h-3 w-px bg-(--card-border)" />}
            {showDays && (
                <span role="img" aria-label={`${days} days remaining`} className="inline-flex items-center gap-0.5">
                    <Calendar className="size-3.5" aria-hidden />
                    <span className="font-bold text-(--fg)">{days}</span>d
                </span>
            )}
        </div>
    );
};
