import { ArrowRight } from 'lucide-react';
import React from 'react';

import { GoalEstimateChips } from './estimate-chips';

interface Props {
    from: React.ReactNode;
    to: React.ReactNode;
    /** Optional extras rendered after the target (e.g. ascension stars). */
    trailing?: React.ReactNode;
    /** Days-remaining estimate, right-aligned. Hidden when 0/undefined. */
    days?: number;
    /** Energy cost, right-aligned next to the days. Hidden when 0/undefined. */
    energy?: number;
    /**
     * Accessible description of the transition (e.g. "Diamond 2 to Diamond 3"). When set, the
     * emblem/arrow group is announced as one label instead of each icon's raw alt text.
     */
    ariaLabel?: string;
}

/** `from → to` row with an arrow separator, optional trailing content, and a right-aligned days/energy estimate. */
export const ProgressionRow: React.FC<Props> = ({ from, to, trailing, days, energy, ariaLabel }) => (
    <div className="flex min-h-[30px] items-center justify-between gap-2">
        <div
            className="flex min-w-0 items-center gap-1"
            {...(ariaLabel ? { role: 'img', 'aria-label': ariaLabel } : {})}>
            {from}
            <ArrowRight className="size-4 shrink-0 text-(--soft-fg)" aria-hidden />
            {to}
            {trailing && <div className="ml-1 flex shrink-0 items-center gap-1">{trailing}</div>}
        </div>
        <GoalEstimateChips days={days} energy={energy} />
    </div>
);
