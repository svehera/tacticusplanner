import { sum } from 'lodash';
import { CheckCircle2, Clock, Info, LayoutGrid, Package, Rows3, TriangleAlert } from 'lucide-react';
import React, { lazy, Suspense, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { DispatchContext, StoreContext } from '@/reducers/store.provider';
import { formatDateWithOrdinal } from 'src/shared-logic/functions';

import {
    AccessibleTooltip,
    Accordion,
    AccordionHeader,
    AccordionBody,
    Button,
    FlexBox,
    Switch,
} from '@/fsd/5-shared/ui';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService } from '@/fsd/4-entities/character';

import { IEstimatedUpgrades } from '@/fsd/3-features/goals/goals.models';

import { DayStrip } from './raids-day-strip';
import { MaterialsSectionContent } from './raids-materials-section';
import { SectionAccordion } from './section-accordion';

const Inventory = lazy(() => import('@/fsd/1-pages/input-inventory').then(m => ({ default: m.Inventory })));

interface Props {
    estimatedRanks: IEstimatedUpgrades;
    scrollToCharSnowprintId?: string;
    openBlocked?: boolean;
    upgrades: Record<string, number>;
    updateInventory: (materialId: string, value: number) => void;
    updateInventoryAny: () => void;
}

type ReferenceElement = HTMLDivElement | null;
type ReferenceMap = { [key: string]: ReferenceElement };

export const RaidsPlan: React.FC<Props> = ({
    estimatedRanks,
    scrollToCharSnowprintId,
    openBlocked,
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

    const [allDaysExpanded, setAllDaysExpanded] = useState(false);
    const [outerExpanded, setOuterExpanded] = useState(scrollToCharSnowprintId !== undefined || !!openBlocked);

    const [expandedPanels, setExpandedPanels] = useState(() => ({
        related: false,
        inProgress: scrollToCharSnowprintId !== undefined,
        finished: false,
        blocked: !!openBlocked,
        raids: false,
    }));

    const togglePanel = (key: keyof typeof expandedPanels) => (isExpanded: boolean) =>
        setExpandedPanels(previous => ({ ...previous, [key]: isExpanded }));

    const itemReferences = useRef<ReferenceMap>({});
    const inProgressReference = useRef<HTMLDivElement>(null);
    const blockedReference = useRef<HTMLDivElement>(null);

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
            for (const fullName of material.relatedCharacters) {
                const unit = CharactersService.getUnit(fullName);
                if (!unit || !unit.snowprintId) continue;
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
        if (openBlocked) {
            setOuterExpanded(true);
            setExpandedPanels(previous => ({ ...previous, blocked: true }));
            const timer = setTimeout(() => {
                blockedReference.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [openBlocked]);

    useEffect(() => {
        if (scrollToCharSnowprintId) {
            const timer = setTimeout(() => {
                scrollToTarget();
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [scrollToCharSnowprintId, scrollToTarget]);

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

    const visibleDays = useMemo(
        () => estimatedRanks.upgradesRaids.slice(upgradesPaging.start, upgradesPaging.end),
        [estimatedRanks.upgradesRaids, upgradesPaging.start, upgradesPaging.end]
    );

    const calendarDateTotal: string = useMemo(() => {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + daysTotal - 1);

        return formatDateWithOrdinal(nextDate);
    }, [daysTotal]);

    return (
        <Accordion className="my-5" expanded={outerExpanded} onToggle={setOuterExpanded}>
            <AccordionHeader>
                <FlexBox className="flex-col items-start">
                    <div className="flex flex-wrap items-center gap-2 text-base font-semibold sm:text-lg">
                        <span>
                            Raids plan (<b>{daysTotal}</b> Days |
                        </span>
                        <span>
                            <b>{energyTotal}</b> <MiscIcon icon={'energy'} height={15} width={15} />)
                        </span>
                        <div onClick={event => event.stopPropagation()}>
                            <Switch isSelected={viewPreferences.raidsTableView} onChange={updateView}>
                                <div className="flex items-center gap-1">
                                    {viewPreferences.raidsTableView ? (
                                        <>
                                            <Rows3 className="size-4 text-(--primary)" />
                                            <span>Table View</span>
                                        </>
                                    ) : (
                                        <>
                                            <LayoutGrid className="size-4 text-(--primary)" />
                                            <span>Cards View</span>
                                        </>
                                    )}
                                </div>
                            </Switch>
                        </div>
                    </div>
                    <span className="text-sm text-(--soft-fg) italic">{calendarDateTotal}</span>
                </FlexBox>
            </AccordionHeader>
            <AccordionBody className="p-0">
                {estimatedRanks.relatedUpgrades.length > 0 && (
                    <SectionAccordion
                        expanded={expandedPanels.related}
                        onChange={togglePanel('related')}
                        summary={
                            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold sm:text-base">
                                <Package className="size-4" />
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
                        summary={
                            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold sm:text-base">
                                <Clock className="size-4 text-(--primary)" />
                                <b>{estimatedRanks.inProgressMaterials.length}</b> in progress upgrades
                            </div>
                        }>
                        <MaterialsSectionContent
                            materials={estimatedRanks.inProgressMaterials}
                            tableView={viewPreferences.raidsTableView === true}
                            updateInventory={updateInventory}
                            inventory={upgrades}
                            scrollToCharSnowprintId={scrollToCharSnowprintId}
                            alreadyUsedMaterials={estimatedRanks.finishedMaterials}
                            cardRefCallback={setCardReference}
                        />
                    </SectionAccordion>
                )}
                {estimatedRanks.finishedMaterials.length > 0 && (
                    <SectionAccordion
                        expanded={expandedPanels.finished}
                        onChange={togglePanel('finished')}
                        summary={
                            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold sm:text-base">
                                <CheckCircle2 className="size-4 text-(--success)" />
                                <b>{estimatedRanks.finishedMaterials.length}</b> finished upgrades
                            </div>
                        }>
                        <MaterialsSectionContent
                            materials={estimatedRanks.finishedMaterials}
                            tableView={viewPreferences.raidsTableView === true}
                            updateInventory={updateInventory}
                            inventory={upgrades}
                            showAdditionalInfo={false}
                        />
                    </SectionAccordion>
                )}
                {estimatedRanks.blockedMaterials.length > 0 && (
                    <SectionAccordion
                        ref={blockedReference}
                        expanded={expandedPanels.blocked}
                        onChange={togglePanel('blocked')}
                        summary={
                            <AccessibleTooltip
                                title={`You don't any have location for ${estimatedRanks.blockedMaterials.length} upgrades`}>
                                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold sm:text-base">
                                    <TriangleAlert className="size-4 text-(--warning)" />
                                    <b>{estimatedRanks.blockedMaterials.length}</b> blocked upgrades
                                </div>
                            </AccessibleTooltip>
                        }>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 p-2">
                                <Info className="size-4 shrink-0 text-(--primary)" /> You don&apos;t have available
                                campaigns nodes for the items listed in the table below
                            </div>
                            <div className="grow">
                                <MaterialsSectionContent
                                    materials={estimatedRanks.blockedMaterials}
                                    tableView={viewPreferences.raidsTableView === true}
                                    updateInventory={updateInventory}
                                    inventory={upgrades}
                                    showAdditionalInfo={false}
                                />
                            </div>
                        </div>
                    </SectionAccordion>
                )}

                {estimatedRanks.upgradesRaids.length > 0 && (
                    <SectionAccordion
                        expanded={expandedPanels.raids}
                        onChange={togglePanel('raids')}
                        summary={
                            <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold sm:text-base">
                                <span>Daily Raids</span>
                                <span className="font-normal text-(--soft-fg)">
                                    <b className="text-(--card-fg)">{estimatedRanks.upgradesRaids.length}</b> days
                                </span>
                                <span className="flex items-center gap-1 font-normal text-(--soft-fg)">
                                    <b className="text-(--card-fg)">{energyTotal}</b>
                                    <MiscIcon icon={'energy'} height={13} width={13} />
                                </span>
                                <span className="flex items-center gap-1 font-normal text-(--soft-fg)">
                                    <b className="text-(--card-fg)">{estimatedRanks.raidsTotal}</b>
                                    <MiscIcon icon={'raidTicket'} height={13} width={13} />
                                </span>
                                <span className="flex items-center gap-1 font-normal text-(--soft-fg)">
                                    <b className="text-(--card-fg)">{estimatedRanks.freeEnergyDays}</b> days unused
                                    <MiscIcon icon={'energy'} height={13} width={13} />
                                </span>
                                <span className="font-normal text-(--soft-fg) italic">{upgradesCalendarDate}</span>
                                {expandedPanels.raids && (
                                    <div onClick={event => event.stopPropagation()}>
                                        <Button
                                            appearance="outline"
                                            intent="secondary"
                                            size="small"
                                            onPress={() => setAllDaysExpanded(v => !v)}>
                                            {allDaysExpanded ? 'Collapse cards' : 'Expand cards'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        }>
                        <DayStrip
                            days={visibleDays}
                            allDays={estimatedRanks.upgradesRaids}
                            allDaysExpanded={allDaysExpanded}
                            energyPerDay={dailyRaidsPreferences.dailyEnergy}
                            showShowAll={!upgradesPaging.completed}
                            onShowAll={() =>
                                setUpgradesPaging({
                                    start: 0,
                                    end: estimatedRanks.upgradesRaids.length,
                                    completed: true,
                                })
                            }
                        />
                    </SectionAccordion>
                )}
            </AccordionBody>
        </Accordion>
    );
};
