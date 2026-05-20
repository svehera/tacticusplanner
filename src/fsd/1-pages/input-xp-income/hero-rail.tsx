import React from 'react';

import { Rarity } from '@/fsd/5-shared/model';
import { Card } from '@/fsd/5-shared/ui';
import { MiscIcon, tacticusIcons } from '@/fsd/5-shared/ui/icons';

import { XpIncomeState } from './models';

const rarities: { value: Rarity; name: string; color: string; iconKey: keyof typeof tacticusIcons }[] = [
    { value: Rarity.Common, name: 'Common', color: 'var(--rarity-common)', iconKey: 'commonBook' },
    { value: Rarity.Uncommon, name: 'Uncommon', color: 'var(--rarity-uncommon)', iconKey: 'uncommonBook' },
    { value: Rarity.Rare, name: 'Rare', color: 'var(--rarity-rare)', iconKey: 'rareBook' },
    { value: Rarity.Epic, name: 'Epic', color: 'var(--rarity-epic)', iconKey: 'epicBook' },
    { value: Rarity.Legendary, name: 'Legendary', color: 'var(--rarity-legendary)', iconKey: 'legendaryBook' },
    { value: Rarity.Mythic, name: 'Mythic', color: 'var(--rarity-mythic)', iconKey: 'mythicBook' },
];

interface HeroRailProps {
    state: XpIncomeState;
    chosenName: string;
    helperDaily: number;
    onUpdate: (key: keyof XpIncomeState, value: XpIncomeState[keyof XpIncomeState]) => void;
    onApply: () => void;
}

export const HeroRail: React.FC<HeroRailProps> = ({ state, chosenName, helperDaily, onUpdate, onApply }) => {
    const diff = helperDaily - state.manualCodicesPerDay;
    const showSuggestion = helperDaily > 0 && Math.abs(diff) >= 0.005;

    return (
        <Card className="sticky top-4 overflow-hidden">
            {/* Step 1 — Codex rarity */}
            <div className="px-5 pt-5 pb-4">
                <div className="mb-3 flex items-baseline gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary)] text-[10px] font-bold text-[var(--primary-fg)]">
                        1
                    </span>
                    <span className="text-[13px] font-semibold text-[var(--fg)]">Codex rarity</span>
                </div>
                {/* 3×2 rarity tile grid */}
                <div className="grid grid-cols-3 gap-2">
                    {rarities.map(r => {
                        const selected = state.defaultCodexToUse === r.value;
                        return (
                            <button
                                key={r.value}
                                type="button"
                                onClick={() => onUpdate('defaultCodexToUse', r.value)}
                                className="group relative flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border px-2 py-2.5 transition-all"
                                style={{
                                    borderColor: selected ? 'var(--primary)' : 'var(--border)',
                                    background: selected
                                        ? 'color-mix(in oklab, var(--primary) 14%, transparent)'
                                        : 'transparent',
                                    transform: selected ? 'translateY(-1px)' : undefined,
                                    boxShadow: selected ? '0 1px 4px rgba(0,0,0,.08)' : undefined,
                                }}>
                                {/* Codex icon */}
                                <MiscIcon icon={r.iconKey} width={32} height={32} className="rounded-md" />
                                <span
                                    className="text-[11px] font-semibold tracking-tight"
                                    style={{ color: selected ? 'var(--fg)' : 'var(--muted-fg)' }}>
                                    {r.name}
                                </span>
                                {/* Check pip */}
                                {selected && (
                                    <span className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow ring-2 ring-[var(--card-bg)]">
                                        <svg
                                            width="7"
                                            height="7"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            strokeLinecap="round"
                                            strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Step 2 — Earned per day */}
            <div
                className="border-t border-[var(--border)] px-5 pt-4 pb-5"
                style={{ background: 'color-mix(in oklab, var(--secondary) 30%, transparent)' }}>
                <div className="mb-3 flex items-baseline gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary)] text-[10px] font-bold text-[var(--primary-fg)]">
                        2
                    </span>
                    <span className="text-[13px] font-semibold text-[var(--fg)]">Earned per day</span>
                </div>
                <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={state.manualCodicesPerDay}
                    onChange={event_ =>
                        onUpdate('manualCodicesPerDay', event_.target.value === '' ? 0 : Number(event_.target.value))
                    }
                    className="w-full rounded-[var(--radius-lg)] border border-[var(--input)] bg-[var(--bg)] px-3 py-2 text-[36px] font-extrabold text-[var(--fg)] tabular-nums focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 focus:outline-none"
                />
                <div className="mt-1 text-[11px] text-[var(--muted-fg)]">{chosenName} codices / day</div>

                {/* Quick-adjust slider */}
                <div className="mt-4">
                    <div className="mb-1.5 flex items-center gap-2">
                        <span className="text-[11px] text-[var(--muted-fg)]">Quick adjust</span>
                        <span className="ml-auto text-[11px] text-[var(--muted-fg)] tabular-nums">0 – 10</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.05"
                        value={Math.min(state.manualCodicesPerDay, 10)}
                        onChange={event_ => onUpdate('manualCodicesPerDay', Number(event_.target.value))}
                        className="w-full"
                    />
                </div>
            </div>

            {/* Apply suggestion (conditional) */}
            {showSuggestion ? (
                <div
                    className="fade-in border-t border-[var(--primary)] px-5 py-3"
                    style={{ background: 'color-mix(in oklab, var(--primary) 14%, transparent)' }}>
                    <div className="flex items-center justify-between gap-3">
                        <div className="text-xs leading-tight">
                            <div className="text-[var(--muted-fg)]">Calculator suggests</div>
                            <div className="mt-0.5 text-base font-extrabold text-[var(--primary)] tabular-nums">
                                {helperDaily.toFixed(2)}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onApply}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--primary)] px-3 py-2 text-xs font-semibold whitespace-nowrap text-[var(--primary-fg)] transition-opacity hover:opacity-90">
                            <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Use this
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    className="border-t border-[var(--border)] px-5 py-3 text-[11px] leading-snug text-[var(--muted-fg)]"
                    style={{ background: 'color-mix(in oklab, var(--secondary) 30%, transparent)' }}>
                    Used in Goals planning, Daily Raids and Campaign Progression to estimate timelines.
                </div>
            )}
        </Card>
    );
};
