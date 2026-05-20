import React from 'react';

import { Rarity } from '@/fsd/5-shared/model';
import { Segmented } from '@/fsd/5-shared/ui';

import { XpIncomeState } from '../models';
import { bossesPerLoop } from '../xp-income.service';

const rarityOptions = [Rarity.Common, Rarity.Uncommon, Rarity.Rare, Rarity.Epic];
const rarityName: Record<number, string> = {
    [Rarity.Common]: 'Common',
    [Rarity.Uncommon]: 'Uncommon',
    [Rarity.Rare]: 'Rare',
    [Rarity.Epic]: 'Epic',
};

interface RaidInnerProps {
    loopsRaids: XpIncomeState['loopsRaids'];
    raidLoops: number;
    setRaidLoops: (v: number) => void;
    extraBossesAfterLoop: number;
    setExtraBossesAfterLoop: (v: number) => void;
    clearRarity: Rarity;
    additionalBosses: number;
    setAdditionalBosses: (v: number) => void;
    onUpdate: (key: keyof XpIncomeState, value: XpIncomeState[keyof XpIncomeState]) => void;
}

export const RaidInner: React.FC<RaidInnerProps> = ({
    loopsRaids,
    raidLoops,
    setRaidLoops,
    extraBossesAfterLoop,
    setExtraBossesAfterLoop,
    clearRarity,
    additionalBosses,
    setAdditionalBosses,
    onUpdate,
}) => (
    <div className="space-y-4 py-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[var(--muted-fg)]">Do you loop guild raids?</p>
            <Segmented
                value={loopsRaids}
                onChange={v => onUpdate('loopsRaids', v)}
                options={[
                    { value: 'yes' as const, label: 'I loop' },
                    { value: 'no' as const, label: 'Manual clear' },
                ]}
            />
        </div>

        {loopsRaids === 'yes' ? (
            <div className="fade-in space-y-4">
                <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm text-[var(--fg)]">Loops done</span>
                        <span className="text-sm font-semibold text-[var(--fg)] tabular-nums">{raidLoops}</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="15"
                        step="1"
                        value={raidLoops}
                        onChange={event_ => setRaidLoops(Number(event_.target.value))}
                        className="w-full"
                    />
                </div>
                <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm text-[var(--fg)]">
                            Extra bosses after final loop (max {bossesPerLoop - 1})
                        </span>
                        <span className="text-sm font-semibold text-[var(--fg)] tabular-nums">
                            {extraBossesAfterLoop}
                        </span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max={bossesPerLoop - 1}
                        step="1"
                        value={extraBossesAfterLoop}
                        onChange={event_ => setExtraBossesAfterLoop(Number(event_.target.value))}
                        className="w-full"
                    />
                </div>
            </div>
        ) : (
            <div className="fade-in space-y-4">
                <label className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-sm text-[var(--fg)]">Highest rarity fully cleared</span>
                    <select
                        value={clearRarity}
                        onChange={event_ => onUpdate('clearRarity', Number.parseInt(event_.target.value, 10) as Rarity)}
                        className="rounded-[var(--radius-lg)] border border-[var(--input)] bg-[var(--bg)] px-3 py-2 text-sm font-semibold text-[var(--fg)] focus:border-[var(--primary)] focus:outline-none">
                        {rarityOptions.map(r => (
                            <option key={r} value={r}>
                                {rarityName[r]}
                            </option>
                        ))}
                    </select>
                </label>
                <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm text-[var(--fg)]">Additional bosses cleared</span>
                        <span className="text-sm font-semibold text-[var(--fg)] tabular-nums">{additionalBosses}</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="5"
                        step="1"
                        value={additionalBosses}
                        onChange={event_ => setAdditionalBosses(Number(event_.target.value))}
                        className="accent-success w-full"
                    />
                </div>
            </div>
        )}
    </div>
);
