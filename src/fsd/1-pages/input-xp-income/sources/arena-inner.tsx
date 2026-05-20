import React from 'react';

import { Segmented } from '@/fsd/5-shared/ui';

import { ArenaLeague, XpIncomeState } from '../models';

const arenaCodicesPerWeek = {
    [ArenaLeague.honorGuard]: { Epic: 18, Legendary: 7 },
    [ArenaLeague.captain]: { Epic: 20, Legendary: 4, Mythic: 1 },
    [ArenaLeague.chapterMaster]: { Epic: 22, Legendary: 5, Mythic: 1 },
} as const;

interface ArenaInnerProps {
    arenaLeague: ArenaLeague;
    onUpdate: (key: keyof XpIncomeState, value: XpIncomeState[keyof XpIncomeState]) => void;
}

export const ArenaInner: React.FC<ArenaInnerProps> = ({ arenaLeague, onUpdate }) => {
    const rewards = arenaCodicesPerWeek[arenaLeague];

    return (
        <div className="space-y-3 py-1">
            <p className="text-xs text-[var(--muted-fg)]">Which league are you in?</p>
            <Segmented
                value={arenaLeague}
                onChange={v => onUpdate('arenaLeague', v)}
                options={[
                    { value: ArenaLeague.honorGuard, label: 'Honor Guard' },
                    { value: ArenaLeague.captain, label: 'Captains' },
                    { value: ArenaLeague.chapterMaster, label: 'Chapter Master' },
                ]}
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
                {Object.entries(rewards).map(([rarity, count]) => (
                    <span
                        key={rarity}
                        className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--bg)] px-2.5 py-0.5 text-xs text-[var(--muted-fg)]">
                        <span className="font-semibold text-[var(--fg)] tabular-nums">{count}</span>
                        {rarity} / wk
                    </span>
                ))}
            </div>
        </div>
    );
};
