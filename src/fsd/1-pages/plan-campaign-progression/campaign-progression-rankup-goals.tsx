import { ArrowForward } from '@mui/icons-material';
import React from 'react';

import { MiscIcon, UnitShardIcon, RankIcon } from '@/fsd/5-shared/ui/icons';

import { RankupGoalRow } from './campaign-progression-goal-rows';

interface Props {
    rows: RankupGoalRow[];
}

export const CampaignProgressionRankupGoals: React.FC<Props> = ({ rows }) => {
    if (rows.length === 0) return;

    return (
        <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
                <thead>
                    <tr>
                        <th className="border-b border-(--border) px-2 py-1.5 text-left text-[11px] font-medium tracking-wider text-(--muted-fg) uppercase">
                            Character
                        </th>
                        <th className="border-b border-(--border) px-2 py-1.5 text-left text-[11px] font-medium tracking-wider text-(--muted-fg) uppercase">
                            From
                        </th>
                        <th className="border-b border-(--border) px-1 py-1.5" />
                        <th className="border-b border-(--border) px-2 py-1.5 text-left text-[11px] font-medium tracking-wider text-(--muted-fg) uppercase">
                            To
                        </th>
                        <th className="border-b border-(--border) px-2 py-1.5 text-left text-[11px] font-medium tracking-wider text-(--muted-fg) uppercase">
                            Energy Cost
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map(({ goalCost, goalId, rankEnd, rankLookupHref, rankStart, unit }) => {
                        return (
                            <tr key={goalId} className="border-b border-(--border)/50">
                                <td className="px-2 py-1.5 align-middle">
                                    <a
                                        href={rankLookupHref}
                                        aria-label={`View rank lookup for ${unit?.name ?? goalId}`}>
                                        <UnitShardIcon
                                            icon={unit?.roundIcon ?? '(undefined)'}
                                            height={28}
                                            tooltip={unit?.name}
                                        />
                                    </a>
                                </td>
                                <td className="px-2 py-1.5 align-middle">
                                    <RankIcon rank={rankStart} />
                                </td>
                                <td className="px-1 py-1.5 align-middle">
                                    <ArrowForward sx={{ fontSize: 16 }} className="text-(--muted-fg)" />
                                </td>
                                <td className="px-2 py-1.5 align-middle">
                                    <RankIcon rank={rankEnd} />
                                </td>
                                <td className="px-2 py-1.5 align-middle font-mono font-semibold text-blue-600 tabular-nums dark:text-blue-400">
                                    costs {goalCost} <MiscIcon icon={'energy'} height={15} width={15} />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
