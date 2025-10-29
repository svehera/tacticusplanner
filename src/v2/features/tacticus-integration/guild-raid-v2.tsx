import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Button, Checkbox, FormControlLabel } from '@mui/material';
import {
    AllCommunityModule,
    ColDef,
    ICellRendererParams,
    ITooltipParams,
    themeBalham,
    ValueGetterParams,
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { enqueueSnackbar } from 'notistack';
import React, { useState, useEffect, useMemo } from 'react';

import {
    TacticusEncounterType,
    TacticusDamageType,
    TacticusGuildRaidEntry,
    TacticusGuildRaidResponse,
    getTacticusGuildRaidData,
    TacticusGuildRaidUnit,
} from '@/fsd/5-shared/lib/tacticus-api';
import { RarityIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService } from '@/fsd/4-entities/character/characters.service';
import { ICharacterData } from '@/fsd/4-entities/character/model';
import { IMowStatic2 } from '@/fsd/4-entities/mow/model';
import { MowsService } from '@/fsd/4-entities/mow/mows.service';

// Type for aggregated user data
interface UserSummary {
    userId: string;
    lastBombTime: number;
    tokenStatus: TokenStatus;
    totalDamageDealt: number;
    battleBossCount: number;
    battleSideBossCount: number;
    totalBattleCount: number;
    bombCount: number;
    highestDamage: number;
    bossDamage: number; // Changed from legendaryBossDamage
    sideBossDamage: number; // Changed from legendarySideBossDamage
    topHeroes: Map<string, number>;
    topMachinesOfWar: Map<string, number>;
    topBosses: Map<string, number>;
    topSideBosses: Map<string, number>;
}

// Helper functions for better display
const getEncounterTypeLabel = (type: TacticusEncounterType): string => {
    return type === TacticusEncounterType.Boss ? 'Boss' : 'Side Boss';
};

const getDamageTypeLabel = (type: TacticusDamageType): string => {
    return type === TacticusDamageType.Battle ? 'Battle' : 'Bomb';
};

const MAX_TOKEN = 3;
const TOKEN_REGEN_HOURS = 12;
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const millisecondsPerToken = TOKEN_REGEN_HOURS * HOUR;
interface TokenStatus {
    count: number;
    reloadStart: number;
    exact: boolean;
}

const updateTokenTo = (tokenState: TokenStatus, time: number): void => {
    const restored = Math.floor((time - tokenState.reloadStart) / millisecondsPerToken);
    tokenState.count += restored;
    if (tokenState.count >= MAX_TOKEN) {
        // Player has capped at this point in time, now we have the exact values
        tokenState.count = MAX_TOKEN;
        // Reload hasn't started before `time`
        tokenState.reloadStart = time;
        tokenState.exact = true;
    } else {
        // reload started when last token was restored
        tokenState.reloadStart += restored * millisecondsPerToken;
    }
};

// Component for rendering HP bar
const HPBarRenderer: React.FC<{ value: number; data: TacticusGuildRaidEntry }> = ({ data }) => {
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

    const startTime = new Date(data.startedOn * 1000);
    const endTime = new Date(data.completedOn * 1000);
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

// Component for rendering date in a readable format
const DateRenderer: React.FC<{ value: number | null | undefined }> = ({ value }) => {
    if (!value) return <span>-</span>;

    const date = new Date(value * 1000);
    return <span>{date.toLocaleString()}</span>;
};

// Component for rendering unit icons
const UnitIconRenderer: React.FC<{ value: ICharacterData[] | IMowStatic2[] }> = ({ value }) => {
    return (
        <span className="flex items-center gap-1 h-full">
            {value.map((unit, i) => {
                return (
                    <UnitShardIcon
                        key={i}
                        icon={unit?.roundIcon ?? ''}
                        name={unit?.name ?? ''}
                        height={22}
                        width={22}
                        tooltip={unit?.name ?? ''}
                    />
                );
            })}
        </span>
    );
};

export const TacticusGuildRaidVisualization: React.FC<{ userIdMapper: (userId: string) => string }> = ({
    userIdMapper,
}) => {
    const [raidData, setRaidData] = useState<TacticusGuildRaidResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [filteredEntries, setFilteredEntries] = useState<TacticusGuildRaidEntry[]>([]);

    // Simulating data fetch
    useEffect(() => {
        // In a real application, you would fetch this data from an API
        getTacticusGuildRaidData()
            .then(response => {
                setRaidData(response.data ?? null);
                setLoading(false);

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

        setFilteredEntries([...raidData.entries]);
    }, [raidData]);

    // AG Grid column definitions
    const columnDefs: ColDef<TacticusGuildRaidEntry>[] = [
        {
            field: 'userId',
            headerName: 'User Nickname',
            valueGetter: col => userIdMapper(col.data?.userId ?? '000'),
            sortable: true,
            filter: true,
        },
        {
            headerName: 'User ID',
            field: 'userId',
            sortable: true,
            filter: true,
            width: 120,
        },
        {
            headerName: 'Rarity',
            field: 'rarity',
            sortable: true,
            filter: true,
            width: 80,
            cellRenderer: (props: ICellRendererParams<TacticusGuildRaidEntry>) => {
                const rarity = props.value ?? 0;
                return <RarityIcon rarity={rarity} />;
            },
        },
        {
            headerName: 'Enemy Type',
            field: 'type',
            sortable: true,
            filter: true,
            width: 140,
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
            headerName: 'Unit ID',
            field: 'unitId',
            sortable: true,
            filter: true,
            width: 140,
            valueGetter: params => {
                if (params.data?.encounterType === TacticusEncounterType.SideBoss) {
                    const match = params.data.unitId.match(/MiniBoss\d+(.+)/);
                    return match ? match[1] : params.data.unitId;
                }

                if (params.data?.encounterType === TacticusEncounterType.Boss) {
                    return params.data.type;
                }

                return params.data?.unitId;
            },
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
            headerName: 'Damage',
            field: 'damageDealt',
            valueFormatter: params => params.value.toLocaleString(),
            sortable: true,
            filter: true,
            width: 120,
        },
        {
            headerName: 'Heroes',
            field: 'heroDetails',
            sortable: false,
            filter: true,
            width: 150,
            cellRenderer: (params: ICellRendererParams<TacticusGuildRaidEntry>) => {
                const heroes = params.data?.heroDetails
                    .map((unit: TacticusGuildRaidUnit) => CharactersService.getUnit(unit.unitId))
                    .filter((character): character is ICharacterData => character !== undefined);
                return <UnitIconRenderer value={heroes ?? []} />;
            },
            valueFormatter: params => params.value?.map((unit: TacticusGuildRaidUnit) => unit.unitId).join(', '),
        },
        {
            headerName: 'MoW',
            field: 'machineOfWarDetails',
            sortable: false,
            filter: true,
            width: 80,
            cellRenderer: (params: ICellRendererParams<TacticusGuildRaidEntry>) => {
                const mow = params.data?.machineOfWarDetails?.unitId
                    ? MowsService.resolveToStatic(params.data.machineOfWarDetails.unitId)
                    : undefined;
                const mowArray = mow ? [mow] : [];
                return <UnitIconRenderer value={mowArray} />;
            },
            valueFormatter: params => params.value?.unitId,
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
            headerName: 'Duration',
            field: 'completedOn',
            cellRenderer: DurationRenderer,
            sortable: true,
            filter: true,
            width: 120,
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
    ];

    const getTimeUntilNextBomb = (userSummary: UserSummary) => {
        const BOMB_COOLDOWN_HOURS = 18;
        const lastBombTime = userSummary.lastBombTime;

        if (!lastBombTime) {
            return 0;
        }

        const timeSince = Date.now() - lastBombTime;
        let timeUntilNext = BOMB_COOLDOWN_HOURS * HOUR - timeSince;

        if (timeUntilNext < 0) {
            timeUntilNext = 0;
        }

        return timeUntilNext;
    };

    // Add this component near other renderers
    const BombStatusRenderer: React.FC<{ data: UserSummary }> = ({ data }) => {
        const timeUntilNext = getTimeUntilNextBomb(data);

        if (timeUntilNext === 0) {
            return <span className="px-2 py-1 rounded bg-green-100 text-green-800 text-xs font-medium">Available</span>;
        }

        const hoursLeft = Math.floor(timeUntilNext / HOUR);
        const minutesLeft = Math.floor((timeUntilNext % HOUR) / MINUTE);

        return (
            <span className="text-sm">
                {hoursLeft}h {minutesLeft}m
            </span>
        );
    };

    const TokenStatusRenderer: React.FC<{ data: UserSummary }> = ({ data }) => {
        const tokenStatus = data.tokenStatus;
        const now = Date.now();

        if (tokenStatus.count === MAX_TOKEN) {
            return (
                <span className="px-2 py-1 rounded bg-green-100 text-green-800 text-xs font-medium">
                    {tokenStatus.count} tokens available
                </span>
            );
        } else {
            const timeReloading = now - tokenStatus.reloadStart;
            const cooldown = millisecondsPerToken - timeReloading;
            const hoursCooldown = Math.round(cooldown / HOUR);
            if (tokenStatus.count > 0) {
                return (
                    <span className="px-2 py-1 rounded bg-green-100 text-green-800 text-xs font-medium">
                        {tokenStatus.count} token{tokenStatus.count > 1 ? 's' : ''}, {hoursCooldown}h cooldown
                    </span>
                );
            } else {
                return <span className="text-sm">no token, {hoursCooldown}h cooldown</span>;
            }
        }
    };

    const summaryColumnDefs: ColDef<UserSummary>[] = [
        {
            field: 'userId',
            headerName: 'User Nickname',
            valueGetter: col => userIdMapper(col.data?.userId ?? '000'),
            sortable: true,
            filter: true,
        },
        { field: 'userId', headerName: 'User ID', width: 100, filter: true },
        {
            headerName: 'Bomb Status',
            field: 'lastBombTime',
            cellRenderer: BombStatusRenderer,
            sortable: true,
            width: 120,
            comparator: (lastBombTime1: number, lastBombTime2: number) => lastBombTime2 - lastBombTime1,
        },
        {
            headerName: 'Token Status',
            field: 'tokenStatus',
            cellRenderer: TokenStatusRenderer,
            valueFormatter: params => {
                const tokenStatus = params.value;
                if (tokenStatus.count === MAX_TOKEN) return `${tokenStatus.count} tokens available`;
                const timeReloading = Date.now() - tokenStatus.reloadStart;
                const cooldown = millisecondsPerToken - timeReloading;
                const hoursCooldown = Math.round(cooldown / HOUR);
                if (tokenStatus.count > 0) {
                    return `${tokenStatus.count} token${tokenStatus.count > 1 ? 's' : ''}, ${hoursCooldown}h cooldown`;
                } else {
                    return `no token, ${hoursCooldown}h cooldown`;
                }
            },
            sortable: true,
            comparator: (tokenStatus1: TokenStatus, tokenStatus2: TokenStatus) => {
                const tokenDiff = tokenStatus1.count - tokenStatus2.count;
                if (tokenDiff !== 0) {
                    return tokenDiff;
                }
                // The oldest the reloadStart, the more token we have
                return tokenStatus2.reloadStart - tokenStatus1.reloadStart;
            },
            width: 120,
            tooltipValueGetter: (param: ITooltipParams) => {
                if (param.data.tokenStatus.exact) {
                    return 'Token estimation should be exact unless tokens were lost or restored';
                } else {
                    return 'Token estimation is pessimistic by up to 12 hours';
                }
            },
        },
        {
            field: 'totalDamageDealt',
            headerName: 'Total Damage',
            filter: 'agNumberColumnFilter',
            valueFormatter: params => params.value.toLocaleString(),
            width: 120,
        },
        {
            field: 'battleBossCount',
            headerName: 'Boss Battles',
            width: 80,
        },
        {
            field: 'battleSideBossCount',
            headerName: 'Side Boss Battles',
            width: 80,
        },
        {
            field: 'totalBattleCount',
            headerName: 'Total Battles',
            width: 80,
        },
        {
            field: 'bombCount',
            headerName: 'Bomb Attacks',
            width: 80,
        },
        {
            headerName: 'Avg Dmg/Boss', // Updated header
            valueGetter: (params: ValueGetterParams) => {
                return params.data.battleBossCount > 0 ? params.data.bossDamage / params.data.battleBossCount : 0;
            },
            valueFormatter: params => Math.round(params.value).toLocaleString(),
            width: 120,
        },
        {
            headerName: 'Avg Dmg/Side Boss', // Updated header
            valueGetter: (params: ValueGetterParams) => {
                return params.data.battleSideBossCount > 0
                    ? params.data.sideBossDamage / params.data.battleSideBossCount
                    : 0;
            },
            valueFormatter: params => Math.round(params.value).toLocaleString(),
            width: 120,
        },
        {
            headerName: 'Most Used Heroes',
            field: 'topHeroes',
            width: 160,
            cellRenderer: (params: ICellRendererParams<UserSummary>) => {
                const topHeroes = [...params.value.entries()]
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([key]) => CharactersService.getUnit(key))
                    .filter((character): character is ICharacterData => character !== undefined);
                return <UnitIconRenderer value={topHeroes} />;
            },
            valueFormatter: params => {
                const topHeroes = [...params.value.entries()]
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([key]) => key);
                return topHeroes.join(', ');
            },
        },
        {
            headerName: 'Most Used MoW',
            field: 'topMachinesOfWar',
            width: 120,
            cellRenderer: (params: ICellRendererParams<UserSummary>) => {
                const topMoW = [...params.value.entries()]
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([key]) => MowsService.resolveToStatic(key))
                    .filter((mow): mow is IMowStatic2 => mow !== undefined);
                return <UnitIconRenderer value={topMoW} />;
            },
            valueFormatter: params => {
                const topMoW = [...params.value.entries()]
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([key]) => key);
                return topMoW.join(', ');
            },
        },
        {
            headerName: 'Most Encountered Bosses',
            field: 'topBosses',
            width: 200,
            valueFormatter: params => {
                if (!params.value) return '';
                const topBosses = [...params.value.entries()]
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([key, count]) => `${key}(${count})`);
                return topBosses.join(', ');
            },
        },
        {
            headerName: 'Most Encountered Side Bosses',
            field: 'topSideBosses',
            width: 200,
            valueFormatter: params => {
                if (!params.value) return '';
                const topSideBosses = [...params.value.entries()]
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([key, count]) => `${key}(${count})`);
                return topSideBosses.join(', ');
            },
        },
        {
            field: 'highestDamage',
            headerName: 'Highest Damage',
            valueFormatter: params => params.value.toLocaleString(),
        },
    ];

    const summaryData = useMemo(() => {
        if (raidData === null) return [];

        const now = Date.now();

        // Worst case scenario: season started at first damage
        const firstEntryStart = (raidData.entries.find(entry => entry.startedOn !== null)?.startedOn ?? 0) * 1000;
        const seasonStart = firstEntryStart === 0 ? now : firstEntryStart;

        const userMap = new Map<string, UserSummary>();

        filteredEntries.forEach(entry => {
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
            entry.heroDetails.forEach(hero => {
                userSummary.topHeroes.set(hero.unitId, (userSummary.topHeroes.get(hero.unitId) || 0) + 1);
            });

            // Track top machines of war
            if (entry.machineOfWarDetails?.unitId) {
                userSummary.topMachinesOfWar.set(
                    entry.machineOfWarDetails.unitId,
                    (userSummary.topMachinesOfWar.get(entry.machineOfWarDetails.unitId) || 0) + 1
                );
            }
        });

        // Advance token status to now
        userMap.values().forEach(userSummary => updateTokenTo(userSummary.tokenStatus, now));

        return Array.from(userMap.values());
    }, [filteredEntries]);

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

        // Number of available bombs at calculation time
        const availableBombs = summaryData.reduce(
            (acc, userSummary) => acc + (getTimeUntilNextBomb(userSummary) === 0 ? 1 : 0),
            0
        );

        // Number of available tokens at calculation time
        const availableTokens = summaryData.reduce((acc, userSummary) => acc + userSummary.tokenStatus.count, 0);

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
    };

    const stats = useMemo(() => calculateStats(), [summaryData]);

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
                    <div className="bg-overlay rounded-lg shadow p-4">
                        <div className="text-muted-fg text-sm">Available Bombs</div>
                        <div className="text-2xl font-bold mt-1 text-overlay-fg">{stats.availableBombs}</div>
                    </div>
                    <div className="bg-overlay rounded-lg shadow p-4">
                        <div className="text-muted-fg text-sm">Available Tokens</div>
                        <div className="text-2xl font-bold mt-1 text-overlay-fg">{stats.availableTokens}</div>
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
                <div className="flex flex-wrap items-center gap-4 mb-6">
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
                        <span className="font-medium text-overlay-fg">Users with bomb:</span>
                        <Button onClick={() => copyUsersWithBomb()} color={'inherit'}>
                            <ContentCopyIcon /> Copy
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-overlay-fg">Users with tokens:</span>
                        <Button onClick={() => copyUsersWithToken()} color={'inherit'}>
                            <ContentCopyIcon /> Copy
                        </Button>
                    </div>
                </div>
                <div className="ag-theme-alpine w-full h-96">
                    <AgGridReact
                        modules={[AllCommunityModule]}
                        theme={themeBalham}
                        rowData={summaryData}
                        columnDefs={summaryColumnDefs}
                        defaultColDef={{
                            resizable: true,
                        }}
                        tooltipShowDelay={500}
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
