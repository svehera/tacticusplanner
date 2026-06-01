/* eslint-disable import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure */
import { useCallback, useEffect, useMemo, useState } from 'react';

import { makeApiCall } from '@/fsd/5-shared/api';
import { TacticusDamageType, type TacticusGuildRaidResponse } from '@/fsd/5-shared/lib/tacticus-api';
import { useAuth } from '@/fsd/5-shared/model';

import { NoKeyMessage, DebugJson } from './guild-performance.components';
import { LOADING, type GuildMemberName, type LoadingOrData } from './guild-performance.types';
import { buildAvgDamageMap } from './guild-performance.utils';
import { BossTab } from './tabs/boss-tab';
import { DamageTab } from './tabs/damage-tab';
import { LoopsTab } from './tabs/loops-tab';
import { OverviewTab } from './tabs/overview-tab';
import { PerformanceTab } from './tabs/performance-tab';

// Module-level cache so data persists across navigations
let cachedCurrent: TacticusGuildRaidResponse | undefined;
let cachedHistory: TacticusGuildRaidResponse | undefined;
let cachedNames: Map<string, string> | undefined;
let cachedRawNames: GuildMemberName[] | undefined;

const TAB_IDS = ['overview', 'damage', 'boss', 'loops', 'performance'] as const;
type TabId = (typeof TAB_IDS)[number];

const TAB_LABELS: Record<TabId, string> = {
    overview: 'Overview',
    damage: 'Damage',
    boss: 'Leaderboard',
    loops: 'Loops',
    performance: 'Performance',
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
    const hasGuildApiKey = !!userInfo?.tacticusGuildApiKey;

    const [current, setCurrent] = useState<LoadingOrData<TacticusGuildRaidResponse>>(cachedCurrent ?? LOADING);
    const [history, setHistory] = useState<LoadingOrData<TacticusGuildRaidResponse>>(cachedHistory ?? LOADING);
    const [names, setNames] = useState<Map<string, string>>(cachedNames ?? new Map());
    const [rawNames, setRawNames] = useState<GuildMemberName[] | undefined>(cachedRawNames);
    const [activeTab, setActiveTab] = useState<TabId>('overview');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const currentData = current === LOADING ? undefined : current;
    const historyData = history === LOADING ? undefined : history;

    const avgDamageMap = useMemo(() => {
        const allEntries = [...(currentData?.entries ?? []), ...(historyData?.entries ?? [])].filter(
            entry => entry.damageType !== TacticusDamageType.Bomb && entry.remainingHp !== 0
        );
        return buildAvgDamageMap(allEntries);
    }, [currentData, historyData]);

    const fetchData = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const [currentResponse, historyResponse, namesResponse] = await Promise.all([
                makeApiCall<TacticusGuildRaidResponse>('GET', 'guild/raid?history=false'),
                makeApiCall<TacticusGuildRaidResponse>('GET', 'guild/raid?history=true'),
                makeApiCall<GuildMemberName[]>('GET', 'guild/members/names'),
            ]);
            if (currentResponse.data) {
                cachedCurrent = currentResponse.data;
                setCurrent(currentResponse.data);
            }
            if (historyResponse.data) {
                cachedHistory = historyResponse.data;
                setHistory(historyResponse.data);
            }
            cachedRawNames = namesResponse.data;
            setRawNames(namesResponse.data);
            const nameMap = new Map<string, string>();
            for (const member of namesResponse.data ?? []) {
                if (member.name) nameMap.set(member.userId, member.name);
            }
            cachedNames = nameMap;
            setNames(nameMap);
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        if (!hasGuildApiKey) return;
        if (cachedCurrent !== undefined && cachedHistory !== undefined && cachedNames !== undefined) return;
        void fetchData();
    }, [hasGuildApiKey, fetchData]);

    if (!hasGuildApiKey) return <NoKeyMessage />;

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
            <DebugJson label="guild/raid?history=false" value={currentData ?? 'loading\u2026'} />
            <DebugJson label="guild/raid?history=true" value={historyData ?? 'loading\u2026'} />
            <DebugJson label="guild/members/names" value={rawNames} />
            <TabBar active={activeTab} onChange={setActiveTab} />
            <div className="pt-2">
                <div className={activeTab === 'overview' ? undefined : 'hidden'}>
                    <OverviewTab currentData={currentData} names={names} />
                </div>
                <div className={activeTab === 'damage' ? undefined : 'hidden'}>
                    <DamageTab
                        currentData={currentData}
                        historyData={historyData}
                        names={names}
                        avgDamageMap={avgDamageMap}
                    />
                </div>
                <div className={activeTab === 'boss' ? undefined : 'hidden'}>
                    <BossTab currentData={currentData} historyData={historyData} names={names} />
                </div>
                <div className={activeTab === 'loops' ? undefined : 'hidden'}>
                    <LoopsTab currentData={currentData} historyData={historyData} />
                </div>
                <div className={activeTab === 'performance' ? undefined : 'hidden'}>
                    <PerformanceTab currentData={currentData} historyData={historyData} names={names} />
                </div>
            </div>
        </div>
    );
};
