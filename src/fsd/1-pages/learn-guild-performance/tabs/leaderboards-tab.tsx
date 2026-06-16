/* eslint-disable import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure */
import { useEffect, useMemo, useState } from 'react';

import {
    type GuildSeasonHistoryResponse,
    type SharedLeaderboardsResponse,
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
    sortBossPrefixes,
    unitRoundIconMap,
} from '../guild-performance.utils';

import {
    ALL_RARITIES,
    buildGuildOptions,
    buildLeaderboardGroups,
    buildLeaderboardGroupsFromSummary,
    mergeSharedEntries,
    unitDisplayLabel,
    type BossGroup,
    type GuildOption,
    type LeaderboardEntry,
} from './leaderboards-tab.utils';

// ---------------------------------------------------------------------------
// Filter sub-components
// ---------------------------------------------------------------------------

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

function GuildFilterGroup({
    guilds,
    selected,
    onChange,
}: {
    guilds: GuildOption[];
    selected: Set<string>;
    onChange: (tags: Set<string>) => void;
}) {
    return (
        <div className="flex flex-col gap-0.5 text-xs">
            <span className="font-semibold text-gray-500 uppercase dark:text-gray-400">Other Guilds</span>
            <div className="flex flex-wrap gap-1">
                {guilds.map(guild => {
                    const isSelected = selected.has(guild.guildTag);
                    return (
                        <button
                            key={guild.guildTag}
                            type="button"
                            onClick={() => {
                                const next = new Set(selected);
                                if (next.has(guild.guildTag)) next.delete(guild.guildTag);
                                else next.add(guild.guildTag);
                                onChange(next);
                            }}
                            className={[
                                'rounded border px-2 py-0.5 transition-colors',
                                isSelected
                                    ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950'
                                    : 'border-gray-200 bg-white hover:border-gray-400 dark:border-gray-700 dark:bg-gray-900',
                            ].join(' ')}>
                            {guild.displayName}
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
            {/* Left prime: second on narrow, left on wide; spacer keeps boss centered when absent */}
            {leftPrime === undefined ? (
                <div className="hidden 2xl:order-1 2xl:block 2xl:w-[28rem]" />
            ) : (
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
    selectedSeason,
    sharedLeaderboards,
    onRefreshSharedLeaderboards,
}: {
    currentData: TacticusGuildRaidResponse | undefined;
    seasonHistory?: GuildSeasonHistoryResponse;
    names: Map<string, string>;
    /** Page-level sticky season selection. */
    selectedSeason: number | undefined;
    sharedLeaderboards?: SharedLeaderboardsResponse;
    onRefreshSharedLeaderboards?: () => Promise<void>;
}) => {
    // A historical season builds its leaderboards from the aggregated top-5s; the live season builds
    // them from raw per-hit entries.
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

    // --- guild filter (shared leaderboards) ---
    // Only applies when the shared leaderboard season matches the selected season.
    const sharedForSeason = useMemo(
        () =>
            sharedLeaderboards !== undefined && sharedLeaderboards.season === selectedSeason
                ? sharedLeaderboards.leaderboards
                : [],
        [sharedLeaderboards, selectedSeason]
    );

    const guildOptions = useMemo(() => buildGuildOptions(sharedForSeason), [sharedForSeason]);
    const [selectedGuildTags, setSelectedGuildTags] = useState<Set<string>>(() => new Set());
    const [isRefreshingShared, setIsRefreshingShared] = useState(false);

    const handleRefreshShared = async () => {
        if (!onRefreshSharedLeaderboards) return;
        setIsRefreshingShared(true);
        try {
            await onRefreshSharedLeaderboards();
        } finally {
            setIsRefreshingShared(false);
        }
    };

    // Reset all filters when the page-level season changes.
    useEffect(() => {
        setRarityOverride(undefined);
        setSelectedBossPrefixes(undefined);
        setSelectedGuildTags(new Set());
    }, [selectedSeason]);

    const handleRarityChange = (rarities: Rarity[]) => {
        setRarityOverride(rarities);
        setSelectedBossPrefixes(undefined);
    };

    // --- groups ---
    const groups = useMemo(() => {
        const rawGroups = historySummary
            ? buildLeaderboardGroupsFromSummary(
                  historySummary,
                  selectedRarities,
                  effectiveBossPrefixes,
                  names,
                  bossTopN,
                  primeTopN
              )
            : buildLeaderboardGroups(rarityFilteredEntries, effectiveBossPrefixes, names, bossTopN, primeTopN);
        if (sharedForSeason.length === 0 || selectedGuildTags.size === 0) return rawGroups;
        return mergeSharedEntries(rawGroups, sharedForSeason, selectedGuildTags, bossTopN, primeTopN);
    }, [
        historySummary,
        selectedRarities,
        rarityFilteredEntries,
        effectiveBossPrefixes,
        names,
        bossTopN,
        primeTopN,
        sharedForSeason,
        selectedGuildTags,
    ]);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end gap-4 border-b border-gray-200 pb-3 dark:border-gray-700">
                {guildOptions.length > 0 && (
                    <GuildFilterGroup
                        guilds={guildOptions}
                        selected={selectedGuildTags}
                        onChange={setSelectedGuildTags}
                    />
                )}
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
                {onRefreshSharedLeaderboards && localStorage.getItem('debugMode') === 'true' && (
                    <button
                        type="button"
                        onClick={() => {
                            void handleRefreshShared();
                        }}
                        disabled={isRefreshingShared}
                        className="rounded border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">
                        {isRefreshingShared ? 'Refreshing…' : 'Refresh Shared'}
                    </button>
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
