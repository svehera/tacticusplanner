import React from 'react';

import { MiscIcon } from '@/fsd/5-shared/ui/icons';
import { TieredRewardCell, TieredRewardGrid } from '@/fsd/5-shared/ui/tiered-reward-grid';

import { getShopCurrencyIconKey, getShopCurrencyLabel } from '@/fsd/4-entities/shops';
import { ISurvivalEvent, survivalRewardInfo } from '@/fsd/4-entities/survival';

interface Props {
    event: ISurvivalEvent;
}

export const MilestonesTab: React.FC<Props> = ({ event }) => {
    const milestoneCells: TieredRewardCell[] = event.milestoneRewards.map((milestone, index) => {
        const rewardIds = milestone.reward
            ? [milestone.reward]
            : (milestone.chest?.flatMap(bundle => bundle.rewards) ?? []);
        const resolved = rewardIds.map(rewardId => survivalRewardInfo(rewardId));
        return {
            key: index,
            title: resolved.length === 1 ? resolved[0].label : undefined,
            rewards: resolved.map(({ icon, qty }) => ({ icon, qty })),
            costLabel: `${milestone.requiredProgress.toLocaleString()} pts`,
        };
    });

    const currencyIconKey = getShopCurrencyIconKey(event.resourceId);
    const currencyLabel = getShopCurrencyLabel(event.resourceId);

    const chestCells: TieredRewardCell[] = event.chests.map(chest => ({
        key: chest.level,
        title: `Chest ${chest.level}`,
        rewards: chest.rewards.map(rewardId => {
            const { icon, qty } = survivalRewardInfo(rewardId);
            return { icon, qty };
        }),
        costLabel: (
            <span className="flex items-center gap-1">
                {currencyIconKey && <MiscIcon icon={currencyIconKey} width={14} height={14} />}
                {chest.cost.amount.toLocaleString()}
            </span>
        ),
    }));

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h3 className="mb-3 font-semibold">Milestone Rewards</h3>
                <TieredRewardGrid cells={milestoneCells} />
            </div>
            <div>
                <h3 className="mb-3 font-semibold">Reward Chests</h3>
                <p className="mb-3 text-sm text-(--soft-fg)">Spend {currencyLabel} to open chests in order.</p>
                <TieredRewardGrid cells={chestCells} />
            </div>
        </div>
    );
};
