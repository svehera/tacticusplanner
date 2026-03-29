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
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';

import { DispatchContext, StoreContext } from '@/reducers/store.provider';
import { formatDateWithOrdinal } from 'src/shared-logic/functions';

import { AccessibleTooltip, FlexBox } from '@/fsd/5-shared/ui';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService } from '@/fsd/4-entities/character';

import { IEstimatedUpgrades } from '@/fsd/3-features/goals/goals.models';
import { MaterialsTable } from '@/fsd/3-features/goals/materials-table';
import { RaidsDayView } from '@/fsd/3-features/goals/raids-day-view';

import { Inventory } from '@/fsd/1-pages/input-inventory';

import { RaidUpgradeMaterialCard } from './raid-upgrade-material-card';

interface Props {
    estimatedRanks: IEstimatedUpgrades;
    scrollToCharSnowprintId?: string;
    upgrades: Record<string, number>;
    updateInventory: (materialId: string, value: number) => void;
    updateInventoryAny: () => void;
}

type ReferenceElement = HTMLDivElement | null;
type ReferenceMap = { [key: string]: ReferenceElement };

export const RaidsPlan: React.FC<Props> = ({
    estimatedRanks,
    scrollToCharSnowprintId,
    updateInventoryAny,
    upgrades,
    updateInventory,
}) => {
    const { viewPreferences } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);
    const [upgradesPaging, setUpgradesPaging] = useState<{
        start: number;
        end: number;
        completed: boolean;
    }>({ start: 0, end: 3, completed: true });

    const [grid1Loaded, setGrid1Loaded] = useState<boolean>(false);
    const [grid2Loaded, setGrid2Loaded] = useState<boolean>(false);
    const [grid3Loaded, setGrid3Loaded] = useState<boolean>(false);

    const [expandedPanels, setExpandedPanels] = useState(() => ({
        related: false,
        inProgress: scrollToCharSnowprintId !== undefined,
        finished: false,
        blocked: false,
        raids: true,
    }));

    const togglePanel = (key: keyof typeof expandedPanels) => (_: any, isExpanded: boolean) =>
        setExpandedPanels(previous => ({ ...previous, [key]: isExpanded }));

    const itemReferences = useRef<ReferenceMap>({});
    const inProgressReference = useRef<HTMLDivElement>(null);
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
        const energyAlreadySpentToday = todayRaids.reduce((total, raid) => {
            const locationSpent = raid.raidLocations.reduce(
                (locationTotal, location) => locationTotal + location.raidsAlreadyPerformed * location.energyCost,
                0
            );

            return total + locationSpent;
        }, 0);

        return Math.max(0, estimatedRanks.energyTotal - energyAlreadySpentToday);
    }, [estimatedRanks.energyTotal, estimatedRanks.upgradesRaids]);

    const calendarDateTotal: string = useMemo(() => {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + daysTotal - 1);

        return formatDateWithOrdinal(nextDate);
    }, [daysTotal]);

    return (
        <Accordion defaultExpanded={scrollToCharSnowprintId !== undefined}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <FlexBox className="flex-col items-start">
                    <div className="flex flex-wrap items-center gap-2" style={{ fontSize: isMobile ? 16 : 20 }}>
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
                                <div className="flex-box gap5">
                                    {viewPreferences.raidsTableView ? (
                                        <div className="flex-box gap5">
                                            <TableRowsIcon color="primary" /> <span>Table View</span>
                                        </div>
                                    ) : (
                                        <div className="flex-box gap5">
                                            <GridViewIcon color="primary" /> <span>Cards View</span>
                                        </div>
                                    )}
                                </div>
                            }
                        />
                    </div>
                    <span className="italic">{calendarDateTotal}</span>
                </FlexBox>
            </AccordionSummary>
            <AccordionDetails>
                {estimatedRanks.relatedUpgrades.length > 0 && (
                    <Accordion
                        TransitionProps={{ unmountOnExit: !grid1Loaded }}
                        expanded={expandedPanels.related}
                        onChange={togglePanel('related')}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <div className="flex flex-wrap items-center gap-2" style={{ fontSize: isMobile ? 16 : 20 }}>
                                <InventoryIcon />
                                <b>{estimatedRanks.relatedUpgrades.length}</b> related upgrades (Inventory)
                            </div>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Inventory itemsFilter={estimatedRanks.relatedUpgrades} onUpdate={updateInventoryAny} />
                        </AccordionDetails>
                    </Accordion>
                )}
                {estimatedRanks.inProgressMaterials.length > 0 && (
                    <Accordion
                        ref={inProgressReference}
                        expanded={expandedPanels.inProgress}
                        onChange={togglePanel('inProgress')}
                        TransitionProps={{ unmountOnExit: !grid1Loaded }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <div className="flex flex-wrap items-center gap-2" style={{ fontSize: isMobile ? 16 : 20 }}>
                                <PendingIcon color={'primary'} />
                                <b>{estimatedRanks.inProgressMaterials.length}</b> in progress upgrades
                            </div>
                        </AccordionSummary>
                        <AccordionDetails>
                            <div className="h-[600px] overflow-y-auto">
                                {viewPreferences.raidsTableView === true ? (
                                    <div className="ag-theme-material flex h-[600px] min-h-[150px] w-full flex-col">
                                        <MaterialsTable
                                            rows={estimatedRanks.inProgressMaterials}
                                            updateMaterialQuantity={updateInventory}
                                            onGridReady={() => setGrid1Loaded(true)}
                                            inventory={upgrades}
                                            scrollToCharSnowprintId={scrollToCharSnowprintId}
                                            alreadyUsedMaterials={estimatedRanks.finishedMaterials}
                                        />
                                    </div>
                                ) : (
                                    <div className="flex max-h-[600px] w-full flex-wrap gap-x-4 gap-y-4 overflow-y-auto p-2">
                                        {estimatedRanks.inProgressMaterials.length > 0 &&
                                            estimatedRanks.inProgressMaterials.map((material, index) => (
                                                <div
                                                    className="item-raids w-70"
                                                    key={index}
                                                    ref={setCardReference(index)}>
                                                    <RaidUpgradeMaterialCard
                                                        index={index}
                                                        upgradeMaterialSnowprintId={material.id}
                                                        currentQuantity={material.acquiredCount}
                                                        desiredQuantity={material.requiredCount}
                                                        relatedCharacterSnowprintIds={material.relatedCharacters}
                                                        locations={material.locations}
                                                        estimate={material}
                                                    />
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>
                        </AccordionDetails>
                    </Accordion>
                )}
                {estimatedRanks.finishedMaterials.length > 0 && (
                    <Accordion
                        TransitionProps={{ unmountOnExit: !grid3Loaded }}
                        expanded={expandedPanels.finished}
                        onChange={togglePanel('finished')}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <div className="flex flex-wrap items-center gap-2" style={{ fontSize: isMobile ? 16 : 20 }}>
                                <CheckCircleIcon color={'success'} /> <b>{estimatedRanks.finishedMaterials.length}</b>{' '}
                                finished upgrades
                            </div>
                        </AccordionSummary>
                        <AccordionDetails>
                            <div className="max-h-[600px] overflow-y-auto">
                                {viewPreferences.raidsTableView === true ? (
                                    <div className="ag-theme-material flex h-[600px] w-full flex-col">
                                        <MaterialsTable
                                            rows={estimatedRanks.finishedMaterials}
                                            updateMaterialQuantity={updateInventory}
                                            onGridReady={() => setGrid3Loaded(true)}
                                            inventory={upgrades}
                                        />
                                    </div>
                                ) : (
                                    <div className="flex max-h-[600px] w-full flex-wrap gap-1 p-2">
                                        <div className="flex flex-wrap gap-x-4 gap-y-4">
                                            {estimatedRanks.finishedMaterials.map((material, index) => (
                                                <div className="item-raids w-70" key={index}>
                                                    <RaidUpgradeMaterialCard
                                                        index={index}
                                                        upgradeMaterialSnowprintId={material.id}
                                                        currentQuantity={material.acquiredCount}
                                                        desiredQuantity={material.requiredCount}
                                                        relatedCharacterSnowprintIds={material.relatedCharacters}
                                                        locations={material.locations}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </AccordionDetails>
                    </Accordion>
                )}
                {estimatedRanks.blockedMaterials.length > 0 && (
                    <Accordion
                        TransitionProps={{ unmountOnExit: !grid2Loaded }}
                        expanded={expandedPanels.blocked}
                        onChange={togglePanel('blocked')}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <AccessibleTooltip
                                title={`You don't any have location for ${estimatedRanks.blockedMaterials.length} upgrades`}>
                                <div
                                    className="flex flex-wrap items-center gap-2"
                                    style={{ fontSize: isMobile ? 16 : 20 }}>
                                    <Warning color={'warning'} />
                                    <b>{estimatedRanks.blockedMaterials.length}</b> blocked upgrades
                                </div>
                            </AccessibleTooltip>
                        </AccordionSummary>
                        <AccordionDetails>
                            <div className="flex flex-col">
                                <div className="flex-box p-2">
                                    <InfoIcon color="primary" /> You don&apos;t have available campaigns nodes for the
                                    items listed in the table below
                                </div>

                                <div className="flex-grow">
                                    {viewPreferences.raidsTableView === true ? (
                                        <div className="ag-theme-material flex h-[600px] w-full flex-col">
                                            <MaterialsTable
                                                rows={estimatedRanks.blockedMaterials}
                                                updateMaterialQuantity={updateInventory}
                                                onGridReady={() => setGrid2Loaded(true)}
                                                inventory={upgrades}
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex max-h-[600px] w-full flex-wrap gap-1 overflow-y-scroll p-2">
                                            <div className="flex flex-wrap gap-x-4 gap-y-4">
                                                {estimatedRanks.blockedMaterials.map((material, index) => (
                                                    <div className="item-raids w-70" key={index}>
                                                        <RaidUpgradeMaterialCard
                                                            index={index}
                                                            upgradeMaterialSnowprintId={material.id}
                                                            currentQuantity={material.acquiredCount}
                                                            desiredQuantity={material.requiredCount}
                                                            relatedCharacterSnowprintIds={material.relatedCharacters}
                                                            locations={material.locations}
                                                            showAdditionalInfo={false}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </AccordionDetails>
                    </Accordion>
                )}

                {estimatedRanks.upgradesRaids.length > 0 && (
                    <Accordion
                        TransitionProps={{ unmountOnExit: !upgradesPaging.completed }}
                        expanded={expandedPanels.raids}
                        onChange={togglePanel('raids')}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <FlexBox className="flex-col items-start">
                                <div className="flex-box gap5 wrap" style={{ fontSize: isMobile ? 16 : 20 }}>
                                    <span>
                                        Raids Plan (<b>{estimatedRanks.upgradesRaids.length}</b> Days |
                                    </span>
                                    <span>
                                        <b>{estimatedRanks.freeEnergyDays}</b> Unused{' '}
                                        <MiscIcon icon={'energy'} height={15} width={15} /> Days |
                                    </span>
                                    <span>
                                        <b>{energyTotal}</b> <MiscIcon icon={'energy'} height={15} width={15} /> |
                                    </span>
                                    <span>
                                        <b>{estimatedRanks.raidsTotal}</b> Raids)
                                    </span>
                                </div>
                                <span className="italic">{upgradesCalendarDate}</span>
                            </FlexBox>
                        </AccordionSummary>
                        <AccordionDetails>
                            <div className="overflow-x-auto overflow-y-hidden" style={{ transform: 'rotateX(180deg)' }}>
                                <div className="flex gap-2.5" style={{ transform: 'rotateX(180deg)' }}>
                                    {estimatedRanks.upgradesRaids
                                        .slice(upgradesPaging.start, upgradesPaging.end)
                                        .map((day, index) => {
                                            return <RaidsDayView key={index} day={day} title={'Day ' + (index + 1)} />;
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
                            </div>
                        </AccordionDetails>
                    </Accordion>
                )}
            </AccordionDetails>
        </Accordion>
    );
};
