import React from 'react';

import { RarityStars } from '@/fsd/5-shared/model';
import { Segmented, Switch } from '@/fsd/5-shared/ui';
import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService } from '@/fsd/4-entities/character';

import { XpIncomeState } from '../models';
import { blueStarCharacters, eliteEnergyPerRaid, nonEliteEnergyPerRaid } from '../xp-income.service';

const onslaughtCodicesWeekly = 25;

interface AtInnerProps {
    state: XpIncomeState;
    blueStarCharIds: string[];
    resolvedCharacters: ReturnType<typeof CharactersService.resolveStoredCharacters>;
    eliteEnergyPerDay: number;
    setEliteEnergyPerDay: (v: number) => void;
    nonEliteEnergyPerDay: number;
    setNonEliteEnergyPerDay: (v: number) => void;
    onUpdate: (key: keyof XpIncomeState, value: XpIncomeState[keyof XpIncomeState]) => void;
}

export const AtInner: React.FC<AtInnerProps> = ({
    state,
    blueStarCharIds: _blueStarCharIds,
    resolvedCharacters,
    eliteEnergyPerDay,
    setEliteEnergyPerDay,
    nonEliteEnergyPerDay,
    setNonEliteEnergyPerDay,
    onUpdate,
}) => (
    <div className="space-y-4 py-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[var(--muted-fg)]">Do you use AT to buy codices?</p>
            <Segmented
                value={state.useATForCodices}
                onChange={v => onUpdate('useATForCodices', v)}
                options={[
                    { value: 'yes' as const, label: 'Yes' },
                    { value: 'no' as const, label: 'No' },
                ]}
            />
        </div>

        {state.useATForCodices === 'yes' && (
            <div className="fade-in space-y-4">
                {/* Residual AT sources — display-only chips derived from roster */}
                <div>
                    <div className="mb-2 text-[11px] font-bold tracking-wider text-[var(--muted-fg)] uppercase">
                        Residual AT sources
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {blueStarCharacters.map(char => {
                            const isStarred =
                                (resolvedCharacters.find(c => c.snowprintId === char.id)?.stars ?? RarityStars.None) >=
                                RarityStars.OneBlueStar;
                            const charData = CharactersService.charactersData.find(c => c.snowprintId === char.id);
                            const shortName = charData?.shortName ?? char.id;
                            const roundIcon = charData?.roundIcon ?? '';

                            return (
                                <div
                                    key={char.id}
                                    title={`${shortName} — ${char.shardsPerWeek} shards/week${isStarred ? '' : ' (not at blue star)'}`}
                                    className="relative flex items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-colors"
                                    style={{
                                        borderColor: isStarred ? 'var(--primary)' : 'var(--border)',
                                        background: isStarred
                                            ? 'color-mix(in oklab, var(--primary) 8%, transparent)'
                                            : 'var(--bg)',
                                    }}>
                                    <div className="relative flex-shrink-0">
                                        <UnitShardIcon icon={roundIcon} />
                                        {isStarred && (
                                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--success)] text-white shadow ring-2 ring-[var(--card-bg)]">
                                                <svg
                                                    width="8"
                                                    height="8"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="3.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            </span>
                                        )}
                                    </div>
                                    <div className="min-w-0 leading-tight">
                                        <div
                                            className="text-xs font-semibold"
                                            style={{ color: isStarred ? 'var(--fg)' : 'var(--muted-fg)' }}>
                                            {shortName}
                                        </div>
                                        <div className="text-[10px] text-[var(--muted-fg)] tabular-nums">
                                            {char.shardsPerWeek} S/W
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <p className="mt-1.5 text-[10px] text-[var(--muted-fg)]">
                        Detected from your roster. Update star levels in Who You Own.
                    </p>
                </div>

                {/* Incursion farming */}
                <div className="rounded-md border border-[var(--border)] bg-[var(--bg)] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <div className="text-sm font-semibold text-[var(--fg)]">Incursion farming (MoW)</div>
                            <div className="text-[11px] text-[var(--muted-fg)]">MoW at blue star for Incursion?</div>
                        </div>
                        <Segmented
                            value={state.hasBlueStarMoW}
                            onChange={v => onUpdate('hasBlueStarMoW', v)}
                            options={[
                                { value: 'yes' as const, label: 'Yes' },
                                { value: 'no' as const, label: 'No' },
                            ]}
                        />
                    </div>
                    {state.hasBlueStarMoW === 'yes' && (
                        <div className="fade-in mt-3">
                            <div className="mb-1.5 text-[11px] text-[var(--muted-fg)]">
                                Legendary level you&apos;re farming
                            </div>
                            <Segmented
                                value={state.incursionLegendaryLevel}
                                onChange={v => onUpdate('incursionLegendaryLevel', v)}
                                options={[
                                    { value: 'L10' as const, label: 'Legendary 10' },
                                    { value: 'L12' as const, label: 'Legendary 12' },
                                    { value: 'M' as const, label: 'Mythic' },
                                ]}
                            />
                        </div>
                    )}
                </div>

                {/* Onslaught */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[var(--border)] bg-[var(--bg)] p-3">
                    <div>
                        <div className="text-sm font-semibold text-[var(--fg)]">Onslaught — Mythic Winged</div>
                        <div className="text-[11px] text-[var(--muted-fg)]">
                            +{onslaughtCodicesWeekly} legendary-equiv /wk
                        </div>
                    </div>
                    <Switch
                        isSelected={state.onslaughtMythicWinged}
                        onChange={v => onUpdate('onslaughtMythicWinged', v)}>
                        {state.onslaughtMythicWinged ? 'Yes' : 'No'}
                    </Switch>
                </div>

                {/* Energy sliders */}
                <div className="grid grid-cols-2 gap-5 rounded-md border border-[var(--border)] bg-[var(--bg)] p-3">
                    <div>
                        <div className="text-xs font-semibold text-[var(--fg)]">Elite energy / day</div>
                        <div className="mb-2 text-[11px] text-[var(--muted-fg)]">{eliteEnergyPerRaid}-energy steps</div>
                        <div className="flex items-baseline justify-between gap-2">
                            <span className="text-sm font-bold text-[var(--fg)] tabular-nums">{eliteEnergyPerDay}</span>
                            <span className="text-xs text-[var(--muted-fg)]">/ 600</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="600"
                            step={eliteEnergyPerRaid}
                            value={eliteEnergyPerDay}
                            onChange={event_ => setEliteEnergyPerDay(Number(event_.target.value))}
                            className="accent-warning mt-1 w-full"
                        />
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-[var(--fg)]">Non-elite energy / day</div>
                        <div className="mb-2 text-[11px] text-[var(--muted-fg)]">
                            {nonEliteEnergyPerRaid}-energy steps
                        </div>
                        <div className="flex items-baseline justify-between gap-2">
                            <span className="text-sm font-bold text-[var(--fg)] tabular-nums">
                                {nonEliteEnergyPerDay}
                            </span>
                            <span className="text-xs text-[var(--muted-fg)]">/ 600</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="600"
                            step={nonEliteEnergyPerRaid}
                            value={nonEliteEnergyPerDay}
                            onChange={event_ => setNonEliteEnergyPerDay(Number(event_.target.value))}
                            className="accent-warning mt-1 w-full"
                        />
                    </div>
                </div>
            </div>
        )}
    </div>
);
