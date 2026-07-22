import { Calendar } from 'lucide-react';
import React from 'react';

import { Rarity, RarityMapper } from '@/fsd/5-shared/model';
import { AccessibleTooltip } from '@/fsd/5-shared/ui';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';

import { IGoalEstimate } from '@/fsd/3-features/goals';

interface Props {
    goalEstimate: IGoalEstimate;
    bookRarity: Rarity | undefined;
}

/**
 * Compact XP-book progress row — book icon, applied/required, fill bar, level range and an XP-days
 * chip. Shared by the UpgradeRank card body and the goals table so both read identically. Renders
 * nothing when the goal needs no XP books.
 */
export const XpBooksRow: React.FC<Props> = ({ goalEstimate, bookRarity }) => {
    const { xpEstimate } = goalEstimate;
    const applied = goalEstimate.xpBooksApplied;
    const required = goalEstimate.xpBooksRequired;
    if (applied === undefined || required === undefined || required === 0) return;
    const rarityLabel = bookRarity === undefined ? undefined : RarityMapper.rarityToRarityString(bookRarity);
    const bookIcon = rarityLabel === undefined ? undefined : ((rarityLabel.toLowerCase() + 'Book') as never);
    // XP income is the bottleneck when it finishes later than the material farm.
    const xpIsDriver = (goalEstimate.xpDaysLeft ?? 0) > goalEstimate.daysLeft;
    const xpPct = Math.min(100, Math.round((applied / Math.max(1, required)) * 100));

    return (
        <div className="flex min-h-[28px] flex-wrap items-center gap-x-2 gap-y-1">
            {bookIcon && <MiscIcon icon={bookIcon} width={18} height={18} />}
            <span className="shrink-0 text-xs font-bold text-(--fg) tabular-nums">
                {applied} / {required}
            </span>
            <div
                role="progressbar"
                aria-label={rarityLabel === undefined ? 'XP Books' : `${rarityLabel} XP Books`}
                aria-valuenow={xpPct}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-2 min-w-[30px] flex-1 overflow-hidden rounded-full bg-(--fg)/12">
                <div
                    className="h-full origin-left bg-(--primary) transition-transform duration-500 motion-reduce:transition-none"
                    style={{ transform: `scaleX(${xpPct / 100})` }}
                />
            </div>
            {xpEstimate && (
                <>
                    <span aria-hidden className="h-3 w-px shrink-0 bg-(--card-border)" />
                    <span className="shrink-0 text-xs whitespace-nowrap text-(--soft-fg) tabular-nums">
                        Lv <span className="font-bold text-(--fg)">{xpEstimate.currentLevel}</span>→
                        <span className="font-bold text-(--fg)">{xpEstimate.targetLevel}</span>
                    </span>
                </>
            )}
            {goalEstimate.xpDaysLeft !== undefined && (
                <>
                    <span aria-hidden className="h-3 w-px shrink-0 bg-(--card-border)" />
                    <AccessibleTooltip
                        title={`${Math.ceil(goalEstimate.xpDaysLeft)} days — estimated from your XP Income settings${xpIsDriver ? ' (this is what gates completion)' : ''}`}>
                        <span className="inline-flex shrink-0 items-center gap-0.5 text-xs text-(--soft-fg) tabular-nums">
                            <Calendar className="size-3.5" aria-hidden />
                            <span className="font-bold text-(--fg)">{Math.ceil(goalEstimate.xpDaysLeft)}</span>d
                        </span>
                    </AccessibleTooltip>
                </>
            )}
        </div>
    );
};
