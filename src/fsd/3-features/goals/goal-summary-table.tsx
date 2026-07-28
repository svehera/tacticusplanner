import React, { ReactNode } from 'react';

import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { GoalCategory } from '@/fsd/4-entities/goal';

export interface GoalSummaryRow {
    key: string | number;
    unitIcon: string;
    unitName: string;
    category: GoalCategory;
    change: ReactNode;
}

const CATEGORY_BADGE_CLASS: Record<GoalCategory, string> = {
    Unlock: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    Ascend: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    Rank: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    Abilities: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
};

interface Props {
    rows: GoalSummaryRow[];
}

/** Unit | goal-category badge | change table shell, shared by bulk-goal-creator's preview and any "goals for these units" summary. */
export const GoalSummaryTable: React.FC<Props> = ({ rows }) => {
    return (
        <table className="w-full text-sm">
            <thead>
                <tr className="border-b border-gray-300 text-left text-xs font-semibold text-gray-500 uppercase dark:border-gray-600 dark:text-gray-400">
                    <th className="pr-4 pb-2">Unit</th>
                    <th className="pr-4 pb-2">Goal</th>
                    <th className="pb-2">Change</th>
                </tr>
            </thead>
            <tbody>
                {rows.map(row => (
                    <tr key={row.key} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-1.5 pr-4 font-medium">
                            <div className="flex items-center gap-2">
                                <UnitShardIcon icon={row.unitIcon} height={24} width={24} />
                                <span>{row.unitName}</span>
                            </div>
                        </td>
                        <td className="py-1.5 pr-4">
                            <span
                                className={`inline-block rounded px-1.5 py-0.5 text-xs font-semibold ${CATEGORY_BADGE_CLASS[row.category]}`}>
                                {row.category}
                            </span>
                        </td>
                        <td className="py-1.5 text-gray-600 dark:text-gray-400">{row.change}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};
