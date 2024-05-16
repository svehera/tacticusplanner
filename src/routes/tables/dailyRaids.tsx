import React, { useContext, useEffect, useMemo, useState } from 'react';

import { ICharacter2, IDailyRaidsFilters } from 'src/models/interfaces';
import { Accordion, AccordionDetails, AccordionSummary, DialogContent, DialogTitle, Popover } from '@mui/material';
import { PersonalGoalType } from 'src/models/enums';
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';
import { isMobile } from 'react-device-detect';
import Button from '@mui/material/Button';
import SettingsIcon from '@mui/icons-material/Settings';
import DailyRaidsSettings from '../../shared-components/daily-raids-settings';
import { Link } from 'react-router-dom';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Warning } from '@mui/icons-material';
import { enqueueSnackbar } from 'notistack';
import ClearIcon from '@mui/icons-material/Clear';
import { MiscIcon } from 'src/shared-components/misc-icon';
import { FlexBox } from 'src/v2/components/flex-box';
import { formatDateWithOrdinal } from 'src/shared-logic/functions';
import { CharactersRaidsSelect } from 'src/v2/features/goals/characters-raids-select';
import {
    CharacterRaidGoalSelect,
    ICharacterAscendGoal,
    ICharacterUnlockGoal,
    ICharacterUpgradeRankGoal,
    IEstimatedShards,
    IEstimatedUpgrades,
    IUpgradeRaid,
    IItemRaidLocation,
} from 'src/v2/features/goals/goals.models';
import { MaterialsTable } from 'src/v2/features/goals/materials-table';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import LinkIcon from '@mui/icons-material/Link';
import { RaidsDayInput } from 'src/v2/features/goals/raids-day-input';
import { RaidsDayView } from 'src/v2/features/goals/raids-day-view';
import { LocationsFilter } from 'src/v2/features/goals/locations-filter';
import { AccessibleTooltip } from 'src/v2/components/tooltip';
import { EditGoalDialog } from 'src/shared-components/goals/edit-goal-dialog';
import { ShardsService } from 'src/v2/features/goals/shards.service';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import { ShardsRaidsDayInput } from 'src/v2/features/goals/shards-raids-day-input';
import { GoalsService } from 'src/v2/features/goals/goals.service';
import { UpgradesService } from 'src/v2/features/goals/upgrades.service';
import { UpgradeImage } from 'src/shared-components/upgrade-image';
import Dialog from '@mui/material/Dialog';
import { MaterialItemInput } from 'src/v2/features/goals/material-item-input';

import './dailyRaids.scss';
import { ShardsItemInput } from 'src/v2/features/goals/shards-item-input';

export const DailyRaids = () => {
    const dispatch = useContext(DispatchContext);
    const {
        dailyRaids,
        characters: storeCharacters,
        goals,
        campaignsProgress,
        dailyRaidsPreferences,
        inventory,
    } = useContext(StoreContext);

    const [anchorEl2, setAnchorEl2] = React.useState<HTMLButtonElement | null>(null);
    const [hasChanges, setHasChanges] = React.useState<boolean>(false);
    const [openGoals, setOpenGoals] = React.useState<boolean>(false);
    const [upgrades, setUpgrades] = React.useState<Record<string, number>>(inventory.upgrades);
    const [characters, setCharacters] = React.useState<ICharacter2[]>(storeCharacters);

    const [upgradesPaging, setUpgradesPaging] = React.useState<{
        start: number;
        end: number;
        completed: boolean;
    }>({ start: 0, end: 3, completed: true });

    const [grid1Loaded, setGrid1Loaded] = React.useState<boolean>(false);
    const [grid2Loaded, setGrid2Loaded] = React.useState<boolean>(false);
    const [grid3Loaded, setGrid3Loaded] = React.useState<boolean>(false);

    const [editGoal, setEditGoal] = useState<CharacterRaidGoalSelect | null>(null);
    const [editCharacter, setEditCharacter] = useState<ICharacter2>(characters[0]);

    const allGoals = useMemo<CharacterRaidGoalSelect[]>(() => {
        return goals
            .map(g => {
                const relatedCharacter = characters.find(x => x.name === g.character);
                if (
                    ![PersonalGoalType.UpgradeRank, PersonalGoalType.Ascend, PersonalGoalType.Unlock].includes(g.type)
                ) {
                    return null;
                }
                return GoalsService.convertToTypedGoal(g, relatedCharacter);
            })
            .filter(g => !!g) as CharacterRaidGoalSelect[];
    }, [goals, characters]);

    const selectedGoals = useMemo(() => allGoals.filter(x => x.include), [allGoals]);

    const shardsGoals = useMemo(
        () =>
            selectedGoals.filter(x => [PersonalGoalType.Ascend, PersonalGoalType.Unlock].includes(x.type)) as Array<
                ICharacterUnlockGoal | ICharacterAscendGoal
            >,
        [selectedGoals]
    );

    const upgradeRankGoals = useMemo(
        () =>
            selectedGoals.filter(x =>
                [PersonalGoalType.UpgradeRank].includes(x.type)
            ) as Array<ICharacterUpgradeRankGoal>,
        [selectedGoals]
    );

    const handleAdd = (upgradeRaid: IUpgradeRaid, value: number, location: IItemRaidLocation) => {
        setHasChanges(true);

        if (value > 0) {
            dispatch.inventory({
                type: 'IncrementUpgradeQuantity',
                upgrade: upgradeRaid.id,
                value,
            });
            enqueueSnackbar(`Added ${value} items for ${upgradeRaid.label}`, {
                variant: 'success',
            });
        }

        dispatch.dailyRaids({
            type: 'AddCompletedBattle',
            location,
        });
    };

    const handleShardsAdd = (characterId: string, value: number, location: IItemRaidLocation) => {
        setHasChanges(true);

        if (value > 0) {
            dispatch.characters({
                type: 'IncrementShards',
                character: characterId,
                value: value,
            });
            enqueueSnackbar(`Added ${value} shards for ${characterId}`, {
                variant: 'success',
            });
        }

        dispatch.dailyRaids({
            type: 'AddCompletedBattle',
            location,
        });
    };

    const handleGoalsSelectionChange = (selection: CharacterRaidGoalSelect[]) => {
        dispatch.goals({
            type: 'UpdateDailyRaids',
            value: selection.map(x => ({ goalId: x.goalId, include: x.include })),
        });
    };

    const handleClick2 = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl2(event.currentTarget);
    };

    const handleClose2 = () => {
        setAnchorEl2(null);
    };

    const open2 = Boolean(anchorEl2);

    const saveInventoryUpdateChanges = (materialId: string, value: number): void => {
        dispatch.inventory({
            type: 'UpdateUpgradeQuantity',
            upgrade: materialId,
            value: value,
        });
        setHasChanges(true);
    };

    const refresh = () => {
        setUpgrades({ ...inventory.upgrades });
        setCharacters(storeCharacters);
        setHasChanges(false);
    };

    const saveFilterChanges = (filters: IDailyRaidsFilters) => {
        dispatch.dailyRaids({
            type: 'UpdateFilters',
            value: filters,
        });
    };

    const handleGoalEdit = (goalId: string) => {
        const goalToEdit = allGoals.find(x => x.goalId === goalId);
        const characterToEdit = characters.find(x => x.name === goalToEdit?.characterName);

        if (goalToEdit && characterToEdit) {
            setEditGoal(goalToEdit);
            setEditCharacter(characterToEdit);
        }
    };

    const filtersCount =
        +!!dailyRaids.filters.enemiesAlliance.length +
        +!!dailyRaids.filters.alliesAlliance.length +
        +!!dailyRaids.filters.alliesFactions.length +
        +!!dailyRaids.filters.campaignTypes.length +
        +!!dailyRaids.filters.upgradesRarity.length +
        +!!dailyRaids.filters.slotsCount?.length +
        +!!dailyRaids.filters.enemiesFactions.length;

    const estimatedShards: IEstimatedShards = useMemo(() => {
        return ShardsService.getShardsEstimatedDays(
            {
                campaignsProgress: campaignsProgress,
                preferences: dailyRaidsPreferences,
                raidedLocations: dailyRaids.raidedLocations,
            },
            ...shardsGoals
        );
    }, [shardsGoals, dailyRaidsPreferences, dailyRaids.raidedLocations]);

    const actualEnergy = useMemo(() => {
        return dailyRaidsPreferences.dailyEnergy - estimatedShards.energyPerDay;
    }, [dailyRaidsPreferences.dailyEnergy, estimatedShards.energyPerDay]);

    const estimatedRanks: IEstimatedUpgrades = useMemo(() => {
        return UpgradesService.getUpgradesEstimatedDays(
            {
                dailyEnergy: actualEnergy,
                campaignsProgress: campaignsProgress,
                preferences: dailyRaidsPreferences,
                upgrades: upgrades,
                completedLocations: dailyRaids.raidedLocations?.filter(x => !x.isShardsLocation) ?? [],
                filters: dailyRaids.filters,
            },
            ...upgradeRankGoals
        );
    }, [actualEnergy, upgradeRankGoals, dailyRaidsPreferences, dailyRaids.filters, upgrades]);

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

    return (
        <div>
            <div className="flex-box between wrap">
                <div className="flex-box gap10" style={{ paddingBottom: 10 }}>
                    <Button
                        variant={'contained'}
                        size="small"
                        component={Link}
                        to={isMobile ? '/mobile/plan/goals' : '/plan/goals'}>
                        <LinkIcon /> <span style={{ paddingLeft: 5 }}>Go to Goals</span>
                    </Button>

                    <Button variant="outlined" size="small" onClick={handleClick2}>
                        <SettingsIcon />
                    </Button>
                    <span>
                        <MiscIcon icon={'energy'} height={15} width={15} /> {actualEnergy}
                        {estimatedShards.energyPerDay > 0 &&
                            ` = ${dailyRaidsPreferences.dailyEnergy} - ${estimatedShards.energyPerDay}`}
                    </span>
                </div>

                <div className="flex-box gap10" style={{ paddingBottom: 10 }}>
                    <Button
                        size="small"
                        variant={'contained'}
                        color={'success'}
                        disabled={!hasChanges}
                        onClick={() => refresh()}>
                        <RefreshIcon /> Refresh
                    </Button>
                    <Button
                        size="small"
                        variant={'contained'}
                        color={'error'}
                        disabled={!dailyRaids.raidedLocations?.length}
                        onClick={() => {
                            dispatch.dailyRaids({ type: 'ResetCompletedBattles' });
                            setHasChanges(false);
                            setTimeout(() => {
                                setUpgrades({ ...inventory.upgrades });
                                setCharacters(storeCharacters);
                            }, 100);
                        }}>
                        <ClearIcon /> Reset day
                    </Button>
                    <Button
                        size="small"
                        variant={'outlined'}
                        disabled={!allGoals?.length}
                        onClick={() => setOpenGoals(true)}>
                        <TrackChangesIcon /> {selectedGoals.length} of {allGoals.length}
                    </Button>
                    <LocationsFilter filter={dailyRaids.filters} filtersChange={saveFilterChanges} />
                </div>
            </div>
            <Popover
                open={open2}
                anchorEl={anchorEl2}
                onClose={handleClose2}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}>
                <div style={{ margin: 20, width: 300 }}>
                    <DailyRaidsSettings close={handleClose2} />
                </div>
            </Popover>
            <Dialog open={openGoals} onClose={() => setOpenGoals(false)}>
                <DialogTitle>
                    <div className="flex-box gap5" style={{ fontSize: 20 }}>
                        <TrackChangesIcon />
                        <span>
                            <b>{selectedGoals.length}</b> of {allGoals.length} active goals
                        </span>
                    </div>
                </DialogTitle>
                <DialogContent>
                    <CharactersRaidsSelect
                        goalsSelect={allGoals}
                        onGoalsSelectChange={handleGoalsSelectionChange}
                        onGoalEdit={handleGoalEdit}
                    />
                    {editGoal && (
                        <EditGoalDialog
                            isOpen={true}
                            goal={editGoal}
                            character={editCharacter}
                            onClose={() => {
                                setEditGoal(null);
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
            {/*<Accordion TransitionProps={{ unmountOnExit: true }}>*/}
            {/*    <AccordionSummary expandIcon={<ExpandMoreIcon />}>*/}
            {/*        <div className="flex-box gap5" style={{ fontSize: 20 }}>*/}
            {/*            <TrackChangesIcon />*/}
            {/*            <span>*/}
            {/*                <b>{selectedGoals.length}</b> of {allGoals.length} active goals*/}
            {/*            </span>*/}
            {/*        </div>*/}
            {/*        <span style={{ fontSize: 20 }}></span>*/}
            {/*    </AccordionSummary>*/}
            {/*    <AccordionDetails>*/}
            {/*        <CharactersRaidsSelect*/}
            {/*            goalsSelect={allGoals}*/}
            {/*            onGoalsSelectChange={handleGoalsSelectionChange}*/}
            {/*            onGoalEdit={handleGoalEdit}*/}
            {/*        />*/}
            {/*        {editGoal && (*/}
            {/*            <EditGoalDialog*/}
            {/*                isOpen={true}*/}
            {/*                goal={editGoal}*/}
            {/*                character={editCharacter}*/}
            {/*                onClose={() => {*/}
            {/*                    setEditGoal(null);*/}
            {/*                }}*/}
            {/*            />*/}
            {/*        )}*/}
            {/*    </AccordionDetails>*/}
            {/*</Accordion>*/}

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
                                <ShardsRaidsDayInput
                                    key={shardsRaid.characterId}
                                    shardRaids={shardsRaid}
                                    handleAdd={handleShardsAdd}
                                />
                            ))}
                        </div>
                    </AccordionDetails>
                </Accordion>
            )}

            {!!estimatedRanks.upgradesRaids.length && (
                <>
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
                            {hasInProgressUpgrades && (
                                <Accordion TransitionProps={{ unmountOnExit: !grid1Loaded }}>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <div className="flex-box gap5" style={{ fontSize: 20 }}>
                                            <PendingIcon color={'primary'} />{' '}
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
                                            updateMaterialQuantity={saveInventoryUpdateChanges}
                                            onGridReady={() => setGrid1Loaded(true)}
                                            inventory={inventory.upgrades}
                                        />
                                    </AccordionDetails>
                                </Accordion>
                            )}
                            {!!estimatedRanks.finishedMaterials.length && (
                                <Accordion TransitionProps={{ unmountOnExit: !grid3Loaded }}>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <div className="flex-box gap5" style={{ fontSize: 20 }}>
                                            <CheckCircleIcon color={'success'} />{' '}
                                            <b>{estimatedRanks.finishedMaterials.length}</b> finished materials
                                        </div>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <MaterialsTable
                                            rows={estimatedRanks.finishedMaterials}
                                            updateMaterialQuantity={saveInventoryUpdateChanges}
                                            onGridReady={() => setGrid3Loaded(true)}
                                            inventory={inventory.upgrades}
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
                                                <Warning color={'warning'} />{' '}
                                                <b>{estimatedRanks.blockedMaterials.length}</b> blocked materials
                                            </div>
                                        </AccessibleTooltip>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <div className="flex-box">
                                            <InfoIcon color="primary" /> You don&apos;t have available campaigns nodes
                                            for the items listed in the table below
                                        </div>
                                        {filtersCount > 0 && (
                                            <div className="flex-box">
                                                <Warning color={'warning'} /> You have applied some filters. Reset
                                                filters to make more campaigns node available
                                            </div>
                                        )}

                                        <MaterialsTable
                                            rows={estimatedRanks.blockedMaterials}
                                            updateMaterialQuantity={saveInventoryUpdateChanges}
                                            onGridReady={() => setGrid2Loaded(true)}
                                            inventory={inventory.upgrades}
                                        />
                                    </AccordionDetails>
                                </Accordion>
                            )}

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
                    <div className="flex-box gap10 wrap start" style={{ marginTop: 10 }}>
                        {estimatedShards.shardsRaids
                            .filter(x => x.locations.length && x.locations.every(location => !location.isCompleted))
                            .map(shardsRaid => (
                                <div className="item-raids" key={shardsRaid.characterId}>
                                    <ShardsItemInput shardsRaid={shardsRaid} handleAdd={handleShardsAdd} />
                                </div>
                            ))}
                        {estimatedRanks.upgradesRaids[0].raids.map(raid => (
                            <div className="item-raids" key={raid.id}>
                                <MaterialItemInput
                                    acquiredCount={raid.acquiredCount ?? 0}
                                    upgradeRaid={raid}
                                    addCount={(value, location) => {
                                        raid.acquiredCount += value;
                                        handleAdd(raid, value, location);
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};
