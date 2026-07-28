import { ReactNode } from 'react';

export const TIERED_REWARD_ICON_SIZE = 40;

export interface TieredRewardCellReward {
    icon: ReactNode;
    /** A plain count, or a `"min-max"` range string for rewards with randomized quantities (e.g. gold). */
    qty: number | string;
}

export interface TieredRewardCell {
    key: string | number;
    title?: string;
    badge?: ReactNode;
    rewards: TieredRewardCellReward[];
    costLabel: ReactNode;
}
