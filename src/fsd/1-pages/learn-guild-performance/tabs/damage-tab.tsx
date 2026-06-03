/* eslint-disable import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure */
import { useMemo, useState } from 'react';

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
import { RarityIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService } from '@/fsd/4-entities/character/characters.service';

import { CompIcons, RaidTable } from '../guild-performance.components';
import {
    bossPrefixDisplayNames,
    bossPrefixRoundIconMap,
    computeDefaultRarities,
    getAvailableBossPrefixes,
    resolvePlayerName,
    unitRoundIconMap,
} from '../guild-performance.utils';

// ---------------------------------------------------------------------------
// Filter sub-components
// ---------------------------------------------------------------------------

const ALL_RARITIES: Rarity[] = [
    Rarity.Common,
    Rarity.Uncommon,
    Rarity.Rare,
    Rarity.Epic,
    Rarity.Legendary,
    Rarity.Mythic,
];

function SeasonSelect({
    seasons,
    value,
    onChange,
}: {
    seasons: number[];
    value: number | undefined;
    onChange: (season: number) => void;
}) {
    return (
        <label className="flex flex-col gap-0.5 text-xs">
            <span className="font-semibold text-gray-500 uppercase dark:text-gray-400">Season</span>
            <select
                value={value ?? ''}
                onChange={event => {
                    onChange(Number(event.target.value));
                }}
                className="rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-900">
                {seasons.map(s => (
                    <option key={s} value={s}>
                        Season {s}
                    </option>
                ))}
            </select>
        </label>
    );
}

function PlayerSelect({
    players,
    value,
    onChange,
}: {
    players: { userId: string; displayName: string }[];
    value: string | undefined;
    onChange: (userId: string | undefined) => void;
}) {
    return (
        <label className="flex flex-col gap-0.5 text-xs">
            <span className="font-semibold text-gray-500 uppercase dark:text-gray-400">Player</span>
            <select
                value={value ?? ''}
                onChange={event => {
                    onChange(event.target.value === '' ? undefined : event.target.value);
                }}
                className="rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-900">
                <option value="">All players</option>
                {players.map(p => (
                    <option key={p.userId} value={p.userId}>
                        {p.displayName}
                    </option>
                ))}
            </select>
        </label>
    );
}

function RarityFilterGroup({ selected, onChange }: { selected: Rarity[]; onChange: (rarities: Rarity[]) => void }) {
    const toggle = (r: Rarity) => {
        if (selected.includes(r) && selected.length === 1) return;
        onChange(selected.includes(r) ? selected.filter(x => x !== r) : [...selected, r]);
    };
    return (
        <div className="flex flex-col gap-0.5 text-xs">
            <span className="font-semibold text-gray-500 uppercase dark:text-gray-400">Rarity</span>
            <div className="flex gap-1">
                {ALL_RARITIES.map(r => (
                    <button
                        key={r}
                        type="button"
                        title={Rarity[r]}
                        onClick={() => {
                            toggle(r);
                        }}
                        className={[
                            'rounded border p-0.5 transition-colors',
                            selected.includes(r)
                                ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950'
                                : 'border-gray-200 bg-white hover:border-gray-400 dark:border-gray-700 dark:bg-gray-900',
                        ].join(' ')}>
                        <RarityIcon rarity={r} />
                    </button>
                ))}
            </div>
        </div>
    );
}

function BossFilterGroup({
    available,
    selected,
    onChange,
}: {
    available: string[];
    selected: string[];
    onChange: (prefixes: string[]) => void;
}) {
    if (available.length === 0) return <></>;
    const toggle = (prefix: string) => {
        if (selected.includes(prefix) && selected.length === 1) return;
        onChange(selected.includes(prefix) ? selected.filter(p => p !== prefix) : [...selected, prefix]);
    };
    return (
        <div className="flex flex-col gap-0.5 text-xs">
            <span className="font-semibold text-gray-500 uppercase dark:text-gray-400">Boss</span>
            <div className="flex flex-wrap gap-1">
                {available.map(prefix => {
                    const icon = bossPrefixRoundIconMap[prefix];
                    const name = bossPrefixDisplayNames[prefix] ?? prefix;
                    return (
                        <button
                            key={prefix}
                            type="button"
                            title={name}
                            onClick={() => {
                                toggle(prefix);
                            }}
                            className={[
                                'rounded border p-0.5 transition-colors',
                                selected.includes(prefix)
                                    ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950'
                                    : 'border-gray-200 bg-white hover:border-gray-400 dark:border-gray-700 dark:bg-gray-900',
                            ].join(' ')}>
                            {icon === undefined ? (
                                <span className="px-1">{name}</span>
                            ) : (
                                <UnitShardIcon icon={icon} name={name} tooltip={name} width={24} height={24} />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

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
            g.maxEntry = entry;
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
                    maxPlayerName: names.get(maxEntry.userId) ?? maxEntry.userId,
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
    return {
        unitId: enemyId,
        rarity: RarityMapper.stringToNumber[rarity],
        set: 0,
        encounterIndex,
        encounterType: encounterIndex === 0 ? TacticusEncounterType.Boss : TacticusEncounterType.SideBoss,
        unitMaxHp: maxHp,
        bossPrefix: /^(GuildBoss\d+)/.exec(enemyId)?.[1] ?? enemyId,
        avgDamage: Math.round(averageDamageWithoutKills),
        maxDamage,
        maxPlayerId: playerId,
        maxPlayerName: resolvePlayerName(playerId, names),
        comp,
    };
}

/** Sort matching the live summary: highest rarity first, then largest enemy, then boss before primes. */
function compareSummaryStatRows(a: BossRarityStatEntry, b: BossRarityStatEntry): number {
    if (a.rarity !== b.rarity) return b.rarity - a.rarity;
    if (a.unitMaxHp !== b.unitMaxHp) return b.unitMaxHp - a.unitMaxHp;
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

function StatBossIcon({ unitId }: { unitId: string }) {
    const mappedIcon = unitRoundIconMap[unitId];
    if (mappedIcon !== undefined)
        return <UnitShardIcon icon={mappedIcon} name={unitId} tooltip={unitId} width={28} height={28} />;
    const match = /(?:MiniBoss|Minion)\d+(.+)/.exec(unitId);
    if (match) {
        const id = match[1].charAt(0).toLowerCase() + match[1].slice(1);
        const character = CharactersService.getUnit(id);
        if (character)
            return (
                <UnitShardIcon
                    icon={character.roundIcon ?? ''}
                    name={character.name}
                    tooltip={character.name}
                    width={28}
                    height={28}
                />
            );
    }
    return <span className="text-xs text-gray-500">{unitId}</span>;
}

function BossRarityStatRow({ row, hidePlayer }: { row: BossRarityStatEntry; hidePlayer: boolean }) {
    const cols = hidePlayer ? 'grid-cols-[24px_20px_6rem_6rem_auto]' : 'grid-cols-[24px_20px_6rem_6rem_1fr_auto]';
    return (
        <div
            className={`grid ${cols} items-center gap-x-2 rounded border border-gray-200 bg-white px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-900`}>
            <span className="flex items-center justify-center">
                <StatBossIcon unitId={row.unitId} />
            </span>
            <span className="flex items-center justify-center">
                <RarityIcon rarity={row.rarity} />
            </span>
            <span className="text-right text-gray-500 tabular-nums dark:text-gray-400">
                {row.avgDamage > 0 ? row.avgDamage.toLocaleString() : '—'}
            </span>
            <span className="text-right font-semibold tabular-nums">{row.maxDamage.toLocaleString()}</span>
            {!hidePlayer && (
                <span className="min-w-0 truncate" title={row.maxPlayerId}>
                    {row.maxPlayerName}
                </span>
            )}
            <CompIcons comp={row.comp} />
        </div>
    );
}

function StatHeader({ hidePlayer }: { hidePlayer: boolean }) {
    const cols = hidePlayer ? 'grid-cols-[24px_20px_6rem_6rem_auto]' : 'grid-cols-[24px_20px_6rem_6rem_1fr_auto]';
    return (
        <div className={`grid ${cols} gap-x-2 px-2 text-xs font-semibold text-gray-500 uppercase`}>
            <span>Boss</span>
            <span />
            <span className="text-right">Avg Dmg</span>
            <span className="text-right">Max Dmg</span>
            {!hidePlayer && <span>Best Player</span>}
            <span>Comp</span>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Per-player text summary (copyable TSV)
// ---------------------------------------------------------------------------

interface PlayerSummaryStats {
    userId: string;
    displayName: string;
    tokens: number;
    bombs: number;
    primeHits: number;
    bossKills: number;
    totalDamage: number;
    maxDamage: number;
    maxTargetUnitId: string;
    maxTargetRarity: Rarity;
    maxTargetIsBoss: boolean;
}

function unitDisplayName(unitId: string, rarity: Rarity, isBoss: boolean): string {
    const prefix = /^(GuildBoss\d+)/.exec(unitId)?.[1];
    const familyName = prefix === undefined ? unitId : (bossPrefixDisplayNames[prefix] ?? unitId);
    const role = isBoss ? '' : ' prime';
    return `${familyName}${role} (${Rarity[rarity]})`;
}

function formatCompactNumber(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1000) return Math.round(n / 1000) + 'k';
    return n.toString();
}

function buildPlayerSummaryText(entries: TacticusGuildRaidEntry[], names: Map<string, string>): string {
    const byPlayer = new Map<string, PlayerSummaryStats>();
    for (const entry of entries) {
        let stats = byPlayer.get(entry.userId);
        if (stats === undefined) {
            stats = {
                userId: entry.userId,
                displayName: names.get(entry.userId) ?? entry.userId,
                tokens: 0,
                bombs: 0,
                primeHits: 0,
                bossKills: 0,
                totalDamage: 0,
                maxDamage: 0,
                maxTargetUnitId: '',
                maxTargetRarity: Rarity.Common,
                maxTargetIsBoss: true,
            };
            byPlayer.set(entry.userId, stats);
        }
        const isBomb = entry.damageType === TacticusDamageType.Bomb;
        const isBoss = entry.encounterType === TacticusEncounterType.Boss;
        if (isBomb) {
            stats.bombs++;
        } else {
            stats.tokens++;
            if (isBoss) {
                if (entry.remainingHp === 0) stats.bossKills++;
            } else {
                stats.primeHits++;
            }
        }
        stats.totalDamage += entry.damageDealt;
        if (entry.damageDealt > stats.maxDamage) {
            stats.maxDamage = entry.damageDealt;
            stats.maxTargetUnitId = entry.unitId;
            stats.maxTargetRarity = entry.rarity;
            stats.maxTargetIsBoss = isBoss;
        }
    }
    return formatPlayerSummaryRows([...byPlayer.values()]);
}

/**
 * Per-player season totals from a historical aggregate. Note `totalDamage` here is boss token
 * damage only (the backend excludes primes and bombs from this figure), unlike the live-season
 * total which sums every hit.
 */
function buildPlayerSummaryTextFromSummary(
    summary: GuildSeasonSummary,
    names: Map<string, string>,
    playerId?: string
): string {
    const playerData =
        playerId === undefined
            ? summary.damageSummary.textData.playerData
            : summary.damageSummary.textData.playerData.filter(player => player.playerId === playerId);
    const statsList = playerData.map((player): PlayerSummaryStats => {
        const target = player.maxDamageTarget;
        return {
            userId: player.playerId ?? '',
            displayName: resolvePlayerName(player.playerId, names),
            tokens: player.tokens,
            bombs: player.bombs,
            primeHits: player.primeHits,
            bossKills: player.bossKillHits,
            totalDamage: player.totalDamage,
            maxDamage: player.maxDamage,
            maxTargetUnitId: target?.enemyId ?? '',
            maxTargetRarity: target ? RarityMapper.stringToNumber[target.rarity] : Rarity.Common,
            maxTargetIsBoss: target ? target.encounterIndex === 0 : true,
        };
    });
    return formatPlayerSummaryRows(statsList);
}

/** Renders the per-player stats as a copyable, fixed-width TSV (sorted by display name). */
function formatPlayerSummaryRows(statsList: PlayerSummaryStats[]): string {
    if (statsList.length === 0) return '';

    const rows = statsList.toSorted((a, b) => {
        const cmp = a.displayName.localeCompare(b.displayName);
        return cmp === 0 ? a.userId.localeCompare(b.userId) : cmp;
    });

    const separator = '\t';
    const header = [
        'Player  ',
        'Tokens',
        'Bombs',
        'Prime Hits',
        'Boss Kills',
        'Total Damage',
        'Max Damage',
        'Max Target',
    ].join(separator);
    const lines = rows.map(stats => {
        const displayName =
            stats.displayName.length > 15 ? stats.displayName.slice(0, 15) : stats.displayName.padEnd(8);
        return [
            displayName,
            stats.tokens,
            stats.bombs,
            formatCompactNumber(stats.primeHits).padEnd(8).slice(0, 15),
            formatCompactNumber(stats.bossKills).padEnd(8).slice(0, 15),
            formatCompactNumber(stats.totalDamage).padEnd(8).slice(0, 15),
            formatCompactNumber(stats.maxDamage).padEnd(8).slice(0, 15),
            unitDisplayName(stats.maxTargetUnitId, stats.maxTargetRarity, stats.maxTargetIsBoss).padEnd(8).slice(0, 15),
        ].join(separator);
    });
    return [header, ...lines].join('\n');
}

function PlayerSummaryTextSection({ text }: { text: string }) {
    if (text === '') return <></>;
    return (
        <details className="max-w-4xl rounded border border-gray-200 dark:border-gray-700">
            <summary className="cursor-pointer px-3 py-2 text-base font-semibold select-none">
                Season Summary — Text
            </summary>
            <div className="border-t border-gray-200 px-3 py-2 dark:border-gray-700">
                <pre className="max-h-96 overflow-auto font-mono text-xs whitespace-pre">{text}</pre>
            </div>
        </details>
    );
}

function BossRarityStatsTable({ rows, hidePlayer }: { rows: BossRarityStatEntry[]; hidePlayer: boolean }) {
    if (rows.length === 0) return <></>;

    const bossRows = rows.filter(row => row.encounterType === TacticusEncounterType.Boss);
    const primeRows = rows.filter(row => row.encounterType !== TacticusEncounterType.Boss);

    return (
        <div className="flex flex-col gap-6">
            {bossRows.length > 0 && (
                <section className="flex max-w-4xl flex-col gap-2">
                    <h2 className="text-base font-semibold">Season Summary — Bosses</h2>
                    <StatHeader hidePlayer={hidePlayer} />
                    <div className="flex flex-col gap-1">
                        {bossRows.map(row => (
                            <BossRarityStatRow
                                key={`${row.unitId}:${row.rarity}:${row.encounterIndex}`}
                                row={row}
                                hidePlayer={hidePlayer}
                            />
                        ))}
                    </div>
                </section>
            )}
            {primeRows.length > 0 && (
                <section className="flex max-w-4xl flex-col gap-2">
                    <h2 className="text-base font-semibold">Season Summary — Primes</h2>
                    <StatHeader hidePlayer={hidePlayer} />
                    <div className="flex flex-col gap-1">
                        {primeRows.map(row => (
                            <BossRarityStatRow
                                key={`${row.unitId}:${row.rarity}:${row.encounterIndex}`}
                                row={row}
                                hidePlayer={hidePlayer}
                            />
                        ))}
                    </div>
                </section>
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
    memberUserId,
}: {
    currentData: TacticusGuildRaidResponse | undefined;
    seasonHistory?: GuildSeasonHistoryResponse;
    names: Map<string, string>;
    avgDamageMap: Map<string, number>;
    /** When set (a keyless member), the view is pinned to this player and the player select is hidden. */
    memberUserId?: string;
}) => {
    // --- season ---
    const availableSeasons = useMemo(() => {
        const s = new Set<number>();
        if (currentData?.season != undefined) s.add(currentData.season);
        for (const season of seasonHistory?.seasonData ?? []) s.add(season.season);
        return [...s].toSorted((a, b) => b - a);
    }, [currentData, seasonHistory]);

    const [seasonOverride, setSeasonOverride] = useState<number | undefined>();
    const selectedSeason = seasonOverride ?? availableSeasons[0];

    // A historical season renders from the aggregated summary; the live (current) season renders
    // from raw per-hit entries. Only the live season has filters and the per-hit raid/bomb table.
    const historySummary = useMemo(
        () =>
            selectedSeason === currentData?.season
                ? undefined
                : seasonHistory?.seasonData.find(season => season.season === selectedSeason),
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

    // --- player ---
    const availablePlayers = useMemo(() => {
        // Historical: list named players (anonymized rows have no id, so they aren't selectable).
        if (historySummary) {
            const named: { userId: string; displayName: string }[] = [];
            for (const player of historySummary.damageSummary.textData.playerData) {
                if (player.playerId === undefined) continue;
                named.push({ userId: player.playerId, displayName: resolvePlayerName(player.playerId, names) });
            }
            return named.toSorted((a, b) => a.displayName.localeCompare(b.displayName));
        }
        const seen = new Map<string, string>();
        for (const entry of rarityFilteredEntries) {
            if (!seen.has(entry.userId)) seen.set(entry.userId, names.get(entry.userId) ?? entry.userId);
        }
        return [...seen.entries()]
            .map(([userId, displayName]) => ({ userId, displayName }))
            .toSorted((a, b) => a.displayName.localeCompare(b.displayName));
    }, [historySummary, rarityFilteredEntries, names]);

    const [selectedUserId, setSelectedUserId] = useState<string | undefined>();
    // A member is locked to their own rows; otherwise the dropdown drives the selection.
    const effectiveUserId = memberUserId ?? selectedUserId;

    // --- final filtered set ---
    const filteredEntries = useMemo(
        () =>
            rarityFilteredEntries
                .filter(entry => selectedUserId === undefined || entry.userId === selectedUserId)
                .filter(
                    entry =>
                        effectiveBossPrefixes.length === 0 ||
                        effectiveBossPrefixes.some(prefix => entry.unitId.startsWith(prefix))
                ),
        [rarityFilteredEntries, selectedUserId, effectiveBossPrefixes]
    );

    // --- summary view models (per source) ---
    // Historical: with a player selected, show that player's own per-enemy stats and single text row;
    // otherwise the guild-wide rollup. Live: the existing per-hit aggregation.
    const bossRows = useMemo(() => {
        if (historySummary) {
            return effectiveUserId === undefined
                ? buildBossRarityStatsFromSummary(historySummary, names)
                : buildPlayerBossRarityStatsFromSummary(historySummary, effectiveUserId, names);
        }
        return buildBossRarityStats(filteredEntries, names);
    }, [historySummary, effectiveUserId, filteredEntries, names]);

    const summaryText = useMemo(() => {
        if (historySummary) {
            return buildPlayerSummaryTextFromSummary(historySummary, names, effectiveUserId);
        }
        return buildPlayerSummaryText(effectiveUserId === undefined ? allSeasonEntries : filteredEntries, names);
    }, [historySummary, effectiveUserId, allSeasonEntries, filteredEntries, names]);

    // cascade-reset dependent filters when upstream changes
    const handleSeasonChange = (season: number) => {
        setSeasonOverride(season);
        setRarityOverride(undefined);
        setSelectedBossPrefixes(undefined);
        setSelectedUserId(undefined);
    };

    const handleRarityChange = (rarities: Rarity[]) => {
        setRarityOverride(rarities);
        setSelectedBossPrefixes(undefined);
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end gap-4 border-b border-gray-200 pb-3 dark:border-gray-700">
                <SeasonSelect seasons={availableSeasons} value={selectedSeason} onChange={handleSeasonChange} />
                {/* A keyless member only sees their own data, so the player select is hidden for them. */}
                {memberUserId === undefined && (
                    <PlayerSelect players={availablePlayers} value={selectedUserId} onChange={setSelectedUserId} />
                )}
                {/* Rarity/Boss filters and the per-hit raid table need per-hit data, so they are
                    live-season only for now; historical seasons support the player filter via the
                    aggregated per-player summaries. */}
                {!isHistorical && (
                    <>
                        <RarityFilterGroup selected={selectedRarities} onChange={handleRarityChange} />
                        <BossFilterGroup
                            available={availableBossPrefixes}
                            selected={effectiveBossPrefixes}
                            onChange={setSelectedBossPrefixes}
                        />
                    </>
                )}
            </div>
            <BossRarityStatsTable rows={bossRows} hidePlayer={effectiveUserId !== undefined} />
            <PlayerSummaryTextSection text={summaryText} />
            {!isHistorical && (
                <RaidTable
                    data={currentData}
                    names={names}
                    label={`Season ${selectedSeason ?? '…'}`}
                    avgDamageMap={avgDamageMap}
                    displayEntries={filteredEntries}
                />
            )}
        </div>
    );
};
