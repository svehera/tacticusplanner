import { Warning } from '@mui/icons-material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';
import InventoryIcon from '@mui/icons-material/Inventory';
import PendingIcon from '@mui/icons-material/Pending';
import { Accordion, AccordionDetails, AccordionSummary, Box } from '@mui/material';
import Button from '@mui/material/Button';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';

import { StoreContext } from '@/reducers/store.provider';
import { formatDateWithOrdinal } from 'src/shared-logic/functions';

import { AccessibleTooltip, FlexBox } from '@/fsd/5-shared/ui';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService } from '@/fsd/4-entities/character';

import { IEstimatedShards, IEstimatedUpgrades } from 'src/v2/features/goals/goals.models';
import { MaterialsTable } from 'src/v2/features/goals/materials-table';
import { RaidsDayView } from 'src/v2/features/goals/raids-day-view';
import { ShardsRaidsDayInput } from 'src/v2/features/goals/shards-raids-day-input';

import { Inventory } from '@/fsd/1-pages/input-inventory';

import { RaidUpgradeMaterialCard } from './raid-upgrade-material-card';

interface Props {
    estimatedShards: IEstimatedShards;
    estimatedRanks: IEstimatedUpgrades;
    scrollToCharSnowprintId?: string;
    upgrades: Record<string, number>;
    updateInventory: (materialId: string, value: number) => void;
    updateInventoryAny: () => void;
}

type RefElem = HTMLDivElement | null;
type RefMap = { [key: string]: RefElem };

export const RaidsPlan: React.FC<Props> = ({
    estimatedShards,
    estimatedRanks,
    scrollToCharSnowprintId,
    updateInventoryAny,
    upgrades,
    updateInventory,
}) => {
    const { viewPreferences } = useContext(StoreContext);
    const [upgradesPaging, setUpgradesPaging] = useState<{
        start: number;
        end: number;
        completed: boolean;
    }>({ start: 0, end: 3, completed: true });

    const [grid1Loaded, setGrid1Loaded] = useState<boolean>(false);
    const [grid2Loaded, setGrid2Loaded] = useState<boolean>(false);
    const [grid3Loaded, setGrid3Loaded] = useState<boolean>(false);

    const itemRefs = useRef<RefMap>({});
    const setCardRef = useCallback(
        (id: number) => (element: RefElem) => {
            itemRefs.current[id] = element;
        },
        []
    );

    interface Material {
        id: number;
        name: string;
        relatedCharacters: string[];
    }

    type CharacterToMaterialIndexMap = Record<string, number>;

    const characterToMaterialMap: CharacterToMaterialIndexMap = useMemo(() => {
        const characterIndexMap: CharacterToMaterialIndexMap = {};

        estimatedRanks.inProgressMaterials.forEach((material, materialIndex) => {
            // Iterate over the related characters for the current material
            material.relatedCharacters.forEach(fullName => {
                const unit = CharactersService.getUnit(fullName);
                if (!unit || !unit.snowprintId) return;
                // Check if this snowprintId has ALREADY been recorded.
                // If it hasn't, this is the FIRST time we've seen it, so record the index.
                if (!(unit.snowprintId in characterIndexMap)) {
                    characterIndexMap[unit.snowprintId] = materialIndex;
                }
            });
        });

        return characterIndexMap;
    }, [estimatedRanks.inProgressMaterials]);

    const scrollToTarget = useCallback(() => {
        if (scrollToCharSnowprintId === undefined) return;
        if (!Object.keys(characterToMaterialMap).includes(scrollToCharSnowprintId)) return;
        const targetElement = itemRefs.current[characterToMaterialMap[scrollToCharSnowprintId]];
        if (targetElement) {
            // 3. Call the native DOM method: scrollIntoView
            targetElement.scrollIntoView({
                behavior: 'smooth', // Makes the scroll transition smooth
                block: 'center', // Aligns the element to the vertical center of the container
            });
        }
    }, [itemRefs, scrollToCharSnowprintId]);

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

    const shardsCalendarDate: string = useMemo(() => {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + estimatedShards.daysTotal);

        return formatDateWithOrdinal(nextDate);
    }, [estimatedShards.daysTotal]);

    const daysTotal = Math.max(estimatedRanks.daysTotal, estimatedShards.daysTotal);
    const energyTotal = estimatedRanks.energyTotal + estimatedShards.energyTotal;

    const calendarDateTotal: string = useMemo(() => {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + daysTotal - 1);

        return formatDateWithOrdinal(nextDate);
    }, [daysTotal]);

    return (
        <Accordion defaultExpanded={scrollToCharSnowprintId !== undefined}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <FlexBox style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <div className="flex gap-2 items-center flex-wrap" style={{ fontSize: isMobile ? 16 : 20 }}>
                        <span>
                            Raids plan (<b>{daysTotal}</b> Days |
                        </span>
                        <span>
                            <b>{energyTotal}</b> <MiscIcon icon={'energy'} height={15} width={15} />
                        </span>
                        {!!estimatedShards.onslaughtTokens && (
                            <span>
                                | <b>{estimatedShards.onslaughtTokens}</b> Tokens)
                            </span>
                        )}

                        {!estimatedShards.onslaughtTokens && <>)</>}
                    </div>
                    <span className="italic">{calendarDateTotal}</span>
                </FlexBox>
            </AccordionSummary>
            <AccordionDetails>
                {!!estimatedRanks.relatedUpgrades.length && (
                    <Accordion TransitionProps={{ unmountOnExit: !grid1Loaded }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <div className="flex gap-2 items-center flex-wrap" style={{ fontSize: isMobile ? 16 : 20 }}>
                                <InventoryIcon />
                                <b>{estimatedRanks.relatedUpgrades.length}</b> related upgrades (Inventory)
                            </div>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Inventory itemsFilter={estimatedRanks.relatedUpgrades} onUpdate={updateInventoryAny} />
                        </AccordionDetails>
                    </Accordion>
                )}
                {!!estimatedRanks.inProgressMaterials.length && (
                    <Accordion
                        defaultExpanded={scrollToCharSnowprintId !== undefined}
                        TransitionProps={{ unmountOnExit: !grid1Loaded }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <div className="flex gap-2 items-center flex-wrap" style={{ fontSize: isMobile ? 16 : 20 }}>
                                <PendingIcon color={'primary'} />
                                <b>{estimatedRanks.inProgressMaterials.length}</b> in progress upgrades
                            </div>
                        </AccordionSummary>
                        <AccordionDetails>
                            {viewPreferences.raidsTableView === true ? (
                                <MaterialsTable
                                    rows={estimatedRanks.inProgressMaterials}
                                    updateMaterialQuantity={updateInventory}
                                    onGridReady={() => setGrid1Loaded(true)}
                                    inventory={upgrades}
                                    scrollToCharSnowprintId={scrollToCharSnowprintId}
                                    alreadyUsedMaterials={estimatedRanks.finishedMaterials}
                                />
                            ) : (
                                <Box
                                    sx={{
                                        height: 300, // Required: Defines the viewable area height
                                        overflowY: 'scroll', // Required: Enables vertical scrolling
                                        p: 2,
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: 1,
                                        width: '100%',
                                    }}>
                                    {estimatedRanks.inProgressMaterials.length > 0 &&
                                        estimatedRanks.inProgressMaterials.map((material, index) => (
                                            <div className="item-raids w-64" key={index} ref={setCardRef(index)}>
                                                <RaidUpgradeMaterialCard
                                                    index={index}
                                                    upgradeMaterialSnowprintId={material.id}
                                                    currentQuantity={material.acquiredCount}
                                                    desiredQuantity={material.requiredCount}
                                                    relatedCharacterSnowprintIds={material.relatedCharacters}
                                                />
                                            </div>
                                        ))}
                                </Box>
                            )}
                        </AccordionDetails>
                    </Accordion>
                )}
                {!!estimatedRanks.finishedMaterials.length && (
                    <Accordion TransitionProps={{ unmountOnExit: !grid3Loaded }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <div className="flex gap-2 items-center flex-wrap" style={{ fontSize: isMobile ? 16 : 20 }}>
                                <CheckCircleIcon color={'success'} /> <b>{estimatedRanks.finishedMaterials.length}</b>{' '}
                                finished upgrades
                            </div>
                        </AccordionSummary>
                        <AccordionDetails>
                            <MaterialsTable
                                rows={estimatedRanks.finishedMaterials}
                                updateMaterialQuantity={updateInventory}
                                onGridReady={() => setGrid3Loaded(true)}
                                inventory={upgrades}
                            />
                        </AccordionDetails>
                    </Accordion>
                )}
                {!!estimatedRanks.blockedMaterials.length && (
                    <Accordion TransitionProps={{ unmountOnExit: !grid2Loaded }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <AccessibleTooltip
                                title={`You don't any have location for ${estimatedRanks.blockedMaterials.length} upgrades`}>
                                <div
                                    className="flex gap-2 items-center flex-wrap"
                                    style={{ fontSize: isMobile ? 16 : 20 }}>
                                    <Warning color={'warning'} />
                                    <b>{estimatedRanks.blockedMaterials.length}</b> blocked upgrades
                                </div>
                            </AccessibleTooltip>
                        </AccordionSummary>
                        <AccordionDetails>
                            <div className="flex-box">
                                <InfoIcon color="primary" /> You don&apos;t have available campaigns nodes for the items
                                listed in the table below
                            </div>

                            <MaterialsTable
                                rows={estimatedRanks.blockedMaterials}
                                updateMaterialQuantity={updateInventory}
                                onGridReady={() => setGrid2Loaded(true)}
                                inventory={upgrades}
                            />
                        </AccordionDetails>
                    </Accordion>
                )}

                {!!estimatedShards.shardsRaids.length && (
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <FlexBox style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                <div
                                    className="flex gap-2 items-center flex-wrap"
                                    style={{ fontSize: isMobile ? 16 : 20 }}>
                                    <span>
                                        Shards Raids (<b>{estimatedShards.daysTotal}</b> Days |
                                    </span>
                                    <span>
                                        <b>{estimatedShards.energyTotal}</b>{' '}
                                        <MiscIcon icon={'energy'} height={15} width={15} /> |
                                    </span>
                                    <span>
                                        <b>{estimatedShards.raidsTotal}</b> Raids |
                                    </span>
                                    <span>
                                        <b>{estimatedShards.onslaughtTokens}</b> Tokens)
                                    </span>
                                </div>
                                <span className="italic">{shardsCalendarDate}</span>
                            </FlexBox>
                        </AccordionSummary>
                        <AccordionDetails>
                            <div className="flex-box gap10 wrap start">
                                {estimatedShards.shardsRaids.map(shardsRaid => (
                                    <ShardsRaidsDayInput key={shardsRaid.characterId} shardRaids={shardsRaid} />
                                ))}
                            </div>
                        </AccordionDetails>
                    </Accordion>
                )}

                {!!estimatedRanks.upgradesRaids.length && (
                    <Accordion TransitionProps={{ unmountOnExit: !upgradesPaging.completed }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <FlexBox style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                <div className="flex-box gap5 wrap" style={{ fontSize: isMobile ? 16 : 20 }}>
                                    <span>
                                        Upgrades raids (<b>{estimatedRanks.upgradesRaids.length}</b> Days |
                                    </span>
                                    <span>
                                        <b>{estimatedRanks.freeEnergyDays}</b> Unused{' '}
                                        <MiscIcon icon={'energy'} height={15} width={15} /> Days |
                                    </span>
                                    <span>
                                        <b>{estimatedRanks.energyTotal}</b>{' '}
                                        <MiscIcon icon={'energy'} height={15} width={15} /> |
                                    </span>
                                    <span>
                                        <b>{estimatedRanks.raidsTotal}</b> Raids)
                                    </span>
                                </div>
                                <span className="italic">{upgradesCalendarDate}</span>
                            </FlexBox>
                        </AccordionSummary>
                        <AccordionDetails>
                            <div style={{ display: 'flex', gap: 10, overflow: 'auto' }}>
                                {estimatedRanks.upgradesRaids
                                    .slice(upgradesPaging.start, upgradesPaging.end)
                                    .map((day, index) => {
                                        return <RaidsDayView key={index} day={day} title={'Day ' + (index + 1)} />;
                                    })}
                                {!upgradesPaging.completed && (
                                    <Button
                                        variant={'outlined'}
                                        style={{ minWidth: 300, alignItems: 'flex-start', paddingTop: 20 }}
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
                        </AccordionDetails>
                    </Accordion>
                )}
            </AccordionDetails>
        </Accordion>
    );
};
