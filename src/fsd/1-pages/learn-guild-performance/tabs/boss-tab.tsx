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
    userId: string;
    displayName: string;
    damage: number;
    raw: TacticusGuildRaidEntry;
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
            raw: entry,
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
    const heroes = entry.raw.heroDetails.map(u => CharactersService.getUnit(u.unitId)).filter(c => c !== undefined);
    const mow = entry.raw.machineOfWarDetails?.unitId
        ? MowsService.resolveToStatic(entry.raw.machineOfWarDetails.unitId)
        : undefined;
    return (
        <div className="grid grid-cols-[1.5rem_minmax(0,8rem)_auto_4.5rem] items-center gap-x-1.5 px-2 py-1 text-sm even:bg-gray-50 dark:even:bg-gray-800/40">
            <span className="flex items-center justify-center">
                <MedalBadge rank={rank} />
            </span>
            <span className="min-w-0 truncate font-medium" title={entry.userId}>
                {entry.displayName}
            </span>
            <span className="flex items-center gap-0.5">
                {heroes.map((hero, index) => (
                    <UnitShardIcon
                        key={index}
                        icon={hero!.roundIcon ?? ''}
                        name={hero!.name}
                        tooltip={hero!.name}
                        width={20}
                        height={20}
                    />
                ))}
                {mow && (
                    <UnitShardIcon
                        icon={mow.roundIcon ?? ''}
                        name={mow.name}
                        tooltip={mow.name}
                        width={20}
                        height={20}
                    />
                )}
            </span>
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
                    <LeaderboardRow key={entry.userId} rank={index + 1} entry={entry} />
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
    historyData,
    names,
}: {
    currentData: TacticusGuildRaidResponse | undefined;
    historyData: TacticusGuildRaidResponse | undefined;
    names: Map<string, string>;
}) => {
    // --- season ---
    const availableSeasons = useMemo(() => {
        const s = new Set<number>();
        if (currentData?.season !== undefined) s.add(currentData.season);
        if (historyData?.season !== undefined) s.add(historyData.season);
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
        () => buildLeaderboardGroups(rarityFilteredEntries, effectiveBossPrefixes, names, bossTopN, primeTopN),
        [rarityFilteredEntries, effectiveBossPrefixes, names, bossTopN, primeTopN]
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
                <NumberInput label="Boss top N" value={bossTopN} onChange={setBossTopN} />
                <NumberInput label="Prime top N" value={primeTopN} onChange={setPrimeTopN} />
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
