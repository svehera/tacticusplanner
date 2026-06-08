import {
    AllCommunityModule,
    ColDef,
    ColumnResizedEvent,
    GridApi,
    GridReadyEvent,
    ICellRendererParams,
    RowClassParams,
    RowStyle,
    ValueGetterParams,
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { ArrowDown, ArrowRight, ArrowUp, BadgeCheck, Link2, Lock, Pause, Pencil, Play, Trash2 } from 'lucide-react';
import React, { useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { isMobile } from 'react-device-detect';
import { Link } from 'react-router-dom';

import { charsUnlockShards } from 'src/models/constants';
import { PersonalGoalType } from 'src/models/enums';
import { DispatchContext } from 'src/reducers/store.provider';
import { getEstimatedDate } from 'src/shared-logic/functions';

import { RarityMapper } from '@/fsd/5-shared/model';
import { Button } from '@/fsd/5-shared/ui';
import { RarityIcon, StarsIcon, RankIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';
import { AccessibleTooltip } from '@/fsd/5-shared/ui/tooltip';

import { UpgradeImage, UpgradesService } from '@/fsd/4-entities/upgrade';

import { CharacterAbilitiesTotal } from '@/fsd/3-features/characters/components/character-abilities-total';
import { OrbsTotal } from '@/fsd/3-features/characters/components/orbs-total';
import {
    ICharacterUpgradeMow,
    ICharacterUpgradeRankGoal,
    IGoalEstimate,
    TypedGoalSelect,
} from '@/fsd/3-features/goals/goals.models';
import { ShardsService } from '@/fsd/3-features/goals/shards.service';
import { XpTooltip } from '@/fsd/3-features/goals/xp-tooltip';

import { MowMaterialsTotal } from '@/fsd/1-pages/learn-mow/mow-materials-total';

import { GoalColorMode } from './goal-color-coding-toggle';
import { GoalService } from './goal-service';

const STATUS_COL_ID = 'status';
const STATUS_COL_DEFAULT_WIDTH = 62;
const STATUS_COL_TEXT_THRESHOLD = 110;

// Defined outside the component so ag-grid never receives new references on re-render.
// New references on defaultColDef or modules cause ag-grid to re-initialize columns,
// which resets user-resized column widths.
const GRID_MODULES = [AllCommunityModule];
const GRID_DEFAULT_COL_DEF = { suppressMovable: true, sortable: true, wrapText: true };

interface Props {
    rows: TypedGoalSelect[]; // The filtered subset (e.g., just Abilities)
    allGoals: TypedGoalSelect[]; // The full list for global priority checks
    estimate: IGoalEstimate[];
    goalsColorCoding: GoalColorMode;
    menuItemSelect: (goalId: string, item: 'edit' | 'delete') => void;
    onToggleInclude?: (goalId: string) => void;
}

export const GoalsTable: React.FC<Props> = ({
    rows,
    allGoals,
    estimate,
    goalsColorCoding,
    menuItemSelect,
    onToggleInclude,
}) => {
    const dispatch = useContext(DispatchContext);

    // All frequently-changing values live in refs so columnDefs can have
    // empty deps and never recompute — which would reset user-resized column widths.
    const statusColWidthReference = useRef(STATUS_COL_DEFAULT_WIDTH);
    const gridApiReference = useRef<GridApi | null>(null);
    // Persists all user-resized column widths so they survive ag-grid's
    // internal reset that happens when rowData changes.
    const savedWidthsReference = useRef<Record<string, number>>({});
    const goalsColorCodingReference = useRef(goalsColorCoding);
    goalsColorCodingReference.current = goalsColorCoding;
    const onToggleIncludeReference = useRef(onToggleInclude);
    onToggleIncludeReference.current = onToggleInclude;
    // Map keyed by goalId for O(1) lookups in cell renderers.
    // Using .find() here would be O(n) × 9 renderers × N rows = O(N²) per render.
    const estimateMapReference = useRef<Map<string, IGoalEstimate>>(new Map());
    estimateMapReference.current = new Map(estimate.map(est => [est.goalId, est]));
    const orderedAllGoalsReference = useRef<typeof allGoals>([]);
    const menuItemSelectReference = useRef(menuItemSelect);
    menuItemSelectReference.current = menuItemSelect;
    const dispatchReference = useRef(dispatch);
    dispatchReference.current = dispatch;
    // rowsRef lets columnDefs (empty deps) read the initial row types for hide logic.
    // Goal types never change mid-session so the initial values stay correct.
    const rowsReference = useRef(rows);

    orderedAllGoalsReference.current = useMemo(() => allGoals.toSorted((a, b) => a.priority - b.priority), [allGoals]);

    // Refresh all cells when estimate changes so date/status columns stay current
    // without needing estimate in columnDefs deps.
    useEffect(() => {
        gridApiReference.current?.refreshCells({ force: true });
    }, [estimate]);

    const handleGridReady = useCallback((event_: GridReadyEvent) => {
        gridApiReference.current = event_.api;
    }, []);

    const handleColumnResized = useCallback((event_: ColumnResizedEvent) => {
        if (!event_.finished || !event_.column) return;
        const colId = event_.column.getColId();
        const width = event_.column.getActualWidth();
        // Save every resized column so we can restore after rowData changes.
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
        // If the status column was resized, sync the ref and refresh cells
        // so the text label reflects the restored width.
        if (saved[STATUS_COL_ID] !== undefined) {
            statusColWidthReference.current = saved[STATUS_COL_ID];
            gridApiReference.current?.refreshCells({ force: true, columns: [STATUS_COL_ID] });
        }
    }, []);

    const getGoalInfo = (goal: TypedGoalSelect, goalEstimate: IGoalEstimate) => {
        switch (goal.type) {
            case PersonalGoalType.Ascend: {
                const isSameRarity = goal.rarityStart === goal.rarityEnd;
                const minStars = RarityMapper.toStars[goal.rarityEnd];
                const isMinStars = minStars === goal.starsEnd;

                const targetShards = ShardsService.getTargetShards(goal);
                const targetMythicShards = ShardsService.getTargetMythicShards(goal);
                return (
                    <div>
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-1">
                                    {!isSameRarity && (
                                        <>
                                            <RarityIcon rarity={goal.rarityStart} /> <ArrowRight className="size-4" />
                                            <RarityIcon rarity={goal.rarityEnd} />
                                            {!isMinStars && <StarsIcon stars={goal.starsEnd} />}
                                        </>
                                    )}

                                    {isSameRarity && (
                                        <>
                                            <StarsIcon stars={goal.starsStart} /> <ArrowRight className="size-4" />
                                            <StarsIcon stars={goal.starsEnd} />
                                        </>
                                    )}
                                </div>

                                <div>
                                    {targetShards > 0 && (
                                        <div>
                                            <b>
                                                {goal.shards} of {targetShards}
                                            </b>{' '}
                                            Shards
                                        </div>
                                    )}
                                    {targetMythicShards > 0 && (
                                        <div>
                                            <b>
                                                {goal.mythicShards} of {targetMythicShards}
                                            </b>{' '}
                                            Mythic Shards
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        {goalEstimate.orbsEstimate &&
                            !!Object.values(goalEstimate.orbsEstimate.orbs).some(x => x > 0) && (
                                <div className="py-2.5">
                                    <OrbsTotal
                                        size={25}
                                        alliance={goalEstimate.orbsEstimate.alliance}
                                        orbs={goalEstimate.orbsEstimate.orbs}
                                        displayOrbs={Object.fromEntries(
                                            Object.entries(goalEstimate.orbsEstimate.orbs).filter(([, v]) => v > 0)
                                        )}
                                    />
                                </div>
                            )}
                    </div>
                );
            }

            case PersonalGoalType.UpgradeRank: {
                return (
                    <div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-[3px]">
                                <RankIcon rank={goal.rankStart} rankPoint5={goal.rankStartPoint5} />{' '}
                                <ArrowRight className="size-4" />
                                <RankIcon rank={goal.rankEnd} rankPoint5={goal.rankPoint5} />
                                {goal.upgradesRarity.length > 0 && (
                                    <div className="flex items-center gap-[3px]">
                                        {goal.upgradesRarity.map(x => (
                                            <RarityIcon key={x} rarity={x} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        {goalEstimate.xpBooksApplied !== undefined &&
                            goalEstimate.xpBooksRequired !== undefined &&
                            goalEstimate.xpBooksRequired > 0 && (
                                <>
                                    <div className="flex flex-row">
                                        <div className="mr-0.5">
                                            XP Books Applied {goalEstimate.xpBooksApplied} / Required{' '}
                                            {goalEstimate.xpBooksRequired} (
                                            {Math.round(
                                                (goalEstimate.xpBooksApplied / goalEstimate.xpBooksRequired!) * 100
                                            )}
                                            %)
                                        </div>
                                        {goalEstimate.xpEstimate && <XpTooltip {...goalEstimate.xpEstimate} />}
                                    </div>
                                </>
                            )}
                    </div>
                );
            }

            case PersonalGoalType.UpgradeMaterial: {
                return (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-[3px]">{goal.quantity}</div>
                    </div>
                );
            }

            case PersonalGoalType.MowAbilities: {
                const hasPrimaryGoal = goal.primaryEnd > goal.primaryStart;
                const hasSecondaryGoal = goal.secondaryEnd > goal.secondaryStart;
                return (
                    <div>
                        <div className="flex items-center justify-between gap-2.5">
                            <div className="flex flex-col items-start">
                                {hasPrimaryGoal && (
                                    <div className="flex items-center gap-[3px]">
                                        <span>Primary:</span> <b>{goal.primaryStart}</b>{' '}
                                        <ArrowRight className="size-4" />
                                        <b>{goal.primaryEnd}</b>
                                    </div>
                                )}

                                {hasSecondaryGoal && (
                                    <div className="flex items-center gap-[3px]">
                                        <span>Secondary:</span> <b>{goal.secondaryStart}</b>{' '}
                                        <ArrowRight className="size-4" />
                                        <b>{goal.secondaryEnd}</b>
                                    </div>
                                )}
                            </div>
                        </div>
                        {goal.upgradesRarity.length > 0 && (
                            <div className="flex items-center gap-[3px]">
                                <ArrowRight className="size-4" />
                                {goal.upgradesRarity.map(x => (
                                    <RarityIcon key={x} rarity={x} />
                                ))}
                            </div>
                        )}
                        {goalEstimate.mowEstimate && (
                            <div className="px-0 py-2.5">
                                <MowMaterialsTotal
                                    size="small"
                                    mowAlliance={goal.unitAlliance}
                                    total={goalEstimate.mowEstimate}
                                />
                            </div>
                        )}
                    </div>
                );
            }
            case PersonalGoalType.CharacterAbilities: {
                const hasActiveGoal = goal.activeEnd > goal.activeStart;
                const hasPassiveGoal = goal.passiveEnd > goal.passiveStart;
                return (
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="flex flex-col items-start">
                                {hasActiveGoal && (
                                    <div className="flex items-center gap-[3px]">
                                        <span>Active:</span> <b>{goal.activeStart}</b> <ArrowRight className="size-4" />
                                        <b>{goal.activeEnd}</b>
                                    </div>
                                )}

                                {hasPassiveGoal && (
                                    <div className="flex items-center gap-[3px]">
                                        <span>Passive:</span> <b>{goal.passiveStart}</b>{' '}
                                        <ArrowRight className="size-4" />
                                        <b>{goal.passiveEnd}</b>
                                    </div>
                                )}
                            </div>
                        </div>
                        {goalEstimate.xpBooksApplied !== undefined &&
                            goalEstimate.xpBooksRequired !== undefined &&
                            goalEstimate.xpBooksRequired > 0 && (
                                <div>
                                    XP Books Applied {goalEstimate.xpBooksApplied} / Required{' '}
                                    {goalEstimate.xpBooksRequired} (
                                    {Math.round((goalEstimate.xpBooksApplied / goalEstimate.xpBooksRequired!) * 100)}
                                    %)
                                </div>
                            )}
                        {goalEstimate.abilitiesEstimate && (
                            <div className="flex items-center gap-[3px]">
                                <CharacterAbilitiesTotal {...goalEstimate.abilitiesEstimate} />
                            </div>
                        )}
                    </div>
                );
            }
            case PersonalGoalType.Unlock: {
                const targetShards = charsUnlockShards[goal.rarity];

                return (
                    <div>
                        <div className="flex items-center justify-between">
                            <div>
                                <b>
                                    {goal.shards} of {targetShards}
                                </b>{' '}
                                Shards
                            </div>
                        </div>
                    </div>
                );
            }
        }
    };
    // columnDefs has empty deps so it NEVER recomputes — all changing values are
    // read from refs inside cell renderers, and refreshCells() is called externally
    // when data changes. This prevents ag-grid from resetting user-resized column widths.
    // hide values use rowsRef.current (captured at mount); goal types never change mid-session.
    const columnDefs = useMemo<Array<ColDef<TypedGoalSelect>>>(() => {
        const initialRows = rowsReference.current;
        const isCharAbilities = initialRows.every(r => r.type === PersonalGoalType.CharacterAbilities);
        const hasAscend = initialRows.some(r => r.type === PersonalGoalType.Ascend);
        const hasUpgrades = initialRows.some(r =>
            [PersonalGoalType.UpgradeRank, PersonalGoalType.MowAbilities].includes(r.type)
        );
        return [
            {
                field: 'priority',
                width: 110,
                maxWidth: 110,
                cellRenderer: (params: ICellRendererParams<TypedGoalSelect>) => {
                    const { data } = params;
                    if (!data) return;

                    const ordered = orderedAllGoalsReference.current;
                    const globalIndex = ordered.findIndex(x => x.goalId === data.goalId);

                    const moveUp = () => {
                        if (globalIndex <= 0) return;
                        const neighbor = ordered[globalIndex - 1];
                        dispatchReference.current.goals({
                            type: 'Swap',
                            goalId: data.goalId,
                            neighborId: neighbor.goalId,
                        });
                    };

                    const moveDown = () => {
                        if (globalIndex >= ordered.length - 1) return;
                        const neighbor = ordered[globalIndex + 1];
                        dispatchReference.current.goals({
                            type: 'Swap',
                            goalId: data.goalId,
                            neighborId: neighbor.goalId,
                        });
                    };
                    return (
                        <div className="flex h-full items-center justify-center gap-1">
                            <span className="text-sm font-semibold text-(--soft-fg)">#{data.priority}</span>
                            <Button
                                size="square-petite"
                                appearance="plain"
                                className="!size-7 [--btn-accent:var(--soft-fg)]"
                                aria-label="Increase Priority"
                                onPress={moveUp}>
                                <ArrowUp data-slot="icon" />
                            </Button>
                            <Button
                                size="square-petite"
                                appearance="plain"
                                className="!size-7 [--btn-accent:var(--soft-fg)]"
                                aria-label="Decrease Priority"
                                onPress={moveDown}>
                                <ArrowDown data-slot="icon" />
                            </Button>
                        </div>
                    );
                },
            },
            {
                headerName: 'Actions',
                width: 96,
                maxWidth: 96,
                cellRenderer: (params: ICellRendererParams<TypedGoalSelect>) => {
                    const { data } = params;
                    if (data) {
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
                    }
                },
            },
            {
                field: 'unitIcon',
                headerName: 'Unit',
                cellRenderer: (params: ICellRendererParams<TypedGoalSelect>) => {
                    const { data } = params;
                    if (data) {
                        if (data.type === PersonalGoalType.UpgradeMaterial) {
                            const mat = UpgradesService.getUpgradeMaterial(data.upgradeMaterialId);
                            if (mat !== undefined) {
                                return (
                                    <UpgradeImage
                                        material={mat.snowprintId}
                                        iconPath={mat.icon ?? ''}
                                        size={30}
                                        rarity={RarityMapper.stringToRarityString(mat.rarity)}
                                        tooltip={mat?.label ?? ''}
                                    />
                                );
                            }
                            return '(unknown material goal)';
                        }
                        return (
                            <UnitShardIcon icon={data.unitRoundIcon} height={30} width={30} tooltip={data.unitName} />
                        );
                    }
                },
                sortable: false,
                maxWidth: 60,
            },
            {
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
                    const isReached = !!goalEstimate?.completed && !goalEstimate?.blocked;
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
                                    className={[
                                        'flex h-full w-full cursor-pointer items-center justify-center gap-1.5',
                                        'border-0 bg-transparent transition-colors',
                                        'focus-visible:ring-2 focus-visible:ring-(--warning) focus-visible:outline-none focus-visible:ring-inset',
                                        'text-(--warning) hover:bg-(--warning)/10',
                                    ].join(' ')}
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
                                className={[
                                    'flex h-full w-full cursor-pointer items-center justify-center gap-1.5',
                                    'border-0 bg-transparent transition-colors',
                                    'focus-visible:ring-2 focus-visible:ring-(--primary) focus-visible:outline-none focus-visible:ring-inset',
                                    isIncluded
                                        ? 'text-(--primary) hover:bg-(--primary)/10'
                                        : 'text-(--soft-fg) hover:bg-(--overlay)',
                                ].join(' ')}
                                aria-label={isIncluded ? 'In Progress' : 'Paused'}
                                onClick={() => onToggleIncludeReference.current!(data.goalId)}>
                                {isIncluded ? (
                                    <Play className="size-4 shrink-0" />
                                ) : (
                                    <Pause className="size-4 shrink-0" />
                                )}
                                {showText && (
                                    <span className="truncate text-sm font-medium">
                                        {isIncluded ? 'In Progress' : 'Paused'}
                                    </span>
                                )}
                            </button>
                        </AccessibleTooltip>
                    );
                },
            },
            {
                headerName: 'Details',
                autoHeight: true,
                width: 300,
                cellRenderer: (params: ICellRendererParams<TypedGoalSelect>) => {
                    const { data } = params;
                    const goalEstimate = data ? estimateMapReference.current.get(data.goalId) : undefined;
                    if (data && goalEstimate) {
                        return getGoalInfo(data, goalEstimate);
                    }
                },
            },
            {
                headerName: 'Estimated Date',
                valueGetter: (params: ValueGetterParams<TypedGoalSelect>) => {
                    const goalEstimate = params.data ? estimateMapReference.current.get(params.data.goalId) : undefined;
                    if (
                        !goalEstimate ||
                        (goalEstimate.daysLeft === undefined && goalEstimate.xpDaysLeft === undefined)
                    ) {
                        return '';
                    }
                    const { daysLeft, xpDaysLeft } = goalEstimate;
                    const materialDate = daysLeft === undefined ? undefined : getEstimatedDate(daysLeft);
                    const xpDate = xpDaysLeft === undefined ? undefined : getEstimatedDate(xpDaysLeft);
                    if (materialDate && xpDate) return `${materialDate} (XP by ${xpDate})`;
                    if (materialDate) return materialDate;
                    if (xpDate) return `XP by ${xpDate}`;
                    return '';
                },
                cellRenderer: (params: ICellRendererParams<TypedGoalSelect>) => {
                    const goalEstimate = params.data ? estimateMapReference.current.get(params.data.goalId) : undefined;
                    if (!goalEstimate) return;
                    const { daysLeft, xpDaysLeft } = goalEstimate;
                    return (
                        <div className="flex flex-col gap-0.5 py-1">
                            {daysLeft !== undefined && (
                                <AccessibleTooltip
                                    title={`${daysLeft} days for materials. Estimated date ${getEstimatedDate(daysLeft)}`}>
                                    <div className="flex items-center gap-[3px] leading-tight">
                                        <span className="text-sm">{getEstimatedDate(daysLeft)}</span>
                                    </div>
                                </AccessibleTooltip>
                            )}
                            {xpDaysLeft !== undefined && (
                                <AccessibleTooltip
                                    title={`${Math.ceil(xpDaysLeft)} days for XP. Estimated date ${getEstimatedDate(xpDaysLeft)}`}>
                                    <div className="flex items-center gap-[3px] leading-tight">
                                        <span className="text-sm">{`XP: ${getEstimatedDate(xpDaysLeft)}`}</span>
                                    </div>
                                </AccessibleTooltip>
                            )}
                        </div>
                    );
                },
                width: 170,
                autoHeight: true,
            },
            {
                colId: 'days-left',
                headerName: 'Days left',
                hide: isCharAbilities,
                valueGetter: params =>
                    params.data ? estimateMapReference.current.get(params.data.goalId)?.daysLeft : undefined,
                maxWidth: 110,
            },
            {
                colId: 'days-total',
                headerName: 'Days total',
                hide: isCharAbilities,
                valueGetter: params =>
                    params.data ? estimateMapReference.current.get(params.data.goalId)?.daysTotal : undefined,
                maxWidth: 110,
            },
            {
                colId: 'energy',
                headerName: 'Energy',
                hide: isCharAbilities,
                valueGetter: params =>
                    params.data ? estimateMapReference.current.get(params.data.goalId)?.energyTotal : undefined,
                maxWidth: 110,
            },
            {
                colId: 'onslaught-tokens',
                headerName: 'Onslaught tokens',
                hide: !hasAscend,
                valueGetter: params =>
                    params.data ? estimateMapReference.current.get(params.data.goalId)?.oTokensTotal : undefined,
                maxWidth: 140,
            },
            {
                colId: 'upgrades',
                headerName: 'Upgrades',
                hide: !hasUpgrades,
                width: 140,
                cellStyle: { padding: 0, overflow: 'hidden' },
                cellRenderer: (params: ICellRendererParams<ICharacterUpgradeRankGoal | ICharacterUpgradeMow>) => {
                    const { data } = params;
                    if (!data) return;
                    if (data.type !== PersonalGoalType.UpgradeRank && data.type !== PersonalGoalType.MowAbilities)
                        return;
                    const goalEstimate = estimateMapReference.current.get(data.goalId);
                    const isReached = !!goalEstimate?.completed && !goalEstimate?.blocked;
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
            },
            {
                field: 'notes',
            },
        ];
    }, []); // empty deps — all values read from refs; column widths are never reset

    const getRowStyle = useCallback((params: RowClassParams<TypedGoalSelect>): RowStyle | undefined => {
        const goalEstimate = params.data ? estimateMapReference.current.get(params.data.goalId) : undefined;

        if (goalEstimate?.completed && !goalEstimate?.blocked) {
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
    }, []); // all values read from refs — stable reference, no column resets

    const baseRowHeight = rows.some(row => [PersonalGoalType.CharacterAbilities].includes(row.type)) ? 90 : 60;

    return (
        <div
            className="ag-theme-material density-compact min-h-[150px] w-full"
            style={{
                height: baseRowHeight + rows.length * baseRowHeight,
            }}>
            <AgGridReact
                modules={GRID_MODULES}
                theme="legacy"
                defaultColDef={GRID_DEFAULT_COL_DEF}
                rowHeight={60}
                columnDefs={columnDefs}
                rowData={rows}
                getRowStyle={getRowStyle}
                onGridReady={handleGridReady}
                onColumnResized={handleColumnResized}
                onRowDataUpdated={handleRowDataUpdated}
            />
        </div>
    );
};
