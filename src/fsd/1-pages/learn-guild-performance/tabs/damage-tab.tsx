/* eslint-disable import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure */
import { ChevronDown, Copy } from 'lucide-react';
import { enqueueSnackbar } from 'notistack';
import { useEffect, useId, useMemo, useState } from 'react';

import { copyToClipboard, useCaptureElement } from '@/fsd/5-shared/lib';
import {
    TacticusDamageType,
    TacticusEncounterType,
    type EnemyInfo,
    type GuildSeasonHistoryResponse,
    type GuildSeasonSummary,
    type TacticusGuildRaidEntry,
    type TacticusGuildRaidResponse,
} from '@/fsd/5-shared/lib/tacticus-api';
import { Rarity, RarityMapper } from '@/fsd/5-shared/model';
import { Button, Segmented } from '@/fsd/5-shared/ui';
import { RarityIcon } from '@/fsd/5-shared/ui/icons';

import { MowsService } from '@/fsd/4-entities/mow/mows.service';

import {
    CaptureButton,
    ColumnHeader,
    CompIcons,
    EncounterIcon,
    FilterBar,
    FilterGroup,
    PrefixFilter,
    RarityFilter,
    ScrollX,
    SectionHeader,
    TableCard,
    type ColumnLabel,
} from '../guild-performance.components';
import { ROW } from '../guild-performance.styles';
import {
    bossIconFor,
    computeDefaultRarities,
    getAvailableBossPrefixes,
    getBossOrder,
    getBossPrefix,
    resolvePlayerName,
} from '../guild-performance.utils';

import { HitGrid } from './damage-hit-grid';
import {
    buildPlayerSummaryText,
    buildPlayerSummaryTextFromSummary,
    DEFAULT_HIT_FILTERS,
    filterHitEntries,
    hasHitFilters,
    type HitFilterState,
    type PlayerSummaryContent,
} from './damage-tab.utils';

/**
 * The axes AG Grid Community cannot express as a column filter — it has text, number and date
 * filters but no set (checkbox) filter, so anything categorical needs a control of its own.
 *
 * Rarity and Boss stay as the icon toggles above, because they also drive the season-summary tables,
 * not just the grid.
 *
 * Generic per group rather than one array of loose strings: without it the two groups collapse to a
 * common `string`, and setting state needed a cast that accepted a slot value for the hit-type axis
 * just as happily.
 */
interface HitFilterGroup<K extends keyof HitFilterState> {
    key: K;
    label: string;
    options: { value: HitFilterState[K]; label: string }[];
}

const HIT_FILTER_GROUPS: [HitFilterGroup<'damage'>, HitFilterGroup<'slot'>] = [
    {
        key: 'damage' as const,
        label: 'Hit type',
        options: [
            { value: 'all', label: 'All' },
            { value: 'battle', label: 'Battle' },
            { value: 'bomb', label: 'Bomb' },
        ],
    },
    {
        // The two primes are separate targets, so each gets its own option rather than one "prime".
        key: 'slot' as const,
        label: 'Slot',
        options: [
            { value: 'all', label: 'All' },
            { value: 'boss', label: 'Boss' },
            { value: 'left', label: 'Left' },
            { value: 'right', label: 'Right' },
        ],
    },
];

// ---------------------------------------------------------------------------
// Boss/rarity season summary
// ---------------------------------------------------------------------------

interface BossRarityStatEntry {
    unitId: string;
    rarity: Rarity;
    set: number;
    encounterIndex: number;
    encounterType: TacticusEncounterType;
    unitMaxHp: number;
    /** GuildBoss{N} prefix — used to associate primes with their main boss HP for sorting. */
    bossPrefix: string;
    avgDamage: number;
    maxDamage: number;
    /** Undefined when anonymized (another member in a keyless member's view). */
    maxPlayerId?: string;
    maxPlayerName: string;
    /** Hero unitIds followed by the machine-of-war unitId (if any) for the best hit. Empty when anonymized. */
    comp: string[];
}

function cloneEntryWithSortedUnitIds(entry: TacticusGuildRaidEntry): TacticusGuildRaidEntry {
    return { ...entry, heroDetails: entry.heroDetails.toSorted((a, b) => a.unitId.localeCompare(b.unitId)) };
}

function buildBossRarityStats(entries: TacticusGuildRaidEntry[], names: Map<string, string>): BossRarityStatEntry[] {
    const groups = new Map<
        string,
        {
            unitId: string;
            rarity: Rarity;
            set: number;
            encounterIndex: number;
            encounterType: TacticusEncounterType;
            unitMaxHp: number;
            avgSum: number;
            avgCount: number;
            maxEntry: TacticusGuildRaidEntry | undefined;
        }
    >();
    for (const entry of entries) {
        if (entry.damageType === TacticusDamageType.Bomb) continue;
        // Include encounterIndex so primes sharing a unitId (e.g. Silent King's twin
        // minions) stay as separate slots in the summary.
        const key = `${entry.unitId}:${entry.rarity}:${entry.encounterIndex}`;
        let g = groups.get(key);
        if (g === undefined) {
            g = {
                unitId: entry.unitId,
                rarity: entry.rarity,
                set: entry.set,
                encounterIndex: entry.encounterIndex,
                encounterType: entry.encounterType,
                unitMaxHp: entry.maxHp,
                avgSum: 0,
                avgCount: 0,
                maxEntry: undefined,
            };
            groups.set(key, g);
        }
        g.unitMaxHp = Math.max(g.unitMaxHp, entry.maxHp);
        // avg excludes kills (remainingHp === 0)
        if (entry.remainingHp > 0) {
            g.avgSum += entry.damageDealt;
            g.avgCount++;
        }
        // max includes kills
        if (g.maxEntry === undefined || entry.damageDealt > g.maxEntry.damageDealt) {
            g.maxEntry = cloneEntryWithSortedUnitIds(entry);
        }
    }
    return (
        [...groups.values()]
            .filter(g => g.maxEntry !== undefined)
            .map((g): BossRarityStatEntry => {
                const bossPrefix = /^(GuildBoss\d+)/.exec(g.unitId)?.[1] ?? g.unitId;
                const maxEntry = g.maxEntry!;
                const comp = [
                    ...maxEntry.heroDetails.map(hero => hero.unitId),
                    ...(maxEntry.machineOfWarDetails ? [maxEntry.machineOfWarDetails.unitId] : []),
                ];
                return {
                    unitId: g.unitId,
                    rarity: g.rarity,
                    set: g.set,
                    encounterIndex: g.encounterIndex,
                    encounterType: g.encounterType,
                    unitMaxHp: g.unitMaxHp,
                    bossPrefix,
                    avgDamage: g.avgCount > 0 ? Math.round(g.avgSum / g.avgCount) : 0,
                    maxDamage: maxEntry.damageDealt,
                    maxPlayerId: maxEntry.userId,
                    maxPlayerName: resolvePlayerName(maxEntry.userId, names),
                    comp,
                };
            })
            // Graphs are sorted descending: highest rarity / latest set first
            .toSorted((a, b) => {
                if (a.rarity !== b.rarity) return b.rarity - a.rarity;
                if (a.set !== b.set) return b.set - a.set;
                return b.encounterIndex - a.encounterIndex;
            })
    );
}

/**
 * Builds the same boss/prime summary rows from a historical season aggregate. Only the season's
 * top-2 rarities carry per-enemy detail (see {@link GuildSeasonSummary}), so lower rarities won't
 * appear. `avgDamage` is the guild average excluding kills and `maxDamage` the best hit including
 * kills — matching {@link buildBossRarityStats}. `set` is unavailable (the backend folds across
 * loops), so rows sort by rarity then max HP rather than by set.
 */
/** Maps one aggregated enemy entry into a summary row. `playerId` is the row's attributed player. */
function toSummaryStatEntry(
    enemyInfo: EnemyInfo,
    averageDamageWithoutKills: number,
    maxDamage: number,
    playerId: string | undefined,
    comp: string[],
    names: Map<string, string>
): BossRarityStatEntry {
    const { enemyId, rarity, encounterIndex, maxHp } = enemyInfo;
    const heroUnits = comp.filter(unitId => MowsService.resolveToStatic(unitId) === undefined).toSorted();
    const mow = comp.find(unitId => MowsService.resolveToStatic(unitId) !== undefined);
    return {
        unitId: enemyId,
        rarity: RarityMapper.stringToNumber[rarity],
        // The aggregate has no `set`; the GuildBoss{N} rotation order stands in for it.
        set: getBossOrder(enemyId),
        encounterIndex,
        encounterType: encounterIndex === 0 ? TacticusEncounterType.Boss : TacticusEncounterType.SideBoss,
        unitMaxHp: maxHp,
        bossPrefix: /^(GuildBoss\d+)/.exec(enemyId)?.[1] ?? enemyId,
        avgDamage: Math.round(averageDamageWithoutKills),
        maxDamage,
        maxPlayerId: playerId,
        maxPlayerName: resolvePlayerName(playerId, names),
        comp: mow ? [...heroUnits, mow] : heroUnits,
    };
}

/** Sort matching the live summary: highest rarity first, then latest set, then boss before primes. */
function compareSummaryStatRows(a: BossRarityStatEntry, b: BossRarityStatEntry): number {
    if (a.rarity !== b.rarity) return b.rarity - a.rarity;
    if (a.set !== b.set) return b.set - a.set;
    return b.encounterIndex - a.encounterIndex;
}

/** Guild-wide boss/prime rows for a historical season (best hit across the guild per enemy). */
function buildBossRarityStatsFromSummary(
    summary: GuildSeasonSummary,
    names: Map<string, string>
): BossRarityStatEntry[] {
    return summary.damageSummary.guildEntries
        .map(entry =>
            toSummaryStatEntry(
                entry.enemyInfo,
                entry.averageDamageWithoutKills,
                entry.maxDamage,
                entry.maxDamagePlayerId,
                entry.maxDamageComp,
                names
            )
        )
        .toSorted(compareSummaryStatRows);
}

/**
 * Boss/prime rows for a single player in a historical season — only enemies that player hit,
 * with that player's own avg/max. Limited to the season's top-2 rarities (see
 * {@link GuildSeasonSummary}); a player who only hit lower rarities yields no rows here.
 */
function buildPlayerBossRarityStatsFromSummary(
    summary: GuildSeasonSummary,
    playerId: string,
    names: Map<string, string>
): BossRarityStatEntry[] {
    return summary.damageSummary.playerEntries
        .filter(entry => entry.playerId === playerId)
        .map(entry =>
            toSummaryStatEntry(
                entry.enemyInfo,
                entry.averageDamageWithoutKills,
                entry.maxDamage,
                entry.playerId,
                entry.maxDamageComp,
                names
            )
        )
        .toSorted(compareSummaryStatRows);
}

/**
 * With a player selected the Best-player column is dropped, so the template loses a track too.
 *
 * The comp track is 150px, matching `HIT_COLS`: a full comp is five heroes plus a machine of war,
 * so six 22px icons and five 2px gaps — 142px. At the 130px it used to be, the last portrait was
 * clipped by `CompIcons`' own `overflow-hidden`.
 */
const statCols = (hidePlayer: boolean) =>
    hidePlayer ? 'grid-cols-[34px_26px_92px_100px_150px]' : 'grid-cols-[34px_26px_92px_100px_1fr_150px]';

/**
 * One label per *readable* column, as in `HIT_LABELS`. The first two tracks are a 34px portrait and
 * a 26px rarity icon; neither holds a word at 12px bold `tracking-widest` ("RARITY" alone is ~55px),
 * so they share one "Boss" label spanning both (70px including the gap). Every other label fits its
 * track outright and must not be abbreviated.
 */
const statLabels = (hidePlayer: boolean): ColumnLabel[] => [
    { text: 'Boss', span: 2 },
    { text: 'Avg dmg', align: 'right' },
    { text: 'Max dmg', align: 'right' },
    ...(hidePlayer ? [] : (['Best player'] as ColumnLabel[])),
    'Winning comp',
];

function BossRarityStatRow({ row, hidePlayer }: { row: BossRarityStatEntry; hidePlayer: boolean }) {
    const id = row.maxPlayerName;
    return (
        <div role="row" className={`grid ${statCols(hidePlayer)} ${ROW}`}>
            <span role="cell" className="flex items-center justify-center">
                <EncounterIcon unitId={row.unitId} />
            </span>
            <span role="cell" className="flex items-center justify-center">
                <RarityIcon rarity={row.rarity} />
            </span>
            <span role="cell" className="text-right text-(--soft-fg) tabular-nums">
                {row.avgDamage > 0 ? row.avgDamage.toLocaleString() : '—'}
            </span>
            <span role="cell" className="text-right font-extrabold text-(--fg) tabular-nums">
                {row.maxDamage.toLocaleString()}
            </span>
            {!hidePlayer && (
                <span role="cell" className="min-w-0 truncate font-semibold" title={id}>
                    {id}
                </span>
            )}
            <span role="cell" className="min-w-0">
                <CompIcons comp={row.comp} />
            </span>
        </div>
    );
}

function PlayerSummaryTextSection({ content }: { content: PlayerSummaryContent }) {
    const [isOpen, setIsOpen] = useState(false);
    const bodyId = useId();
    if (content.text === '') return <></>;
    return (
        <div className="overflow-hidden rounded-xl border border-(--border)">
            {/* One bar carrying the disclosure, the hint and the copy action — previously the copy
                button was hidden inside the expanded body. */}
            <div className="flex items-center gap-2.5 bg-(--soft) px-3 py-2">
                <button
                    type="button"
                    onClick={() => {
                        setIsOpen(open => !open);
                    }}
                    aria-expanded={isOpen}
                    aria-controls={bodyId}
                    className="flex cursor-pointer items-center gap-1.5 text-sm font-extrabold text-(--fg)">
                    <ChevronDown className={`size-4 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                    Season summary — text
                </button>
                <span className="text-xs text-(--soft-fg)">paste into Discord</span>
                <button
                    type="button"
                    title="Copy to clipboard"
                    onClick={() => {
                        const { text, html } = content;
                        copyToClipboard(text, html)
                            .then(() => enqueueSnackbar('Copied', { variant: 'success' }))
                            // Firefox and denied permissions reject the write. Swallowing that left
                            // the button looking inert with no way to tell success from failure.
                            .catch(() => enqueueSnackbar('Could not copy to clipboard', { variant: 'error' }));
                    }}
                    className="ml-auto inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-(--border) px-2 py-0.5 text-[11px] font-semibold text-(--soft-fg) hover:border-(--primary)/50 hover:bg-(--primary)/10 hover:text-(--primary)">
                    <Copy className="size-3" />
                    Copy
                </button>
            </div>
            {isOpen && (
                <div id={bodyId} className="border-t border-(--border) px-3 py-2">
                    <pre className="max-h-96 overflow-auto font-mono text-xs whitespace-pre">{content.text}</pre>
                </div>
            )}
        </div>
    );
}

/**
 * One summary table, capturable as a PNG. The capture ref sits on the whole `<section>` so the
 * exported image carries its own title; the button marks itself ignored so it doesn't appear in
 * its own screenshot.
 */
function StatsTableSection({
    title,
    rows,
    hidePlayer,
    captureName,
}: {
    title: string;
    rows: BossRarityStatEntry[];
    hidePlayer: boolean;
    captureName: string;
}) {
    const [isOpen, setIsOpen] = useState(true);
    const bodyId = useId();
    const { ref, capture, isCapturing } = useCaptureElement<HTMLElement>(captureName);

    const onCapture = () => {
        void capture().then(outcome => {
            if (outcome === 'clipboard') enqueueSnackbar('Image copied', { variant: 'success' });
            else if (outcome === 'download') enqueueSnackbar('Image downloaded', { variant: 'success' });
            else enqueueSnackbar('Could not capture the image', { variant: 'error' });
        });
    };

    return (
        <section ref={ref} className="flex flex-col gap-2">
            <SectionHeader
                title={title}
                isOpen={isOpen}
                onToggle={() => setIsOpen(open => !open)}
                bodyId={bodyId}
                meta={
                    <span className="flex items-center gap-2.5">
                        {rows.length} encounters
                        {/* Nothing to capture while collapsed — the image would be the header alone. */}
                        {isOpen && <CaptureButton onCapture={onCapture} isCapturing={isCapturing} />}
                    </span>
                }
            />
            {isOpen && (
                <TableCard id={bodyId}>
                    {/* 640, not 620: the fixed tracks plus padding and gaps come to 472px, leaving the
                        Best-player `1fr` 168px — enough for its own header at 12px bold uppercase. */}
                    <ScrollX minWidth={640}>
                        <div role="table" aria-label={title}>
                            <ColumnHeader cols={statCols(hidePlayer)} labels={statLabels(hidePlayer)} />
                            {rows.map(row => (
                                <BossRarityStatRow
                                    key={`${row.unitId}:${row.rarity}:${row.encounterIndex}`}
                                    row={row}
                                    hidePlayer={hidePlayer}
                                />
                            ))}
                        </div>
                    </ScrollX>
                </TableCard>
            )}
        </section>
    );
}

function BossRarityStatsTable({ rows, hidePlayer }: { rows: BossRarityStatEntry[]; hidePlayer: boolean }) {
    if (rows.length === 0) return <></>;

    const bossRows = rows.filter(row => row.encounterType === TacticusEncounterType.Boss);
    const primeRows = rows.filter(row => row.encounterType !== TacticusEncounterType.Boss);

    return (
        <div className="flex flex-col gap-3.5">
            {bossRows.length > 0 && (
                <StatsTableSection
                    title="Season summary — bosses"
                    rows={bossRows}
                    hidePlayer={hidePlayer}
                    captureName="guild-performance-bosses"
                />
            )}
            {primeRows.length > 0 && (
                <StatsTableSection
                    title="Season summary — primes"
                    rows={primeRows}
                    hidePlayer={hidePlayer}
                    captureName="guild-performance-primes"
                />
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// DamageTab
// ---------------------------------------------------------------------------

export const DamageTab = ({
    currentData,
    seasonHistory,
    names,
    avgDamageMap,
    selectedSeason,
    selectedPlayerId,
}: {
    currentData: TacticusGuildRaidResponse | undefined;
    seasonHistory?: GuildSeasonHistoryResponse;
    names: Map<string, string>;
    avgDamageMap: Map<string, number>;
    /** Page-level sticky season selection. */
    selectedSeason: number | undefined;
    /** Page-level sticky player selection (a keyless member's own id, or a leader's dropdown choice). */
    selectedPlayerId: string | undefined;
}) => {
    // A historical season renders from the aggregated summary; the live (current) season renders
    // from raw per-hit entries. Only the live season has filters and the per-hit raid/bomb table.
    const historySummary = useMemo(
        () =>
            selectedSeason === currentData?.season
                ? undefined
                : seasonHistory?.seasonData.find(entry => entry.season === selectedSeason)?.summary,
        [selectedSeason, currentData, seasonHistory]
    );
    const isHistorical = historySummary !== undefined;

    // Live-season entries; empty for a historical season (no per-hit data exists).
    const allSeasonEntries: TacticusGuildRaidEntry[] = useMemo(
        () => (isHistorical ? [] : (currentData?.entries ?? [])),
        [isHistorical, currentData]
    );

    // --- rarity ---
    const defaultRarities = useMemo(() => computeDefaultRarities(allSeasonEntries), [allSeasonEntries]);
    /** Only the rarities this season actually contains get an option. */
    const availableRarities = useMemo(
        () => [...new Set(allSeasonEntries.map(entry => entry.rarity))].toSorted((a, b) => a - b),
        [allSeasonEntries]
    );
    const [rarityOverride, setRarityOverride] = useState<Rarity[] | undefined>();
    const selectedRarities = rarityOverride ?? defaultRarities;

    const rarityFilteredEntries = useMemo(
        () => allSeasonEntries.filter(entry => selectedRarities.includes(entry.rarity)),
        [allSeasonEntries, selectedRarities]
    );

    // --- boss ---
    const availableBossPrefixes = useMemo(
        () => getAvailableBossPrefixes(rarityFilteredEntries),
        [rarityFilteredEntries]
    );
    const [selectedBossPrefixes, setSelectedBossPrefixes] = useState<string[] | undefined>();
    const effectiveBossPrefixes = selectedBossPrefixes ?? availableBossPrefixes;

    // Reset the live-season filters when the page-level season changes.
    useEffect(() => {
        setRarityOverride(undefined);
        setSelectedBossPrefixes(undefined);
    }, [selectedSeason]);

    // --- final filtered set ---
    const filteredEntries = useMemo(
        () =>
            rarityFilteredEntries
                .filter(entry => selectedPlayerId === undefined || entry.userId === selectedPlayerId)
                .filter(
                    entry =>
                        effectiveBossPrefixes.length === 0 ||
                        // Exact prefix, not `startsWith`: "GuildBoss1" is a string prefix of
                        // GuildBoss10/11/12, so selecting one boss silently admitted four. Every
                        // other tab already compares this way.
                        effectiveBossPrefixes.includes(getBossPrefix(entry.unitId))
                ),
        [rarityFilteredEntries, selectedPlayerId, effectiveBossPrefixes]
    );

    // --- summary view models (per source) ---
    // Historical: with a player selected, show that player's own per-enemy stats and single text row;
    // otherwise the guild-wide rollup. Live: the existing per-hit aggregation.
    const bossRows = useMemo(() => {
        if (historySummary) {
            return selectedPlayerId === undefined
                ? buildBossRarityStatsFromSummary(historySummary, names)
                : buildPlayerBossRarityStatsFromSummary(historySummary, selectedPlayerId, names);
        }
        return buildBossRarityStats(filteredEntries, names);
    }, [historySummary, selectedPlayerId, filteredEntries, names]);

    const summaryContent = useMemo(() => {
        if (historySummary) {
            return buildPlayerSummaryTextFromSummary(historySummary, names, selectedPlayerId);
        }
        return buildPlayerSummaryText(
            selectedPlayerId === undefined ? allSeasonEntries : filteredEntries,
            names,
            selectedPlayerId === undefined ? [...names.keys()] : [selectedPlayerId]
        );
    }, [historySummary, selectedPlayerId, allSeasonEntries, filteredEntries, names]);

    const [hitFilters, setHitFilters] = useState<HitFilterState>(DEFAULT_HIT_FILTERS);

    // The grid gets a further-narrowed set: the icon filters above also scope the summary tables, so
    // they stay separate from the three hit-only axes.
    const gridEntries = useMemo(() => filterHitEntries(filteredEntries, hitFilters), [filteredEntries, hitFilters]);

    const handleRarityChange = (rarities: Rarity[]) => {
        // An empty rarity set would blank every table on the tab, so the last one cannot be removed.
        if (rarities.length === 0) return;
        setRarityOverride(rarities);
        setSelectedBossPrefixes(undefined);
    };

    return (
        <div className="flex flex-col gap-3.5">
            {/* Rarity/Boss filters and the per-hit grid need per-hit data, so they are live-only. */}
            {!isHistorical && (
                <FilterBar>
                    <RarityFilter
                        selected={selectedRarities}
                        onChange={handleRarityChange}
                        available={availableRarities}
                    />
                    <PrefixFilter
                        label="Boss"
                        available={availableBossPrefixes}
                        selected={effectiveBossPrefixes}
                        onChange={setSelectedBossPrefixes}
                        iconFor={bossIconFor}
                    />
                    {HIT_FILTER_GROUPS.map(group => (
                        <FilterGroup key={group.key} label={group.label}>
                            <Segmented
                                value={hitFilters[group.key]}
                                onChange={next => setHitFilters(current => ({ ...current, [group.key]: next }))}
                                options={group.options}
                            />
                        </FilterGroup>
                    ))}
                    <span className="ml-auto flex items-center gap-2.5 text-xs text-(--soft-fg)">
                        {/* Two scopes, so two counts: the hit toggles narrow only the log, while the
                            rarity/boss toggles above also drive the summary tables. Reporting only the
                            pre-toggle figure claimed 559 hits above a grid showing 40. */}
                        <span>
                            {gridEntries.length === filteredEntries.length
                                ? `${filteredEntries.length} hits`
                                : `${gridEntries.length} of ${filteredEntries.length} hits`}
                            {' · '}
                            {bossRows.length} encounters (bombs excluded)
                        </span>
                        {hasHitFilters(hitFilters) && (
                            <Button
                                appearance="plain"
                                intent="primary"
                                size="extra-small"
                                onPress={() => setHitFilters(DEFAULT_HIT_FILTERS)}>
                                Clear
                            </Button>
                        )}
                    </span>
                </FilterBar>
            )}
            <BossRarityStatsTable rows={bossRows} hidePlayer={selectedPlayerId !== undefined} />
            <PlayerSummaryTextSection content={summaryContent} />
            {!isHistorical && (
                <HitGrid
                    data={currentData}
                    names={names}
                    label="Every hit"
                    avgDamageMap={avgDamageMap}
                    displayEntries={gridEntries}
                />
            )}
        </div>
    );
};
