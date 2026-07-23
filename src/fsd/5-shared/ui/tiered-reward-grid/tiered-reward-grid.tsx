import React from 'react';

import { TieredRewardCell, TIERED_REWARD_ICON_SIZE } from './tiered-reward-grid.model';

interface Props {
    cells: TieredRewardCell[];
    columns?: number;
}

/**
 * Presentational Nx-column grid of "pay/reach a cost to get reward(s)" cards, shared by any
 * feature with a tiered reward ladder (HSE milestones, survival milestones/chests, ...).
 * Callers resolve reward ids to icons themselves and pass already-built cells.
 */
export const TieredRewardGrid: React.FC<Props> = ({ cells, columns = 5 }) => {
    return (
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
            {cells.map(cell => (
                <div
                    key={cell.key}
                    title={cell.title}
                    className="relative flex flex-col items-center gap-1.5 rounded-xl border border-(--border) bg-(--overlay) p-3">
                    {cell.badge}
                    <div className="flex flex-col items-center gap-1">
                        {cell.rewards.map((reward, index) => (
                            <div key={index} className="flex items-center gap-1.5">
                                <div
                                    className="flex items-center justify-center"
                                    style={{ height: TIERED_REWARD_ICON_SIZE, width: TIERED_REWARD_ICON_SIZE }}>
                                    {reward.icon}
                                </div>
                                <span className="text-xs font-bold text-(--soft-fg) tabular-nums">×{reward.qty}</span>
                            </div>
                        ))}
                    </div>
                    <span className="rounded bg-(--soft) px-1.5 py-0.5 text-[11px] font-semibold text-amber-400 tabular-nums">
                        {cell.costLabel}
                    </span>
                </div>
            ))}
        </div>
    );
};
