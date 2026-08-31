/* eslint-disable import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure */
import { enqueueSnackbar } from 'notistack';
import { useContext, useEffect, useMemo, useState } from 'react';

import { DispatchContext, StoreContext } from 'src/reducers/store.provider';

import { useCaptureElement } from '@/fsd/5-shared/lib';
import {
    type GuildSeasonHistoryResponse,
    type SharedLeaderboardsResponse,
    type TacticusGuildRaidEntry,
    type TacticusGuildRaidResponse,
} from '@/fsd/5-shared/lib/tacticus-api';
import { Rarity, RarityMapper } from '@/fsd/5-shared/model';
import { Button } from '@/fsd/5-shared/ui';
import { RarityIcon } from '@/fsd/5-shared/ui/icons';

import {
    CaptureButton,
    CardGrid,
    CompIcons,
    EncounterIcon,
    FilterBar,
    FilterGroup,
    PrefixFilter,
    RarityFilter,
    SectionHeader,
    Stepper,
    TableCard,
    TableCardHeader,
} from '../guild-performance.components';
import {
    bossIconFor,
    bossPrefixDisplayNames,
    computeDefaultRaritiesFromRarities,
    getAvailableBosses,
    orderBossesByEncounter,
    unitDisplayLabel,
} from '../guild-performance.utils';

import {
    buildGuildOptions,
    buildLeaderboardGroups,
    buildLeaderboardGroupsFromSummary,
    mergeSharedEntries,
    type BossGroup,
    type GuildOption,
    type LeaderboardEntry,
} from './leaderboards-tab.utils';

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
        <FilterGroup label="Other guilds">
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
                            'cursor-pointer rounded-full border px-2.5 py-0.5 text-[11.5px] transition-colors',
                            isSelected
                                ? 'border-(--primary) bg-(--primary)/15 font-semibold text-(--fg)'
                                : 'border-(--border) text-(--soft-fg) hover:border-(--primary)/45 hover:text-(--fg)',
                        ].join(' ')}>
                        {guild.displayName}
                    </button>
                );
            })}
        </FilterGroup>
    );
}

/** Replaces the emoji medals — the top three get progressively weaker accent fills. */
function RankBadge({ rank }: { rank: number }) {
    const fill =
        rank === 1
            ? 'bg-(--primary) text-(--primary-fg)'
            : rank === 2
              ? 'bg-(--fg)/22 text-(--fg)'
              : rank === 3
                ? 'bg-(--primary)/25 text-(--fg)'
                : 'text-(--soft-fg)';
    return (
        <span
            className={`inline-flex size-[19px] items-center justify-center rounded-md text-[10.5px] font-extrabold tabular-nums ${fill}`}>
            {rank}
        </span>
    );
}

function LeaderboardRow({ rank, entry, topDamage }: { rank: number; entry: LeaderboardEntry; topDamage: number }) {
    const barWidth = topDamage > 0 ? (entry.damage / topDamage) * 100 : 0;
    return (
        <div
            role="row"
            className="relative grid grid-cols-[22px_minmax(0,1fr)_auto_68px] items-center gap-x-1.5 px-2 py-1 text-sm even:bg-(--neutral)/50 hover:bg-(--primary)/10">
            {/* Damage read as a bar behind the row, so relative standing is visible without
                comparing numerals. Content cells sit above it via `relative`. `aria-hidden`: it
                restates the damage figure in the last cell, and it is not a cell of its own. */}
            <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 bg-(--primary)/10"
                style={{ width: `${barWidth}%` }}
            />
            <span role="cell" className="relative flex items-center justify-center">
                <RankBadge rank={rank} />
            </span>
            <span role="cell" className="relative min-w-0 truncate font-medium" title={entry.userId}>
                {entry.displayName}
            </span>
            <span role="cell" className="relative min-w-0">
                <CompIcons comp={entry.comp} size={20} />
            </span>
            <span role="cell" className="relative text-right font-bold tabular-nums">
                {entry.damage.toLocaleString()}
            </span>
        </div>
    );
}

function LeaderboardCard({
    unitId,
    rarity,
    entries,
    kind,
}: {
    unitId: string;
    rarity: Rarity;
    entries: LeaderboardEntry[];
    kind: 'Boss' | 'Prime';
}) {
    if (entries.length === 0) return <></>;
    const displayName = unitDisplayLabel(unitId);
    const topEntry = entries[0];
    return (
        <TableCard>
            <TableCardHeader className="gap-2 px-2 py-1.5">
                <EncounterIcon unitId={unitId} rarity={rarity} />
                <RarityIcon rarity={rarity} />
                <span className="text-sm font-extrabold text-(--fg)">{displayName}</span>
                <span className="text-[10px] tracking-[.08em] text-(--soft-fg) uppercase">{kind}</span>
                <span className="ml-auto text-xs text-(--soft-fg)">top {entries.length}</span>
            </TableCardHeader>
            <div role="table" aria-label={`${displayName} — ${kind}, top ${entries.length}`}>
                {entries.map((entry, index) => (
                    <LeaderboardRow key={index} rank={index + 1} entry={entry} topDamage={topEntry.damage} />
                ))}
            </div>
        </TableCard>
    );
}

function BossGroupSection({ group }: { group: BossGroup }) {
    // The band is the capture unit, not the individual card: boss plus both primes in one image is
    // what's worth sharing, and the header supplies the boss name and tier so it reads standalone.
    const bossName = bossPrefixDisplayNames[group.bossPrefix] ?? group.bossPrefix;
    const tier = `${RarityMapper.rarityToRarityString(group.rarity)} ${group.set + 1}`;
    const { ref, capture, isCapturing } = useCaptureElement<HTMLElement>(
        `leaderboard-${bossName.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}-${tier.toLowerCase().replaceAll(' ', '')}`
    );

    const onCapture = () => {
        void capture().then(outcome => {
            if (outcome === 'clipboard') enqueueSnackbar('Image copied', { variant: 'success' });
            else if (outcome === 'download') enqueueSnackbar('Image downloaded', { variant: 'success' });
            else enqueueSnackbar('Could not capture the image', { variant: 'error' });
        });
    };

    // Left prime, boss, right prime — the encounter's own left-to-right order. The auto-fit grid
    // handles the responsive collapse, replacing the old order-* / 2xl: juggling and the fixed
    // 28rem card width that left dead space on a wide screen.
    //
    // The header carries no stats meta: it previously restated the two top-N steppers from the
    // filter bar on every band, and its "N hits" counted displayed rows — already capped by those
    // steppers — so it reported the settings back rather than anything about the guild. Each card
    // header carries its own "top N", scoped to the board it describes.
    return (
        <section ref={ref} className="flex flex-col gap-2.5">
            <SectionHeader
                title={bossName}
                icon={<RarityIcon rarity={group.rarity} />}
                note={<span className="rounded-full border border-(--border) px-2 py-0.5 text-[10.5px]">{tier}</span>}
                meta={<CaptureButton onCapture={onCapture} isCapturing={isCapturing} />}
            />
            <CardGrid min={320} gap="gap-2.5">
                {group.primeSlots[0] !== undefined && (
                    <LeaderboardCard
                        unitId={group.primeSlots[0].unitId}
                        rarity={group.rarity}
                        entries={group.primeSlots[0].entries}
                        kind="Prime"
                    />
                )}
                <LeaderboardCard
                    unitId={group.bossUnitId}
                    rarity={group.rarity}
                    entries={group.bossEntries}
                    kind="Boss"
                />
                {group.primeSlots.slice(1).map(prime => (
                    <LeaderboardCard
                        key={`${prime.unitId}:${prime.encounterIndex}`}
                        unitId={prime.unitId}
                        rarity={group.rarity}
                        entries={prime.entries}
                        kind="Prime"
                    />
                ))}
            </CardGrid>
        </section>
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
        // Historical aggregates carry rarity and set on each board's enemyInfo, so the same
        // encounter ordering as the live path is available here too.
        if (historySummary) {
            return orderBossesByEncounter(
                historySummary.leaderboards
                    .filter(board => selectedRarities.includes(RarityMapper.stringToNumber[board.enemyInfo.rarity]))
                    .map(board => ({
                        unitId: board.enemyInfo.enemyId,
                        rarity: RarityMapper.stringToNumber[board.enemyInfo.rarity],
                        set: board.enemyInfo.set,
                        encounterIndex: board.enemyInfo.encounterIndex,
                    }))
            );
        }
        return getAvailableBosses(rarityFilteredEntries);
    }, [historySummary, selectedRarities, rarityFilteredEntries]);
    const [selectedBossPrefixes, setSelectedBossPrefixes] = useState<string[] | undefined>();
    const effectiveBossPrefixes = selectedBossPrefixes ?? availableBossPrefixes.map(option => option.key);

    // --- leaderboard sizes ---
    const { viewPreferences } = useContext(StoreContext);
    const { viewPreferences: dispatchViewPreferences } = useContext(DispatchContext);
    const bossTopN = viewPreferences.leaderboardBossTopN;
    const primeTopN = viewPreferences.leaderboardPrimeTopN;
    const setBossTopN = (v: number) =>
        dispatchViewPreferences({ type: 'Update', setting: 'leaderboardBossTopN', value: v });
    const setPrimeTopN = (v: number) =>
        dispatchViewPreferences({ type: 'Update', setting: 'leaderboardPrimeTopN', value: v });

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

    // "Clear" returns the filters to their computed defaults, not to empty — an empty rarity or
    // boss set would blank the tab.
    const hasFilters = rarityOverride !== undefined || selectedBossPrefixes !== undefined || selectedGuildTags.size > 0;
    const clearFilters = () => {
        setRarityOverride(undefined);
        setSelectedBossPrefixes(undefined);
        setSelectedGuildTags(new Set());
    };

    return (
        <div className="flex flex-col gap-3.5">
            <FilterBar
                header={
                    <>
                        <span className="text-[10px] font-bold tracking-[.14em] text-(--soft-fg) uppercase">
                            Filters
                        </span>
                        <span className="text-xs text-(--soft-fg)">
                            Season {selectedSeason ?? '…'} · {groups.length} boards
                        </span>
                        <div className="flex flex-1 items-center justify-end gap-3">
                            {onRefreshSharedLeaderboards && localStorage.getItem('debugMode') === 'true' && (
                                <Button
                                    appearance="outline"
                                    intent="secondary"
                                    size="extra-small"
                                    isDisabled={isRefreshingShared}
                                    onPress={() => {
                                        void handleRefreshShared();
                                    }}>
                                    {isRefreshingShared ? 'Refreshing…' : 'Refresh Shared'}
                                </Button>
                            )}
                            <Button
                                appearance="plain"
                                intent="primary"
                                size="extra-small"
                                isDisabled={!hasFilters}
                                onPress={clearFilters}>
                                Clear
                            </Button>
                        </div>
                    </>
                }>
                {guildOptions.length > 0 && (
                    <GuildFilterGroup
                        guilds={guildOptions}
                        selected={selectedGuildTags}
                        onChange={setSelectedGuildTags}
                    />
                )}
                <RarityFilter selected={selectedRarities} onChange={handleRarityChange} />
                <PrefixFilter
                    label="Boss"
                    available={availableBossPrefixes}
                    getKey={option => option.key}
                    getRarity={option => option.rarity}
                    selected={effectiveBossPrefixes}
                    onChange={setSelectedBossPrefixes}
                    iconFor={bossIconFor}
                />
                {/* Historical leaderboards are pre-capped at top-5 server-side, so top-N is live-only. */}
                {!isHistorical && (
                    <>
                        <FilterGroup label="Boss top N">
                            <Stepper value={bossTopN} min={1} max={10} onChange={setBossTopN} />
                        </FilterGroup>
                        {/* Primes floor at 0 so a band can be reduced to its boss board alone; both
                            group builders drop prime slots with no entries, so the cards simply
                            disappear. Bosses keep a floor of 1 — at 0 a band would render empty. */}
                        <FilterGroup label="Prime top N">
                            <Stepper value={primeTopN} min={0} max={10} onChange={setPrimeTopN} />
                        </FilterGroup>
                    </>
                )}
            </FilterBar>
            {groups.length === 0 ? (
                <div className="flex items-center justify-center rounded-xl border border-(--border) bg-(--soft) py-12 text-sm text-(--soft-fg)">
                    No data for selected filters.
                </div>
            ) : (
                <div className="flex flex-col gap-6">
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
