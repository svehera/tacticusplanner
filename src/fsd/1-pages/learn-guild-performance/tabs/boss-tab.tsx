/* eslint-disable import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure */
import { useMemo, useState } from 'react';

import {
    TacticusDamageType,
    TacticusEncounterType,
    type GuildSeasonBossLeaderboardEntry,
    type GuildSeasonHistoryResponse,
    type GuildSeasonSummary,
    type TacticusGuildRaidEntry,
    type TacticusGuildRaidResponse,
} from '@/fsd/5-shared/lib/tacticus-api';
import { Rarity, RarityMapper } from '@/fsd/5-shared/model';
import { RarityIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService } from '@/fsd/4-entities/character/characters.service';

import { CompIcons } from '../guild-performance.components';
import {
    bossPrefixDisplayNames,
    bossPrefixRoundIconMap,
    computeDefaultRaritiesFromRarities,
    getAvailableBossPrefixes,
    getBossPrefix,
    resolvePlayerName,
    sortBossPrefixes,
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

function NumberInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
    return (
        <label className="flex flex-col gap-0.5 text-xs">
            <span className="font-semibold text-gray-500 uppercase dark:text-gray-400">{label}</span>
            <input
                type="number"
                min={1}
                max={10}
                value={value}
                onChange={event => {
                    const v = Math.max(1, Math.min(10, Number.parseInt(event.target.value, 10) || 1));
                    onChange(v);
                }}
                className="w-16 rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-900"
            />
        </label>
    );
}

// ---------------------------------------------------------------------------
// Leaderboard data model + logic
// ---------------------------------------------------------------------------

interface LeaderboardEntry {
    /** Undefined when anonymized (another member in a keyless member's view). */
    userId?: string;
    displayName: string;
    damage: number;
    /** Hero unitIds followed by the machine-of-war unitId (if any). Empty when anonymized. */
    comp: string[];
}

interface PrimeSlot {
    unitId: string;
    encounterIndex: number;
    entries: LeaderboardEntry[];
}

interface BossGroup {
    bossPrefix: string;
    bossUnitId: string;
    rarity: Rarity;
    /** entry.set — used for sort order within same rarity */
    set: number;
    bossEntries: LeaderboardEntry[];
    primeSlots: PrimeSlot[];
}

/** Top N hits at (unitId, rarity[, encounterIndex]), sorted by damage desc. A player may appear multiple times. */
function buildTopN(
    entries: TacticusGuildRaidEntry[],
    unitId: string,
    rarity: Rarity,
    names: Map<string, string>,
    maxCount: number,
    encounterIndex?: number
): LeaderboardEntry[] {
    return entries
        .filter(entry => {
            if (entry.unitId !== unitId || entry.rarity !== rarity) return false;
            if (encounterIndex !== undefined && entry.encounterIndex !== encounterIndex) return false;
            if (entry.damageType === TacticusDamageType.Bomb) return false;
            return true;
        })
        .toSorted((a, b) => b.damageDealt - a.damageDealt)
        .slice(0, maxCount)
        .map(entry => ({
            userId: entry.userId,
            displayName: names.get(entry.userId) ?? entry.userId,
            damage: entry.damageDealt,
            comp: [
                ...entry.heroDetails.map(hero => hero.unitId),
                ...(entry.machineOfWarDetails ? [entry.machineOfWarDetails.unitId] : []),
            ],
        }));
}

/** Maps aggregated leaderboard entries (historical seasons) into {@link LeaderboardEntry} rows. */
function toLeaderboardEntries(
    entries: GuildSeasonBossLeaderboardEntry[],
    names: Map<string, string>
): LeaderboardEntry[] {
    return entries.map(entry => ({
        userId: entry.playerId,
        displayName: resolvePlayerName(entry.playerId, names),
        damage: entry.damage,
        comp: entry.comp,
    }));
}

function buildLeaderboardGroups(
    entries: TacticusGuildRaidEntry[],
    selectedBossPrefixes: string[],
    names: Map<string, string>,
    bossTopN: number,
    primeTopN: number
): BossGroup[] {
    type BossSlot = { unitId: string; set: number; rarity: Rarity; bossPrefix: string };
    const bossSlots = new Map<string, BossSlot>();

    for (const entry of entries) {
        if (entry.encounterType !== TacticusEncounterType.Boss) continue;
        if (entry.damageType === TacticusDamageType.Bomb) continue;
        const bossPrefix = /^(GuildBoss\d+)/.exec(entry.unitId)?.[1] ?? entry.unitId;
        if (selectedBossPrefixes.length > 0 && !selectedBossPrefixes.includes(bossPrefix)) continue;
        // Key = bossPrefix:rarity so each boss family+rarity gets one leaderboard
        const key = `${bossPrefix}:${entry.rarity}`;
        if (!bossSlots.has(key))
            bossSlots.set(key, { unitId: entry.unitId, set: entry.set, rarity: entry.rarity, bossPrefix });
    }

    // Prime slots: keyed by bossPrefix:rarity, then by prime unitId:encounterIndex
    const primeSlotMap = new Map<string, Map<string, { unitId: string; encounterIndex: number }>>();
    for (const entry of entries) {
        if (entry.encounterType !== TacticusEncounterType.SideBoss) continue;
        if (entry.damageType === TacticusDamageType.Bomb) continue;
        const bossPrefix = /^(GuildBoss\d+)/.exec(entry.unitId)?.[1] ?? entry.unitId;
        if (selectedBossPrefixes.length > 0 && !selectedBossPrefixes.includes(bossPrefix)) continue;
        const groupKey = `${bossPrefix}:${entry.rarity}`;
        let group = primeSlotMap.get(groupKey);
        if (group === undefined) {
            group = new Map();
            primeSlotMap.set(groupKey, group);
        }
        const slotKey = `${entry.unitId}:${entry.encounterIndex}`;
        if (!group.has(slotKey)) group.set(slotKey, { unitId: entry.unitId, encounterIndex: entry.encounterIndex });
    }

    const groups: BossGroup[] = [];
    for (const [groupKey, slot] of bossSlots) {
        const primeSlots = [...(primeSlotMap.get(groupKey)?.values() ?? [])]
            .toSorted((a, b) => a.encounterIndex - b.encounterIndex)
            .map(ps => ({
                unitId: ps.unitId,
                encounterIndex: ps.encounterIndex,
                entries: buildTopN(entries, ps.unitId, slot.rarity, names, primeTopN, ps.encounterIndex),
            }))
            .filter(ps => ps.entries.length > 0);
        groups.push({
            bossPrefix: slot.bossPrefix,
            bossUnitId: slot.unitId,
            rarity: slot.rarity,
            set: slot.set,
            bossEntries: buildTopN(entries, slot.unitId, slot.rarity, names, bossTopN),
            primeSlots,
        });
    }

    // Sort: rarity desc, then set desc
    return groups.toSorted((a, b) => {
        if (a.rarity !== b.rarity) return b.rarity - a.rarity;
        return b.set - a.set;
    });
}

/**
 * Reconstructs leaderboard groups from a historical season aggregate. Each leaderboard is already
 * the top-5 single hits for one enemy (boss or prime, top-2 rarities only); we re-group a boss with
 * its primes by GuildBoss{N} prefix + rarity. `bossTopN`/`primeTopN` can only trim the stored five.
 */
function buildLeaderboardGroupsFromSummary(
    summary: GuildSeasonSummary,
    selectedRarities: Rarity[],
    selectedBossPrefixes: string[],
    names: Map<string, string>,
    bossTopN: number,
    primeTopN: number
): BossGroup[] {
    interface GroupAccumulator {
        bossPrefix: string;
        rarity: Rarity;
        bossUnitId: string;
        bossMaxHp: number;
        bossEntries: LeaderboardEntry[];
        primeSlots: PrimeSlot[];
    }
    const groups = new Map<string, GroupAccumulator>();

    for (const board of summary.leaderboards) {
        const { enemyId, rarity: rarityName, encounterIndex, maxHp } = board.enemyInfo;
        const rarity = RarityMapper.stringToNumber[rarityName];
        if (!selectedRarities.includes(rarity)) continue;
        const bossPrefix = getBossPrefix(enemyId);
        if (selectedBossPrefixes.length > 0 && !selectedBossPrefixes.includes(bossPrefix)) continue;

        const key = `${bossPrefix}:${rarity}`;
        let group = groups.get(key);
        if (group === undefined) {
            group = { bossPrefix, rarity, bossUnitId: '', bossMaxHp: 0, bossEntries: [], primeSlots: [] };
            groups.set(key, group);
        }
        const entries = toLeaderboardEntries(board.entries, names);
        if (encounterIndex === 0) {
            group.bossUnitId = enemyId;
            group.bossMaxHp = maxHp;
            group.bossEntries = entries.slice(0, bossTopN);
        } else {
            group.primeSlots.push({ unitId: enemyId, encounterIndex, entries: entries.slice(0, primeTopN) });
        }
    }

    return [...groups.values()]
        .map(group => ({
            bossPrefix: group.bossPrefix,
            bossUnitId: group.bossUnitId,
            rarity: group.rarity,
            // No `set` in the aggregate; sort within a rarity by boss max HP (biggest first) instead.
            set: group.bossMaxHp,
            bossEntries: group.bossEntries,
            primeSlots: group.primeSlots
                .toSorted((a, b) => a.encounterIndex - b.encounterIndex)
                .filter(prime => prime.entries.length > 0),
        }))
        .toSorted((a, b) => {
            if (a.rarity !== b.rarity) return b.rarity - a.rarity;
            return b.set - a.set;
        });
}

// ---------------------------------------------------------------------------
/**
 * Given a GuildBoss unit ID, returns the best display name:
 * - For main bosses: uses the boss family name from bossPrefixDisplayNames
 * - For primes/minions: extracts the last two CamelCase words (the snowprint ID),
 *   looks up the character, and returns their shortName if found, otherwise the
 *   last-two-words string, otherwise the raw unitId.
 */
function unitDisplayLabel(unitId: string): string {
    const bossPrefix = /^(GuildBoss\d+)/.exec(unitId)?.[1];

    // Prime/minion: strip the leading GuildBoss{N}(MiniBoss|Minion){N} part
    const primeMatch = /(?:MiniBoss|Minion)\d+(.+)/.exec(unitId);
    if (primeMatch) {
        const tail = primeMatch[1]; // e.g. "EldarAutarch", "TyranWarriorLeviathan", "ThousInfernalMaster"
        const snowprintId = tail.charAt(0).toLowerCase() + tail.slice(1);
        const character = CharactersService.getUnit(snowprintId);
        if (character) return character.shortName;
        // Fallback: split CamelCase into readable words
        return tail.split(/(?=[A-Z])/).join(' ');
    }

    // Main boss: use boss family name
    if (bossPrefix !== undefined) return bossPrefixDisplayNames[bossPrefix] ?? unitId;

    return unitId;
}

function MedalBadge({ rank }: { rank: number }) {
    if (rank === 1) return <span className="text-base leading-none">🥇</span>;
    if (rank === 2) return <span className="text-base leading-none">🥈</span>;
    if (rank === 3) return <span className="text-base leading-none">🥉</span>;
    return <span className="w-5 text-center text-xs text-gray-500 tabular-nums">{rank}</span>;
}

function UnitIcon({ unitId }: { unitId: string }) {
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

function LeaderboardRow({ rank, entry }: { rank: number; entry: LeaderboardEntry }) {
    return (
        <div className="grid grid-cols-[1.5rem_minmax(0,8rem)_auto_4.5rem] items-center gap-x-1.5 px-2 py-1 text-sm even:bg-gray-50 dark:even:bg-gray-800/40">
            <span className="flex items-center justify-center">
                <MedalBadge rank={rank} />
            </span>
            <span className="min-w-0 truncate font-medium" title={entry.userId}>
                {entry.displayName}
            </span>
            <CompIcons comp={entry.comp} size={20} />
            <span className="text-right font-semibold tabular-nums">{entry.damage.toLocaleString()}</span>
        </div>
    );
}

function LeaderboardCard({ unitId, rarity, entries }: { unitId: string; rarity: Rarity; entries: LeaderboardEntry[] }) {
    if (entries.length === 0) return <></>;
    const displayName = unitDisplayLabel(unitId);
    return (
        <div className="w-[28rem] shrink-0 overflow-hidden rounded border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-2 py-1.5 dark:border-gray-700 dark:bg-gray-800">
                <UnitIcon unitId={unitId} />
                <RarityIcon rarity={rarity} />
                <span className="text-sm font-semibold">{displayName}</span>
            </div>
            <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
                {entries.map((entry, index) => (
                    <LeaderboardRow key={index} rank={index + 1} entry={entry} />
                ))}
            </div>
        </div>
    );
}

function BossGroupSection({ group }: { group: BossGroup }) {
    const leftPrime = group.primeSlots[0];
    const rightPrime = group.primeSlots[1];
    const extraPrimes = group.primeSlots.slice(2);
    return (
        <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-start">
            {/* Boss: first on narrow, center on wide */}
            <div className="order-1 2xl:order-2">
                <LeaderboardCard unitId={group.bossUnitId} rarity={group.rarity} entries={group.bossEntries} />
            </div>
            {/* Left prime: second on narrow, left on wide */}
            {leftPrime !== undefined && (
                <div className="order-2 2xl:order-1">
                    <LeaderboardCard unitId={leftPrime.unitId} rarity={group.rarity} entries={leftPrime.entries} />
                </div>
            )}
            {/* Right prime: third on narrow, right on wide */}
            {rightPrime !== undefined && (
                <div className="order-3 2xl:order-3">
                    <LeaderboardCard unitId={rightPrime.unitId} rarity={group.rarity} entries={rightPrime.entries} />
                </div>
            )}
            {extraPrimes.map(prime => (
                <LeaderboardCard
                    key={`${prime.unitId}:${prime.encounterIndex}`}
                    unitId={prime.unitId}
                    rarity={group.rarity}
                    entries={prime.entries}
                />
            ))}
        </div>
    );
}

// ---------------------------------------------------------------------------
// LeaderboardTab
// ---------------------------------------------------------------------------

export const LeaderboardTab = ({
    currentData,
    seasonHistory,
    names,
}: {
    currentData: TacticusGuildRaidResponse | undefined;
    seasonHistory?: GuildSeasonHistoryResponse;
    names: Map<string, string>;
}) => {
    // --- season ---
    const availableSeasons = useMemo(() => {
        const s = new Set<number>();
        if (currentData?.season !== undefined) s.add(currentData.season);
        for (const season of seasonHistory?.seasonData ?? []) s.add(season.season);
        return [...s].toSorted((a, b) => b - a);
    }, [currentData, seasonHistory]);

    const [seasonOverride, setSeasonOverride] = useState<number | undefined>();
    const selectedSeason = seasonOverride ?? availableSeasons[0];

    // A historical season builds its leaderboards from the aggregated top-5s; the live season builds
    // them from raw per-hit entries.
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
    const raritiesPresent = useMemo<Rarity[]>(
        () =>
            historySummary
                ? [
                      ...new Set(
                          historySummary.leaderboards.map(board => RarityMapper.stringToNumber[board.enemyInfo.rarity])
                      ),
                  ]
                : allSeasonEntries.map(entry => entry.rarity),
        [historySummary, allSeasonEntries]
    );
    const defaultRarities = useMemo(() => computeDefaultRaritiesFromRarities(raritiesPresent), [raritiesPresent]);
    const [rarityOverride, setRarityOverride] = useState<Rarity[] | undefined>();
    const selectedRarities = rarityOverride ?? defaultRarities;

    const rarityFilteredEntries = useMemo(
        () => allSeasonEntries.filter(entry => selectedRarities.includes(entry.rarity)),
        [allSeasonEntries, selectedRarities]
    );

    // --- boss ---
    const availableBossPrefixes = useMemo(() => {
        if (historySummary) {
            return sortBossPrefixes(
                historySummary.leaderboards
                    .filter(board => selectedRarities.includes(RarityMapper.stringToNumber[board.enemyInfo.rarity]))
                    .map(board => getBossPrefix(board.enemyInfo.enemyId))
            );
        }
        return getAvailableBossPrefixes(rarityFilteredEntries);
    }, [historySummary, selectedRarities, rarityFilteredEntries]);
    const [selectedBossPrefixes, setSelectedBossPrefixes] = useState<string[] | undefined>();
    const effectiveBossPrefixes = selectedBossPrefixes ?? availableBossPrefixes;

    // --- leaderboard sizes ---
    const [bossTopN, setBossTopN] = useState(5);
    const [primeTopN, setPrimeTopN] = useState(3);

    // cascade-reset on season/rarity change
    const handleSeasonChange = (season: number) => {
        setSeasonOverride(season);
        setRarityOverride(undefined);
        setSelectedBossPrefixes(undefined);
    };
    const handleRarityChange = (rarities: Rarity[]) => {
        setRarityOverride(rarities);
        setSelectedBossPrefixes(undefined);
    };

    // --- groups ---
    const groups = useMemo(
        () =>
            historySummary
                ? buildLeaderboardGroupsFromSummary(
                      historySummary,
                      selectedRarities,
                      effectiveBossPrefixes,
                      names,
                      bossTopN,
                      primeTopN
                  )
                : buildLeaderboardGroups(rarityFilteredEntries, effectiveBossPrefixes, names, bossTopN, primeTopN),
        [historySummary, selectedRarities, rarityFilteredEntries, effectiveBossPrefixes, names, bossTopN, primeTopN]
    );

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end gap-4 border-b border-gray-200 pb-3 dark:border-gray-700">
                <SeasonSelect seasons={availableSeasons} value={selectedSeason} onChange={handleSeasonChange} />
                <RarityFilterGroup selected={selectedRarities} onChange={handleRarityChange} />
                <BossFilterGroup
                    available={availableBossPrefixes}
                    selected={effectiveBossPrefixes}
                    onChange={setSelectedBossPrefixes}
                />
                {/* Historical leaderboards are pre-capped at top-5 server-side, so top-N is live-only. */}
                {!isHistorical && (
                    <>
                        <NumberInput label="Boss top N" value={bossTopN} onChange={setBossTopN} />
                        <NumberInput label="Prime top N" value={primeTopN} onChange={setPrimeTopN} />
                    </>
                )}
            </div>
            {groups.length === 0 ? (
                <p className="text-sm text-gray-400">No data for selected filters.</p>
            ) : (
                <div className="flex flex-col gap-8">
                    {groups.map(group => (
                        <BossGroupSection key={`${group.bossPrefix}:${group.rarity}`} group={group} />
                    ))}
                </div>
            )}
        </div>
    );
};

/** @deprecated Use LeaderboardTab */
export const BossTab = LeaderboardTab;
