import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Button, Checkbox, FormControlLabel } from '@mui/material';
import { AllCommunityModule, themeBalham } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { enqueueSnackbar } from 'notistack';
import React, { useState, useEffect, useMemo } from 'react';

import {
    TacticusEncounterType,
    TacticusDamageType,
    TacticusGuildRaidEntry,
    TacticusGuildRaidResponse,
    getTacticusGuildRaidData,
    // eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
} from '@/fsd/5-shared/lib/tacticus-api';

import { columnDefs, summaryColumnDefs, useUserIdMapper } from './guild-raid-column-defs';
import { UserSummary, updateTokenTo, getTimeUntilNextBomb, MINUTE } from './guild-raid.model';

export const TacticusGuildRaidVisualization: React.FC<{ userIdMapper: (userId: string) => string }> = ({
    userIdMapper,
}) => {
    const [raidData, setRaidData] = useState<TacticusGuildRaidResponse>();
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>();
    const [filteredEntries, setFilteredEntries] = useState<TacticusGuildRaidEntry[]>([]);
    const [currentTime, setCurrentTime] = useState(() => Date.now());

    useEffect(() => {
        getTacticusGuildRaidData()
            .then(response => {
                setRaidData(response.data);
                setFilteredEntries(response.data?.entries ?? []);
            })
            .catch((error_: unknown) => {
                setError(error_ instanceof Error ? error_.message : String(error_));
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        const intervalId = globalThis.setInterval(() => setCurrentTime(Date.now()), MINUTE);
        return () => globalThis.clearInterval(intervalId);
    }, []);

    // Update filtered entries when filters change
    useEffect(() => {
        if (!raidData) return;

        setFilteredEntries([...raidData.entries]);
    }, [raidData]);

    const gridContext = useUserIdMapper(userIdMapper);

    const summaryData = useMemo(() => {
        if (!raidData) return [];

        const now = currentTime;

        // Worst case scenario: season started at first damage
        const firstEntryStart =
            (raidData.entries.find(entry => Number.isFinite(entry.startedOn))?.startedOn ?? 0) * 1000;
        const seasonStart = firstEntryStart === 0 ? now : firstEntryStart;

        const userMap = new Map<string, UserSummary>();

        for (const entry of filteredEntries) {
            if (!userMap.has(entry.userId)) {
                userMap.set(entry.userId, {
                    userId: entry.userId,
                    lastBombTime: 0,
                    // Worst case scenario: user had played his 3 token at the exact end of last season
                    // 2 tokens recharged from the 24H inter season
                    tokenStatus: {
                        count: 2,
                        reloadStart: seasonStart,
                        exact: false,
                    },
                    totalDamageDealt: 0,
                    battleBossCount: 0,
                    battleSideBossCount: 0,
                    bombCount: 0,
                    totalBattleCount: 0,
                    highestDamage: 0,
                    bossDamage: 0,
                    sideBossDamage: 0,
                    topHeroes: new Map(),
                    topMachinesOfWar: new Map(),
                    topBosses: new Map(),
                    topSideBosses: new Map(),
                });
            }

            const userSummary = userMap.get(entry.userId)!;
            userSummary.totalDamageDealt += entry.damageDealt;

            if (entry.damageType === TacticusDamageType.Bomb) {
                userSummary.bombCount += 1;
                if (entry.completedOn !== undefined) {
                    userSummary.lastBombTime = entry.completedOn! * 1000;
                }
            } else {
                // Battle attacks
                userSummary.totalBattleCount += 1;
                if (entry.encounterType === TacticusEncounterType.Boss) {
                    userSummary.battleBossCount += 1;
                    userSummary.bossDamage += entry.damageDealt;
                    // Track boss encounters
                    userSummary.topBosses.set(entry.type, (userSummary.topBosses.get(entry.type) || 0) + 1);
                } else {
                    userSummary.battleSideBossCount += 1;
                    userSummary.sideBossDamage += entry.damageDealt;
                    // Track side boss encounters
                    const match = entry.unitId.match(/MiniBoss\d+(.+)/);
                    const unitId = match ? match[1] : entry.unitId;
                    userSummary.topSideBosses.set(unitId, (userSummary.topSideBosses.get(unitId) || 0) + 1);
                }

                if (entry.startedOn !== undefined) {
                    // update token status at entry.startedOn
                    updateTokenTo(userSummary.tokenStatus, entry.startedOn! * 1000);
                    // one token was used for this battle attack
                    userSummary.tokenStatus.count--;

                    if (userSummary.tokenStatus.count < 0) {
                        // Estimation was too pessimist, let's refine according to this datapoint
                        userSummary.tokenStatus.count = 0;
                        userSummary.tokenStatus.reloadStart = entry.startedOn! * 1000;
                    }
                }
            }

            // Track highest damage
            if (entry.damageDealt > userSummary.highestDamage) {
                userSummary.highestDamage = entry.damageDealt;
            }

            // Track top heroes
            for (const hero of entry.heroDetails) {
                userSummary.topHeroes.set(hero.unitId, (userSummary.topHeroes.get(hero.unitId) || 0) + 1);
            }

            // Track top machines of war
            if (entry.machineOfWarDetails?.unitId) {
                userSummary.topMachinesOfWar.set(
                    entry.machineOfWarDetails.unitId,
                    (userSummary.topMachinesOfWar.get(entry.machineOfWarDetails.unitId) || 0) + 1
                );
            }
        }

        // Advance token status to now
        for (const userSummary of userMap.values()) updateTokenTo(userSummary.tokenStatus, now);

        return [...userMap.values()];
    }, [raidData, filteredEntries, currentTime]);

    const stats = useMemo(() => {
        if (!raidData || filteredEntries.length === 0) return;

        // Total damage dealt across all entries
        const totalDamage = filteredEntries.reduce((sum, entry) => sum + entry.damageDealt, 0);

        // Average damage per entry
        const avgDamage = totalDamage / filteredEntries.length;

        // Count of battle vs bomb attacks
        const battleAttacks = filteredEntries.filter(entry => entry.damageType === TacticusDamageType.Battle).length;
        const bombAttacks = filteredEntries.filter(entry => entry.damageType === TacticusDamageType.Bomb).length;

        // Boss vs Side Boss encounters
        const bossEncounters = filteredEntries.filter(
            entry => entry.encounterType === TacticusEncounterType.Boss
        ).length;
        const sideBossEncounters = filteredEntries.filter(
            entry => entry.encounterType === TacticusEncounterType.SideBoss
        ).length;

        // User participation count
        const userParticipation = new Map();
        for (const entry of filteredEntries) {
            userParticipation.set(entry.userId, (userParticipation.get(entry.userId) || 0) + 1);
        }

        // Most active user
        let mostActiveUser = '';
        let mostActiveCount = 0;
        for (const [user, count] of userParticipation) {
            if (count > mostActiveCount) {
                mostActiveUser = userIdMapper(user);
                mostActiveCount = count;
            }
        }

        // Highest damage in a single attack
        const highestDamage = Math.max(0, ...filteredEntries.map(entry => entry.damageDealt));

        // User with highest damage
        const userWithHighestDamage = userIdMapper(
            filteredEntries.find(entry => entry.damageDealt === highestDamage)?.userId || ''
        );

        // Attacks that defeated enemies (remaining HP = 0)
        const defeatedEnemies = filteredEntries.filter(entry => entry.remainingHp === 0).length;

        // Number of available bombs at calculation time
        const availableBombs = summaryData.reduce(
            (accumulator, userSummary) => accumulator + (getTimeUntilNextBomb(userSummary) === 0 ? 1 : 0),
            0
        );

        // Number of available tokens at calculation time
        const availableTokens = summaryData.reduce(
            (accumulator, userSummary) => accumulator + userSummary.tokenStatus.count,
            0
        );

        return {
            totalDamage,
            avgDamage,
            battleAttacks,
            bombAttacks,
            bossEncounters,
            sideBossEncounters,
            mostActiveUser,
            mostActiveCount,
            highestDamage,
            userWithHighestDamage,
            defeatedEnemies,
            userCount: userParticipation.size,
            availableBombs,
            availableTokens,
        };
    }, [raidData, filteredEntries, summaryData, userIdMapper]);

    const [usePrefixForCopyUser, setSePrefixForCopyUser] = useState<boolean>(true);

    const getPrefixForCopyUser = () => (usePrefixForCopyUser ? '@' : '');

    const copyUsersWithBomb = () => {
        const usersWithBomb = summaryData
            .filter((userSummary: UserSummary) => getTimeUntilNextBomb(userSummary) === 0)
            .map((userSummary: UserSummary) => getPrefixForCopyUser() + userIdMapper(userSummary.userId));

        navigator.clipboard
            .writeText(usersWithBomb.join(' '))
            .then(_ => enqueueSnackbar('Copied', { variant: 'success' }));
    };

    const copyUsersWithToken = () => {
        const usersWithTokens = summaryData
            .filter((userSummary: UserSummary) => userSummary.tokenStatus.count > 0)
            .map((userSummary: UserSummary) => getPrefixForCopyUser() + userIdMapper(userSummary.userId));

        navigator.clipboard
            .writeText(usersWithTokens.join(' '))
            .then(_ => enqueueSnackbar('Copied', { variant: 'success' }));
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="text-muted-fg">Loading raid data...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-danger/20 border-danger/70 text-danger-fg rounded border px-4 py-3">
                <p>{error}</p>
            </div>
        );
    }

    if (!raidData) {
        return (
            <div className="bg-warning/20 border-warning/70 text-warning-fg rounded border px-4 py-3">
                <p>No raid data available.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            {/* Raid Header */}
            <div className="mb-6 rounded-lg bg-gradient-to-r from-purple-700 to-indigo-800 p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Guild Raid Season {raidData.season}</h1>
                        <div className="mt-2 flex items-center">
                            <span className="text-sm">Config ID: {raidData.seasonConfigId}</span>
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-4xl font-bold">{raidData.entries.length}</div>
                        <div className="text-sm tracking-wide uppercase">Total Attacks</div>
                    </div>
                </div>
            </div>

            {/* Stats Dashboard */}
            {stats && (
                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div className="bg-overlay rounded-lg p-4 shadow">
                        <div className="text-muted-fg text-sm">Total Damage</div>
                        <div className="text-overlay-fg mt-1 text-2xl font-bold">
                            {stats.totalDamage.toLocaleString()}
                        </div>
                    </div>
                    <div className="bg-overlay rounded-lg p-4 shadow">
                        <div className="text-muted-fg text-sm">Average Damage</div>
                        <div className="text-overlay-fg mt-1 text-2xl font-bold">
                            {Math.round(stats.avgDamage).toLocaleString()}
                        </div>
                    </div>
                    <div className="bg-overlay rounded-lg p-4 shadow">
                        <div className="text-muted-fg text-sm">Participants</div>
                        <div className="text-overlay-fg mt-1 text-2xl font-bold">{stats.userCount}</div>
                    </div>
                    <div className="bg-overlay rounded-lg p-4 shadow">
                        <div className="text-muted-fg text-sm">Enemies Defeated</div>
                        <div className="text-overlay-fg mt-1 text-2xl font-bold">{stats.defeatedEnemies}</div>
                    </div>
                    <div className="bg-overlay rounded-lg p-4 shadow">
                        <div className="text-muted-fg text-sm">Available Bombs</div>
                        <div className="text-overlay-fg mt-1 text-2xl font-bold">{stats.availableBombs}</div>
                    </div>
                    <div className="bg-overlay rounded-lg p-4 shadow">
                        <div className="text-muted-fg text-sm">Available Tokens</div>
                        <div className="text-overlay-fg mt-1 text-2xl font-bold">{stats.availableTokens}</div>
                    </div>
                </div>
            )}

            {/* Attack Type Breakdown */}
            {stats && (
                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="bg-overlay rounded-lg p-4 shadow">
                        <h2 className="text-overlay-fg mb-3 text-lg font-semibold">Attack Types</h2>
                        <div className="flex h-8 overflow-hidden rounded-md">
                            <div
                                className="bg-accent text-accent-fg flex items-center justify-center text-sm"
                                style={{
                                    width: `${(stats.battleAttacks / (stats.battleAttacks + stats.bombAttacks)) * 100}%`,
                                }}>
                                {stats.battleAttacks} Battle
                            </div>
                            <div
                                className="bg-secondary text-secondary-fg flex items-center justify-center text-sm"
                                style={{
                                    width: `${(stats.bombAttacks / (stats.battleAttacks + stats.bombAttacks)) * 100}%`,
                                }}>
                                {stats.bombAttacks} Bomb
                            </div>
                        </div>
                    </div>
                    <div className="bg-overlay rounded-lg p-4 shadow">
                        <h2 className="text-overlay-fg mb-3 text-lg font-semibold">Encounter Types</h2>
                        <div className="flex h-8 overflow-hidden rounded-md">
                            <div
                                className="bg-danger text-danger-fg flex items-center justify-center text-sm"
                                style={{
                                    width: `${(stats.bossEncounters / (stats.bossEncounters + stats.sideBossEncounters)) * 100}%`,
                                }}>
                                {stats.bossEncounters} Boss
                            </div>
                            <div
                                className="bg-warning text-warning-fg flex items-center justify-center text-sm"
                                style={{
                                    width: `${(stats.sideBossEncounters / (stats.bossEncounters + stats.sideBossEncounters)) * 100}%`,
                                }}>
                                {stats.sideBossEncounters} Side Boss
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Performers */}
            {stats && (
                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="bg-overlay rounded-lg p-4 shadow">
                        <h2 className="text-overlay-fg mb-3 text-lg font-semibold">Most Active</h2>
                        <div className="flex items-center">
                            <div className="bg-accent/20 mr-4 rounded-full p-3">
                                <svg
                                    className="text-accent h-6 w-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                </svg>
                            </div>
                            <div>
                                <div className="text-overlay-fg font-medium">{stats.mostActiveUser}</div>
                                <div className="text-muted-fg text-sm">{stats.mostActiveCount} attacks</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-overlay rounded-lg p-4 shadow">
                        <h2 className="text-overlay-fg mb-3 text-lg font-semibold">Highest Damage</h2>
                        <div className="flex items-center">
                            <div className="bg-danger/20 mr-4 rounded-full p-3">
                                <svg
                                    className="text-danger h-6 w-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                                </svg>
                            </div>
                            <div>
                                <div className="text-overlay-fg font-medium">{stats.userWithHighestDamage}</div>
                                <div className="text-muted-fg text-sm">
                                    {stats.highestDamage.toLocaleString()} damage
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Player Summary Table */}
            <div className="bg-overlay mb-6 rounded-lg p-4 shadow">
                <h2 className="text-overlay-fg mb-3 text-lg font-semibold">Player Summary</h2>
                <div className="mb-6 flex flex-wrap items-center gap-4">
                    <div>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={usePrefixForCopyUser}
                                    onChange={_event => setSePrefixForCopyUser(!usePrefixForCopyUser)}
                                    inputProps={{ 'aria-label': 'controlled' }}
                                />
                            }
                            label={'@ prefix'}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-overlay-fg font-medium">Users with bomb:</span>
                        <Button onClick={() => copyUsersWithBomb()} color={'inherit'}>
                            <ContentCopyIcon /> Copy
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-overlay-fg font-medium">Users with tokens:</span>
                        <Button onClick={() => copyUsersWithToken()} color={'inherit'}>
                            <ContentCopyIcon /> Copy
                        </Button>
                    </div>
                </div>
                <div className="ag-theme-alpine h-96 w-full">
                    <AgGridReact
                        modules={[AllCommunityModule]}
                        theme={themeBalham}
                        rowData={summaryData}
                        columnDefs={summaryColumnDefs}
                        context={gridContext}
                        defaultColDef={{
                            resizable: true,
                        }}
                        tooltipShowDelay={500}
                    />
                </div>
            </div>

            {/* Raid Entries Table */}
            <div className="bg-overlay rounded-lg p-4 shadow">
                <h2 className="text-overlay-fg mb-3 text-lg font-semibold">Raid Attacks</h2>
                <div className="ag-theme-alpine h-96 w-full">
                    <AgGridReact
                        modules={[AllCommunityModule]}
                        theme={themeBalham}
                        rowData={filteredEntries}
                        columnDefs={columnDefs}
                        context={gridContext}
                        defaultColDef={{
                            resizable: true,
                        }}
                    />
                </div>
            </div>
        </div>
    );
};
