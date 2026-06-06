/* eslint-disable import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure */
import { useCallback, useEffect, useMemo, useState } from 'react';

import { makeApiCall } from '@/fsd/5-shared/api';
import {
    TacticusDamageType,
    safeParseGuildSeasonHistory,
    safeParseGuildSeasonSummary,
    safeParseSharedLeaderboards,
    type GuildSeasonHistoryEntry,
    type GuildSeasonHistoryResponse,
    type SharedLeaderboardsResponse,
    type TacticusGuildRaidResponse,
} from '@/fsd/5-shared/lib/tacticus-api';
import { useAuth } from '@/fsd/5-shared/model';
import { DebugJson } from '@/fsd/5-shared/ui';

import { NoKeyMessage, SeasonSelect, PlayerSelect } from './guild-performance.components';
import { LOADING, type GuildMemberName, type GuildTokenEntry, type LoadingOrData } from './guild-performance.types';
import { buildAvgDamageMap, getAllGuildPlayers, mergeSeasonSummaries } from './guild-performance.utils';
import { DamageTab } from './tabs/damage-tab';
import { HistoricalPerformanceTab } from './tabs/historical-performance-tab';
import { LeaderboardTab } from './tabs/leaderboards-tab';
import { LoopsTab } from './tabs/loops-tab';
import { OverviewTab } from './tabs/overview-tab';
import { PerformanceTab } from './tabs/performance-tab';

// Module-level cache so data persists across navigations
let cachedCurrent: TacticusGuildRaidResponse | undefined;
let cachedHistory: GuildSeasonHistoryResponse | undefined;
let cachedSharedLeaderboards: SharedLeaderboardsResponse | undefined;
let cachedNames: Map<string, string> | undefined;
let cachedRawNames: GuildMemberName[] | undefined;
let cachedTokens: GuildTokenEntry[] | undefined;
/** Gates the one-shot auto-fetch (the cache vars above can legitimately stay undefined for members). */
let cachedFetched = false;

function errorText(error: unknown): string | undefined {
    if (error === undefined) return undefined;
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    return String(error);
}

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

const TabBar = ({ active, onChange }: { active: TabId; onChange: (tab: TabId) => void }) => (
    <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {TAB_IDS.map(id => (
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

export const GuildPerformance = () => {
    const { userInfo } = useAuth();
    // A keyed user (leader/co-leader) gets raw current-season data; a keyless member with a guild
    // tag gets an anonymized aggregated summary instead. Either grants access to this page.
    const hasGuildApiKey = !!userInfo?.tacticusGuildApiKey;
    const hasGuildTag = !!userInfo?.guildTag;
    const isMember = !hasGuildApiKey && hasGuildTag;
    const hasAccess = hasGuildApiKey || hasGuildTag;
    const ownUserId = userInfo?.tacticusUserId;
    // For a keyless member, the player-aware tabs are pinned to their own (un-anonymized) rows.
    const memberUserId = isMember && ownUserId ? ownUserId : undefined;

    const [current, setCurrent] = useState<LoadingOrData<TacticusGuildRaidResponse>>(cachedCurrent ?? LOADING);
    const [seasonHistory, setSeasonHistory] = useState<GuildSeasonHistoryResponse | undefined>(cachedHistory);
    const [sharedLeaderboards, setSharedLeaderboards] = useState<SharedLeaderboardsResponse | undefined>(
        cachedSharedLeaderboards
    );
    const [historyError, setHistoryError] = useState<string | undefined>();
    const [names, setNames] = useState<Map<string, string>>(cachedNames ?? new Map());
    const [rawNames, setRawNames] = useState<GuildMemberName[] | undefined>(cachedRawNames);
    // Members have no raw current-season data, so the Overview tab is empty for them — land on Damage.
    const [activeTab, setActiveTab] = useState<TabId>(isMember ? 'damage' : 'overview');
    const [tokens, setTokens] = useState<GuildTokenEntry[] | typeof LOADING>(cachedTokens ?? LOADING);
    const [tokenError, setTokenError] = useState<string | undefined>();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const currentData = current === LOADING ? undefined : current;
    const tokenData = tokens === LOADING ? undefined : tokens;

    // --- sticky season + player selection (shared across tabs) ---
    const availableSeasons = useMemo(() => {
        const set = new Set<number>();
        if (currentData?.season != undefined) set.add(currentData.season);
        for (const season of seasonHistory?.seasonData ?? []) set.add(season.season);
        return [...set].toSorted((a, b) => b - a);
    }, [currentData, seasonHistory]);

    const [seasonOverride, setSeasonOverride] = useState<number | undefined>();
    const selectedSeason = seasonOverride ?? availableSeasons[0];

    const allPlayers = useMemo(
        () => getAllGuildPlayers(currentData?.entries ?? [], seasonHistory?.seasonData ?? [], names),
        [currentData, seasonHistory, names]
    );
    const [selectedUserId, setSelectedUserId] = useState<string | undefined>();
    // A keyless member is pinned to their own rows; a leader drives selection via the dropdown.
    const selectedPlayerId = isMember ? memberUserId : selectedUserId;

    const avgDamageMap = useMemo(() => {
        const allEntries = (currentData?.entries ?? []).filter(
            entry => entry.damageType !== TacticusDamageType.Bomb && entry.remainingHp !== 0
        );
        return buildAvgDamageMap(allEntries);
    }, [currentData]);

    const fetchData = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const [currentResponse, historyResponse, namesResponse, tokensResponse, sharedLbResponse] =
                await Promise.all([
                    makeApiCall<unknown>('GET', 'guild/raid?history=false'),
                    makeApiCall<unknown>('GET', 'guild/raid?history=true'),
                    makeApiCall<GuildMemberName[]>('GET', 'guild/members/names'),
                    makeApiCall<GuildTokenEntry[]>('GET', 'guild/tokens'),
                    makeApiCall<unknown>('GET', 'guild/sharedLeaderboards'),
                ]);

            // --- names (shared) ---
            const nameMap = new Map<string, string>();
            for (const member of namesResponse.data ?? []) {
                if (member.name) nameMap.set(member.userId, member.name);
            }
            // A keyless member sees their own (un-anonymized) rows; label them when not otherwise known.
            if (isMember && ownUserId) nameMap.set(ownUserId, nameMap.get(ownUserId) ?? 'You');
            cachedRawNames = namesResponse.data;
            setRawNames(namesResponse.data);
            cachedNames = nameMap;
            setNames(nameMap);

            // --- history (both user types return { sequenceNumber, seasonData }) ---
            let seasonData: GuildSeasonHistoryEntry[] = [];
            let sequenceNumber = 0;
            let parseError: string | undefined;
            if (historyResponse.data !== undefined) {
                const parsed = safeParseGuildSeasonHistory(historyResponse.data);
                if (parsed.success) {
                    seasonData = parsed.data.seasonData;
                    sequenceNumber = parsed.data.sequenceNumber;
                } else {
                    parseError = parsed.error.message;
                }
            }

            if (hasGuildApiKey) {
                // Leader: current season is the raw per-hit response.
                const raw = currentResponse.data as TacticusGuildRaidResponse | undefined;
                if (raw) {
                    cachedCurrent = raw;
                    setCurrent(raw);
                }
                const history = { sequenceNumber, seasonData };
                cachedHistory = history;
                setSeasonHistory(history);
                setHistoryError(parseError);
            } else {
                // Member: current season is a single anonymized summary — merge it into the history.
                if (currentResponse.data !== undefined) {
                    const parsed = safeParseGuildSeasonSummary(currentResponse.data);
                    if (parsed.success) {
                        seasonData = mergeSeasonSummaries(seasonData, parsed.data);
                    } else {
                        parseError ??= parsed.error.message;
                    }
                }
                const history = { sequenceNumber, seasonData };
                cachedHistory = history;
                setSeasonHistory(history);
                // Surface a backend access error (403 sharing-disabled / 404 not-a-member) when no data.
                setHistoryError(
                    seasonData.length === 0
                        ? (errorText(currentResponse.error) ?? errorText(historyResponse.error) ?? parseError)
                        : parseError
                );
            }

            // --- tokens ---
            if (tokensResponse.data) {
                cachedTokens = tokensResponse.data;
                setTokens(tokensResponse.data);
            } else if (tokensResponse.error) {
                const error = tokensResponse.error;
                setTokenError(typeof error === 'string' ? error : ((error as Error).message ?? 'Unknown error'));
                setTokens([]);
            }

            // --- shared leaderboards ---
            if (sharedLbResponse.data !== undefined) {
                const parsed = safeParseSharedLeaderboards(sharedLbResponse.data);
                if (parsed.success) {
                    cachedSharedLeaderboards = parsed.data;
                    setSharedLeaderboards(parsed.data);
                }
            }

            cachedFetched = true;
        } finally {
            setIsRefreshing(false);
        }
    }, [hasGuildApiKey, isMember, ownUserId]);

    useEffect(() => {
        if (!hasAccess) return;
        if (cachedFetched) return;
        void fetchData();
    }, [hasAccess, fetchData]);

    if (!hasAccess) return <NoKeyMessage />;

    return (
        <div className="flex flex-col gap-4 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
                <h1 className="text-2xl font-bold">Guild Performance</h1>
                <button
                    type="button"
                    onClick={() => {
                        void fetchData();
                    }}
                    disabled={isRefreshing}
                    className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">
                    {isRefreshing ? 'Refreshing\u2026' : 'Refresh'}
                </button>
            </div>
            {isMember && historyError !== undefined && (seasonHistory?.seasonData.length ?? 0) === 0 && (
                <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                    {historyError}
                </div>
            )}
            <DebugJson label="guild/raid?history=false" value={currentData ?? 'loading\u2026'} />
            <DebugJson
                label="guild/raid?history=true (parsed)"
                value={historyError ?? seasonHistory ?? 'loading\u2026'}
            />
            <DebugJson label="guild/members/names" value={rawNames} />
            <DebugJson label="guild/tokens" value={tokenData ?? 'loading…'} />
            <DebugJson label="guild/sharedLeaderboards" value={sharedLeaderboards ?? 'loading…'} />
            <div className="flex flex-wrap items-end justify-between gap-4">
                <TabBar active={activeTab} onChange={setActiveTab} />
                <div className="flex flex-wrap items-end gap-4">
                    <SeasonSelect seasons={availableSeasons} value={selectedSeason} onChange={setSeasonOverride} />
                    {/* Player select is for guild leaders only; keyless members are pinned to themselves. */}
                    {hasGuildApiKey && (
                        <PlayerSelect players={allPlayers} value={selectedUserId} onChange={setSelectedUserId} />
                    )}
                </div>
            </div>
            <div className="pt-2">
                <div className={activeTab === 'overview' ? undefined : 'hidden'}>
                    <OverviewTab
                        currentData={currentData}
                        names={names}
                        tokenData={tokenData}
                        tokenError={tokenError}
                    />
                </div>
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
                    />
                </div>
                <div className={activeTab === 'loops' ? undefined : 'hidden'}>
                    <LoopsTab currentData={currentData} seasonHistory={seasonHistory} selectedSeason={selectedSeason} />
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
                        seasonHistory={seasonHistory}
                        names={names}
                        selectedPlayerId={selectedPlayerId}
                    />
                </div>
            </div>
        </div>
    );
};
