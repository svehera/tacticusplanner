/* eslint-disable import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure */
import { useMemo, useState } from 'react';

import {
    TacticusDamageType,
    TacticusEncounterType,
    type TacticusGuildRaidEntry,
    type TacticusGuildRaidResponse,
} from '@/fsd/5-shared/lib/tacticus-api';
import { Rarity } from '@/fsd/5-shared/model';
import { RarityIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService } from '@/fsd/4-entities/character/characters.service';
import { MowsService } from '@/fsd/4-entities/mow/mows.service';

import { RaidTable } from '../guild-performance.components';
import {
    bossPrefixDisplayNames,
    bossPrefixRoundIconMap,
    computeDefaultRarities,
    getAvailableBossPrefixes,
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
    maxPlayerName: string;
    maxEntry: TacticusGuildRaidEntry;
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
            .map(g => {
                const bossPrefix = /^(GuildBoss\d+)/.exec(g.unitId)?.[1] ?? g.unitId;
                return {
                    unitId: g.unitId,
                    rarity: g.rarity,
                    set: g.set,
                    encounterIndex: g.encounterIndex,
                    encounterType: g.encounterType,
                    unitMaxHp: g.unitMaxHp,
                    bossPrefix,
                    avgDamage: g.avgCount > 0 ? Math.round(g.avgSum / g.avgCount) : 0,
                    maxDamage: g.maxEntry!.damageDealt,
                    maxPlayerName: names.get(g.maxEntry!.userId) ?? g.maxEntry!.userId,
                    maxEntry: g.maxEntry!,
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

function BossRarityStatRow({ row }: { row: BossRarityStatEntry }) {
    const heroes = row.maxEntry.heroDetails.map(u => CharactersService.getUnit(u.unitId)).filter(c => c !== undefined);
    const mow = row.maxEntry.machineOfWarDetails?.unitId
        ? MowsService.resolveToStatic(row.maxEntry.machineOfWarDetails.unitId)
        : undefined;
    return (
        <div className="grid grid-cols-[24px_20px_6rem_6rem_1fr_auto] items-center gap-x-2 rounded border border-gray-200 bg-white px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-900">
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
            <span className="min-w-0 truncate" title={row.maxEntry.userId}>
                {row.maxPlayerName}
            </span>
            <span className="flex items-center gap-0.5">
                {heroes.map((hero, index) => (
                    <UnitShardIcon
                        key={index}
                        icon={hero!.roundIcon ?? ''}
                        name={hero!.name}
                        tooltip={hero!.name}
                        width={22}
                        height={22}
                    />
                ))}
                {mow && (
                    <UnitShardIcon
                        icon={mow.roundIcon ?? ''}
                        name={mow.name}
                        tooltip={mow.name}
                        width={22}
                        height={22}
                    />
                )}
            </span>
        </div>
    );
}

const STAT_HEADER = (
    <div className="grid grid-cols-[24px_20px_6rem_6rem_1fr_auto] gap-x-2 px-2 text-xs font-semibold text-gray-500 uppercase">
        <span>Boss</span>
        <span />
        <span className="text-right">Avg Dmg</span>
        <span className="text-right">Max Dmg</span>
        <span>Best Player</span>
        <span>Comp</span>
    </div>
);

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
    if (byPlayer.size === 0) return '';

    const rows = [...byPlayer.values()].toSorted((a, b) => {
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

function PlayerSummaryTextSection({
    entries,
    names,
}: {
    entries: TacticusGuildRaidEntry[];
    names: Map<string, string>;
}) {
    const text = useMemo(() => buildPlayerSummaryText(entries, names), [entries, names]);
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

function BossRarityStatsTable({ entries, names }: { entries: TacticusGuildRaidEntry[]; names: Map<string, string> }) {
    const rows = useMemo(() => buildBossRarityStats(entries, names), [entries, names]);
    if (rows.length === 0) return <></>;

    const bossRows = rows.filter(row => row.encounterType === TacticusEncounterType.Boss);
    const primeRows = rows.filter(row => row.encounterType !== TacticusEncounterType.Boss);

    return (
        <div className="flex flex-col gap-6">
            {bossRows.length > 0 && (
                <section className="flex max-w-4xl flex-col gap-2">
                    <h2 className="text-base font-semibold">Season Summary — Bosses</h2>
                    {STAT_HEADER}
                    <div className="flex flex-col gap-1">
                        {bossRows.map(row => (
                            <BossRarityStatRow key={`${row.unitId}:${row.rarity}`} row={row} />
                        ))}
                    </div>
                </section>
            )}
            {primeRows.length > 0 && (
                <section className="flex max-w-4xl flex-col gap-2">
                    <h2 className="text-base font-semibold">Season Summary — Primes</h2>
                    {STAT_HEADER}
                    <div className="flex flex-col gap-1">
                        {primeRows.map(row => (
                            <BossRarityStatRow key={`${row.unitId}:${row.rarity}`} row={row} />
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
    historyData,
    names,
    avgDamageMap,
}: {
    currentData: TacticusGuildRaidResponse | undefined;
    historyData: TacticusGuildRaidResponse | undefined;
    names: Map<string, string>;
    avgDamageMap: Map<string, number>;
}) => {
    // --- season ---
    const availableSeasons = useMemo(() => {
        const s = new Set<number>();
        if (currentData?.season != undefined) s.add(currentData.season);
        if (historyData?.season != undefined) s.add(historyData.season);
        return [...s].toSorted((a, b) => b - a);
    }, [currentData, historyData]);

    const [seasonOverride, setSeasonOverride] = useState<number | undefined>();
    const selectedSeason = seasonOverride ?? availableSeasons[0];
    const selectedData = selectedSeason === historyData?.season ? historyData : currentData;
    const allSeasonEntries: TacticusGuildRaidEntry[] = useMemo(() => selectedData?.entries ?? [], [selectedData]);

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
        const seen = new Map<string, string>();
        for (const entry of rarityFilteredEntries) {
            if (!seen.has(entry.userId)) seen.set(entry.userId, names.get(entry.userId) ?? entry.userId);
        }
        return [...seen.entries()]
            .map(([userId, displayName]) => ({ userId, displayName }))
            .toSorted((a, b) => a.displayName.localeCompare(b.displayName));
    }, [rarityFilteredEntries, names]);

    const [selectedUserId, setSelectedUserId] = useState<string | undefined>();

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
                <PlayerSelect players={availablePlayers} value={selectedUserId} onChange={setSelectedUserId} />
                <RarityFilterGroup selected={selectedRarities} onChange={handleRarityChange} />
                <BossFilterGroup
                    available={availableBossPrefixes}
                    selected={effectiveBossPrefixes}
                    onChange={setSelectedBossPrefixes}
                />
            </div>
            <BossRarityStatsTable entries={filteredEntries} names={names} />
            {/* Text summary always shows every player's full activity for the season —
                independent of the boss/prime/rarity/player selections above. */}
            <PlayerSummaryTextSection entries={allSeasonEntries} names={names} />
            <RaidTable
                data={selectedData}
                names={names}
                label={`Season ${selectedSeason ?? '…'}`}
                avgDamageMap={avgDamageMap}
                displayEntries={filteredEntries}
            />
        </div>
    );
};
