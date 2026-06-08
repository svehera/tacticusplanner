/* eslint-disable import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure */
import { useCallback, useEffect, useMemo, useState } from 'react';

import { makeApiCall } from '@/fsd/5-shared/api';
import {
    TacticusDamageType,
    getTacticusGuildData,
    safeParseGuildSeasonHistory,
    safeParseGuildSeasonSummary,
    safeParseSharedLeaderboards,
    type GuildSeasonHistoryEntry,
    type GuildSeasonHistoryResponse,
    type SharedLeaderboardsResponse,
    type TacticusGuildRaidResponse,
} from '@/fsd/5-shared/lib/tacticus-api';
import { useAuth } from '@/fsd/5-shared/model';

import { LOADING, type GuildMemberName, type GuildTokenEntry, type LoadingOrData } from './guild-performance.types';
import { buildAvgDamageMap, getAllGuildPlayers, mergeSeasonSummaries } from './guild-performance.utils';

// Module-level cache so data persists across navigations
let cachedCurrent: TacticusGuildRaidResponse | undefined;
let cachedHistory: GuildSeasonHistoryResponse | undefined;
let cachedSharedLeaderboards: SharedLeaderboardsResponse | undefined;
let cachedGuildInfo: { tag: string; name: string } | undefined;
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

export function useGuildPerformance() {
    const { userInfo } = useAuth();
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
    const [guildInfo, setGuildInfo] = useState<{ tag: string; name: string } | undefined>(cachedGuildInfo);
    const [historyError, setHistoryError] = useState<string | undefined>();
    const [names, setNames] = useState<Map<string, string>>(cachedNames ?? new Map());
    const [rawNames, setRawNames] = useState<GuildMemberName[] | undefined>(cachedRawNames);
    const [tokens, setTokens] = useState<GuildTokenEntry[] | typeof LOADING>(cachedTokens ?? LOADING);
    const [tokenError, setTokenError] = useState<string | undefined>();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const currentData = current === LOADING ? undefined : current;
    const tokenData = tokens === LOADING ? undefined : tokens;

    const availableSeasons = useMemo(() => {
        const set = new Set<number>();
        if (currentData?.season != undefined) set.add(currentData.season);
        for (const season of seasonHistory?.seasonData ?? []) set.add(season.season);
        return [...set].toSorted((a, b) => b - a);
    }, [currentData, seasonHistory]);

    const allPlayers = useMemo(
        () => getAllGuildPlayers(currentData?.entries ?? [], seasonHistory?.seasonData ?? [], names),
        [currentData, seasonHistory, names]
    );

    const avgDamageMap = useMemo(() => {
        const allEntries = (currentData?.entries ?? []).filter(
            entry => entry.damageType !== TacticusDamageType.Bomb && entry.remainingHp !== 0
        );
        return buildAvgDamageMap(allEntries);
    }, [currentData]);

    const refreshSharedLeaderboards = useCallback(async () => {
        const response = await makeApiCall<unknown>('GET', 'guild/sharedLeaderboards');
        const parsedSharedLb = response.data === undefined ? undefined : safeParseSharedLeaderboards(response.data);
        cachedSharedLeaderboards = parsedSharedLb?.success ? parsedSharedLb.data : undefined;
        setSharedLeaderboards(cachedSharedLeaderboards);
    }, []);

    const fetchData = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const [currentResponse, historyResponse, namesResponse, tokensResponse, sharedLbResponse, guildResponse] =
                await Promise.all([
                    makeApiCall<unknown>('GET', 'guild/raid?history=false'),
                    makeApiCall<unknown>('GET', 'guild/raid?history=true'),
                    makeApiCall<GuildMemberName[]>('GET', 'guild/members/names'),
                    makeApiCall<GuildTokenEntry[]>('GET', 'guild/tokens'),
                    makeApiCall<unknown>('GET', 'guild/sharedLeaderboards'),
                    getTacticusGuildData(),
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
                // Leader: current season is the raw per-hit response, wrapped in { raidResponse: ... }.
                const wrapper = currentResponse.data as { raidResponse?: TacticusGuildRaidResponse } | undefined;
                const raw = wrapper?.raidResponse;
                if (raw) {
                    cachedCurrent = raw;
                    setCurrent(raw);
                }
                const history = { sequenceNumber, seasonData };
                cachedHistory = history;
                setSeasonHistory(history);
                setHistoryError(parseError);
            } else {
                // Member: current season is a single anonymized summary wrapped in { summary: ... }.
                if (currentResponse.data !== undefined) {
                    const wrapper = currentResponse.data as { summary?: unknown } | undefined;
                    const summaryData = wrapper?.summary;
                    if (summaryData !== undefined) {
                        const parsed = safeParseGuildSeasonSummary(summaryData);
                        if (parsed.success) {
                            seasonData = mergeSeasonSummaries(seasonData, parsed.data);
                        } else {
                            parseError ??= parsed.error.message;
                        }
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
            const parsedSharedLb =
                sharedLbResponse.data === undefined ? undefined : safeParseSharedLeaderboards(sharedLbResponse.data);
            cachedSharedLeaderboards = parsedSharedLb?.success ? parsedSharedLb.data : undefined;
            setSharedLeaderboards(cachedSharedLeaderboards);

            // --- guild info ---
            if (guildResponse.data?.guild) {
                const { guildTag, name } = guildResponse.data.guild;
                cachedGuildInfo = { tag: guildTag, name };
                setGuildInfo({ tag: guildTag, name });
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

    return {
        hasGuildApiKey,
        hasAccess,
        isMember,
        memberUserId,
        currentData,
        seasonHistory,
        sharedLeaderboards,
        guildInfo,
        historyError,
        names,
        rawNames,
        tokenData,
        tokenError,
        isRefreshing,
        availableSeasons,
        allPlayers,
        avgDamageMap,
        fetchData,
        refreshSharedLeaderboards,
    };
}
