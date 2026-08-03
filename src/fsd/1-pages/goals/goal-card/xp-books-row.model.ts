import { Rarity, RarityMapper } from '@/fsd/5-shared/model';
import { tacticusIcons } from '@/fsd/5-shared/ui/icons';

import { hasXpBooks, IGoalEstimate } from '@/fsd/3-features/goals';

type IconKey = keyof typeof tacticusIcons;

const BOOK_ICON: Record<Rarity, IconKey> = {
    [Rarity.Common]: 'commonBook',
    [Rarity.Uncommon]: 'uncommonBook',
    [Rarity.Rare]: 'rareBook',
    [Rarity.Epic]: 'epicBook',
    [Rarity.Legendary]: 'legendaryBook',
    [Rarity.Mythic]: 'mythicBook',
};

/** Everything XpBooksRow renders, already resolved. `undefined` means the row shows nothing. */
export interface XpBooksRowView {
    applied: number;
    required: number;
    rarityLabel?: string;
    bookIcon?: IconKey;
    percent: number;
    /** Human-readable progress for `aria-valuetext`. */
    valueText: string;
    levels?: { current: number; target: number };
    xpDaysLeft?: number;
    /** XP income finishes later than the material farm, so it's what gates completion. */
    xpIsDriver: boolean;
}

export const buildXpBooksRowView = (
    goalEstimate: IGoalEstimate,
    fallbackRarity: Rarity | undefined
): XpBooksRowView | undefined => {
    if (!hasXpBooks(goalEstimate)) return;
    const { xpBooksApplied: applied, xpBooksRequired: required } = goalEstimate;

    // Rank goals carry xpEstimate, ability goals xpEstimateAbilities — only one is ever set.
    const xpEstimate = goalEstimate.xpEstimate ?? goalEstimate.xpEstimateAbilities;
    // The icon must match the rarity the counts are denominated in, not the page's preferred codex.
    const rarity = xpEstimate?.bookRarity ?? fallbackRarity;

    // Progress measures XP, not codices — codex counts are too coarse a denominator. Falls back to
    // the book ratio for estimates that never went through adjustGoalEstimates and carry no total.
    const totalXp = goalEstimate.xpRequiredTotal;
    const outstandingXp = xpEstimate?.xpLeft;
    const byXp = totalXp !== undefined && totalXp > 0 && outstandingXp !== undefined;
    const percent = byXp
        ? Math.min(100, Math.round(((totalXp - outstandingXp) / totalXp) * 100))
        : Math.min(100, Math.round((applied / Math.max(1, required)) * 100));

    return {
        applied,
        required,
        rarityLabel: rarity === undefined ? undefined : RarityMapper.rarityToRarityString(rarity),
        bookIcon: rarity === undefined ? undefined : BOOK_ICON[rarity],
        percent,
        valueText: byXp
            ? `${(totalXp - outstandingXp).toLocaleString()} of ${totalXp.toLocaleString()} XP`
            : `${applied} of ${required} books`,
        levels: xpEstimate && { current: xpEstimate.currentLevel, target: xpEstimate.targetLevel },
        xpDaysLeft: goalEstimate.xpDaysLeft,
        xpIsDriver: (goalEstimate.xpDaysLeft ?? 0) > goalEstimate.daysLeft,
    };
};
