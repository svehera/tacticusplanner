/* eslint-disable import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure */
import { useEffect, useState } from 'react';

import { SeasonFetchStatus } from '@/fsd/5-shared/lib/tacticus-api';
import { DebugJson } from '@/fsd/5-shared/ui';

import { NoKeyMessage, SeasonSelect, PlayerSelect } from './guild-performance.components';
import { useGuildPerformance } from './guild-performance.hook';
import { DamageTab } from './tabs/damage-tab';
import { HistoricalPerformanceTab } from './tabs/historical-performance-tab';
import { LeaderboardTab } from './tabs/leaderboards-tab';
import { LoopsTab } from './tabs/loops-tab';
import { OverviewTab } from './tabs/overview-tab';
import { PerformanceTab } from './tabs/performance-tab';

const TAB_IDS = ['overview', 'damage', 'leaderboards', 'loops', 'performance', 'historical-performance'] as const;
type TabId = (typeof TAB_IDS)[number];

const TAB_LABELS: Record<TabId, string> = {
    overview: 'Overview',
    damage: 'Damage',
    leaderboards: 'Leaderboard',
    loops: 'Loops',
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
        fetchData,
        fetchSeasonData,
        refreshSharedLeaderboards,
    } = useGuildPerformance();

    const [activeTab, setActiveTab] = useState<TabId>(isMember ? 'damage' : 'overview');
    useEffect(() => {
        setActiveTab(isMember ? 'damage' : 'overview');
    }, [isMember]);

    const [seasonOverride, setSeasonOverride] = useState<number | undefined>();
    const selectedSeason = seasonOverride ?? availableSeasons[0];
    const [selectedUserId, setSelectedUserId] = useState<string | undefined>();
    const selectedPlayerId = isMember ? memberUserId : selectedUserId;

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

    if (!hasAccess) return <NoKeyMessage />;

    return (
        <div className="flex flex-col gap-4 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
                <h1 className="text-2xl font-bold">Guild Performance</h1>
                <button
                    type="button"
                    onClick={() => {
                        void fetchData(Date.now());
                    }}
                    disabled={isRefreshing}
                    className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">
                    {isRefreshing ? 'Refreshing…' : 'Refresh Current Season'}
                </button>
            </div>

            {isMember && historyError !== undefined && seasonHistory.seasonData.length === 0 && (
                <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                    {historyError}
                </div>
            )}

            <DebugJson label="guild/raid/seasons" value={seasonList ?? 'loading…'} />
            <DebugJson label="guild/raid/seasons - cached season data" value={Object.fromEntries(seasonDataMap)} />
            <DebugJson label="guild/raid/{currentSeason} (current)" value={currentData ?? 'loading…'} />
            <DebugJson label="guild/members/names" value={rawNames} />
            <DebugJson label="guild/tokens" value={tokenData ?? 'loading…'} />
            <DebugJson label="guild/sharedLeaderboards" value={sharedLeaderboards ?? 'loading…'} />
            <DebugJson label="guild/raid/performance-index" value={performanceIndex ?? 'loading…'} />

            <div className="flex flex-wrap items-end justify-between gap-4">
                <TabBar active={activeTab} onChange={setActiveTab} hasGuildApiKey={hasGuildApiKey} />
                <div className="flex flex-wrap items-end gap-4">
                    <SeasonSelect
                        seasons={availableSeasons}
                        value={selectedSeason}
                        onChange={setSeasonOverride}
                        seasonStatusLabel={s => {
                            if (s === currentSeasonNumber) return;
                            if (seasonDataMap.has(s)) return;
                            const listEntry = seasonList?.seasons.find(entry => entry.season === s);
                            return seasonStatusLabel(listEntry?.status);
                        }}
                    />
                    {hasGuildApiKey && (
                        <PlayerSelect players={allPlayers} value={selectedUserId} onChange={setSelectedUserId} />
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
                    {hasGuildApiKey && (
                        <div className={activeTab === 'overview' ? undefined : 'hidden'}>
                            <OverviewTab
                                currentData={currentData}
                                names={names}
                                tokenData={tokenData}
                                tokenError={tokenError}
                                guildInfo={guildInfo}
                            />
                        </div>
                    )}
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
                    <div className={activeTab === 'leaderboards' ? undefined : 'hidden'}>
                        <LeaderboardTab
                            currentData={currentData}
                            seasonHistory={seasonHistory}
                            names={names}
                            selectedSeason={selectedSeason}
                            sharedLeaderboards={sharedLeaderboards}
                            onRefreshSharedLeaderboards={refreshSharedLeaderboards}
                        />
                    </div>
                    <div className={activeTab === 'loops' ? undefined : 'hidden'}>
                        <LoopsTab
                            currentData={currentData}
                            seasonHistory={seasonHistory}
                            selectedSeason={selectedSeason}
                        />
                    </div>
                    <div className={activeTab === 'performance' ? undefined : 'hidden'}>
                        <PerformanceTab
                            currentData={currentData}
                            seasonHistory={seasonHistory}
                            names={names}
                            selectedSeason={selectedSeason}
                            selectedPlayerId={selectedPlayerId}
                        />
                    </div>
                    <div className={activeTab === 'historical-performance' ? undefined : 'hidden'}>
                        <HistoricalPerformanceTab
                            performanceIndex={performanceIndex}
                            names={names}
                            selectedPlayerId={selectedPlayerId}
                            ownUserId={memberUserId}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
