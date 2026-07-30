import React from 'react';

import { MiscIcon } from '@/fsd/5-shared/ui/icons';
import { buildProgressRewardCells, TieredRewardGrid } from '@/fsd/5-shared/ui/tiered-reward-grid';

import { getShopCurrencyIconKey, getShopCurrencyLabel, ShopEventWeek } from '@/fsd/4-entities/shops';

import { rewardInfo } from '@/fsd/3-features/shop-rewards';

interface Props {
    week: ShopEventWeek;
    currencyType: string;
}

export const MilestonesTab: React.FC<Props> = ({ week, currencyType }) => {
    const currencyIconKey = getShopCurrencyIconKey(currencyType);
    const currencyLabel = getShopCurrencyLabel(currencyType);

    const milestoneCells = buildProgressRewardCells(
        week.milestoneRewards ?? [],
        rewardInfo,
        milestone => `${milestone.requiredProgress.toLocaleString()} pts`
    );

    const chestCells = buildProgressRewardCells(week.progressChests ?? [], rewardInfo, entry => (
        <span className="flex items-center gap-1">
            {currencyIconKey && <MiscIcon icon={currencyIconKey} width={14} height={14} />}
            {entry.requiredProgress.toLocaleString()}
        </span>
    ));

    if (milestoneCells.length === 0 && chestCells.length === 0) {
        return (
            <div className="rounded-xl border border-(--border) bg-(--overlay) p-8 text-center text-(--soft-fg)">
                No milestone data for this week.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {milestoneCells.length > 0 && (
                <div>
                    <h3 className="mb-3 font-semibold">Milestone Rewards</h3>
                    <TieredRewardGrid cells={milestoneCells} />
                </div>
            )}
            {chestCells.length > 0 && (
                <div>
                    <h3 className="mb-3 font-semibold">Progress Chests</h3>
                    <p className="mb-3 text-sm text-(--soft-fg)">Spend {currencyLabel} to open chests in order.</p>
                    <TieredRewardGrid cells={chestCells} />
                </div>
            )}
        </div>
    );
};
