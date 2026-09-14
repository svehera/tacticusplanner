import { Calendar } from 'lucide-react';
import React from 'react';

import { MiscIcon } from '@/fsd/5-shared/ui/icons';

import { CampaignImage } from '@/fsd/4-entities/campaign';

interface Props {
    /** Days-remaining estimate (rightmost, so it stacks with the XP-day in the rank card). Hidden when 0. */
    days?: number;
    /** Energy cost. Hidden when 0/undefined. */
    energy?: number;
    /** Onslaught tokens cost. Hidden when 0/undefined. */
    tokens?: number;
}

const Divider: React.FC = () => <span aria-hidden className="h-3 w-px bg-(--card-border)" />;

/** Right-aligned `⚡ energy | 🎟 tokens | 📅 Nd` readout — day last so it aligns with the XP-day row below it. */
export const GoalEstimateChips: React.FC<Props> = ({ days, energy, tokens }) => {
    const showDays = days !== undefined && days > 0;
    const showEnergy = energy !== undefined && energy > 0;
    const showTokens = tokens !== undefined && tokens > 0;
    if (!showDays && !showEnergy && !showTokens) return;

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
            {showEnergy && showTokens && <Divider />}
            {showTokens && (
                <span
                    role="img"
                    aria-label={`${tokens.toLocaleString()} onslaught tokens`}
                    className="inline-flex items-center gap-0.5">
                    <CampaignImage campaign="Onslaught" size={14} />
                    <span className="font-bold text-(--fg)">{tokens.toLocaleString()}</span>
                </span>
            )}
            {(showEnergy || showTokens) && showDays && <Divider />}
            {showDays && (
                <span role="img" aria-label={`${days} days remaining`} className="inline-flex items-center gap-0.5">
                    <Calendar className="size-3.5" aria-hidden />
                    <span className="font-bold text-(--fg)">{days}</span>d
                </span>
            )}
        </div>
    );
};
