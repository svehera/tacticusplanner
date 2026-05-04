import { ArrowForward } from '@mui/icons-material';
import React from 'react';

import { RarityIcon, StarsIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { AscensionGoalRow } from './campaign-progression-goal-rows';

interface Props {
    rows: AscensionGoalRow[];
}

/** Renders a table of ascension/unlock goal rows for a single campaign card. */
export const CampaignProgressionAscensionGoals: React.FC<Props> = ({ rows }) => {
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
                            From Rarity
                        </th>
                        <th className="border-b border-(--border) px-2 py-1.5 text-left text-[11px] font-medium tracking-wider text-(--muted-fg) uppercase">
                            Stars
                        </th>
                        <th className="border-b border-(--border) px-1 py-1.5" />
                        <th className="border-b border-(--border) px-2 py-1.5 text-left text-[11px] font-medium tracking-wider text-(--muted-fg) uppercase">
                            To Rarity
                        </th>
                        <th className="border-b border-(--border) px-2 py-1.5 text-left text-[11px] font-medium tracking-wider text-(--muted-fg) uppercase">
                            Stars
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map(({ goal, goalId, unit }) => {
                        return (
                            <tr key={goalId} className="border-b border-(--border)/50">
                                <td className="px-2 py-1.5 align-middle">
                                    <UnitShardIcon
                                        icon={unit?.roundIcon ?? '(undefined)'}
                                        height={28}
                                        tooltip={unit?.name}
                                    />
                                </td>
                                <td className="px-2 py-1.5 align-middle">
                                    {goal && <RarityIcon rarity={goal.rarityStart} />}
                                </td>
                                <td className="px-2 py-1.5 align-middle">
                                    {goal && <StarsIcon stars={goal.starsStart} />}
                                </td>
                                <td className="px-1 py-1.5 align-middle">
                                    <ArrowForward sx={{ fontSize: 16 }} className="text-(--muted-fg)" />
                                </td>
                                <td className="px-2 py-1.5 align-middle">
                                    {goal && <RarityIcon rarity={goal.rarityEnd} />}
                                </td>
                                <td className="px-2 py-1.5 align-middle">
                                    {goal && <StarsIcon stars={goal.starsEnd} />}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
