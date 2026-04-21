import { ColDef, ITooltipParams, ValueGetterParams } from 'ag-grid-community';
import { useCallback, useMemo, useRef } from 'react';

import {
    TacticusEncounterType,
    TacticusGuildRaidEntry,
    TacticusGuildRaidUnit,
    // eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
} from '@/fsd/5-shared/lib/tacticus-api';

import {
    BombStatusRenderer,
    DamageTypeRenderer,
    DateRenderer,
    DurationRenderer,
    EncounterTypeRenderer,
    HeroesColumnRenderer,
    HPBarRenderer,
    MoWColumnRenderer,
    RarityColumnRenderer,
    TokenStatusRenderer,
    TopHeroesColumnRenderer,
    TopMoWColumnRenderer,
} from './guild-raid-renderers';
import { TokenStatus, UserSummary, MAX_TOKEN, HOUR, millisecondsPerToken } from './guild-raid.model';

export interface GridContext {
    userIdMapper: (userId: string) => string;
}

// Shifts `userIdMapper` to column render time so that columnDefs can live
// as static module-level objects without capturing a stale closure.
export const useUserIdMapper = (userIdMapper: (userId: string) => string): GridContext => {
    const reference = useRef(userIdMapper);
    reference.current = userIdMapper;
    const stableMapper = useCallback((userId: string) => reference.current(userId), []);
    return useMemo(() => ({ userIdMapper: stableMapper }), [stableMapper]);
};

export const columnDefs: ColDef<TacticusGuildRaidEntry>[] = [
    {
        field: 'userId',
        headerName: 'User Nickname',
        valueGetter: (col: ValueGetterParams<TacticusGuildRaidEntry>) =>
            (col.context as GridContext | undefined)?.userIdMapper(col.data?.userId ?? '000'),
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
        cellRenderer: RarityColumnRenderer,
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
        cellRenderer: HeroesColumnRenderer,
        valueFormatter: params => params.value?.map((unit: TacticusGuildRaidUnit) => unit.unitId).join(', '),
    },
    {
        headerName: 'MoW',
        field: 'machineOfWarDetails',
        sortable: false,
        filter: true,
        width: 80,
        cellRenderer: MoWColumnRenderer,
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

export const summaryColumnDefs: ColDef<UserSummary>[] = [
    {
        field: 'userId',
        headerName: 'User Nickname',
        valueGetter: (col: ValueGetterParams<UserSummary>) =>
            (col.context as GridContext | undefined)?.userIdMapper(col.data?.userId ?? '000'),
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
            if (tokenStatus.count === 0) return `no token, ${hoursCooldown}h cooldown`;
            return `${tokenStatus.count} token${tokenStatus.count > 1 ? 's' : ''}, ${hoursCooldown}h cooldown`;
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
        tooltipValueGetter: (parameter: ITooltipParams) => {
            return parameter.data.tokenStatus.exact
                ? 'Token estimation should be exact unless tokens were lost or restored'
                : 'Token estimation is pessimistic by up to 12 hours';
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
        headerName: 'Avg Dmg/Boss',
        valueGetter: (params: ValueGetterParams) => {
            return params.data.battleBossCount > 0 ? params.data.bossDamage / params.data.battleBossCount : 0;
        },
        valueFormatter: params => Math.round(params.value).toLocaleString(),
        width: 120,
    },
    {
        headerName: 'Avg Dmg/Side Boss',
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
        cellRenderer: TopHeroesColumnRenderer,
        valueFormatter: params => {
            const topHeroes = [...params.value.entries()]
                .toSorted((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([key]) => key);
            return topHeroes.join(', ');
        },
    },
    {
        headerName: 'Most Used MoW',
        field: 'topMachinesOfWar',
        width: 120,
        cellRenderer: TopMoWColumnRenderer,
        valueFormatter: params => {
            const topMoW = [...params.value.entries()]
                .toSorted((a, b) => b[1] - a[1])
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
                .toSorted((a, b) => b[1] - a[1])
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
                .toSorted((a, b) => b[1] - a[1])
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
