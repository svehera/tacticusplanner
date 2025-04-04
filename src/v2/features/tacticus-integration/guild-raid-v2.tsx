import React, { useState, useEffect, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ColDef, themeBalham, ValueGetterParams } from 'ag-grid-community';
import {
    TacticusDamageType,
    TacticusEncounterType,
    TacticusGuildRaidEntry,
    TacticusGuildRaidResponse,
    TacticusGuildRaidUnit,
} from './tacticus-integration.models';
import { Rarity } from 'src/models/enums';
import { getTacticusGuildRaidData } from '@/v2/features/tacticus-integration/tacticus-integration.endpoints';
import { mapUserIdToName } from './user-id-mapper';
import { IGuildMember } from '@/models/interfaces';

// Type for aggregated user data
interface UserSummary {
    userId: string;
    totalDamageDealt: number;
    attackCount: number;
    bombCount: number;
    battleCount: number;
    bossCount: number;
    sideBossCount: number;
    highestDamage: number;
    topHeroes: Map<string, number>; // Array of hero names
}

// Helper functions for better display
const getEncounterTypeLabel = (type: TacticusEncounterType): string => {
    return type === TacticusEncounterType.Boss ? 'Boss' : 'Side Boss';
};

const getDamageTypeLabel = (type: TacticusDamageType): string => {
    return type === TacticusDamageType.Battle ? 'Battle' : 'Bomb';
};

const getRarityLabel = (rarity: Rarity): string => {
    switch (rarity) {
        case Rarity.Common:
            return 'Common';
        case Rarity.Uncommon:
            return 'Uncommon';
        case Rarity.Rare:
            return 'Rare';
        case Rarity.Epic:
            return 'Epic';
        case Rarity.Legendary:
            return 'Legendary';
        default:
            return 'Unknown';
    }
};

const TOKEN_REGEN_HOURS = 12;
const millisecondsPerToken = TOKEN_REGEN_HOURS * 60 * 60 * 1000;
interface TokenStatus {
    count: number;
    reloadStart: number;
}

const updateTokenTo = (tokenState: TokenStatus, time: number): void => {
    const restored = Math.floor((time - tokenState.reloadStart) / millisecondsPerToken);
    if (restored + tokenState.count >= 3) {
        // Player has capped, now we have the exact count and time
        tokenState.count = 3;
        tokenState.reloadStart = time;
    } else {
        tokenState.count += restored;
        tokenState.reloadStart += restored * millisecondsPerToken;
    }
};

// Component for rendering HP bar
const HPBarRenderer: React.FC<{ value: number; data: TacticusGuildRaidEntry }> = ({ value, data }) => {
    const percentage = ((data.maxHp - data.remainingHp) / data.maxHp) * 100;
    const damagePercentage = (data.damageDealt / data.maxHp) * 100;

    return (
        <div className="w-full">
            <div className="flex justify-between text-xs mb-1">
                <span>{Math.round(damagePercentage)}% damage</span>
                <span>
                    {data.remainingHp.toLocaleString()} / {data.maxHp.toLocaleString()} HP
                </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-red-600 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
};

// Component for rendering encounter type with icon
const EncounterTypeRenderer: React.FC<{ value: TacticusEncounterType }> = ({ value }) => {
    const bgColor = value === TacticusEncounterType.Boss ? 'bg-red-100' : 'bg-amber-100';
    const textColor = value === TacticusEncounterType.Boss ? 'text-red-800' : 'text-amber-800';
    const icon = value === TacticusEncounterType.Boss ? '👑' : '⚔️';

    return (
        <span className={`px-2 py-1 rounded ${bgColor} ${textColor} text-xs font-medium flex items-center gap-1`}>
            <span>{icon}</span>
            <span>{getEncounterTypeLabel(value)}</span>
        </span>
    );
};

// Component for rendering damage type with icon
const DamageTypeRenderer: React.FC<{ value: TacticusDamageType }> = ({ value }) => {
    const bgColor = value === TacticusDamageType.Battle ? 'bg-blue-100' : 'bg-purple-100';
    const textColor = value === TacticusDamageType.Battle ? 'text-blue-800' : 'text-purple-800';
    const icon = value === TacticusDamageType.Battle ? '⚔️' : '💣';

    return (
        <span className={`px-2 py-1 rounded ${bgColor} ${textColor} text-xs font-medium flex items-center gap-1`}>
            <span>{icon}</span>
            <span>{getDamageTypeLabel(value)}</span>
        </span>
    );
};

// Component for rendering time duration
const DurationRenderer: React.FC<{ data: TacticusGuildRaidEntry }> = ({ data }) => {
    if (!data.startedOn || !data.completedOn) return <span>N/A</span>;

    const startTime = new Date(data.startedOn);
    const endTime = new Date(data.completedOn);
    const durationMs = endTime.getTime() - startTime.getTime();

    // Format duration
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);

    return (
        <span>
            {minutes}m {seconds}s
        </span>
    );
};

// Component for rendering unit details
const UnitDetailsRenderer: React.FC<{ value: TacticusGuildRaidUnit[] }> = ({ value }) => {
    if (!value || value.length === 0) return <span>No heroes</span>;

    const totalPower = value.reduce((sum, unit) => sum + unit.power, 0);

    return (
        <div>
            <div className="font-medium text-sm">{value.length} Heroes</div>
            <div className="text-xs text-gray-500">Total Power: {totalPower.toLocaleString()}</div>
        </div>
    );
};

// Component for rendering date in a readable format
const DateRenderer: React.FC<{ value: number | null | undefined }> = ({ value }) => {
    if (!value) return <span>-</span>;

    const date = new Date(value * 1000);
    return <span>{date.toLocaleString()}</span>;
};

export const TacticusGuildRaidVisualization: React.FC<{ userIdMapper: (userId: string) => string }> = ({
    userIdMapper,
}) => {
    const [raidData, setRaidData] = useState<TacticusGuildRaidResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [userFilters, setUserFilters] = useState<string[]>([]);
    // const [selectedTier, setSelectedTier] = useState<number | null>(null);
    const [selectedUnitType, setSelectedUnitType] = useState<string | null>(null);
    const [filteredEntries, setFilteredEntries] = useState<TacticusGuildRaidEntry[]>([]);

    // Simulating data fetch
    useEffect(() => {
        // In a real application, you would fetch this data from an API
        getTacticusGuildRaidData()
            .then(response => {
                setRaidData(response.data ?? null);
                setLoading(false);

                // Extract unique users and tiers for filtering
                const uniqueUsers = [...new Set(response.data?.entries.map(entry => entry.userId))];
                setUserFilters(uniqueUsers);
                setFilteredEntries(response.data?.entries ?? []);
            })
            .catch(error => {
                setError(error);
            });

        setTimeout(() => {}, 1000);
    }, []);

    // Update filtered entries when filters change
    useEffect(() => {
        if (!raidData) return;

        let filtered = [...raidData.entries];

        if (selectedUnitType !== null) {
            filtered = filtered.filter(entry => entry.unitId === selectedUnitType);
        }

        setFilteredEntries(filtered);
    }, [raidData, selectedUnitType]);

    // AG Grid column definitions
    const columnDefs: ColDef<any>[] = [
        {
            field: 'userId',
            headerName: 'User Nickname',
            valueGetter: col => userIdMapper(col.data?.userId ?? '000'),
            sortable: true,
        },
        {
            headerName: 'User ID',
            field: 'userId',
            sortable: true,
            filter: true,
            width: 120,
        },
        {
            headerName: 'Tier',
            field: 'tier',
            sortable: true,
            filter: true,
            width: 80,
        },
        {
            headerName: 'Set',
            field: 'set',
            sortable: true,
            filter: true,
            width: 80,
        },
        {
            headerName: 'Encounter',
            field: 'encounterType',
            cellRenderer: EncounterTypeRenderer,
            sortable: true,
            filter: true,
            width: 130,
        },
        {
            headerName: 'Enemy Type',
            field: 'type',
            sortable: true,
            filter: true,
            width: 140,
        },
        {
            headerName: 'HP',
            field: 'damageDealt',
            cellRenderer: HPBarRenderer,
            sortable: true,
            filter: true,
            width: 240,
        },
        {
            headerName: 'Damage',
            field: 'damageDealt',
            valueFormatter: params => params.value.toLocaleString(),
            sortable: true,
            filter: true,
            width: 120,
        },
        {
            headerName: 'Attack Type',
            field: 'damageType',
            cellRenderer: DamageTypeRenderer,
            sortable: true,
            filter: true,
            width: 130,
        },
        {
            headerName: 'Started',
            field: 'startedOn',
            cellRenderer: DateRenderer,
            sortable: true,
            filter: true,
            width: 180,
            sort: 'desc',
        },
        {
            headerName: 'Completed',
            field: 'completedOn',
            cellRenderer: DateRenderer,
            sortable: true,
            filter: true,
            width: 180,
        },
        {
            headerName: 'Duration',
            field: 'completedOn',
            cellRenderer: DurationRenderer,
            sortable: true,
            filter: true,
            width: 120,
        },
        {
            headerName: 'Heroes',
            field: 'heroDetails',
            cellRenderer: UnitDetailsRenderer,
            sortable: false,
            filter: false,
            width: 150,
        },
    ];

    // Calculate summary statistics
    const calculateStats = () => {
        if (!raidData || !filteredEntries.length) return null;

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
        filteredEntries.forEach(entry => {
            userParticipation.set(entry.userId, (userParticipation.get(entry.userId) || 0) + 1);
        });

        // Most active user
        let mostActiveUser = '';
        let mostActiveCount = 0;
        userParticipation.forEach((count, user: string) => {
            if (count > mostActiveCount) {
                mostActiveUser = userIdMapper(user);
                mostActiveCount = count;
            }
        });

        // Highest damage in a single attack
        const highestDamage = filteredEntries.reduce((max, entry) => Math.max(max, entry.damageDealt), 0);

        // User with highest damage
        const userWithHighestDamage = userIdMapper(
            filteredEntries.find(entry => entry.damageDealt === highestDamage)?.userId || ''
        );

        // Attacks that defeated enemies (remaining HP = 0)
        const defeatedEnemies = filteredEntries.filter(entry => entry.remainingHp === 0).length;

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
        };
    };

    const stats = calculateStats();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-muted-fg">Loading raid data...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-danger/20 border border-danger/70 text-danger-fg px-4 py-3 rounded">
                <p>{error}</p>
            </div>
        );
    }

    if (!raidData) {
        return (
            <div className="bg-warning/20 border border-warning/70 text-warning-fg px-4 py-3 rounded">
                <p>No raid data available.</p>
            </div>
        );
    }

    // Get unique tiers for filter dropdown
    const units = [...new Set(raidData.entries.map(entry => entry.unitId))].sort();

    // Add this component near other renderers
    const BombStatusRenderer: React.FC<{ data: UserSummary }> = ({ data }) => {
        const BOMB_COOLDOWN_HOURS = 18;
        const lastBombTime = filteredEntries
            .filter(
                entry =>
                    entry.userId === data.userId &&
                    entry.damageType === TacticusDamageType.Bomb &&
                    entry.completedOn != null
            )
            .map(entry => entry.completedOn! * 1000) // Convert seconds to milliseconds
            .sort((a, b) => b - a)[0];

        if (!lastBombTime) {
            return <span className="px-2 py-1 rounded bg-green-100 text-green-800 text-xs font-medium">Available</span>;
        }

        const timeSince = Date.now() - lastBombTime;
        const timeUntilNext = BOMB_COOLDOWN_HOURS * 60 * 60 * 1000 - timeSince;

        if (timeUntilNext <= 0) {
            return <span className="px-2 py-1 rounded bg-green-100 text-green-800 text-xs font-medium">Available</span>;
        }

        const hoursLeft = Math.floor(timeUntilNext / (1000 * 60 * 60));
        const minutesLeft = Math.floor((timeUntilNext % (1000 * 60 * 60)) / (1000 * 60));

        return (
            <span className="text-sm">
                {hoursLeft}h {minutesLeft}m
            </span>
        );
    };

    const TokenStatusRenderer: React.FC<{ data: UserSummary }> = ({ data }) => {
        const now = Date.now();

        // Initialize with worst case scenario:
        // season started at first damage, user had played his 3 token at the exact end of last season
        // 2 tokens recharged from the 24H inter season
        const firstEntryStart = raidData.entries.find(entry => entry.startedOn !== null)?.startedOn ?? 0 * 1000;
        const seasonStart = firstEntryStart === 0 ? now : firstEntryStart;
        const tokenStatus = {
            count: 2,
            reloadStart: seasonStart,
        };

        raidData.entries
            .filter(
                entry =>
                    entry.userId === data.userId &&
                    entry.damageType === TacticusDamageType.Battle &&
                    entry.startedOn != null
            )
            .forEach(entry => {
                updateTokenTo(tokenStatus, entry.startedOn! * 1000);
                tokenStatus.count--;
                if (tokenStatus.count < 0) {
                    // Estimation was too pessimist, let's refine according to this datapoint
                    tokenStatus.count = 0;
                    tokenStatus.reloadStart = entry.startedOn! * 1000;
                }
            });
        updateTokenTo(tokenStatus, now);

        if (tokenStatus.count > 0) {
            // If tokens are avaiable, show the number
            return (
                <span className="px-2 py-1 rounded bg-green-100 text-green-800 text-xs font-medium">
                    {tokenStatus.count} token{tokenStatus.count > 1 ? 's' : ''} available
                </span>
            );
        } else {
            // Otherwise show cooldown until next token
            const timeReloading = now - tokenStatus.reloadStart;
            const cooldown = millisecondsPerToken - timeReloading;
            const hoursCooldown = Math.floor(cooldown / (1000 * 60 * 60));
            const minutesCooldown = Math.floor((cooldown % (1000 * 60 * 60)) / (1000 * 60));
            return (
                <span className="text-sm">
                    {hoursCooldown}h {minutesCooldown}m remaining cooldown
                </span>
            );
        }
    };

    const summaryColumnDefs: ColDef<UserSummary>[] = [
        {
            field: 'userId',
            headerName: 'User Nickname',
            valueGetter: col => userIdMapper(col.data?.userId ?? '000'),
            sortable: true,
        },
        { field: 'userId', headerName: 'Player ID', filter: true },
        {
            field: 'totalDamageDealt',
            headerName: 'Total Damage',
            filter: 'agNumberColumnFilter',
            valueFormatter: params => params.value.toLocaleString(),
        },
        {
            headerName: 'Bomb Status',
            field: 'userId',
            cellRenderer: BombStatusRenderer,
            sortable: false,
            width: 120,
        },
        {
            headerName: 'Token Status',
            field: 'userId',
            cellRenderer: TokenStatusRenderer,
            sortable: false,
            width: 120,
        },
        { field: 'attackCount', headerName: 'Total Attacks' },
        { field: 'bossCount', headerName: 'Boss Attacks' },
        { field: 'sideBossCount', headerName: 'Side Boss Attacks' },
        { field: 'battleCount', headerName: 'Battle Attacks' },
        { field: 'bombCount', headerName: 'Bomb Attacks' },
        {
            field: 'highestDamage',
            headerName: 'Highest Damage',
            valueFormatter: params => params.value.toLocaleString(),
        },

        {
            headerName: 'Avg Damage/Attack',
            valueGetter: (params: ValueGetterParams) => {
                return params.data.attackCount > 0 ? params.data.totalDamageDealt / params.data.attackCount : 0;
            },
            valueFormatter: params => Math.round(params.value).toLocaleString(),
        },
        {
            headerName: 'Most Used Heroes',
            field: 'topHeroes',
            width: 200,
            valueFormatter: params => {
                const topHeroes = [...params.value.entries()]
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([key]) => key);
                return topHeroes.join(', ');
            },
        },
    ];

    const summaryData = useMemo(() => {
        // Generate summary data by user
        const userMap = new Map<string, UserSummary>();

        filteredEntries.forEach(entry => {
            if (!userMap.has(entry.userId)) {
                userMap.set(entry.userId, {
                    userId: entry.userId,
                    totalDamageDealt: 0,
                    attackCount: 0,
                    bombCount: 0,
                    battleCount: 0,
                    bossCount: 0,
                    sideBossCount: 0,
                    highestDamage: 0,
                    topHeroes: new Map(),
                });
            }

            const userSummary = userMap.get(entry.userId)!;
            userSummary.totalDamageDealt += entry.damageDealt;
            userSummary.attackCount += 1;

            if (entry.damageType === TacticusDamageType.Bomb) {
                userSummary.bombCount += 1;
            } else {
                userSummary.battleCount += 1;
            }

            if (entry.encounterType === TacticusEncounterType.Boss) {
                userSummary.bossCount += 1;
            } else {
                userSummary.sideBossCount += 1;
            }

            // Track highest damage
            if (entry.damageDealt > userSummary.highestDamage) {
                userSummary.highestDamage = entry.damageDealt;
            }

            // Track top heroes
            entry.heroDetails.forEach(hero => {
                userSummary.topHeroes.set(hero.unitId, (userSummary.topHeroes.get(hero.unitId) || 0) + 1);
            });
        });

        return Array.from(userMap.values());
    }, [filteredEntries]);

    return (
        <div className="container mx-auto p-4">
            {/* Raid Header */}
            <div className="bg-gradient-to-r from-purple-700 to-indigo-800 rounded-lg shadow-lg p-6 mb-6 text-white">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Guild Raid Season {raidData.season}</h1>
                        <div className="flex items-center mt-2">
                            <span className="text-sm">Config ID: {raidData.seasonConfigId}</span>
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-4xl font-bold">{raidData.entries.length}</div>
                        <div className="text-sm uppercase tracking-wide">Total Attacks</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            {/* <div className="bg-white rounded-lg shadow p-4 mb-6">
                <h2 className="text-lg font-semibold mb-3">Filters</h2>
                <div className="flex flex-wrap gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unit ID</label>
                        <select
                            className="block w-32 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            value={selectedUnitType === null ? '' : selectedUnitType}
                            onChange={e => setSelectedUnitType(e.target.value === '' ? null : e.target.value)}>
                            <option value="">All Units</option>
                            {units.map(unitId => (
                                <option key={unitId} value={unitId}>
                                    {unitId}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div> */}

            {/* Stats Dashboard */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-overlay rounded-lg shadow p-4">
                        <div className="text-muted-fg text-sm">Total Damage</div>
                        <div className="text-2xl font-bold mt-1 text-overlay-fg">
                            {stats.totalDamage.toLocaleString()}
                        </div>
                    </div>
                    <div className="bg-overlay rounded-lg shadow p-4">
                        <div className="text-muted-fg text-sm">Average Damage</div>
                        <div className="text-2xl font-bold mt-1 text-overlay-fg">
                            {Math.round(stats.avgDamage).toLocaleString()}
                        </div>
                    </div>
                    <div className="bg-overlay rounded-lg shadow p-4">
                        <div className="text-muted-fg text-sm">Participants</div>
                        <div className="text-2xl font-bold mt-1 text-overlay-fg">{stats.userCount}</div>
                    </div>
                    <div className="bg-overlay rounded-lg shadow p-4">
                        <div className="text-muted-fg text-sm">Enemies Defeated</div>
                        <div className="text-2xl font-bold mt-1 text-overlay-fg">{stats.defeatedEnemies}</div>
                    </div>
                </div>
            )}

            {/* Attack Type Breakdown */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-overlay rounded-lg shadow p-4">
                        <h2 className="text-lg font-semibold mb-3 text-overlay-fg">Attack Types</h2>
                        <div className="flex h-8 rounded-md overflow-hidden">
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
                    <div className="bg-overlay rounded-lg shadow p-4">
                        <h2 className="text-lg font-semibold mb-3 text-overlay-fg">Encounter Types</h2>
                        <div className="flex h-8 rounded-md overflow-hidden">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-overlay rounded-lg shadow p-4">
                        <h2 className="text-lg font-semibold mb-3 text-overlay-fg">Most Active</h2>
                        <div className="flex items-center">
                            <div className="bg-accent/20 p-3 rounded-full mr-4">
                                <svg
                                    className="h-6 w-6 text-accent"
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
                                <div className="font-medium text-overlay-fg">{stats.mostActiveUser}</div>
                                <div className="text-sm text-muted-fg">{stats.mostActiveCount} attacks</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-overlay rounded-lg shadow p-4">
                        <h2 className="text-lg font-semibold mb-3 text-overlay-fg">Highest Damage</h2>
                        <div className="flex items-center">
                            <div className="bg-danger/20 p-3 rounded-full mr-4">
                                <svg
                                    className="h-6 w-6 text-danger"
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
                                <div className="font-medium text-overlay-fg">{stats.userWithHighestDamage}</div>
                                <div className="text-sm text-muted-fg">
                                    {stats.highestDamage.toLocaleString()} damage
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Player Summary Table */}
            <div className="bg-overlay rounded-lg shadow p-4 mb-6">
                <h2 className="text-lg font-semibold mb-3 text-overlay-fg">Player Summary</h2>
                <div className="ag-theme-alpine w-full h-96">
                    <AgGridReact
                        modules={[AllCommunityModule]}
                        theme={themeBalham}
                        rowData={summaryData}
                        columnDefs={summaryColumnDefs}
                        defaultColDef={{
                            resizable: true,
                        }}
                    />
                </div>
            </div>

            {/* Raid Entries Table */}
            <div className="bg-overlay rounded-lg shadow p-4">
                <h2 className="text-lg font-semibold mb-3 text-overlay-fg">Raid Attacks</h2>
                <div className="ag-theme-alpine w-full h-96">
                    <AgGridReact
                        modules={[AllCommunityModule]}
                        theme={themeBalham}
                        rowData={filteredEntries}
                        columnDefs={columnDefs}
                        defaultColDef={{
                            resizable: true,
                        }}
                    />
                </div>
            </div>
        </div>
    );
};
