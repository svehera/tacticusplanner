import React from 'react';

import { MiscIcon } from '@/fsd/5-shared/ui/icons';

interface SummaryStats {
    totalSavings: number;
    activeCampaigns: number;
    goalCount: number;
    lockedMaterials: number;
}

interface Props {
    stats: SummaryStats;
}

export const CampaignProgressionSummary: React.FC<Props> = ({ stats }) => {
    return (
        <dl className="flex flex-wrap overflow-hidden rounded-xl border border-(--border) bg-(--card-bg)">
            {[
                {
                    label: 'Goals',
                    value: stats.goalCount,
                    sub: `${stats.activeCampaigns} campaign${stats.activeCampaigns === 1 ? '' : 's'}`,
                    accent: false,
                },
                {
                    label: 'Savings',
                    value: stats.totalSavings,
                    sub: 'energy saved',
                    accent: true,
                },
                {
                    label: 'Locked',
                    value: stats.lockedMaterials,
                    sub: 'unfarmable',
                    accent: false,
                },
            ].map((stat, index, array) => (
                <div
                    key={stat.label}
                    className={`flex min-w-0 flex-1 flex-col gap-0.5 px-4 py-3 ${index < array.length - 1 ? 'border-r border-(--border)' : ''}`}>
                    <dt className="text-[11px] font-medium tracking-wide text-(--muted-fg) uppercase">{stat.label}</dt>
                    <dd
                        className={`flex items-center gap-1 font-mono text-lg tabular-nums sm:text-2xl ${stat.accent ? 'text-blue-600 dark:text-blue-400' : 'text-(--card-fg)'}`}>
                        {stat.accent && <MiscIcon icon="energy" height={14} width={14} />}
                        {stat.value}
                    </dd>
                    <span className="text-xs text-(--muted-fg)">{stat.sub}</span>
                </div>
            ))}
        </dl>
    );
};
