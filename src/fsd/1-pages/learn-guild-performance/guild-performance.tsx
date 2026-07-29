/* eslint-disable import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure */
import { RefreshCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useQueryState } from '@/fsd/5-shared/lib';
import { SeasonFetchStatus } from '@/fsd/5-shared/lib/tacticus-api';
import { Button, DebugJson } from '@/fsd/5-shared/ui';

import { NoKeyMessage, SeasonSelect, PlayerSelect } from './guild-performance.components';
import { useGuildPerformance } from './guild-performance.hook';
import { DamageTab } from './tabs/damage-tab';
import { HistoricalPerformanceTab } from './tabs/historical-performance-tab';
import { LeaderboardTab } from './tabs/leaderboards-tab';
import { LoopsTab } from './tabs/loops-tab';
import { OverviewTab } from './tabs/overview-tab';
import { PerformanceTab } from './tabs/performance-tab';
import { TokenUsageTab } from './tabs/token-usage-tab';

const TAB_IDS = [
    'overview',
    'damage',
    'leaderboards',
    'loops',
    'token-usage',
    'performance',
    'historical-performance',
] as const;
type TabId = (typeof TAB_IDS)[number];

/** Tabs whose content is driven by the selected season; others (overview, token-usage,
 *  historical-performance) ignore it, so the Season selector is disabled there. */
const SEASON_TABS = new Set<TabId>(['damage', 'leaderboards', 'loops', 'performance']);
/** Tabs that consume the selected player (filter or highlight); the Player selector is disabled
 *  elsewhere. Only shown to keyholders regardless. */
const PLAYER_TABS = new Set<TabId>(['damage', 'token-usage', 'performance', 'historical-performance']);

const TAB_LABELS: Record<TabId, string> = {
    overview: 'Overview',
    damage: 'Damage',
    leaderboards: 'Leaderboard',
    loops: 'Loops',
    'token-usage': 'Token Usage',
    performance: 'Performance',
    'historical-performance': 'Historical Performance',
};

const TabBar = ({
    active,
    hasGuildApiKey,
    onChange,
}: {
    active: TabId;
    hasGuildApiKey: boolean;
    onChange: (tab: TabId) => void;
}) => (
    <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {TAB_IDS.filter(id => hasGuildApiKey || id !== 'overview').map(id => (
            <button
                key={id}
                type="button"
                onClick={() => {
                    onChange(id);
                }}
                className={[
                    'px-4 py-2 text-sm font-medium transition-colors',
                    active === id
                        ? 'border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100',
                ].join(' ')}>
                {TAB_LABELS[id]}
            </button>
        ))}
    </div>
);

/** Status badge shown next to historical seasons that haven't been fetched yet. */
function seasonStatusLabel(status: SeasonFetchStatus | undefined): string | undefined {
    switch (status) {
        case SeasonFetchStatus.NotAggregated: {
            return 'not aggregated';
        }
        case SeasonFetchStatus.TooOld: {
            return 'too old';
        }
        case SeasonFetchStatus.NotFound: {
            return 'not found';
        }
        case SeasonFetchStatus.Empty: {
            return 'empty';
        }
        case SeasonFetchStatus.TransientError: {
            return 'error';
        }
        default: {
            return undefined;
        }
    }
}

export const GuildPerformance = () => {
    const {
        hasGuildApiKey,
        hasAccess,
        isMember,
        memberUserId,
        currentData,
        seasonList,
        seasonDataMap,
        seasonHistory,
        sharedLeaderboards,
        guildInfo,
        historyError,
        names,
        rawNames,
        tokenData,
        tokenError,
        isRefreshing,
        isLoadingHistoricalSeason,
        availableSeasons,
        allPlayers,
        avgDamageMap,
        performanceIndex,
        tokenUsageData,
        raidCompsMap,
        fetchData,
        fetchSeasonData,
        refreshSharedLeaderboards,
    } = useGuildPerformance();

    const defaultTab: TabId = isMember ? 'damage' : 'overview';
    const [activeTab, setActiveTab] = useQueryState<TabId>(
        'tab',
        p => (p && (TAB_IDS as readonly string[]).includes(p) ? (p as TabId) : defaultTab),
        t => t
    );
    // The Overview tab exists only for keyholders; if the URL (or a stale default from before auth
    // resolved) lands a keyless member there, fall back to a tab they can actually see.
    useEffect(() => {
        if (activeTab === 'overview' && !hasGuildApiKey) setActiveTab('damage');
    }, [activeTab, hasGuildApiKey, setActiveTab]);

    // Mount a tab's subtree only once it has been opened, then keep it mounted so its filter state
    // survives switching away. Avoids running every tab's aggregations on the initial load.
    const [activatedTabs, setActivatedTabs] = useState<Set<TabId>>(() => new Set([activeTab]));
    useEffect(() => {
        setActivatedTabs(previous => (previous.has(activeTab) ? previous : new Set(previous).add(activeTab)));
    }, [activeTab]);

    const [seasonParameter, setSeasonParameter] = useQueryState<number | undefined>(
        'season',
        p => (p ? Number(p) : undefined),
        n => (n == undefined ? undefined : String(n))
    );
    const selectedSeason = seasonParameter ?? availableSeasons[0];
    const [selectedUserId, setSelectedUserId] = useState<string | undefined>();
    const selectedPlayerId = isMember ? memberUserId : selectedUserId;

    const debugMode = localStorage.getItem('debugMode') === 'true';

    // When the user picks a historical season not yet in cache, fetch it on demand.
    const currentSeasonNumber = seasonList?.currentSeason ?? currentData?.season;
    useEffect(() => {
        if (selectedSeason === undefined) return;
        if (selectedSeason === currentSeasonNumber) return;
        if (seasonDataMap.has(selectedSeason)) return;
        // Only attempt to fetch seasons we know exist in the list.
        const listEntry = seasonList?.seasons.find(s => s.season === selectedSeason);
        if (listEntry && listEntry.status !== SeasonFetchStatus.TooOld) {
            void fetchSeasonData(selectedSeason);
        }
    }, [selectedSeason, currentSeasonNumber, seasonDataMap, seasonList, fetchSeasonData]);

    // For keyless members, shared leaderboards are per-season. Re-fetch when the season changes,
    // but skip the very first render (fetchData already loaded the initial season's leaderboards).
    const leaderboardSeasonFetchedReference = useRef(false);
    useEffect(() => {
        if (!isMember || selectedSeason === undefined) return;
        if (!leaderboardSeasonFetchedReference.current) {
            leaderboardSeasonFetchedReference.current = true;
            return;
        }
        void refreshSharedLeaderboards(selectedSeason);
    }, [isMember, selectedSeason, refreshSharedLeaderboards]);

    if (!hasAccess) return <NoKeyMessage />;

    return (
        <div className="flex flex-col gap-4 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
                <h1 className="text-2xl font-bold">Guild Performance</h1>
                <Button
                    size="small"
                    appearance="outline"
                    intent="secondary"
                    isDisabled={isRefreshing}
                    onPress={() => {
                        void fetchData(Date.now());
                    }}>
                    <RefreshCcw data-slot="icon" className={isRefreshing ? 'animate-spin' : undefined} />
                    {isRefreshing ? 'Refreshing…' : 'Refresh Current Season'}
                </Button>
            </div>

            {isMember && historyError !== undefined && seasonHistory.seasonData.length === 0 && (
                <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                    {historyError}
                </div>
            )}

            {debugMode && (
                <>
                    <DebugJson
                        label={isMember ? 'season list (derived from PI)' : 'guild/raid/seasons'}
                        value={seasonList ?? 'loading…'}
                    />
                    <DebugJson
                        label={
                            isMember
                                ? 'guild/member/raid - cached season data'
                                : 'guild/raid/seasons - cached season data'
                        }
                        value={Object.fromEntries(seasonDataMap)}
                    />
                    {hasGuildApiKey && (
                        <DebugJson label="guild/raid/{currentSeason} (current)" value={currentData ?? 'loading…'} />
                    )}
                    {isMember && (
                        <DebugJson label="guild/member/raid (current season)" value={seasonDataMap ?? 'loading…'} />
                    )}
                    {hasGuildApiKey && <DebugJson label="guild/members/names" value={rawNames} />}
                    {hasGuildApiKey && <DebugJson label="guild/tokens" value={tokenData ?? 'loading…'} />}
                    <DebugJson
                        label={
                            isMember
                                ? `guild/member/sharedLeaderboards?season=${selectedSeason ?? '…'}`
                                : 'guild/sharedLeaderboards'
                        }
                        value={sharedLeaderboards ?? 'loading…'}
                    />
                    <DebugJson
                        label={isMember ? 'guild/member/raid/performance-index' : 'guild/raid/performance-index'}
                        value={performanceIndex ?? 'loading…'}
                    />
                </>
            )}

            <div className="flex flex-wrap items-end justify-between gap-4">
                <TabBar active={activeTab} onChange={setActiveTab} hasGuildApiKey={hasGuildApiKey} />
                <div className="flex flex-wrap items-end gap-4">
                    <SeasonSelect
                        seasons={availableSeasons}
                        value={selectedSeason}
                        onChange={setSeasonParameter}
                        disabled={!SEASON_TABS.has(activeTab)}
                        seasonStatusLabel={s => {
                            if (s === currentSeasonNumber) return;
                            if (seasonDataMap.has(s)) return;
                            const listEntry = seasonList?.seasons.find(entry => entry.season === s);
                            return seasonStatusLabel(listEntry?.status);
                        }}
                    />
                    {hasGuildApiKey && (
                        <PlayerSelect
                            players={allPlayers}
                            value={selectedUserId}
                            onChange={setSelectedUserId}
                            disabled={!PLAYER_TABS.has(activeTab)}
                        />
                    )}
                </div>
            </div>

            {/* Spinner overlay while a historical season is loading */}
            <div className="relative pt-2">
                {isLoadingHistoricalSeason && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded bg-white/60 dark:bg-gray-900/60">
                        <span className="inline-block size-8 animate-spin rounded-full border-4 border-gray-400 border-t-transparent" />
                    </div>
                )}
                <div>
                    {hasGuildApiKey && activatedTabs.has('overview') && (
                        <div className={activeTab === 'overview' ? undefined : 'hidden'}>
                            <OverviewTab
                                currentData={currentData}
                                names={names}
                                tokenData={tokenData}
                                tokenError={tokenError}
                                guildInfo={guildInfo}
                                raidCompsMap={raidCompsMap}
                            />
                        </div>
                    )}
                    {activatedTabs.has('damage') && (
                        <div className={activeTab === 'damage' ? undefined : 'hidden'}>
                            <DamageTab
                                currentData={currentData}
                                seasonHistory={seasonHistory}
                                names={names}
                                avgDamageMap={avgDamageMap}
                                selectedSeason={selectedSeason}
                                selectedPlayerId={selectedPlayerId}
                            />
                        </div>
                    )}
                    {activatedTabs.has('leaderboards') && (
                        <div className={activeTab === 'leaderboards' ? undefined : 'hidden'}>
                            <LeaderboardTab
                                currentData={currentData}
                                seasonHistory={seasonHistory}
                                names={names}
                                selectedSeason={selectedSeason}
                                sharedLeaderboards={sharedLeaderboards}
                                onRefreshSharedLeaderboards={() => refreshSharedLeaderboards(selectedSeason)}
                            />
                        </div>
                    )}
                    {activatedTabs.has('loops') && (
                        <div className={activeTab === 'loops' ? undefined : 'hidden'}>
                            <LoopsTab
                                currentData={currentData}
                                seasonHistory={seasonHistory}
                                selectedSeason={selectedSeason}
                            />
                        </div>
                    )}
                    {activatedTabs.has('token-usage') && (
                        <div className={activeTab === 'token-usage' ? undefined : 'hidden'}>
                            <TokenUsageTab
                                tokenUsageData={tokenUsageData}
                                currentData={currentData}
                                names={names}
                                selectedPlayerId={selectedPlayerId}
                            />
                        </div>
                    )}
                    {activatedTabs.has('performance') && (
                        <div className={activeTab === 'performance' ? undefined : 'hidden'}>
                            <PerformanceTab
                                currentData={currentData}
                                seasonHistory={seasonHistory}
                                names={names}
                                selectedSeason={selectedSeason}
                                selectedPlayerId={selectedPlayerId}
                            />
                        </div>
                    )}
                    {activatedTabs.has('historical-performance') && (
                        <div className={activeTab === 'historical-performance' ? undefined : 'hidden'}>
                            <HistoricalPerformanceTab
                                currentData={currentData}
                                performanceIndex={performanceIndex}
                                names={names}
                                selectedPlayerId={selectedPlayerId}
                                ownUserId={memberUserId}
                                isLoading={isRefreshing && performanceIndex === undefined}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
