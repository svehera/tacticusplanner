import React, { useEffect, useMemo } from 'react';
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { FlexBox } from 'src/v2/components/flex-box';
import { MiscIcon } from 'src/shared-components/misc-icon';
import PendingIcon from '@mui/icons-material/Pending';
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';
import { isMobile } from 'react-device-detect';
import LinkIcon from '@mui/icons-material/Link';
import { UpgradeImage } from 'src/shared-components/upgrade-image';
import { MaterialsTable } from 'src/v2/features/goals/materials-table';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { AccessibleTooltip } from 'src/v2/components/tooltip';
import { Warning } from '@mui/icons-material';
import InfoIcon from '@mui/icons-material/Info';
import { ShardsRaidsDayInput } from 'src/v2/features/goals/shards-raids-day-input';
import { RaidsDayView } from 'src/v2/features/goals/raids-day-view';
import { IEstimatedShards, IEstimatedUpgrades } from 'src/v2/features/goals/goals.models';
import { formatDateWithOrdinal } from 'src/shared-logic/functions';

interface Props {
    estimatedShards: IEstimatedShards;
    estimatedRanks: IEstimatedUpgrades;
    upgrades: Record<string, number>;
    updateInventory: (materialId: string, value: number) => void;
}

export const RaidsPlan: React.FC<Props> = ({ estimatedShards, estimatedRanks, upgrades, updateInventory }) => {
    const [upgradesPaging, setUpgradesPaging] = React.useState<{
        start: number;
        end: number;
        completed: boolean;
    }>({ start: 0, end: 3, completed: true });

    const [grid1Loaded, setGrid1Loaded] = React.useState<boolean>(false);
    const [grid2Loaded, setGrid2Loaded] = React.useState<boolean>(false);
    const [grid3Loaded, setGrid3Loaded] = React.useState<boolean>(false);

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

    const hasInProgressUpgrades =
        !!estimatedRanks.inProgressMaterials.length || !!estimatedRanks.craftedUpgrades.length;

    const daysTotal = Math.max(estimatedRanks.daysTotal, estimatedShards.daysTotal);
    const energyTotal = estimatedRanks.energyTotal + estimatedShards.energyTotal;

    const calendarDateTotal: string = useMemo(() => {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + daysTotal - 1);

        return formatDateWithOrdinal(nextDate);
    }, [daysTotal]);

    return (
        <Accordion TransitionProps={{ unmountOnExit: true }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <FlexBox style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <div className="flex-box gap5 wrap" style={{ fontSize: 20 }}>
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
                {hasInProgressUpgrades && (
                    <Accordion TransitionProps={{ unmountOnExit: !grid1Loaded }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <div className="flex-box gap5" style={{ fontSize: 20 }}>
                                <PendingIcon color={'primary'} />
                                <b>{estimatedRanks.inProgressMaterials.length}</b> in progress materials
                            </div>
                        </AccordionSummary>
                        <AccordionDetails>
                            <div className="flex-box gap10 wrap">
                                <Button
                                    variant={'contained'}
                                    component={Link}
                                    to={isMobile ? '/mobile/input/inventory' : '/input/inventory'}>
                                    <LinkIcon /> <span style={{ paddingLeft: 5 }}>Go to Inventory</span>
                                </Button>
                            </div>
                            {!!estimatedRanks.craftedUpgrades.length && (
                                <>
                                    <h4>Contributed crafted upgrades</h4>
                                    <div className="flex-box gap10 wrap">
                                        {estimatedRanks.craftedUpgrades.map(x => (
                                            <UpgradeImage
                                                key={x.id}
                                                material={x.label}
                                                rarity={x.rarity}
                                                iconPath={x.iconPath}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                            <MaterialsTable
                                rows={estimatedRanks.inProgressMaterials}
                                updateMaterialQuantity={updateInventory}
                                onGridReady={() => setGrid1Loaded(true)}
                                inventory={upgrades}
                            />
                        </AccordionDetails>
                    </Accordion>
                )}
                {!!estimatedRanks.finishedMaterials.length && (
                    <Accordion TransitionProps={{ unmountOnExit: !grid3Loaded }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <div className="flex-box gap5" style={{ fontSize: 20 }}>
                                <CheckCircleIcon color={'success'} /> <b>{estimatedRanks.finishedMaterials.length}</b>{' '}
                                finished materials
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
                                title={`You don't any have location for ${estimatedRanks.blockedMaterials.length} materials`}>
                                <div className="flex-box gap5" style={{ fontSize: 20 }}>
                                    <Warning color={'warning'} />
                                    <b>{estimatedRanks.blockedMaterials.length}</b> blocked materials
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
                                <div className="flex-box gap5 wrap" style={{ fontSize: 20 }}>
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
                        <AccordionDetails style={{ maxHeight: '63vh', overflow: 'auto' }}>
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
                                <div className="flex-box gap5 wrap" style={{ fontSize: 20 }}>
                                    <span>
                                        Upgrades raids (<b>{estimatedRanks.upgradesRaids.length}</b> Days |
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
                        <AccordionDetails style={{ maxHeight: '63vh', overflow: 'auto' }}>
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
