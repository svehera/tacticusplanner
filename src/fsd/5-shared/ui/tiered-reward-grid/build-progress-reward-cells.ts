import { ReactNode } from 'react';

import { TieredRewardCell } from './tiered-reward-grid.model';

/** Shape shared by `ISurvivalMilestoneReward` and `ShopEventMilestoneReward`/`ShopEventProgressChest`. */
export interface ProgressRewardEntry {
    requiredProgress: number;
    reward?: string;
    chest?: { rewards: string[] }[];
}

export interface ResolvedReward {
    icon: ReactNode;
    label: string;
    qty: number | string | undefined;
}

/**
 * Builds `TieredRewardCell`s for a progress-gated reward ladder (a milestone/chest tier resolves to
 * either a single `reward` id or a bundle of `chest[].rewards`). Shared by Survival's and Shop
 * Events' Milestones tabs, which otherwise duplicated this exact mapping — each page passes its own
 * reward resolver (`survivalRewardInfo`/`rewardInfo`) since reward-string resolution intentionally
 * stays a small per-feature concern in this codebase.
 */
export function buildProgressRewardCells<T extends ProgressRewardEntry>(
    entries: T[],
    resolveReward: (rewardId: string) => ResolvedReward,
    costLabel: (entry: T) => ReactNode
): TieredRewardCell[] {
    return entries.map((entry, index) => {
        const rewardIds = entry.reward ? [entry.reward] : (entry.chest?.flatMap(bundle => bundle.rewards) ?? []);
        const resolved = rewardIds.map(rewardId => resolveReward(rewardId));
        return {
            key: index,
            title: resolved.length === 1 ? resolved[0].label : undefined,
            rewards: resolved.map(({ icon, qty }) => ({ icon, qty: qty ?? 1 })),
            costLabel: costLabel(entry),
        };
    });
}
