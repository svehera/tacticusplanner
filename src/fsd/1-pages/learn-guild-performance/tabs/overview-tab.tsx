/* eslint-disable import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure */
/* eslint-disable boundaries/element-types -- cross-page import for shared guild data */
import { useState } from 'react';

import { snowprintIcons } from '@/fsd/5-shared/assets';
import { obfuscateUserId } from '@/fsd/5-shared/lib';
import type { TacticusGuildRaidResponse } from '@/fsd/5-shared/lib/tacticus-api';
import { RarityMapper, type Rarity } from '@/fsd/5-shared/model';
import { Badge } from '@/fsd/5-shared/ui';
import { RarityIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';
import type { ISnapshotCharacter } from '@/fsd/5-shared/ui/unit-portrait';

import { resolveModifierDisplay } from '@/fsd/4-entities/guild_boss';
import { NpcPortrait } from '@/fsd/4-entities/npc';

import { AbilityText } from '@/fsd/3-features/character-details/ability-text-renderer';

import {
    ALL_RAID_COMPS,
    type RaidComp,
} from '@/fsd/1-pages/input-guild-roster-snapshots/guild-roster-snapshots.models';
import { getRaidCompIconProps } from '@/fsd/1-pages/input-guild-roster-snapshots/raid-comp-icon';

import {
    CaptureButton,
    CardGrid,
    ColumnHeader,
    ReadinessTile,
    ScrollX,
    SectionHeader,
    TableCard,
    TableCardHeader,
    type ColumnLabel,
} from '../guild-performance.components';
import { captureFileName, useSectionCapture } from '../guild-performance.hook';
import { ROW, roundIconToggleClass } from '../guild-performance.styles';
import type { GuildTokenEntry } from '../guild-performance.types';
import {
    formatTime,
    resolveBossOverviewDisplay,
    sortTokenEntries,
    type BossDisplayHp,
    type PrimeDisplay,
} from '../guild-performance.utils';

/** `boss` renders a thicker bar than `prime`, so the boss reads as the dominant encounter. */
const HpBar = ({ hp, size = 'prime' }: { hp: BossDisplayHp; size?: 'boss' | 'prime' }) => {
    const track = `${size === 'boss' ? 'h-3' : 'h-2'} w-full overflow-hidden rounded-full bg-(--fg)/12`;
    const label =
        hp.kind === 'fullUnknown'
            ? 'Full HP'
            : `${(hp.kind === 'full' ? hp.max : hp.remaining).toLocaleString()} / ${hp.max.toLocaleString()} HP remaining`;
    const pct = hp.kind === 'actual' ? (hp.max > 0 ? (hp.remaining / hp.max) * 100 : 0) : 100;
    return (
        <div className="flex flex-col gap-0.5">
            <div className={track}>
                <div className="h-full bg-(--danger) transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[11px] text-(--soft-fg) tabular-nums">{label}</span>
        </div>
    );
};

/**
 * NpcPortrait renders at a fixed 307×242, so it is scaled down inside a clipped box. `scale`
 * drives the boss/prime size hierarchy — previously both rendered identically whenever the season
 * config supplied stats, which was the usual case, so the boss never actually looked dominant.
 */
const EncounterPortrait = ({
    fakeChar,
    portraitUrl,
    displayName,
    imgClassName,
    placeholderClassName,
    scale = 0.5,
}: {
    fakeChar?: ISnapshotCharacter;
    portraitUrl?: string;
    displayName: string;
    imgClassName: string;
    placeholderClassName: string;
    scale?: number;
}) => {
    if (fakeChar) {
        return (
            <div className="overflow-hidden" style={{ height: 307 * scale, width: 242 * scale }}>
                <div className="h-[307px] w-[242px] origin-top-left" style={{ transform: `scale(${scale})` }}>
                    <NpcPortrait
                        id={fakeChar.id}
                        rank={fakeChar.rank}
                        stars={fakeChar.stars}
                        customPortraitUrl={portraitUrl}
                        rarity={fakeChar.rarity}
                    />
                </div>
            </div>
        );
    }
    if (portraitUrl) {
        return <img src={portraitUrl} alt={displayName} className={imgClassName} />;
    }
    return <div className={placeholderClassName}>{displayName}</div>;
};

const PrimePanel = ({ prime, rarity, side }: { prime: PrimeDisplay; rarity: Rarity; side: 'left' | 'right' }) => {
    return (
        <div className="flex flex-col items-center gap-2 bg-(--card) p-3 text-center">
            <EncounterPortrait
                fakeChar={prime.fakeChar}
                portraitUrl={prime.portraitUrl}
                displayName={prime.displayName}
                scale={0.4}
                imgClassName="size-14 rounded object-cover"
                placeholderClassName="flex h-14 w-14 shrink-0 items-center justify-center rounded bg-(--soft) text-[10px] text-(--soft-fg)"
            />
            <span className="text-[10px] tracking-[.12em] text-(--soft-fg) uppercase">Prime · {side}</span>
            <p className="text-sm font-bold text-(--fg)">{prime.displayName}</p>
            <div className="w-full">
                <HpBar hp={prime.hp} size="prime" />
            </div>
            {prime.modifierProgress && (
                <div className="flex w-full flex-col items-center gap-1.5 text-xs text-(--soft-fg)">
                    <span className="tabular-nums">
                        {prime.modifierProgress.modifiersHit} / {prime.modifierProgress.totalModifiers} modifiers hit
                    </span>
                    {prime.modifierProgress.nextTarget &&
                        (() => {
                            const { modifierKey, remainingHp, description } = prime.modifierProgress.nextTarget;
                            const {
                                title,
                                portraitUrl: portraitIconUrl,
                                abilityIcons,
                            } = resolveModifierDisplay(modifierKey);
                            return (
                                <div className="w-full rounded-md bg-(--ability-panel) p-2 text-left">
                                    <div className="flex items-start gap-2">
                                        {portraitIconUrl ? (
                                            <img src={portraitIconUrl} alt={title} className="h-8 w-8 shrink-0" />
                                        ) : (
                                            abilityIcons?.map((icon, index) => (
                                                <img
                                                    key={index}
                                                    src={icon.file}
                                                    alt={icon.name}
                                                    className="h-8 w-8 shrink-0"
                                                />
                                            ))
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <div className="mb-0.5 flex items-center justify-between gap-1">
                                                <span className="text-xs font-semibold text-(--fg)">{title}</span>
                                                <span className="shrink-0 text-[10px] text-(--soft-fg) tabular-nums">
                                                    next at {remainingHp.toLocaleString()} HP
                                                </span>
                                            </div>
                                            <AbilityText
                                                text={description}
                                                level={1}
                                                variables={{}}
                                                constants={{}}
                                                scaledVariableNames={[]}
                                                rarity={rarity}
                                                unitName=""
                                                factionId=""
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                </div>
            )}
        </div>
    );
};

const CurrentBoss = ({
    data,
    guildInfo,
}: {
    data: TacticusGuildRaidResponse | undefined;
    guildInfo?: { tag: string; name: string };
}) => {
    if (data === undefined) return <p className="text-sm text-(--soft-fg)">Loading…</p>;

    const entries = data.entries ?? [];
    const display = resolveBossOverviewDisplay(entries, data.seasonConfigId);
    if (!display) return <p className="text-sm text-(--soft-fg)">No boss data yet.</p>;

    const rarityName = RarityMapper.rarityToRarityString(display.rarity);
    const tierLabel = `${rarityName} ${display.tierSetIndex + 1}`;

    return (
        <TableCard>
            <TableCardHeader>
                <span className="text-[10px] font-bold tracking-[.14em] text-(--soft-fg) uppercase">Current boss</span>
                <RarityIcon rarity={display.rarity} />
                <span className="text-sm font-extrabold text-(--fg)">{tierLabel}</span>
                {guildInfo && (
                    <>
                        <span className="h-3.5 w-px bg-(--border)" />
                        <span className="text-xs text-(--soft-fg)">
                            <span className="font-mono font-semibold">[{guildInfo.tag}]</span> {guildInfo.name}
                        </span>
                    </>
                )}
                <span className="ml-auto text-xs text-(--soft-fg)">
                    Season {data.season} · {entries.length} hits logged
                </span>
            </TableCardHeader>
            {/* Three equal columns. The 1px gap over a border-coloured background draws the
                separators, so the primes read as flanking the boss rather than floating beside it. */}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(255px,100%),1fr))] gap-px bg-(--border)">
                {display.leftPrime && <PrimePanel prime={display.leftPrime} rarity={display.rarity} side="left" />}
                <div className="flex flex-col items-center gap-2 bg-(--soft) p-3">
                    <EncounterPortrait
                        fakeChar={display.boss.fakeChar}
                        portraitUrl={display.boss.portraitUrl}
                        displayName={display.boss.displayName}
                        scale={0.55}
                        imgClassName="w-28 shrink-0 rounded-lg object-cover shadow"
                        placeholderClassName="flex h-48 w-28 shrink-0 items-center justify-center rounded-lg bg-(--soft) text-xs text-(--soft-fg)"
                    />
                    <span className="text-[10px] tracking-[.12em] text-(--fg) uppercase">
                        {display.isNextBoss ? 'Next boss' : 'Boss'}
                    </span>
                    <p className="text-base font-extrabold text-(--fg)">{display.boss.displayName}</p>
                    <div className="w-full">
                        <HpBar hp={display.boss.hp} size="boss" />
                    </div>
                </div>
                {display.rightPrime && <PrimePanel prime={display.rightPrime} rarity={display.rarity} side="right" />}
            </div>
        </TableCard>
    );
};

const CompFilterBar = ({
    selected,
    onSelect,
}: {
    selected: RaidComp | undefined;
    onSelect: (comp: RaidComp | undefined) => void;
}) => (
    <div className="flex flex-wrap items-center gap-1">
        {ALL_RAID_COMPS.map(comp => {
            const { icon, name } = getRaidCompIconProps(comp);
            const isActive = selected === comp;
            return (
                <button
                    key={comp}
                    type="button"
                    title={comp}
                    onClick={() => onSelect(isActive ? undefined : comp)}
                    className={roundIconToggleClass(isActive)}>
                    <UnitShardIcon icon={icon} name={name} width={28} height={28} />
                </button>
            );
        })}
    </div>
);

const MAX_TOKENS = 3;

/**
 * Every track is `minmax(content-floor, weight)`, so spare width is shared out in proportion instead
 * of piling into one column — the same balance the Every-hit grid gets from `fitGridWidth`. The
 * floors add up to the `minWidth` the table scrolls at.
 *
 * Teams sits last: it is the one optional column (empty for a guild with no comps recorded) and the
 * one nobody sorts or scans by, so it belongs at the edge rather than between the player and their
 * readiness.
 */
const ROSTER_COLS =
    'grid-cols-[minmax(150px,1.7fr)_minmax(86px,0.9fr)_minmax(92px,1fr)_minmax(74px,0.8fr)_minmax(92px,1fr)_minmax(76px,0.9fr)]';
const ROSTER_LABELS: ColumnLabel[] = ['Player', 'Tokens', 'Next token', 'Bomb', 'Bomb ready', 'Teams'];

/**
 * Three token icons plus `n/3`. Colour is never the only signal — the count is always spelled out.
 * A full bar is `--danger`: at 3/3 regeneration has stalled and tokens are being wasted.
 */
const TokenPips = ({ tokens }: { tokens: number | null | undefined }) => {
    const hasData = tokens != undefined;
    return (
        <span className="flex items-center gap-0.5">
            {Array.from({ length: MAX_TOKENS }, (_, index) => (
                <img
                    key={index}
                    src={snowprintIcons.guildRaidToken.file}
                    alt=""
                    className={
                        hasData
                            ? index < tokens
                                ? 'h-[15px] w-[15px] object-contain'
                                : 'h-[15px] w-[15px] object-contain opacity-[.22] grayscale'
                            : 'h-[15px] w-[15px] object-contain opacity-[.18]'
                    }
                />
            ))}
            <span
                className={`ml-0.5 text-[11px] font-bold tabular-nums ${
                    hasData && tokens >= MAX_TOKENS ? 'text-(--danger)' : 'text-(--soft-fg)'
                }`}>
                {hasData ? `${tokens}/${MAX_TOKENS}` : '—'}
            </span>
        </span>
    );
};

/** Replaces the separate Raid Tokens and Bombs tables — one row per player covering both. */
const RosterReadinessTable = ({
    entries,
    names,
    raidCompsMap,
    selectedComp,
}: {
    entries: GuildTokenEntry[];
    names: Map<string, string>;
    raidCompsMap: Map<string, RaidComp[]> | undefined;
    selectedComp: RaidComp | undefined;
}) => {
    const rows = entries.map(entry => ({
        userId: entry.userId,
        displayName: names.get(entry.userId) ?? entry.name ?? obfuscateUserId(entry.userId),
        tokens: entry.tokens,
        nextTokenAtUtc: entry.nextTokenAtUtc,
        bombAvailableAtUtc: entry.bombAvailableAtUtc,
    }));
    const filtered =
        selectedComp === undefined
            ? rows
            : rows.filter(row => (raidCompsMap?.get(row.userId) ?? []).includes(selectedComp));
    const sorted = sortTokenEntries(filtered);

    return (
        <ScrollX minWidth={620}>
            <div role="table" aria-label="Roster readiness">
                <ColumnHeader cols={ROSTER_COLS} labels={ROSTER_LABELS} />
                {sorted.map(row => {
                    const hasData = row.tokens != undefined;
                    // A null bombAvailableAtUtc means the bomb is off cooldown, i.e. ready now.
                    const hasBomb = hasData && row.bombAvailableAtUtc == undefined;
                    return (
                        <div role="row" key={row.userId} className={`grid ${ROSTER_COLS} ${ROW}`}>
                            <span role="cell" className="min-w-0 truncate font-semibold" title={row.userId}>
                                {row.displayName}
                            </span>
                            <span role="cell" className="flex items-center">
                                <TokenPips tokens={row.tokens} />
                            </span>
                            <span role="cell" className="text-[11.5px] text-(--soft-fg) tabular-nums">
                                {row.nextTokenAtUtc == undefined
                                    ? hasData
                                        ? 'Full'
                                        : '—'
                                    : formatTime(row.nextTokenAtUtc)}
                            </span>
                            <span role="cell">
                                {hasData ? (
                                    <Badge intent={hasBomb ? 'success' : 'default'} appearance="outline">
                                        {hasBomb ? 'Ready' : 'Used'}
                                    </Badge>
                                ) : (
                                    <span className="text-(--soft-fg)">—</span>
                                )}
                            </span>
                            <span role="cell" className="text-[11.5px] text-(--soft-fg) tabular-nums">
                                {row.bombAvailableAtUtc == undefined ? '—' : formatTime(row.bombAvailableAtUtc)}
                            </span>
                            <span role="cell" className="flex flex-wrap gap-0.5">
                                {(raidCompsMap?.get(row.userId) ?? []).slice(0, 2).map(comp => {
                                    const { icon, name } = getRaidCompIconProps(comp);
                                    return (
                                        <UnitShardIcon
                                            key={comp}
                                            icon={icon}
                                            name={name}
                                            tooltip={comp}
                                            width={18}
                                            height={18}
                                        />
                                    );
                                })}
                            </span>
                        </div>
                    );
                })}
            </div>
        </ScrollX>
    );
};

/**
 * Answers "is anyone wasting regeneration" without reading the table. All three derive from the
 * token data the tab already receives; the roster size is counted rather than assumed.
 */
const ReadinessTiles = ({ entries }: { entries: GuildTokenEntry[] }) => {
    const withData = entries.filter(entry => entry.tokens != undefined);
    const tokensHeld = withData.reduce((sum, entry) => sum + (entry.tokens ?? 0), 0);
    const tokenCapacity = withData.length * MAX_TOKENS;
    const bombsReady = withData.filter(entry => entry.bombAvailableAtUtc == undefined).length;
    const capped = withData.filter(entry => (entry.tokens ?? 0) >= MAX_TOKENS).length;

    return (
        <CardGrid min={148} gap="gap-2.5">
            <ReadinessTile
                label="Tokens ready"
                value={`${tokensHeld} / ${tokenCapacity}`}
                caption="Held across the roster"
                barPct={tokenCapacity > 0 ? (tokensHeld / tokenCapacity) * 100 : 0}
            />
            <ReadinessTile
                label="Bombs available"
                value={String(bombsReady)}
                caption={`of ${withData.length} players`}
                valueClass="text-(--success)"
                barPct={withData.length > 0 ? (bombsReady / withData.length) * 100 : 0}
                barClass="bg-(--success)"
            />
            <ReadinessTile
                label="Capped & idle"
                value={String(capped)}
                caption={capped > 0 ? 'Wasting regen' : 'Nobody capped'}
                valueClass={capped > 0 ? 'text-(--danger)' : 'text-(--fg)'}
            />
        </CardGrid>
    );
};

export const OverviewTab = ({
    currentData,
    names,
    tokenData,
    tokenError,
    guildInfo,
    raidCompsMap,
}: {
    currentData: TacticusGuildRaidResponse | undefined;
    names: Map<string, string>;
    tokenData: GuildTokenEntry[] | undefined;
    tokenError: string | undefined;
    guildInfo?: { tag: string; name: string };
    raidCompsMap?: Map<string, RaidComp[]>;
}) => {
    const roster = useSectionCapture<HTMLElement>(captureFileName('guild-roster-readiness'));
    const [selectedComp, setSelectedComp] = useState<RaidComp | undefined>();
    const hasAnyComps = raidCompsMap !== undefined && raidCompsMap.size > 0;
    const effectiveSelectedComp = hasAnyComps ? selectedComp : undefined;

    return (
        <div className="flex flex-col gap-3.5">
            <CurrentBoss data={currentData} guildInfo={guildInfo} />

            {tokenData !== undefined && <ReadinessTiles entries={tokenData} />}

            <section ref={roster.ref} className="flex flex-col gap-2">
                <SectionHeader
                    title="Roster readiness"
                    note="Tokens and bombs per player"
                    meta={<CaptureButton onCapture={roster.onCapture} isCapturing={roster.isCapturing} />}
                />
                <TableCard>
                    {hasAnyComps && (
                        <TableCardHeader>
                            <span className="text-[10px] font-bold tracking-[.14em] text-(--soft-fg) uppercase">
                                Filter by team
                            </span>
                            <div className="ml-auto">
                                <CompFilterBar selected={effectiveSelectedComp} onSelect={setSelectedComp} />
                            </div>
                        </TableCardHeader>
                    )}
                    {tokenData === undefined ? (
                        <p className={`px-3 py-6 text-sm ${tokenError ? 'text-(--danger)' : 'text-(--soft-fg)'}`}>
                            {tokenError ?? 'Loading…'}
                        </p>
                    ) : (
                        <RosterReadinessTable
                            entries={tokenData}
                            names={names}
                            raidCompsMap={raidCompsMap}
                            selectedComp={effectiveSelectedComp}
                        />
                    )}
                </TableCard>
            </section>
        </div>
    );
};
