import React, { useEffect, useMemo, useState } from 'react';
import { useDebounceCallback } from 'usehooks-ts';

import { Slider } from '@/fsd/5-shared/ui';

import { Campaign, CampaignDifficulty, CampaignImage, DifficultyChip, ICampaignModel } from '@/fsd/4-entities/campaign';
import { ICharacter2 } from '@/fsd/4-entities/character';

import { CharacterChipRow } from './character-chip';
import { getMaxNodes } from './get-max-nodes';

// Static map so Tailwind's scanner can detect every class at build time.
const DIFF_BAR_CLASS: Record<CampaignDifficulty, string> = {
    [CampaignDifficulty.standard]: 'bg-[var(--diff-standard)]',
    [CampaignDifficulty.mirror]: 'bg-[var(--diff-mirror)]',
    [CampaignDifficulty.elite]: 'bg-[var(--diff-elite)]',
    [CampaignDifficulty.eventStandard]: 'bg-[var(--diff-event-std)]',
    [CampaignDifficulty.eventExtremis]: 'bg-[var(--diff-event-ext)]',
    [CampaignDifficulty.eventChallenge]: 'bg-[var(--diff-event-chal)]',
};

// ─── TileB ────────────────────────────────────────────────────────────────────

interface TileBProps {
    campaign: ICampaignModel;
    value: number;
    isActiveGoal: boolean;
    onSet: (value: number) => void;
}

const TileB = ({ campaign, value, isActiveGoal, onSet }: TileBProps) => {
    const [localValue, setLocalValue] = useState(value);
    const debounced = useDebounceCallback(onSet, 1500);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const max = useMemo(() => getMaxNodes(campaign.difficulty), [campaign.difficulty]);
    const cleared = localValue >= max && max > 0;

    const update = (v: number) => {
        const clamped = Math.max(0, Math.min(max, v));
        setLocalValue(clamped);
        debounced(clamped);
    };

    const diffClass = DIFF_BAR_CLASS[campaign.difficulty] ?? 'bg-[var(--diff-standard)]';
    const isChallenge = campaign.difficulty === CampaignDifficulty.eventChallenge;
    const challengeBaseDifficulty =
        isChallenge && (campaign.id as string).includes('Extremis')
            ? CampaignDifficulty.eventExtremis
            : CampaignDifficulty.eventStandard;

    // left-edge state stripe classes
    const stripeClass = cleared
        ? 'border-l-2 border-l-(--success)'
        : isActiveGoal
          ? 'border-l-2 border-l-(--primary)'
          : 'border-l-2 border-l-transparent';

    const bgClass = cleared
        ? 'bg-[color-mix(in_oklab,var(--success)_5%,transparent)]'
        : isActiveGoal
          ? 'bg-[color-mix(in_oklab,var(--primary)_5%,transparent)]'
          : '';

    return (
        <div
            className={`flex flex-col gap-1.5 border-b border-(--border) px-3 py-2.5 last:border-b-0 sm:border-r sm:border-b-0 sm:last:border-r-0 ${stripeClass} ${bgClass}`}>
            {/* head: difficulty chip + status indicator */}
            <div className="flex items-center justify-between">
                {isChallenge ? (
                    <div className="flex items-center gap-1">
                        <DifficultyChip difficulty={challengeBaseDifficulty} compact />
                        <DifficultyChip difficulty={CampaignDifficulty.eventChallenge} compact />
                    </div>
                ) : (
                    <DifficultyChip difficulty={campaign.difficulty} compact />
                )}
                {cleared && (
                    <span className="text-[13px] font-black text-(--success)" title="Cleared">
                        ✓
                    </span>
                )}
                {isActiveGoal && !cleared && (
                    <span
                        className="inline-block size-[7px] rounded-full bg-(--primary) shadow-[0_0_0_2px_var(--card-bg),0_0_0_3px_var(--primary)]"
                        title="Linked to active goal"
                    />
                )}
            </div>

            {/* progress bar + value */}
            <div className="flex items-center gap-2">
                <Slider className="flex-1" value={localValue} max={max} onChange={update} fillClassName={diffClass} />
                <div className="min-w-[44px] shrink-0 text-xs tabular-nums">
                    <strong>{localValue}</strong>
                    <span className="text-(--muted-fg)">/{max}</span>
                </div>
            </div>

            {/* controls: − / input / + / Max */}
            <div className="flex items-center gap-[3px]">
                <button
                    onClick={() => update(localValue - 1)}
                    className="grid size-[22px] shrink-0 cursor-pointer place-items-center rounded border border-(--border) bg-(--card-bg) text-xs leading-none font-bold text-(--fg) hover:bg-(--primary)/15 focus-visible:ring-2 focus-visible:ring-(--ring)/60 focus-visible:outline-none active:bg-(--primary)/25"
                    aria-label="Decrease">
                    −
                </button>
                <input
                    type="number"
                    value={localValue}
                    min={0}
                    max={max}
                    onChange={event_ => update(event_.target.value === '' ? 0 : Number(event_.target.value))}
                    onFocus={event_ => event_.target.select()}
                    onBlur={() => {
                        if (localValue < 0) update(0);
                        else if (localValue > max) update(max);
                    }}
                    name={`progress-${campaign.id}`}
                    autoComplete="off"
                    className="h-[22px] w-[44px] [appearance:textfield] rounded border border-(--input) bg-(--bg) px-1 text-center text-[11px] font-semibold text-(--fg) tabular-nums focus-visible:border-(--primary) focus-visible:ring-[3px] focus-visible:ring-(--ring)/20 focus-visible:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    aria-label={`Progress for ${campaign.displayName}`}
                />
                <button
                    onClick={() => update(localValue + 1)}
                    className="grid size-[22px] shrink-0 cursor-pointer place-items-center rounded border border-(--border) bg-(--card-bg) text-xs leading-none font-bold text-(--fg) hover:bg-(--primary)/15 focus-visible:ring-2 focus-visible:ring-(--ring)/60 focus-visible:outline-none active:bg-(--primary)/25"
                    aria-label="Increase">
                    +
                </button>
                <button
                    onClick={() => update(max)}
                    className="ml-auto grid h-[22px] cursor-pointer place-items-center rounded-full border border-(--primary) bg-(--primary) px-2 text-[10px] font-bold tracking-[0.02em] text-(--primary-fg) hover:bg-(--primary)/80 focus-visible:ring-2 focus-visible:ring-(--ring)/60 focus-visible:outline-none"
                    aria-label="Set to max">
                    Max
                </button>
            </div>
        </div>
    );
};

// ─── StoryRow ─────────────────────────────────────────────────────────────────

interface StoryRowProps {
    /** All difficulty variants for this storyline (same groupType). */
    campaigns: ICampaignModel[];
    progress: Record<Campaign, number>;
    /** Full user roster for character chip lookup. */
    characters: ICharacter2[];
    activeGoals: Set<Campaign>;
    onSet: (id: Campaign, value: number) => void;
}

export const StoryRow = ({ campaigns, progress, characters, activeGoals, onSet }: StoryRowProps) => {
    // aggregate progress across all difficulties in this row
    const totalMax = useMemo(() => campaigns.reduce((a, c) => a + getMaxNodes(c.difficulty), 0), [campaigns]);
    const totalDone = useMemo(() => campaigns.reduce((a, c) => a + (progress[c.id] ?? 0), 0), [campaigns, progress]);
    const pct = totalMax > 0 ? Math.round((totalDone / totalMax) * 100) : 0;

    // de-duplicate core characters across all difficulties
    const coreCharacters = useMemo(() => {
        const ids = new Set<string>();
        for (const c of campaigns) for (const id of c.coreCharacters) ids.add(id);
        return characters.filter(ch => ids.has(ch.snowprintId));
    }, [campaigns, characters]);

    // use first campaign as the storyline icon representative
    const representative = campaigns[0];
    const storyName = representative.groupType as string;

    return (
        <div className="overflow-hidden rounded-[var(--radius-md)] border border-(--card-border) bg-(--card-bg)">
            {/* row header */}
            <div className="flex flex-col gap-3 border-b border-(--border) bg-[color-mix(in_oklab,var(--secondary)_50%,var(--card-bg))] px-4 py-4 sm:grid sm:grid-cols-[1fr_220px] sm:gap-6">
                {/* left: icon + name + characters */}
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                    <div className="flex min-w-0 items-center gap-4">
                        <div className="shrink-0">
                            <CampaignImage campaign={representative.id} size={40} showTooltip={false} />
                        </div>
                        <span className="mx-1 truncate text-base font-bold text-(--fg)">{storyName}</span>
                    </div>
                    {coreCharacters.length > 0 && <CharacterChipRow characters={coreCharacters} gap={4} />}
                </div>

                {/* right: aggregate % + bar */}
                <div className="flex items-center gap-2 sm:shrink-0 sm:flex-col sm:justify-center sm:gap-1">
                    <div className="shrink-0 text-base leading-none font-bold text-(--fg) tabular-nums sm:text-[20px]">
                        {pct}
                        <span className="ml-0.5 text-xs font-normal text-(--muted-fg)">%</span>
                    </div>
                    <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-(--fg)/12 sm:w-full sm:flex-none">
                        <div
                            className="h-full rounded-full bg-(--primary) motion-safe:transition-[width] motion-safe:duration-200"
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* tiles */}
            <div
                className="flex flex-col sm:grid sm:grid-cols-[repeat(var(--cols),1fr)]"
                style={{ '--cols': campaigns.length } as React.CSSProperties}>
                {campaigns.map(c => (
                    <TileB
                        key={c.id}
                        campaign={c}
                        value={progress[c.id] ?? 0}
                        isActiveGoal={activeGoals.has(c.id)}
                        onSet={v => onSet(c.id, v)}
                    />
                ))}
            </div>
        </div>
    );
};
