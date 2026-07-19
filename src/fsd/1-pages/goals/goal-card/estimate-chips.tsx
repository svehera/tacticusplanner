import { Calendar } from 'lucide-react';
import React from 'react';

import { MiscIcon } from '@/fsd/5-shared/ui/icons';

interface Props {
    /** Days-remaining estimate. Hidden when 0/undefined. */
    days?: number;
    /** Energy cost. Hidden when 0/undefined. */
    energy?: number;
}

/** Right-aligned `📅 Nd | ⚡ energy` readout, shared by ProgressionRow and card bodies. */
export const GoalEstimateChips: React.FC<Props> = ({ days, energy }) => {
    const showDays = days !== undefined && days > 0;
    const showEnergy = energy !== undefined && energy > 0;
    if (!showDays && !showEnergy) return;

    return (
        <div className="flex shrink-0 items-center gap-2 text-xs whitespace-nowrap text-(--soft-fg) tabular-nums">
            {showDays && (
                <span role="img" aria-label={`${days} days remaining`} className="inline-flex items-center gap-0.5">
                    <Calendar className="size-3.5" aria-hidden />
                    <span className="font-bold text-(--fg)">{days}</span>d
                </span>
            )}
            {showDays && showEnergy && <span aria-hidden className="h-3 w-px bg-(--card-border)" />}
            {showEnergy && (
                <span
                    role="img"
                    aria-label={`${energy.toLocaleString()} energy`}
                    className="inline-flex items-center gap-0.5">
                    <MiscIcon icon="energy" width={14} height={14} />
                    <span className="font-bold text-(--fg)">{energy.toLocaleString()}</span>
                </span>
            )}
        </div>
    );
};
