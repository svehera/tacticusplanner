import { Warning } from '@mui/icons-material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GridViewIcon from '@mui/icons-material/GridView';
import InfoIcon from '@mui/icons-material/Info';
import InventoryIcon from '@mui/icons-material/Inventory';
import PendingIcon from '@mui/icons-material/Pending';
import TableRowsIcon from '@mui/icons-material/TableRows';
import { Accordion, AccordionDetails, AccordionSummary, FormControlLabel, Switch } from '@mui/material';
import Button from '@mui/material/Button';
import { sum } from 'lodash';
import React, { lazy, Suspense, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { DispatchContext, StoreContext } from '@/reducers/store.provider';
import { formatDateWithOrdinal } from 'src/shared-logic/functions';

import { useDragScroll } from '@/fsd/5-shared/lib/use-drag-scroll';
import { AccessibleTooltip, FlexBox } from '@/fsd/5-shared/ui';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService } from '@/fsd/4-entities/character';

import { IEstimatedUpgrades } from '@/fsd/3-features/goals/goals.models';

import { SectionAccordion } from './section-accordion';

const MaterialsTable = lazy(() =>
    import('@/fsd/3-features/goals/materials-table').then(m => ({ default: m.MaterialsTable }))
);
const RaidsDayView = lazy(() =>
    import('@/fsd/3-features/goals/raids-day-view').then(m => ({ default: m.RaidsDayView }))
);
const Inventory = lazy(() => import('@/fsd/1-pages/input-inventory').then(m => ({ default: m.Inventory })));
const RaidUpgradeMaterialCard = lazy(() =>
    import('./raid-upgrade-material-card').then(m => ({ default: m.RaidUpgradeMaterialCard }))
);

interface Props {
    estimatedRanks: IEstimatedUpgrades;
    scrollToCharSnowprintId?: string;
    upgrades: Record<string, number>;
    updateInventory: (materialId: string, value: number) => void;
    updateInventoryAny: () => void;
}

type ReferenceElement = HTMLDivElement | null;
type ReferenceMap = { [key: string]: ReferenceElement };

// ─── RaidsPlan ───────────────────────────────────────────────────────────────

export const RaidsPlan: React.FC<Props> = ({
    estimatedRanks,
    scrollToCharSnowprintId,
    updateInventoryAny,
    upgrades,
    updateInventory,
}) => {
    const { viewPreferences, dailyRaidsPreferences } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);
    const [upgradesPaging, setUpgradesPaging] = useState<{
        start: number;
        end: number;
        completed: boolean;
    }>({ start: 0, end: 3, completed: true });

    const [grid1Loaded, setGrid1Loaded] = useState<boolean>(false);
    const [grid2Loaded, setGrid2Loaded] = useState<boolean>(false);
    const [grid3Loaded, setGrid3Loaded] = useState<boolean>(false);

    const [allDaysExpanded, setAllDaysExpanded] = useState(false);
    const [outerExpanded, setOuterExpanded] = useState(scrollToCharSnowprintId !== undefined);

    const [expandedPanels, setExpandedPanels] = useState(() => ({
        related: false,
        inProgress: scrollToCharSnowprintId !== undefined,
        finished: false,
        blocked: false,
        raids: false,
    }));

    const togglePanel = (key: keyof typeof expandedPanels) => (_: React.SyntheticEvent, isExpanded: boolean) =>
        setExpandedPanels(previous => ({ ...previous, [key]: isExpanded }));

    const itemReferences = useRef<ReferenceMap>({});
    const inProgressReference = useRef<HTMLDivElement>(null);

    const {
        scrollRef: raidsDayScrollReference,
        onMouseDown: onDragStart,
        onMouseMove: onDragMove,
        onMouseUp: onDragEnd,
        onMouseLeave: onDragLeave,
        onTouchStart: onDragTouchStart,
        onTouchMove: onDragTouchMove,
        onTouchEnd: onDragTouchEnd,
        onTouchCancel: onDragTouchCancel,
    } = useDragScroll();
    const setCardReference = useCallback(
        (id: number) => (element: ReferenceElement) => {
            itemReferences.current[id] = element;
        },
        []
    );

    type CharacterToMaterialIndexMap = Record<string, number>;

    const updateView = (tableView: boolean): void => {
        dispatch.viewPreferences({ type: 'Update', setting: 'raidsTableView', value: tableView });
    };

    const characterToMaterialMap: CharacterToMaterialIndexMap = useMemo(() => {
        const characterIndexMap: CharacterToMaterialIndexMap = {};

        for (const [materialIndex, material] of estimatedRanks.inProgressMaterials.entries()) {
            // Iterate over the related characters for the current material
            for (const fullName of material.relatedCharacters) {
                const unit = CharactersService.getUnit(fullName);
                if (!unit || !unit.snowprintId) continue;
                // Check if this snowprintId has ALREADY been recorded.
                // If it hasn't, this is the FIRST time we've seen it, so record the index.
                if (!(unit.snowprintId in characterIndexMap)) {
                    characterIndexMap[unit.snowprintId] = materialIndex;
                }
            }
        }

        return characterIndexMap;
    }, [estimatedRanks.inProgressMaterials]);

    const scrollToTarget = useCallback(() => {
        if (scrollToCharSnowprintId === undefined) return;
        if (!Object.keys(characterToMaterialMap).includes(scrollToCharSnowprintId)) return;
        if (viewPreferences.raidsTableView) {
            inProgressReference.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }
        const targetElement = itemReferences.current[characterToMaterialMap[scrollToCharSnowprintId]];
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [itemReferences, scrollToCharSnowprintId, characterToMaterialMap, viewPreferences.raidsTableView]);

    useEffect(() => {
        if (scrollToCharSnowprintId !== undefined) {
            setOuterExpanded(true);
            setExpandedPanels(previous => ({ ...previous, inProgress: true }));
        }
    }, [scrollToCharSnowprintId]);

    useEffect(() => {
        if (scrollToCharSnowprintId) {
            // Use a brief delay to ensure the scrollable parent container and its content
            // have finished rendering and measurement.
            const timer = setTimeout(() => {
                scrollToTarget();
            }, 100);

            return () => clearTimeout(timer); // Cleanup timer on unmount
        }
    }, [scrollToCharSnowprintId, scrollToTarget]); // Rerun if the ID changes

    useEffect(() => {
        if (estimatedRanks.upgradesRaids.length > 3) {
            setUpgradesPaging(() => ({
                start: 0,
                end: 3,
                completed: false,
            }));
        } else {
            setUpgradesPaging(() => ({
                start: 0,
                end: estimatedRanks.upgradesRaids.length,
                completed: true,
            }));
        }
    }, [estimatedRanks.upgradesRaids.length]);

    const upgradesCalendarDate: string = useMemo(() => {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + estimatedRanks.upgradesRaids.length - 1);

        return formatDateWithOrdinal(nextDate);
    }, [estimatedRanks.upgradesRaids.length]);

    const daysTotal = estimatedRanks.daysTotal;

    const energyTotal = useMemo(() => {
        const todayRaids = estimatedRanks.upgradesRaids[0]?.raids ?? [];
        const energyAlreadySpentToday = sum(
            todayRaids.map(raid =>
                sum(raid.raidLocations.map(location => location.raidsAlreadyPerformed * location.energyCost))
            )
        );

        return Math.max(0, estimatedRanks.energyTotal - energyAlreadySpentToday);
    }, [estimatedRanks.energyTotal, estimatedRanks.upgradesRaids]);

    const calendarDateTotal: string = useMemo(() => {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + daysTotal - 1);

        return formatDateWithOrdinal(nextDate);
    }, [daysTotal]);

    return (
        <Accordion
            expanded={outerExpanded}
            onChange={(_, isExpanded) => setOuterExpanded(isExpanded)}
            disableGutters
            className="my-5 overflow-hidden rounded-xl! border border-(--border) bg-transparent shadow-none">
            <AccordionSummary
                expandIcon={<ExpandMoreIcon className="text-(--muted-fg)" />}
                className="px-4 py-0 [&_.MuiAccordionSummary-content]:my-1.5">
                <FlexBox className="flex-col items-start">
                    <div className="flex flex-wrap items-center gap-2 text-base font-semibold sm:text-lg">
                        <span>
                            Raids plan (<b>{daysTotal}</b> Days |
                        </span>
                        <span>
                            <b>{energyTotal}</b> <MiscIcon icon={'energy'} height={15} width={15} />)
                        </span>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={viewPreferences.raidsTableView}
                                    onChange={event => {
                                        event.stopPropagation();
                                        updateView(event.target.checked);
                                    }}
                                    onClick={event => event.stopPropagation()}
                                    onFocus={event => event.stopPropagation()}
                                    onMouseDown={event => event.stopPropagation()}
                                />
                            }
                            label={
                                <div className="flex items-center gap-1">
                                    {viewPreferences.raidsTableView ? (
                                        <div className="flex items-center gap-1">
                                            <TableRowsIcon color="primary" /> <span>Table View</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1">
                                            <GridViewIcon color="primary" /> <span>Cards View</span>
                                        </div>
                                    )}
                                </div>
                            }
                        />
                    </div>
                    <span className="text-sm text-(--muted-fg) italic">{calendarDateTotal}</span>
                </FlexBox>
            </AccordionSummary>
            <AccordionDetails className="p-0!">
                {estimatedRanks.relatedUpgrades.length > 0 && (
                    <SectionAccordion
                        expanded={expandedPanels.related}
                        onChange={togglePanel('related')}
                        transitionProps={{ unmountOnExit: true }}
                        summary={
                            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold sm:text-base">
                                <InventoryIcon />
                                <b>{estimatedRanks.relatedUpgrades.length}</b> related upgrades (Inventory)
                            </div>
                        }>
                        <Suspense fallback={undefined}>
                            <Inventory itemsFilter={estimatedRanks.relatedUpgrades} onUpdate={updateInventoryAny} />
                        </Suspense>
                    </SectionAccordion>
                )}
                {estimatedRanks.inProgressMaterials.length > 0 && (
                    <SectionAccordion
                        ref={inProgressReference}
                        expanded={expandedPanels.inProgress}
                        onChange={togglePanel('inProgress')}
                        transitionProps={{ unmountOnExit: !grid1Loaded }}
                        summary={
                            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold sm:text-base">
                                <PendingIcon color={'primary'} />
                                <b>{estimatedRanks.inProgressMaterials.length}</b> in progress upgrades
                            </div>
                        }>
                        {viewPreferences.raidsTableView === true ? (
                            <div className="ag-theme-material flex h-[600px] min-h-[150px] w-full flex-col">
                                <Suspense fallback={undefined}>
                                    <MaterialsTable
                                        rows={estimatedRanks.inProgressMaterials}
                                        updateMaterialQuantity={updateInventory}
                                        onGridReady={() => setGrid1Loaded(true)}
                                        inventory={upgrades}
                                        scrollToCharSnowprintId={scrollToCharSnowprintId}
                                        alreadyUsedMaterials={estimatedRanks.finishedMaterials}
                                    />
                                </Suspense>
                            </div>
                        ) : (
                            <Suspense fallback={undefined}>
                                <div className="flex max-h-[600px] w-full flex-wrap gap-x-4 gap-y-4 overflow-y-auto py-2 min-[354px]:px-2">
                                    {estimatedRanks.inProgressMaterials.length > 0 &&
                                        estimatedRanks.inProgressMaterials.map((material, index) => (
                                            <div key={index} ref={setCardReference(index)}>
                                                <RaidUpgradeMaterialCard
                                                    key={index}
                                                    index={index}
                                                    upgradeEstimate={material}
                                                />
                                            </div>
                                        ))}
                                </div>
                            </Suspense>
                        )}
                    </SectionAccordion>
                )}
                {estimatedRanks.finishedMaterials.length > 0 && (
                    <SectionAccordion
                        expanded={expandedPanels.finished}
                        onChange={togglePanel('finished')}
                        transitionProps={{ unmountOnExit: !grid3Loaded }}
                        summary={
                            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold sm:text-base">
                                <CheckCircleIcon color={'success'} /> <b>{estimatedRanks.finishedMaterials.length}</b>{' '}
                                finished upgrades
                            </div>
                        }>
                        {viewPreferences.raidsTableView === true ? (
                            <div className="ag-theme-material flex h-[600px] w-full flex-col">
                                <Suspense fallback={undefined}>
                                    <MaterialsTable
                                        rows={estimatedRanks.finishedMaterials}
                                        updateMaterialQuantity={updateInventory}
                                        onGridReady={() => setGrid3Loaded(true)}
                                        inventory={upgrades}
                                    />
                                </Suspense>
                            </div>
                        ) : (
                            <Suspense fallback={undefined}>
                                <div className="flex max-h-[600px] w-full flex-wrap gap-x-4 gap-y-4 overflow-y-auto py-2 min-[354px]:px-2">
                                    {estimatedRanks.finishedMaterials.map((material, index) => (
                                        <RaidUpgradeMaterialCard
                                            key={index}
                                            index={index}
                                            upgradeEstimate={material}
                                            showAdditionalInfo={false}
                                        />
                                    ))}
                                </div>
                            </Suspense>
                        )}
                    </SectionAccordion>
                )}
                {estimatedRanks.blockedMaterials.length > 0 && (
                    <SectionAccordion
                        expanded={expandedPanels.blocked}
                        onChange={togglePanel('blocked')}
                        transitionProps={{ unmountOnExit: !grid2Loaded }}
                        summary={
                            <AccessibleTooltip
                                title={`You don't any have location for ${estimatedRanks.blockedMaterials.length} upgrades`}>
                                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold sm:text-base">
                                    <Warning color={'warning'} />
                                    <b>{estimatedRanks.blockedMaterials.length}</b> blocked upgrades
                                </div>
                            </AccessibleTooltip>
                        }>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 p-2">
                                <InfoIcon color="primary" /> You don&apos;t have available campaigns nodes for the items
                                listed in the table below
                            </div>

                            <div className="grow">
                                {viewPreferences.raidsTableView === true ? (
                                    <div className="ag-theme-material flex h-[600px] w-full flex-col">
                                        <Suspense fallback={undefined}>
                                            <MaterialsTable
                                                rows={estimatedRanks.blockedMaterials}
                                                updateMaterialQuantity={updateInventory}
                                                onGridReady={() => setGrid2Loaded(true)}
                                                inventory={upgrades}
                                            />
                                        </Suspense>
                                    </div>
                                ) : (
                                    <Suspense fallback={undefined}>
                                        <div className="flex max-h-[600px] w-full flex-wrap gap-x-4 gap-y-4 overflow-y-auto py-2 min-[354px]:px-2">
                                            {estimatedRanks.blockedMaterials.map((material, index) => (
                                                <RaidUpgradeMaterialCard
                                                    key={index}
                                                    index={index}
                                                    upgradeEstimate={material}
                                                    showAdditionalInfo={false}
                                                />
                                            ))}
                                        </div>
                                    </Suspense>
                                )}
                            </div>
                        </div>
                    </SectionAccordion>
                )}

                {estimatedRanks.upgradesRaids.length > 0 && (
                    <SectionAccordion
                        expanded={expandedPanels.raids}
                        onChange={togglePanel('raids')}
                        transitionProps={{ unmountOnExit: !upgradesPaging.completed }}
                        summary={
                            <div className="flex w-full flex-col gap-1">
                                <span className="text-sm font-semibold sm:text-base">Daily Raids</span>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-(--muted-fg)">
                                    <span>
                                        <b className="text-(--card-fg)">{estimatedRanks.upgradesRaids.length}</b> days
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <b className="text-(--card-fg)">{energyTotal}</b>
                                        <MiscIcon icon={'energy'} height={13} width={13} />
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <b className="text-(--card-fg)">{estimatedRanks.raidsTotal}</b>
                                        <MiscIcon icon={'raidTicket'} height={13} width={13} />
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <b className="text-(--card-fg)">{estimatedRanks.freeEnergyDays}</b> days unused
                                        <MiscIcon icon={'energy'} height={13} width={13} />
                                    </span>
                                    <span className="italic">{upgradesCalendarDate}</span>
                                    {expandedPanels.raids && (
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={event => {
                                                event.stopPropagation();
                                                setAllDaysExpanded(v => !v);
                                            }}>
                                            {allDaysExpanded ? 'Collapse cards' : 'Expand cards'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        }>
                        <div
                            ref={raidsDayScrollReference}
                            className="overflow-x-auto overflow-y-hidden"
                            style={{ cursor: 'grab' }}
                            onMouseDown={onDragStart}
                            onMouseMove={onDragMove}
                            onMouseUp={onDragEnd}
                            onMouseLeave={onDragLeave}
                            onTouchStart={onDragTouchStart}
                            onTouchMove={onDragTouchMove}
                            onTouchEnd={onDragTouchEnd}
                            onTouchCancel={onDragTouchCancel}>
                            <Suspense fallback={undefined}>
                                <div className="flex gap-2.5">
                                    {estimatedRanks.upgradesRaids
                                        .slice(upgradesPaging.start, upgradesPaging.end)
                                        .map((day, index) => {
                                            return (
                                                <RaidsDayView
                                                    key={index}
                                                    day={day}
                                                    title={'Day ' + (index + 1)}
                                                    dayIndex={index}
                                                    expanded={allDaysExpanded}
                                                    energyPerDay={dailyRaidsPreferences.dailyEnergy}
                                                />
                                            );
                                        })}
                                    {!upgradesPaging.completed && (
                                        <Button
                                            variant={'outlined'}
                                            className="min-w-[300px] items-start pt-5"
                                            onClick={() =>
                                                setUpgradesPaging({
                                                    start: 0,
                                                    end: estimatedRanks.upgradesRaids.length,
                                                    completed: true,
                                                })
                                            }>
                                            Show All
                                        </Button>
                                    )}
                                </div>
                            </Suspense>
                        </div>
                    </SectionAccordion>
                )}
            </AccordionDetails>
        </Accordion>
    );
};
