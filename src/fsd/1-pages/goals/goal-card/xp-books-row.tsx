import { Calendar } from 'lucide-react';
import React from 'react';

import { Rarity } from '@/fsd/5-shared/model';
import { AccessibleTooltip } from '@/fsd/5-shared/ui';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';

import { IGoalEstimate } from '@/fsd/3-features/goals';

import { buildXpBooksRowView } from './xp-books-row.model';

interface Props {
    goalEstimate: IGoalEstimate;
    /** Fallback codex rarity, used only when the estimate hasn't been assigned one. */
    bookRarity: Rarity | undefined;
}

/**
 * Compact XP-book progress row — book icon, applied/required, fill bar, level range and an XP-days
 * chip. Shared by the UpgradeRank/CharacterAbilities card bodies and the goals table so all read
 * identically. Renders nothing when the goal needs no XP books.
 */
export const XpBooksRow: React.FC<Props> = ({ goalEstimate, bookRarity }) => {
    const view = buildXpBooksRowView(goalEstimate, bookRarity);
    if (!view) return;

    return (
        <div className="flex min-h-[28px] flex-wrap items-center gap-x-2 gap-y-1">
            {view.bookIcon && <MiscIcon icon={view.bookIcon} width={18} height={18} />}
            <span className="shrink-0 text-xs font-bold text-(--fg) tabular-nums">
                {view.applied} / {view.required}
            </span>
            <div
                role="progressbar"
                aria-label={view.rarityLabel === undefined ? 'XP Books' : `${view.rarityLabel} XP Books`}
                aria-valuenow={view.percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuetext={view.valueText}
                className="h-2 min-w-[30px] flex-1 overflow-hidden rounded-full bg-(--fg)/12">
                <div
                    className="h-full origin-left bg-(--primary) transition-transform duration-500 motion-reduce:transition-none"
                    style={{ transform: `scaleX(${view.percent / 100})` }}
                />
            </div>
            {view.levels && (
                <>
                    <span aria-hidden className="h-3 w-px shrink-0 bg-(--card-border)" />
                    <span className="shrink-0 text-xs whitespace-nowrap text-(--soft-fg) tabular-nums">
                        Lv <span className="font-bold text-(--fg)">{view.levels.current}</span>→
                        <span className="font-bold text-(--fg)">{view.levels.target}</span>
                    </span>
                </>
            )}
            {view.xpDaysLeft !== undefined && (
                <>
                    <span aria-hidden className="h-3 w-px shrink-0 bg-(--card-border)" />
                    <AccessibleTooltip
                        title={`${Math.ceil(view.xpDaysLeft)} days — estimated from your XP Income settings${view.xpIsDriver ? ' (this is what gates completion)' : ''}`}>
                        <span className="inline-flex shrink-0 items-center gap-0.5 text-xs text-(--soft-fg) tabular-nums">
                            <Calendar className="size-3.5" aria-hidden />
                            <span className="font-bold text-(--fg)">{Math.ceil(view.xpDaysLeft)}</span>d
                        </span>
                    </AccessibleTooltip>
                </>
            )}
        </div>
    );
};
