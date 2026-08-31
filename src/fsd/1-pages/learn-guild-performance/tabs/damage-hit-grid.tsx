/* eslint-disable import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure */
import {
    AllCommunityModule,
    type ColDef,
    type ICellRendererParams,
    type ValueFormatterParams,
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { useMemo, useState } from 'react';

import { snowprintIcons } from '@/fsd/5-shared/assets';
import type { TacticusGuildRaidEntry, TacticusGuildRaidResponse } from '@/fsd/5-shared/lib/tacticus-api';
import { RarityIcon } from '@/fsd/5-shared/ui/icons';

import { CaptureButton, CompIcons, EncounterIcon, SectionHeader } from '../guild-performance.components';
import { captureFileName, useSectionCapture } from '../guild-performance.hook';
import { buildLoopCountMaps, getDamageColorClass } from '../guild-performance.utils';

import { OptionFilter } from './damage-grid-option-filter';
import { buildHitRows, type HitRow } from './damage-tab.utils';

// ---------------------------------------------------------------------------
// Cell renderers
// ---------------------------------------------------------------------------

/** Boss or prime portrait, its rarity and its tier label. */
const TargetCell = ({ data }: ICellRendererParams<HitRow>) => {
    if (!data) return <></>;
    // The raid/bomb token icon moved out to its own sortable Type column.
    return (
        <span className="flex items-center gap-1.5">
            <EncounterIcon unitId={data.entry.unitId} size={22} rarity={data.entry.rarity} />
            <RarityIcon rarity={data.entry.rarity} />
            <span className="truncate">{data.bossName}</span>
        </span>
    );
};

/** Raid token or bomb — its own sortable column rather than an icon buried in the target cell. */
const TypeCell = ({ data }: ICellRendererParams<HitRow>) => {
    if (!data) return <></>;
    return (
        <span className="flex items-center gap-1.5">
            <img
                src={data.isBomb ? snowprintIcons.bombToken.file : snowprintIcons.guildRaidToken.file}
                alt=""
                aria-hidden="true"
                className="h-4 w-4 shrink-0 object-contain"
            />
            <span>{data.hitType}</span>
        </span>
    );
};

/** The heroes and machine of war taken into the hit. */
const CompCell = ({ data }: ICellRendererParams<HitRow>) => {
    if (!data) return <></>;
    const comp = [
        ...data.entry.heroDetails.map(hero => hero.unitId),
        ...(data.entry.machineOfWarDetails ? [data.entry.machineOfWarDetails.unitId] : []),
    ];
    return <CompIcons comp={comp} size={20} />;
};

const compact = (n: number) => n.toLocaleString(undefined, { notation: 'compact', maximumFractionDigits: 1 });

/**
 * One line, not two: compact numbers (`2.1M/37.5M`) beside a short bar keep the row at 36px where
 * stacking forced 44px. Exact figures stay on hover, and the bar is `aria-hidden` because it
 * depicts the number printed next to it.
 */
const HpCell = ({ data }: ICellRendererParams<HitRow>) => {
    if (!data) return <></>;
    return (
        <span
            className="flex items-center gap-1.5"
            title={`${data.remainingHp.toLocaleString()} of ${data.maxHp.toLocaleString()} HP remaining`}>
            <span aria-hidden="true" className="h-1.5 w-10 shrink-0 overflow-hidden rounded-full bg-(--fg)/12">
                <span className="block h-full bg-(--danger)" style={{ width: `${data.hpPct}%` }} />
            </span>
            <span className="text-xs text-(--soft-fg) tabular-nums">
                {compact(data.remainingHp)}/{compact(data.maxHp)}
            </span>
        </span>
    );
};

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

/** Right-aligned tabular figures, so magnitudes line up down a column. */
const numberCell = 'text-right tabular-nums';

/**
 * Columns whose values form a small closed set get a checkbox list instead of a text box. A free-text
 * filter on "Bomb" or "Left prime" made you guess the exact wording and showed you nothing about what
 * the column contains.
 *
 * No `filterParams.doesFilterPass` — AG Grid ignores it for React filters. The predicate is
 * registered inside {@link OptionFilter} via `useGridFilter`.
 */
const optionFilterColumn = { filter: OptionFilter } as const;

// AG Grid types a formatter value as `number | null | undefined`, so narrow with `typeof` rather
// than comparing against one of the three.
const formatVsAvg = ({ value }: ValueFormatterParams<HitRow, number>) =>
    typeof value === 'number' ? `${value >= 0 ? '+' : ''}${value.toFixed(0)}%` : '—';

const formatTime = ({ value }: ValueFormatterParams<HitRow, number>) =>
    typeof value === 'number'
        ? new Date(value).toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
          })
        : '—';

/** Column definitions. Widths are explicit and nothing flexes — see the note in {@link HitGrid}. */
const COLUMNS: ColDef<HitRow>[] = [
    {
        // No column flexes: a flexed column absorbs every spare pixel on its own, so the slack is
        // spread across all of them by `autoSizeStrategy` instead.
        headerName: 'Target',
        field: 'bossName',
        width: 210,
        cellRenderer: TargetCell,
        ...optionFilterColumn,
    },
    { headerName: 'Type', field: 'hitType', width: 115, cellRenderer: TypeCell, ...optionFilterColumn },
    { headerName: 'Slot', field: 'slot', width: 125, ...optionFilterColumn },
    { headerName: 'Player', field: 'playerName', width: 230, ...optionFilterColumn },
    {
        headerName: 'Comp',
        width: 150,
        cellRenderer: CompCell,
        sortable: false,
        filter: false,
        // Nothing to sort or filter on: the cell is a row of portraits, and the units are already
        // reachable through the Target and Player columns.
    },
    {
        headerName: 'Time',
        field: 'completedAt',
        width: 140,
        filter: 'agDateColumnFilter',
        valueFormatter: formatTime,
        sort: 'desc',
        // Newest first, matching the log's previous default order.
    },
    {
        headerName: 'Damage',
        field: 'damage',
        width: 120,
        filter: 'agNumberColumnFilter',
        // `data` is absent while the grid is loading or showing no-rows, and `cellClass` runs then
        // too — every renderer in this file guards for the same reason.
        cellClass: params =>
            params.data === undefined
                ? numberCell
                : [numberCell, getDamageColorClass(params.data.entry, params.data.avgDamage)].join(' '),
        valueFormatter: ({ value }) => (typeof value === 'number' ? value.toLocaleString() : '—'),
    },
    {
        headerName: 'vs avg',
        field: 'vsAvgPct',
        width: 105,
        filter: 'agNumberColumnFilter',
        valueFormatter: formatVsAvg,
        cellClass: params =>
            [
                numberCell,
                params.value === undefined
                    ? 'text-(--soft-fg)'
                    : params.value >= 0
                      ? 'text-(--success)'
                      : 'text-(--danger)',
            ].join(' '),
    },
    { headerName: 'HP left', field: 'remainingHp', width: 145, filter: 'agNumberColumnFilter', cellRenderer: HpCell },
    { headerName: 'Raids', field: 'raids', width: 95, filter: 'agNumberColumnFilter', cellClass: numberCell },
    { headerName: 'Bombs', field: 'bombs', width: 100, filter: 'agNumberColumnFilter', cellClass: numberCell },
];

/**
 * No `floatingFilter`: a permanent band of nine empty inputs reads as clutter, and the same filters
 * live one click away behind each column's menu, with AG Grid marking any column that is filtered.
 */
const DEFAULT_COL_DEF: ColDef<HitRow> = { sortable: true, resizable: true };

// ---------------------------------------------------------------------------
// HitGrid
// ---------------------------------------------------------------------------

/**
 * The per-hit log, as an AG Grid rather than a CSS-grid table.
 *
 * This is the one table on the page where the trade favours a grid: at a full season it is ~559 flat
 * records, so virtualisation renders ~30 rows instead of all of them, and sorting plus per-column
 * filtering are things a guild leader obviously wants and could not do before. It also brings real
 * table semantics with it, so none of the hand-applied ARIA roles are needed here.
 *
 * The trade is the fixed height: the section becomes its own scroll region instead of flowing with
 * the page. That is what virtualisation requires — an auto-height grid renders every row.
 */
export const HitGrid = ({
    data,
    names,
    label,
    avgDamageMap,
    displayEntries,
}: {
    data: TacticusGuildRaidResponse | undefined;
    names: Map<string, string>;
    label: string;
    avgDamageMap: Map<string, number>;
    /** Only these entries are shown; loop counts still come from every entry in the season. */
    displayEntries?: TacticusGuildRaidEntry[];
}) => {
    const [quickFilter, setQuickFilter] = useState('');
    // A virtualised grid only has its visible rows in the DOM, so this captures the viewport rather
    // than all 700-odd entries. Narrow the filters first if you want a specific slice in the image.
    const capture = useSectionCapture<HTMLElement>(captureFileName('guild-every-hit'));

    // Loop counters read the whole season, not the filtered subset: "3rd raid on this boss" has to
    // stay true regardless of what the view is narrowed to.
    const { loopRaidNumber, loopBombNumber } = useMemo(() => buildLoopCountMaps(data?.entries ?? []), [data]);

    const rows = useMemo(
        () => buildHitRows(displayEntries ?? data?.entries ?? [], names, avgDamageMap, loopRaidNumber, loopBombNumber),
        [displayEntries, data, names, avgDamageMap, loopRaidNumber, loopBombNumber]
    );

    if (data === undefined) return <p className="text-sm text-(--soft-fg)">Loading…</p>;

    const totalCount = (data.entries ?? []).length;
    const shownCount = rows.length;

    return (
        <section ref={capture.ref} className="flex flex-col gap-2">
            <SectionHeader
                title={label}
                note={`Season ${data.season}`}
                meta={
                    <span className="flex items-center gap-2.5">
                        <span>
                            {shownCount < totalCount ? `${shownCount} of ${totalCount}` : totalCount} entries · vs avg
                            excludes bombs and kills
                        </span>
                        <CaptureButton onCapture={capture.onCapture} isCapturing={capture.isCapturing} />
                        <input
                            type="search"
                            value={quickFilter}
                            onChange={event => setQuickFilter(event.target.value)}
                            placeholder="Search…"
                            aria-label="Search every column"
                            className="w-40 rounded-md border border-(--input-border) bg-(--bg) px-2 py-0.5 text-xs text-(--fg) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ring)"
                        />
                    </span>
                }
            />
            <div className="ag-theme-material density-compact h-[70vh] w-full">
                <AgGridReact<HitRow>
                    modules={[AllCommunityModule]}
                    theme="legacy"
                    suppressCellFocus
                    defaultColDef={DEFAULT_COL_DEF}
                    columnDefs={COLUMNS}
                    rowData={rows}
                    rowHeight={36}
                    autoSizeStrategy={{ type: 'fitGridWidth', defaultMinWidth: 90 }}
                    quickFilterText={quickFilter}
                />
            </div>
        </section>
    );
};
