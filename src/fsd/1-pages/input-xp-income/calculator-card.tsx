import React from 'react';

import { Rarity } from '@/fsd/5-shared/model';
import { Button, Card } from '@/fsd/5-shared/ui';

import { CharactersService } from '@/fsd/4-entities/character';

import { SourceContribution } from './compute-sources';
import { XpIncomeState } from './models';
import { SourceRow } from './source-row';
import { ArenaInner, AtInner, OtherInner, RaidInner } from './sources';

interface CalculatorCardProps {
    state: XpIncomeState;
    sources: SourceContribution[];
    helperWeekly: number;
    helperDaily: number;
    chosenName: string;
    expanded: Record<'arena' | 'raid' | 'at' | 'other', boolean>;
    onToggle: (id: 'arena' | 'raid' | 'at' | 'other') => void;
    blueStarCharIds: string[];
    resolvedCharacters: ReturnType<typeof CharactersService.resolveStoredCharacters>;
    raidLoops: number;
    setRaidLoops: (v: number) => void;
    extraBossesAfterLoop: number;
    setExtraBossesAfterLoop: (v: number) => void;
    additionalBosses: number;
    setAdditionalBosses: (v: number) => void;
    eliteEnergyPerDay: number;
    setEliteEnergyPerDay: (v: number) => void;
    nonEliteEnergyPerDay: number;
    setNonEliteEnergyPerDay: (v: number) => void;
    onUpdate: (key: keyof XpIncomeState, value: XpIncomeState[keyof XpIncomeState]) => void;
    onApply: () => void;
}

export const CalculatorCard: React.FC<CalculatorCardProps> = ({
    state,
    sources,
    helperWeekly,
    helperDaily,
    chosenName,
    expanded,
    onToggle,
    blueStarCharIds,
    resolvedCharacters,
    raidLoops,
    setRaidLoops,
    extraBossesAfterLoop,
    setExtraBossesAfterLoop,
    additionalBosses,
    setAdditionalBosses,
    eliteEnergyPerDay,
    setEliteEnergyPerDay,
    nonEliteEnergyPerDay,
    setNonEliteEnergyPerDay,
    onUpdate,
    onApply,
}) => {
    const applyDisabled = Math.abs(helperDaily - state.manualCodicesPerDay) < 0.005;

    return (
        <Card className="overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2.5 px-5 pt-4 pb-3">
                <span
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-[var(--primary)]"
                    style={{ background: 'color-mix(in oklab, var(--primary) 14%, transparent)' }}>
                    {/* Sparkles icon */}
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round">
                        <path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-2.1-5.8L4 11l5.9-2.2L12 3z" />
                    </svg>
                </span>
                <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-[var(--fg)]">Help me estimate</div>
                    <div className="text-[11px] text-[var(--muted-fg)]">
                        Calculate from your arena, raids and AT purchases — click any source to tweak.
                    </div>
                </div>
            </div>

            {/* Source rows */}
            <div className="border-t border-[var(--border)]">
                {sources.map(source => (
                    <SourceRow
                        key={source.id}
                        source={source}
                        expanded={!!expanded[source.id]}
                        onToggle={() => onToggle(source.id)}
                        total={helperWeekly}>
                        {source.id === 'arena' && <ArenaInner arenaLeague={state.arenaLeague} onUpdate={onUpdate} />}
                        {source.id === 'raid' && (
                            <RaidInner
                                loopsRaids={state.loopsRaids}
                                raidLoops={raidLoops}
                                setRaidLoops={setRaidLoops}
                                extraBossesAfterLoop={extraBossesAfterLoop}
                                setExtraBossesAfterLoop={setExtraBossesAfterLoop}
                                clearRarity={state.clearRarity ?? Rarity.Epic}
                                additionalBosses={additionalBosses}
                                setAdditionalBosses={setAdditionalBosses}
                                onUpdate={onUpdate}
                            />
                        )}
                        {source.id === 'at' && (
                            <AtInner
                                state={state}
                                blueStarCharIds={blueStarCharIds}
                                resolvedCharacters={resolvedCharacters}
                                eliteEnergyPerDay={eliteEnergyPerDay}
                                setEliteEnergyPerDay={setEliteEnergyPerDay}
                                nonEliteEnergyPerDay={nonEliteEnergyPerDay}
                                setNonEliteEnergyPerDay={setNonEliteEnergyPerDay}
                                onUpdate={onUpdate}
                            />
                        )}
                        {source.id === 'other' && (
                            <OtherInner additionalCodicesPerWeek={state.additionalCodicesPerWeek} onUpdate={onUpdate} />
                        )}
                    </SourceRow>
                ))}

                {/* Footer total + Apply */}
                <div
                    className="border-t-2 border-[var(--primary)] px-5 py-4"
                    style={{ background: 'color-mix(in oklab, var(--secondary) 50%, transparent)' }}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <div className="text-[10px] font-bold tracking-[.18em] text-[var(--muted-fg)] uppercase">
                                Calculator total
                            </div>
                            <div className="mt-1 flex items-baseline gap-1.5">
                                <span className="text-3xl font-extrabold text-[var(--fg)] tabular-nums">
                                    {helperDaily.toFixed(2)}
                                </span>
                                <span className="text-sm text-[var(--muted-fg)]">{chosenName.toLowerCase()} / day</span>
                                <span className="ml-2 text-xs text-[var(--muted-fg)]">
                                    ({helperWeekly.toFixed(2)} / wk)
                                </span>
                            </div>
                        </div>
                        <Button intent="primary" size="small" isDisabled={applyDisabled} onPress={onApply}>
                            Apply →
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
};
