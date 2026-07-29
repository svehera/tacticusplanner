import {
    AllCommunityModule,
    ColDef,
    ColumnResizedEvent,
    GridApi,
    GridReadyEvent,
    ICellRendererParams,
    RowClassParams,
    RowDragEndEvent,
    RowStyle,
    SortChangedEvent,
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import {
    ArrowDown,
    ArrowUp,
    BadgeCheck,
    Calendar,
    CheckCircle2,
    GripVertical,
    Hourglass,
    Link2,
    Lock,
    Pause,
    Pencil,
    Play,
    Trash2,
} from 'lucide-react';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { isMobile } from 'react-device-detect';
import { Link } from 'react-router-dom';

import { charsUnlockShards } from 'src/models/constants';
import { PersonalGoalType } from 'src/models/enums';

import { getEstimatedDateShort, numberToThousandsString } from '@/fsd/5-shared/lib';
import { Rarity, RarityMapper } from '@/fsd/5-shared/model';
import { AccessibleTooltip, Button, ProgressBar } from '@/fsd/5-shared/ui';
import { MiscIcon, RarityIcon, StarsIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { UpgradeImage, UpgradesService } from '@/fsd/4-entities/upgrade';

import { getDoneByDays, getMaterialBar, isGoalReached } from '@/fsd/3-features/goals';
import { IGoalEstimate, TypedGoalSelect } from '@/fsd/3-features/goals/goals.models';
import { ShardsService } from '@/fsd/3-features/goals/shards.service';

import {
    ProgressionRow,
    RankEmblem,
    ResourceCostRow,
    StatBlockPair,
    XpBooksRow,
    buildAbilityCostItems,
    buildMowCostItems,
    buildOrbItems,
    doneByTooltip,
} from '@/fsd/1-pages/goals/goal-card';

import { GoalColorMode } from './goal-color-coding-toggle';
import { GoalService } from './goal-service';

const GRID_MODULES = [AllCommunityModule];
const GRID_DEFAULT_COL_DEF = { suppressMovable: true, sortable: true, wrapText: true };
const ROW_HEIGHT = 68;

const STATUS_COL_ID = 'status';
const STATUS_COL_DEFAULT_WIDTH = 62;
const STATUS_COL_TEXT_THRESHOLD = 110;

/** Which column set the table renders. Mirrors the three goal accordion sections. */
export type GoalsTableVariant = 'rank' | 'ascend' | 'abilities';

interface Props {
    rows: TypedGoalSelect[]; // The filtered subset for one section (already priority-sorted)
    estimate: IGoalEstimate[];
    variant: GoalsTableVariant;
    goalsColorCoding: GoalColorMode;
    menuItemSelect: (goalId: string, item: 'edit' | 'delete') => void;
    onToggleInclude?: (goalId: string) => void;
    /** Section-scoped reorder — same contract as the card grid (new order of ids + which id moved). */
    onReorder: (orderedIds: string[], movedId: string) => void;
    /** Priority-arrow move by one position in the GLOBAL order; may cross a section boundary. */
    onMove: (goalId: string, delta: number) => void;
    /** Total goal count across all sections — the upper bound of the global priority range. */
    totalGoals: number;
}

const emptyCell = <div className="flex h-full items-center text-sm leading-normal text-(--soft-fg) opacity-50">—</div>;

/** Right-aligned `value + icon` numeric cell (em-dash when empty). Shared by the numeric columns. */
const numericCell = (
    value: number | undefined,
    icon?: React.ReactNode,
    format: (n: number) => string = n => n.toLocaleString()
) => (
    <div className="flex h-full w-full items-center justify-end gap-1.5 text-sm leading-normal tabular-nums">
        {value ? (
            <>
                {format(value)}
                {icon}
            </>
        ) : (
            <span className="text-(--soft-fg) opacity-50">—</span>
        )}
    </div>
);

export const GoalsTable: React.FC<Props> = ({
    rows,
    estimate,
    variant,
    goalsColorCoding,
    menuItemSelect,
    onToggleInclude,
    onReorder,
    onMove,
    totalGoals,
}) => {
    // All frequently-changing values live in refs so columnDefs can have stable deps and never
    // recompute — which would reset user-resized column widths.
    const gridApiReference = useRef<GridApi | null>(null);
    const savedWidthsReference = useRef<Record<string, number>>({});
    const statusColWidthReference = useRef(STATUS_COL_DEFAULT_WIDTH);
    // True while any column sort is active. Managed row-drag is suppressed by ag-grid under a sort,
    // so the grip is disabled/dimmed then; the arrows still work, since they move the goal in global
    // priority space rather than in display order (see prioCol).
    const sortActiveReference = useRef(false);
    const goalsColorCodingReference = useRef(goalsColorCoding);
    const onToggleIncludeReference = useRef(onToggleInclude);
    const menuItemSelectReference = useRef(menuItemSelect);
    const onReorderReference = useRef(onReorder);
    const onMoveReference = useRef(onMove);
    const totalGoalsReference = useRef(totalGoals);
    // Map keyed by goalId for O(1) lookups in cell renderers.
    const estimateMapReference = useRef<Map<string, IGoalEstimate>>(new Map());

    useLayoutEffect(() => {
        goalsColorCodingReference.current = goalsColorCoding;
        onToggleIncludeReference.current = onToggleInclude;
        menuItemSelectReference.current = menuItemSelect;
        onReorderReference.current = onReorder;
        onMoveReference.current = onMove;
        totalGoalsReference.current = totalGoals;
        estimateMapReference.current = new Map(estimate.map(est => [est.goalId, est]));
    }, [estimate, goalsColorCoding, menuItemSelect, onMove, onReorder, onToggleInclude, rows, totalGoals]);

    // Redraw rows (not columns) when estimates OR the colour-coding mode change, so cell content,
    // row classes and row styles (getRowStyle reads the colour-mode ref) stay current without
    // recomputing columnDefs (which would reset resized widths).
    useEffect(() => {
        gridApiReference.current?.redrawRows();
    }, [estimate, goalsColorCoding]);

    const handleGridReady = useCallback((event_: GridReadyEvent) => {
        gridApiReference.current = event_.api;
    }, []);

    const handleColumnResized = useCallback((event_: ColumnResizedEvent) => {
        if (!event_.finished || !event_.column) return;
        const colId = event_.column.getColId();
        const width = event_.column.getActualWidth();
        savedWidthsReference.current[colId] = width;
        if (colId === STATUS_COL_ID) {
            statusColWidthReference.current = width;
            gridApiReference.current?.refreshCells({ force: true, columns: [STATUS_COL_ID] });
        }
    }, []);

    const handleRowDataUpdated = useCallback(() => {
        const saved = savedWidthsReference.current;
        if (Object.keys(saved).length === 0) return;
        gridApiReference.current?.applyColumnState({
            state: Object.entries(saved).map(([colId, width]) => ({ colId, width })),
        });
        if (saved[STATUS_COL_ID] !== undefined) {
            statusColWidthReference.current = saved[STATUS_COL_ID];
            gridApiReference.current?.refreshCells({ force: true, columns: [STATUS_COL_ID] });
        }
    }, []);

    const handleRowDragEnd = useCallback((event_: RowDragEndEvent<TypedGoalSelect>) => {
        // Under an active sort the post-sort node order isn't the user's intended manual order, so
        // never persist it (ag-grid also suppresses managed drag while sorted — this is a guard).
        if (sortActiveReference.current) return;
        const orderedIds: string[] = [];
        event_.api.forEachNodeAfterFilterAndSort(node => {
            if (node.data) orderedIds.push(node.data.goalId);
        });
        const movedId = event_.node.data?.goalId;
        if (movedId) onReorderReference.current(orderedIds, movedId);
    }, []);

    const handleSortChanged = useCallback((event_: SortChangedEvent) => {
        sortActiveReference.current = event_.api.getColumnState().some(column => !!column.sort);
        // Full row redraw (not refreshCells) so both the grip's dimmed state and the `rowDrag`
        // callback are re-evaluated — rowDrag is read when the cell is built, not on a cell refresh.
        event_.api.redrawRows();
    }, []);

    // columnDefs recomputes only when the variant changes (stable per mounted table). All changing
    // values are read from refs inside renderers, and redrawRows() is called when data changes.
    const columnDefs = useMemo<Array<ColDef<TypedGoalSelect>>>(() => {
        // ── Shared columns ──────────────────────────────────────────────────
        const dragGripCol: ColDef<TypedGoalSelect> = {
            headerName: '',
            width: 36,
            maxWidth: 36,
            // Drag only reorders in priority order, which only matches the view when unsorted.
            rowDrag: () => !sortActiveReference.current,
            sortable: false,
            suppressNavigable: true,
            cellRenderer: () =>
                sortActiveReference.current ? (
                    <div
                        title="Clear the column sort to drag rows. Use the priority arrows to reorder while sorted."
                        className="flex h-full cursor-not-allowed items-center justify-center text-(--soft-fg) opacity-20">
                        <GripVertical className="size-4" />
                    </div>
                ) : (
                    <div className="flex h-full cursor-grab items-center justify-center text-(--soft-fg) opacity-40 transition-opacity duration-150 hover:opacity-80 active:cursor-grabbing">
                        <GripVertical className="size-4" />
                    </div>
                ),
        };

        const prioCol: ColDef<TypedGoalSelect> = {
            headerName: 'Priority',
            width: 96,
            maxWidth: 96,
            valueGetter: params => params.data?.priority ?? 0,
            cellClass: 'prio-cell',
            cellRenderer: (params: ICellRendererParams<TypedGoalSelect>) => {
                const { data } = params;
                if (!data) return;
                // Priority is GLOBAL (1..totalGoals across every section), so the arrows are live
                // whenever a neighbour exists anywhere in that range — the goal one step up may sit
                // in a different accordion section, which is a legitimate move.
                const { priority } = data;
                const total = totalGoalsReference.current;
                return (
                    <div className="flex h-full w-full">
                        <div className="flex flex-1 items-center px-3">
                            <span className="min-w-[20px] text-center text-sm font-medium text-(--soft-fg) tabular-nums">
                                {priority}
                            </span>
                        </div>
                        <div className="flex w-10 flex-col border-l border-(--border)">
                            <button
                                type="button"
                                title="Move Up"
                                disabled={priority <= 1}
                                onClick={() => onMoveReference.current(data.goalId, -1)}
                                className="flex w-full flex-1 cursor-pointer items-center justify-center text-(--soft-fg) transition-colors hover:bg-(--primary)/15 hover:text-(--primary) disabled:cursor-not-allowed disabled:opacity-25">
                                <ArrowUp className="size-3" />
                            </button>
                            <button
                                type="button"
                                title="Move Down"
                                disabled={priority >= total}
                                onClick={() => onMoveReference.current(data.goalId, 1)}
                                className="flex w-full flex-1 cursor-pointer items-center justify-center text-(--soft-fg) transition-colors hover:bg-(--primary)/15 hover:text-(--primary) disabled:cursor-not-allowed disabled:opacity-25">
                                <ArrowDown className="size-3" />
                            </button>
                        </div>
                    </div>
                );
            },
        };

        const characterCol: ColDef<TypedGoalSelect> = {
            headerName: 'Character',
            flex: 2,
            minWidth: 180,
            valueGetter: params => {
                const data = params.data;
                if (!data) return '';
                return 'unitName' in data ? data.unitName : data.upgradeMaterialId;
            },
            cellRenderer: (params: ICellRendererParams<TypedGoalSelect>) => {
                const { data } = params;
                if (!data) return;
                let portrait: React.ReactNode;
                let name: string;
                let subline = '';
                if ('unitName' in data) {
                    portrait = (
                        <UnitShardIcon icon={data.unitRoundIcon} height={30} width={30} tooltip={data.unitName} />
                    );
                    name = data.unitName ?? '';
                } else {
                    const mat = UpgradesService.getUpgradeMaterial(data.upgradeMaterialId);
                    portrait = mat ? (
                        <UpgradeImage
                            material={mat.snowprintId}
                            iconPath={mat.icon ?? ''}
                            size={30}
                            rarity={RarityMapper.stringToRarityString(mat.rarity)}
                            tooltip={mat.label ?? ''}
                        />
                    ) : undefined;
                    name = mat?.label ?? '';
                    subline = data.type === PersonalGoalType.PreFarmMaterialForGoals ? 'Pre-farm material' : 'Material';
                }
                return (
                    <div className="flex h-full min-w-0 items-center gap-2.5 leading-normal">
                        <div className="shrink-0">{portrait}</div>
                        <div className="flex min-w-0 flex-col leading-tight">
                            <span className="truncate text-sm font-medium text-(--fg)">{name}</span>
                            {subline && <span className="truncate text-xs text-(--soft-fg)">{subline}</span>}
                        </div>
                    </div>
                );
            },
        };

        const daysCol: ColDef<TypedGoalSelect> = {
            headerName: 'Total days',
            width: 108,
            minWidth: 96,
            headerClass: 'ag-right-aligned-header',
            valueGetter: params => estimateMapReference.current.get(params.data?.goalId ?? '')?.daysTotal ?? 0,
            cellRenderer: (params: ICellRendererParams<TypedGoalSelect>) =>
                numericCell(
                    estimateMapReference.current.get(params.data?.goalId ?? '')?.daysTotal,
                    <Hourglass className="size-3.5 shrink-0 text-(--soft-fg)" />
                ),
        };

        const doneByCol: ColDef<TypedGoalSelect> = {
            headerName: 'Done By',
            flex: 1,
            minWidth: 110,
            valueGetter: params => {
                const est = estimateMapReference.current.get(params.data?.goalId ?? '');
                if (!est) return;
                const days = getDoneByDays(est);
                return days > 0 ? days : undefined;
            },
            cellRenderer: (params: ICellRendererParams<TypedGoalSelect>) => {
                const est = estimateMapReference.current.get(params.data?.goalId ?? '');
                const daysLeft = est ? getDoneByDays(est) : 0;
                if (!est || !daysLeft) return emptyCell;
                const rounded = Math.ceil(daysLeft);
                return (
                    <AccessibleTooltip title={doneByTooltip(est)}>
                        <div className="flex h-full min-w-0 flex-col justify-center gap-0.5 leading-normal">
                            <span className="flex items-center gap-1 text-sm font-medium text-(--fg)">
                                <Calendar className="size-[18px] shrink-0 text-(--soft-fg)" />
                                {getEstimatedDateShort(rounded)}
                            </span>
                            <span className="text-xs text-(--soft-fg)">in {rounded} days</span>
                        </div>
                    </AccessibleTooltip>
                );
            },
        };

        const energyCol: ColDef<TypedGoalSelect> = {
            headerName: 'Energy',
            width: 92,
            maxWidth: 92,
            headerClass: 'ag-right-aligned-header',
            valueGetter: params => estimateMapReference.current.get(params.data?.goalId ?? '')?.energyTotal ?? 0,
            cellRenderer: (params: ICellRendererParams<TypedGoalSelect>) =>
                numericCell(
                    estimateMapReference.current.get(params.data?.goalId ?? '')?.energyTotal,
                    <MiscIcon icon="energy" width={14} height={14} />
                ),
        };

        // Status column — restored from the original table: Reached / Locked / In Progress / Paused,
        // icon-only until the column is widened past the text threshold. Also the include toggle.
        const statusCol: ColDef<TypedGoalSelect> = {
            colId: STATUS_COL_ID,
            headerName: 'Status',
            sortable: false,
            resizable: true,
            width: STATUS_COL_DEFAULT_WIDTH,
            minWidth: STATUS_COL_DEFAULT_WIDTH,
            cellStyle: { padding: 0, overflow: 'hidden' },
            cellRenderer: (params: ICellRendererParams<TypedGoalSelect>) => {
                const { data } = params;
                if (!data) return;
                const goalEstimate = estimateMapReference.current.get(data.goalId);
                const isReached = isGoalReached(goalEstimate);
                const isBlocked = !!goalEstimate?.blocked;
                const showText = statusColWidthReference.current >= STATUS_COL_TEXT_THRESHOLD;

                if (isReached) {
                    return (
                        <AccessibleTooltip title="Goal is complete.">
                            <div
                                className="flex h-full w-full items-center justify-center gap-1.5 text-(--success)"
                                tabIndex={0}>
                                <BadgeCheck className="size-4 shrink-0" />
                                {showText && <span className="truncate text-sm font-medium">Reached</span>}
                            </div>
                        </AccessibleTooltip>
                    );
                }

                if (isBlocked) {
                    return (
                        <AccessibleTooltip title="Goal is blocked because required farm nodes are not accessible. See Plan > Daily Raids > Raids Plan > Blocked Upgrades for details.">
                            <button
                                type="button"
                                className="flex h-full w-full cursor-pointer items-center justify-center gap-1.5 border-0 bg-transparent text-(--warning) transition-colors hover:bg-(--warning)/10 focus-visible:ring-2 focus-visible:ring-(--warning) focus-visible:outline-none focus-visible:ring-inset"
                                aria-label="Locked"
                                onClick={() => onToggleIncludeReference.current?.(data.goalId)}>
                                <Lock className="size-4 shrink-0" />
                                {showText && <span className="truncate text-sm font-medium">Locked</span>}
                            </button>
                        </AccessibleTooltip>
                    );
                }

                if (!onToggleIncludeReference.current) return;

                const isIncluded = !!data.include;
                return (
                    <AccessibleTooltip
                        title={
                            isIncluded
                                ? 'Included in daily raids. Click to pause.'
                                : 'Excluded from daily raids. Click to include.'
                        }>
                        <button
                            type="button"
                            className={`flex h-full w-full cursor-pointer items-center justify-center gap-1.5 border-0 bg-transparent transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset ${
                                isIncluded
                                    ? 'text-(--primary) hover:bg-(--primary)/10 focus-visible:ring-(--primary)'
                                    : 'text-(--soft-fg) hover:bg-(--overlay) focus-visible:ring-(--primary)'
                            }`}
                            aria-label={isIncluded ? 'In Progress' : 'Paused'}
                            onClick={() => onToggleIncludeReference.current?.(data.goalId)}>
                            {isIncluded ? <Play className="size-4 shrink-0" /> : <Pause className="size-4 shrink-0" />}
                            {showText && (
                                <span className="truncate text-sm font-medium">
                                    {isIncluded ? 'In Progress' : 'Paused'}
                                </span>
                            )}
                        </button>
                    </AccessibleTooltip>
                );
            },
        };

        // Utility buttons — Edit / Delete, restored to their original placement next to priority.
        const actionsCol: ColDef<TypedGoalSelect> = {
            headerName: 'Actions',
            width: 96,
            maxWidth: 96,
            sortable: false,
            cellRenderer: (params: ICellRendererParams<TypedGoalSelect>) => {
                const { data } = params;
                if (!data) return;
                return (
                    <div className="flex h-full items-center justify-center">
                        <Button
                            size="square-petite"
                            appearance="plain"
                            className="[--btn-accent:var(--soft-fg)]"
                            aria-label="Edit Goal"
                            onPress={() => menuItemSelectReference.current(data.goalId, 'edit')}>
                            <Pencil data-slot="icon" />
                        </Button>
                        <Button
                            size="square-petite"
                            appearance="plain"
                            className="[--btn-accent:var(--soft-fg)] data-hovered:[--btn-accent:var(--danger)]"
                            aria-label="Delete Goal"
                            onPress={() => menuItemSelectReference.current(data.goalId, 'delete')}>
                            <Trash2 data-slot="icon" />
                        </Button>
                    </div>
                );
            },
        };

        // Go to Raids — restored from the original table; shown for rank/MoW goals only.
        const upgradesCol: ColDef<TypedGoalSelect> = {
            colId: 'upgrades',
            headerName: 'Upgrades',
            sortable: false,
            width: 140,
            cellStyle: { padding: 0, overflow: 'hidden' },
            cellRenderer: (params: ICellRendererParams<TypedGoalSelect>) => {
                const { data } = params;
                if (!data) return;
                if (data.type !== PersonalGoalType.UpgradeRank && data.type !== PersonalGoalType.MowAbilities) return;
                const goalEstimate = estimateMapReference.current.get(data.goalId);
                const isReached = isGoalReached(goalEstimate);
                const linkBase = isMobile ? '/mobile/plan/dailyRaids' : '/plan/dailyRaids';
                if (isReached) {
                    return (
                        <span className="flex h-full w-full cursor-not-allowed items-center justify-center gap-2 text-(--primary) opacity-50">
                            <Link2 className="size-4 shrink-0" />
                            Go to Raids
                        </span>
                    );
                }
                return (
                    <Link
                        to={`${linkBase}?charSnowprintId=${encodeURIComponent(data.unitId)}`}
                        className="flex h-full w-full items-center justify-center gap-2 text-(--primary) no-underline hover:bg-(--primary)/10">
                        <Link2 className="size-4 shrink-0" />
                        Go to Raids
                    </Link>
                );
            },
        };

        const notesCol: ColDef<TypedGoalSelect> = {
            field: 'notes',
            headerName: 'Notes',
            flex: 1,
            minWidth: 120,
            maxWidth: 220,
            cellRenderer: (params: ICellRendererParams<TypedGoalSelect>) => {
                const notes = params.data?.notes ?? '';
                return (
                    <div
                        className="flex h-full items-center truncate text-xs leading-normal text-(--soft-fg)"
                        title={notes}>
                        {notes}
                    </div>
                );
            },
        };

        const completedMark = (goalId: string | undefined) => {
            const est = goalId ? estimateMapReference.current.get(goalId) : undefined;
            return isGoalReached(est) ? (
                <CheckCircle2 className="size-3.5 shrink-0 text-(--success)" aria-label="Completed" />
            ) : undefined;
        };

        // ── Variant: rank (UpgradeRank + MowAbilities + UpgradeMaterial) ─────
        const rankGoalCol: ColDef<TypedGoalSelect> = {
            headerName: 'Goal',
            flex: 1.5,
            minWidth: 150,
            sortable: false,
            cellRenderer: (params: ICellRendererParams<TypedGoalSelect>) => {
                const { data } = params;
                if (!data) return;
                let content: React.ReactNode;
                switch (data.type) {
                    case PersonalGoalType.UpgradeRank: {
                        content = (
                            <ProgressionRow
                                from={
                                    <RankEmblem
                                        rank={data.rankStart}
                                        rankPoint5={data.rankStartPoint5}
                                        role="Current rank"
                                    />
                                }
                                to={<RankEmblem rank={data.rankEnd} rankPoint5={data.rankPoint5} role="Target rank" />}
                                trailing={
                                    data.upgradesRarity.length > 0 && data.upgradesRarity.length < 6 ? (
                                        <span className="flex items-center gap-0.5 [&>img]:h-[18px] [&>img]:w-auto">
                                            {data.upgradesRarity.map(rarity => (
                                                <RarityIcon key={rarity} rarity={rarity} />
                                            ))}
                                        </span>
                                    ) : undefined
                                }
                            />
                        );

                        break;
                    }
                    case PersonalGoalType.MowAbilities: {
                        const blocks = [];
                        if (data.primaryEnd > data.primaryStart)
                            blocks.push({ label: 'Primary', start: data.primaryStart, end: data.primaryEnd });
                        if (data.secondaryEnd > data.secondaryStart)
                            blocks.push({ label: 'Secondary', start: data.secondaryStart, end: data.secondaryEnd });
                        const showRarityFilter = data.upgradesRarity.length > 0 && data.upgradesRarity.length < 6;
                        content = (
                            <div className="flex items-center gap-1.5">
                                <div className="min-w-0 flex-1">
                                    <StatBlockPair blocks={blocks} />
                                </div>
                                {showRarityFilter && (
                                    <span className="flex shrink-0 items-center gap-0.5 [&>img]:h-4 [&>img]:w-auto">
                                        {data.upgradesRarity.map(rarity => (
                                            <RarityIcon key={rarity} rarity={rarity} />
                                        ))}
                                    </span>
                                )}
                            </div>
                        );

                        break;
                    }
                    case PersonalGoalType.UpgradeMaterial: {
                        content = <span className="text-sm font-medium tabular-nums">{data.quantity}×</span>;

                        break;
                    }
                    // No default
                }
                return (
                    <div className="flex h-full min-w-0 items-center gap-1.5 py-1 leading-normal">
                        <div className="min-w-0 flex-1">{content}</div>
                        {completedMark(data.goalId)}
                    </div>
                );
            },
        };

        const rankProgressCol: ColDef<TypedGoalSelect> = {
            headerName: 'Progress',
            flex: 1.5,
            minWidth: 150,
            sortable: false,
            cellRenderer: (params: ICellRendererParams<TypedGoalSelect>) => {
                const { data } = params;
                if (!data) return emptyCell;
                const est = estimateMapReference.current.get(data.goalId);
                if (data.type === PersonalGoalType.UpgradeRank) {
                    const applied = est?.xpBooksApplied;
                    const required = est?.xpBooksRequired;
                    if (!est || applied === undefined || required === undefined || required === 0) return emptyCell;
                    return (
                        <div className="flex h-full w-full flex-col justify-center py-1">
                            <XpBooksRow goalEstimate={est} bookRarity={est.xpEstimate?.bookRarity} />
                        </div>
                    );
                }
                if (data.type === PersonalGoalType.MowAbilities) {
                    const targetShards = ShardsService.getTargetShardsForMow(data);
                    const costItems = buildMowCostItems(est?.mowEstimate, data.unitAlliance, false);
                    if (targetShards <= 0 && costItems.length === 0) return emptyCell;
                    return (
                        <div className="flex h-full w-full flex-col justify-center gap-1 py-2">
                            {targetShards > 0 && (
                                <span className="text-xs text-(--soft-fg)">
                                    Shards{' '}
                                    <span className="font-bold text-(--fg) tabular-nums">
                                        {data.shards} / {targetShards}
                                    </span>
                                </span>
                            )}
                            <ResourceCostRow items={costItems} />
                        </div>
                    );
                }
                if (data.type === PersonalGoalType.UpgradeMaterial) {
                    const info = est?.materialQuantityInfo;
                    if (!info) return emptyCell;
                    const bar = getMaterialBar(info);
                    return (
                        <div className="flex h-full w-full flex-col justify-center py-2">
                            <ProgressBar
                                value={bar.value}
                                max={bar.max}
                                intent="success"
                                label={bar.label}
                                valueLabel={bar.valueLabel}
                            />
                        </div>
                    );
                }
                return emptyCell;
            },
        };

        const rankGoldCol: ColDef<TypedGoalSelect> = {
            headerName: 'Gold',
            width: 96,
            maxWidth: 96,
            headerClass: 'ag-right-aligned-header',
            valueGetter: params => {
                const est = estimateMapReference.current.get(params.data?.goalId ?? '');
                return params.data?.type === PersonalGoalType.UpgradeRank
                    ? (est?.xpEstimate?.gold ?? 0)
                    : params.data?.type === PersonalGoalType.MowAbilities
                      ? (est?.mowEstimate?.gold ?? 0)
                      : 0;
            },
            cellRenderer: (params: ICellRendererParams<TypedGoalSelect>) => {
                const est = estimateMapReference.current.get(params.data?.goalId ?? '');
                const gold =
                    params.data?.type === PersonalGoalType.UpgradeRank
                        ? est?.xpEstimate?.gold
                        : params.data?.type === PersonalGoalType.MowAbilities
                          ? est?.mowEstimate?.gold
                          : undefined;
                return numericCell(gold, <MiscIcon icon="coin" width={24} height={24} />, numberToThousandsString);
            },
        };

        // ── Variant: ascend (Ascend + Unlock) ────────────────────────────────
        const ascendGoalCol: ColDef<TypedGoalSelect> = {
            headerName: 'Goal',
            flex: 1.5,
            minWidth: 150,
            sortable: false,
            cellRenderer: (params: ICellRendererParams<TypedGoalSelect>) => {
                const { data } = params;
                if (!data) return;
                let content: React.ReactNode;
                if (data.type === PersonalGoalType.Ascend) {
                    const isSameRarity = data.rarityStart === data.rarityEnd;
                    const isMinStars = RarityMapper.toStars[data.rarityEnd] === data.starsEnd;
                    content = isSameRarity ? (
                        <ProgressionRow
                            from={<StarsIcon stars={data.starsStart} />}
                            to={<StarsIcon stars={data.starsEnd} />}
                            ariaLabel="Ascension stars progression"
                        />
                    ) : (
                        <ProgressionRow
                            from={<RarityIcon rarity={data.rarityStart} />}
                            to={<RarityIcon rarity={data.rarityEnd} />}
                            trailing={!isMinStars && <StarsIcon stars={data.starsEnd} />}
                            ariaLabel="Ascension rarity progression"
                        />
                    );
                } else if (data.type === PersonalGoalType.Unlock) {
                    content = <span className="text-xs text-(--soft-fg)">Unlock</span>;
                }
                return (
                    <div className="flex h-full min-w-0 items-center gap-1.5 py-1 leading-normal">
                        <div className="min-w-0 flex-1">{content}</div>
                        {completedMark(data.goalId)}
                    </div>
                );
            },
        };

        const ascendProgressCol: ColDef<TypedGoalSelect> = {
            headerName: 'Progress',
            flex: 1.5,
            minWidth: 150,
            sortable: false,
            cellRenderer: (params: ICellRendererParams<TypedGoalSelect>) => {
                const { data } = params;
                if (!data) return emptyCell;
                // Collect every applicable shard bar so a goal needing both regular and mythic shards
                // shows both (mirrors the Ascend card body, which renders both).
                const bars: Array<{ key: string; label: string; value: number; max: number }> = [];
                if (data.type === PersonalGoalType.Ascend) {
                    const targetShards = ShardsService.getTargetShards(data);
                    const targetMythicShards = ShardsService.getTargetMythicShards(data);
                    if (targetShards > 0)
                        bars.push({ key: 'shards', label: 'Shards', value: data.shards, max: targetShards });
                    if (targetMythicShards > 0)
                        bars.push({
                            key: 'mythic',
                            label: 'Mythic',
                            value: data.mythicShards,
                            max: targetMythicShards,
                        });
                } else if (data.type === PersonalGoalType.Unlock) {
                    bars.push({
                        key: 'shards',
                        label: 'Shards',
                        value: data.shards,
                        max: charsUnlockShards[data.rarity],
                    });
                }
                if (bars.length === 0) return emptyCell;
                return (
                    <div
                        className={`flex h-full w-full flex-col justify-center ${bars.length > 1 ? 'gap-0.5 py-0.5' : 'py-1'}`}>
                        {bars.map(bar => (
                            <ProgressBar
                                key={bar.key}
                                value={bar.value}
                                max={bar.max}
                                intent="success"
                                label={bar.label}
                                valueLabel={`${bar.value} / ${bar.max}`}
                            />
                        ))}
                    </div>
                );
            },
        };

        const orbsCol: ColDef<TypedGoalSelect> = {
            headerName: 'Orbs',
            flex: 1.25,
            minWidth: 120,
            sortable: false,
            cellRenderer: (params: ICellRendererParams<TypedGoalSelect>) => {
                const { data } = params;
                if (!data || !('unitAlliance' in data)) return emptyCell;
                const est = estimateMapReference.current.get(data.goalId);
                if (!est?.orbsEstimate) return emptyCell;
                const items = buildOrbItems(est, data.unitAlliance, false);
                if (items.length === 0) return emptyCell;
                return (
                    <div className="flex h-full w-full flex-col justify-center py-2">
                        <ResourceCostRow items={items} />
                    </div>
                );
            },
        };

        const tokensCol: ColDef<TypedGoalSelect> = {
            headerName: 'Tokens',
            width: 92,
            maxWidth: 92,
            headerClass: 'ag-right-aligned-header',
            valueGetter: params => estimateMapReference.current.get(params.data?.goalId ?? '')?.oTokensTotal ?? 0,
            cellRenderer: (params: ICellRendererParams<TypedGoalSelect>) =>
                numericCell(estimateMapReference.current.get(params.data?.goalId ?? '')?.oTokensTotal),
        };

        // ── Variant: abilities (CharacterAbilities) ──────────────────────────
        const abilitiesGoalCol: ColDef<TypedGoalSelect> = {
            headerName: 'Goal',
            flex: 1.5,
            minWidth: 160,
            sortable: false,
            cellRenderer: (params: ICellRendererParams<TypedGoalSelect>) => {
                const { data } = params;
                if (!data || data.type !== PersonalGoalType.CharacterAbilities) return;
                const blocks = [];
                if (data.activeEnd > data.activeStart)
                    blocks.push({ label: 'Active', start: data.activeStart, end: data.activeEnd });
                if (data.passiveEnd > data.passiveStart)
                    blocks.push({ label: 'Passive', start: data.passiveStart, end: data.passiveEnd });
                return (
                    <div className="flex h-full min-w-0 items-center gap-1.5 py-1 leading-normal">
                        <div className="min-w-0 flex-1">
                            <StatBlockPair blocks={blocks} />
                        </div>
                        {completedMark(data.goalId)}
                    </div>
                );
            },
        };

        const badgesCol: ColDef<TypedGoalSelect> = {
            headerName: 'Badges',
            flex: 1.5,
            minWidth: 140,
            sortable: false,
            cellRenderer: (params: ICellRendererParams<TypedGoalSelect>) => {
                const est = estimateMapReference.current.get(params.data?.goalId ?? '');
                const items = buildAbilityCostItems(est?.abilitiesEstimate, false);
                if (items.length === 0) return emptyCell;
                return (
                    <div className="flex h-full w-full flex-col justify-center py-2">
                        <ResourceCostRow items={items} />
                    </div>
                );
            },
        };

        const abilitiesBooksCol: ColDef<TypedGoalSelect> = {
            headerName: 'Books',
            flex: 1,
            minWidth: 120,
            valueGetter: params => estimateMapReference.current.get(params.data?.goalId ?? '')?.xpBooksTotal ?? 0,
            cellRenderer: (params: ICellRendererParams<TypedGoalSelect>) => {
                const est = estimateMapReference.current.get(params.data?.goalId ?? '');
                if (!est || est.xpBooksTotal === 0) return emptyCell;
                const xpEst = est.xpEstimateAbilities ?? est.xpEstimate;
                const bookIcon =
                    xpEst?.bookRarity === undefined
                        ? undefined
                        : ((Rarity[xpEst.bookRarity].toLowerCase() + 'Book') as never);
                const levelRange = xpEst ? `Lv ${xpEst.currentLevel} → ${xpEst.targetLevel}` : undefined;
                return (
                    <div className="flex h-full min-w-0 flex-col justify-center gap-0.5 py-2 leading-normal">
                        <span className="flex items-center gap-1.5 text-sm font-medium text-(--fg) tabular-nums">
                            {est.xpBooksTotal.toLocaleString()}
                            {bookIcon && <MiscIcon icon={bookIcon} width={20} height={20} />}
                        </span>
                        {levelRange && <span className="text-xs text-(--soft-fg)">{levelRange}</span>}
                    </div>
                );
            },
        };

        const abilitiesGoldCol: ColDef<TypedGoalSelect> = {
            headerName: 'Gold',
            width: 96,
            maxWidth: 96,
            headerClass: 'ag-right-aligned-header',
            valueGetter: params =>
                estimateMapReference.current.get(params.data?.goalId ?? '')?.abilitiesEstimate?.gold ?? 0,
            cellRenderer: (params: ICellRendererParams<TypedGoalSelect>) =>
                numericCell(
                    estimateMapReference.current.get(params.data?.goalId ?? '')?.abilitiesEstimate?.gold,
                    <MiscIcon icon="coin" width={20} height={20} />,
                    numberToThousandsString
                ),
        };

        const variantCols =
            variant === 'rank'
                ? [rankGoalCol, rankProgressCol, energyCol, rankGoldCol]
                : variant === 'ascend'
                  ? [ascendGoalCol, ascendProgressCol, orbsCol, energyCol, tokensCol]
                  : [abilitiesGoalCol, badgesCol, abilitiesBooksCol, abilitiesGoldCol];

        return [
            dragGripCol,
            prioCol,
            actionsCol,
            characterCol,
            statusCol,
            ...variantCols,
            daysCol,
            doneByCol,
            ...(variant === 'rank' ? [upgradesCol] : []),
            notesCol,
        ];
    }, [variant]);

    const getRowStyle = useCallback((params: RowClassParams<TypedGoalSelect>): RowStyle | undefined => {
        const goalEstimate = params.data ? estimateMapReference.current.get(params.data.goalId) : undefined;

        if (isGoalReached(goalEstimate)) {
            return {
                background: 'color-mix(in srgb, var(--success) 20%, transparent)',
                borderLeft: '3px solid var(--success)',
            };
        }

        const colorBg = GoalService.getBackgroundColor(goalsColorCodingReference.current, goalEstimate);
        const borderColor = goalEstimate?.blocked ? 'var(--warning)' : 'transparent';

        return {
            background: colorBg,
            borderLeft: `3px solid ${borderColor}`,
        };
    }, []);

    return (
        <div
            className="ag-theme-material density-compact w-full"
            style={{ height: Math.max(150, 48 + rows.length * ROW_HEIGHT) }}>
            <AgGridReact
                modules={GRID_MODULES}
                theme="legacy"
                defaultColDef={GRID_DEFAULT_COL_DEF}
                rowHeight={ROW_HEIGHT}
                columnDefs={columnDefs}
                rowData={rows}
                getRowId={params => params.data.goalId}
                getRowStyle={getRowStyle}
                rowDragManaged={true}
                animateRows={true}
                onGridReady={handleGridReady}
                onColumnResized={handleColumnResized}
                onRowDataUpdated={handleRowDataUpdated}
                onRowDragEnd={handleRowDragEnd}
                onSortChanged={handleSortChanged}
            />
        </div>
    );
};
