import React, { useContext, useEffect, useMemo, useState } from 'react';

import {
    ICharacter2,
    ICharacterRankRange,
    IDailyRaidsFilters,
    IEstimatedRanks,
    IMaterialEstimated2,
    IMaterialRaid,
    IPersonalGoal,
    IRaidLocation,
} from 'src/models/interfaces';
import { StaticDataService } from 'src/services';
import { Accordion, AccordionDetails, AccordionSummary, Popover, Tooltip } from '@mui/material';
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
import { sum } from 'lodash';
import { MiscIcon } from 'src/shared-components/misc-icon';
import { FlexBox } from 'src/v2/components/flex-box';
import { formatDateWithOrdinal } from 'src/shared-logic/functions';
import { CharactersRaidsSelect } from 'src/v2/features/goals/characters-raids-select';
import {
    CharacterRaidGoalSelect,
    ICharacterAscendGoal,
    ICharacterRaidGoalSelectBase,
    ICharacterUpgradeRankGoal,
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
import { EditGoalDialog } from 'src/shared-components/goals/set-goal-dialog';

export const DailyRaids = () => {
    const dispatch = useContext(DispatchContext);
    const { dailyRaids, characters, goals, campaignsProgress, dailyRaidsPreferences, inventory } =
        useContext(StoreContext);

    const [anchorEl2, setAnchorEl2] = React.useState<HTMLButtonElement | null>(null);
    const [hasChanges, setHasChanges] = React.useState<boolean>(false);
    const [upgrades, setUpgrades] = React.useState<Record<string, number>>(inventory.upgrades);

    const [pagination, setPagination] = React.useState<{
        start: number;
        end: number;
        completed: boolean;
    }>({ start: 0, end: 3, completed: true });
    const [grid1Loaded, setGrid1Loaded] = React.useState<boolean>(false);
    const [grid2Loaded, setGrid2Loaded] = React.useState<boolean>(false);
    const [grid3Loaded, setGrid3Loaded] = React.useState<boolean>(false);

    const [editGoal, setEditGoal] = useState<IPersonalGoal | null>(null);
    const [editCharacter, setEditCharacter] = useState<ICharacter2>(characters[0]);

    const allGoals = useMemo<CharacterRaidGoalSelect[]>(() => {
        return goals
            .map(g => {
                const relatedCharacter = characters.find(x => x.name === g.character);
                if (!relatedCharacter || ![PersonalGoalType.UpgradeRank].includes(g.type)) {
                    return null;
                }
                const base: ICharacterRaidGoalSelectBase = {
                    goalId: g.id,
                    include: g.dailyRaids,
                    characterName: relatedCharacter.name,
                    characterIcon: relatedCharacter.icon,
                };

                if (g.type === PersonalGoalType.Ascend) {
                    const result: ICharacterAscendGoal = {
                        type: PersonalGoalType.Ascend,
                        rarityStart: relatedCharacter.rarity,
                        rarityEnd: g.targetRarity!,
                        ...base,
                    };
                    return result;
                }

                if (g.type === PersonalGoalType.UpgradeRank) {
                    const result: ICharacterUpgradeRankGoal = {
                        type: PersonalGoalType.UpgradeRank,
                        rankStart: relatedCharacter.rank,
                        rankEnd: g.targetRank!,
                        rankPoint5: g.rankPoint5!,
                        appliedUpgrades: relatedCharacter.upgrades,
                        ...base,
                    };
                    return result;
                }

                return null;
            })
            .filter(g => !!g) as CharacterRaidGoalSelect[];
    }, [goals, characters]);

    const selectedGoals = useMemo(() => allGoals.filter(x => x.include), [allGoals]);

    const upgradeRankGoals: ICharacterRankRange[] = useMemo(
        () =>
            selectedGoals
                .filter((x): x is ICharacterUpgradeRankGoal => x.type === PersonalGoalType.UpgradeRank)
                .map(x => ({
                    id: x.characterName,
                    rankStart: x.rankStart,
                    rankEnd: x.rankEnd,
                    appliedUpgrades: x.appliedUpgrades,
                    rankPoint5: x.rankPoint5,
                })),
        [selectedGoals]
    );
    const completedLocations = dailyRaids.completedLocations?.flatMap(x => x.locations) ?? [];

    const handleAdd = (material: IMaterialRaid, value: number, location: IRaidLocation) => {
        setHasChanges(true);

        if (value > 0) {
            dispatch.inventory({
                type: 'IncrementUpgradeQuantity',
                upgrade: material.materialId,
                value,
            });
            enqueueSnackbar(`Added ${value} items for ${material.materialLabel}`, {
                variant: 'success',
            });
        }

        dispatch.dailyRaids({
            type: 'AddCompletedBattle',
            location,
            material: {
                ...material,
                locations: [],
            },
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
        setHasChanges(false);
    };

    const actualEnergy = useMemo(() => {
        const goalsEnergy = sum(goals.map(x => x.energyPerDay || 0));
        return dailyRaidsPreferences.dailyEnergy - dailyRaidsPreferences.shardsEnergy - goalsEnergy;
    }, [dailyRaidsPreferences.dailyEnergy, dailyRaidsPreferences.shardsEnergy]);

    const actualEnergyDescription = useMemo(() => {
        const goalsEnergy = goals.map(x => x.energyPerDay || 0).filter(x => x > 0);
        if (dailyRaidsPreferences.shardsEnergy > 0) {
            goalsEnergy.push(dailyRaidsPreferences.shardsEnergy);
        }
        if (!goalsEnergy.length) {
            return '';
        }
        goalsEnergy.unshift(dailyRaidsPreferences.dailyEnergy);

        return `(${goalsEnergy.join(' - ')})`;
    }, [dailyRaidsPreferences.dailyEnergy, dailyRaidsPreferences.shardsEnergy]);

    const estimatedRanks: IEstimatedRanks = useMemo(() => {
        const result = StaticDataService.getRankUpgradeEstimatedDays(
            {
                dailyEnergy: actualEnergy,
                campaignsProgress: campaignsProgress,
                preferences: dailyRaidsPreferences,
                upgrades: upgrades,
                completedLocations: dailyRaids.completedLocations ?? [],
                filters: dailyRaids.filters,
            },
            ...upgradeRankGoals
        );

        const currentDay = result.raids[0];

        if (currentDay) {
            const completedRaids: IMaterialRaid[] = [];
            const notCompletedRaids: IMaterialRaid[] = [];
            for (const raid of currentDay.raids) {
                const isAllRaidsCompleted = raid.locations.every(
                    location =>
                        dailyRaids.completedLocations
                            ?.flatMap(x => x.locations)
                            .some(completedLocation => completedLocation.id === location.id)
                );

                if (isAllRaidsCompleted) {
                    completedRaids.push(raid);
                } else {
                    const completedLocations: IRaidLocation[] = [];
                    const notCompletedLocations: IRaidLocation[] = [];

                    for (const location of raid.locations) {
                        const isLocationCompleted = dailyRaids.completedLocations
                            ?.flatMap(x => x.locations)
                            .some(completedLocation => completedLocation.id === location.id);

                        if (isLocationCompleted) {
                            completedLocations.push(location);
                        } else {
                            notCompletedLocations.push(location);
                        }
                    }
                    raid.locations = [...notCompletedLocations, ...completedLocations];

                    notCompletedRaids.push(raid);
                }
            }

            currentDay.raids = [...notCompletedRaids, ...completedRaids];
        }

        return result;
    }, [upgradeRankGoals, dailyRaidsPreferences, dailyRaids.filters, upgrades]);

    useEffect(() => {
        if (estimatedRanks.raids.length > 3) {
            setPagination(() => ({
                start: 0,
                end: 3,
                completed: false,
            }));
        } else {
            setPagination(() => ({
                start: 0,
                end: estimatedRanks.raids.length,
                completed: true,
            }));
        }
    }, [estimatedRanks.raids.length]);

    const availableMaterials: IMaterialEstimated2[] = useMemo(() => {
        return estimatedRanks.materials.filter(
            x => x.locationsString !== x.missingLocationsString && x.quantity < x.count
        );
    }, [estimatedRanks.materials]);

    const finishedMaterials: IMaterialEstimated2[] = useMemo(() => {
        return estimatedRanks.materials.filter(x => x.quantity >= x.count);
    }, [estimatedRanks.materials]);

    const blockedMaterials: IMaterialEstimated2[] = useMemo(() => {
        return estimatedRanks.materials.filter(
            x => x.locationsString === x.missingLocationsString && x.quantity < x.count
        );
    }, [estimatedRanks.materials]);

    const formattedDate: string = useMemo(() => {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + estimatedRanks.raids.length - 1);

        return formatDateWithOrdinal(nextDate);
    }, [estimatedRanks.raids.length]);

    const saveFilterChanges = (filters: IDailyRaidsFilters) => {
        dispatch.dailyRaids({
            type: 'UpdateFilters',
            value: filters,
        });
    };

    const handleGoalEdit = (goalId: string) => {
        const goalToEdit = goals.find(x => x.id === goalId);
        const characterToEdit = characters.find(x => x.name === goalToEdit?.character);

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

    return (
        <div>
            <div className="flex-box gap10 p10">
                <Button variant={'contained'} component={Link} to={isMobile ? '/mobile/plan/goals' : '/plan/goals'}>
                    <LinkIcon /> <span style={{ paddingLeft: 5 }}>Go to Goals</span>
                </Button>

                <Button variant="outlined" onClick={handleClick2}>
                    Daily Raids <SettingsIcon />
                </Button>
                <span>
                    Daily <MiscIcon icon={'energy'} height={15} width={15} /> {actualEnergy} {actualEnergyDescription}
                </span>
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

            <div className="flex-box gap10 p10">
                <Button variant={'contained'} color={'success'} disabled={!hasChanges} onClick={() => refresh()}>
                    <RefreshIcon /> Refresh
                </Button>
                <Button
                    variant={'contained'}
                    color={'error'}
                    disabled={!dailyRaids.completedLocations?.length}
                    onClick={() => {
                        dispatch.dailyRaids({ type: 'ResetCompletedBattles' });
                        setHasChanges(false);
                        setTimeout(() => {
                            setUpgrades({ ...inventory.upgrades });
                        }, 100);
                    }}>
                    <ClearIcon /> Reset day
                </Button>
                <LocationsFilter filter={dailyRaids.filters} filtersChange={saveFilterChanges} />
            </div>

            <Accordion TransitionProps={{ unmountOnExit: true }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <span style={{ fontSize: 20 }}>
                        Selected Goals ({selectedGoals.length} of {allGoals.length})
                    </span>
                </AccordionSummary>
                <AccordionDetails>
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
                </AccordionDetails>
            </Accordion>

            <Accordion TransitionProps={{ unmountOnExit: !grid1Loaded }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <div className="flex-box gap5" style={{ fontSize: 20 }}>
                        <PendingIcon color={'primary'} /> <b>{availableMaterials.length}</b> in progress materials
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
                    <MaterialsTable
                        rows={availableMaterials}
                        updateMaterialQuantity={saveInventoryUpdateChanges}
                        onGridReady={() => setGrid1Loaded(true)}
                    />
                </AccordionDetails>
            </Accordion>

            {!!finishedMaterials.length && (
                <Accordion TransitionProps={{ unmountOnExit: !grid3Loaded }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <div className="flex-box gap5" style={{ fontSize: 20 }}>
                            <CheckCircleIcon color={'success'} /> <b>{finishedMaterials.length}</b> finished materials
                        </div>
                    </AccordionSummary>
                    <AccordionDetails>
                        <MaterialsTable
                            rows={finishedMaterials}
                            updateMaterialQuantity={saveInventoryUpdateChanges}
                            onGridReady={() => setGrid3Loaded(true)}
                        />
                    </AccordionDetails>
                </Accordion>
            )}

            {!!blockedMaterials.length && (
                <Accordion TransitionProps={{ unmountOnExit: !grid2Loaded }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <AccessibleTooltip
                            title={`You don't any have location for ${blockedMaterials.length} materials`}>
                            <div className="flex-box gap5" style={{ fontSize: 20 }}>
                                <Warning color={'warning'} /> <b>{blockedMaterials.length}</b> blocked materials
                            </div>
                        </AccessibleTooltip>
                    </AccordionSummary>
                    <AccordionDetails>
                        <div className="flex-box">
                            <InfoIcon color="primary" /> You don&apos;t have available campaigns nodes for the items
                            listed in the table below
                        </div>
                        {filtersCount > 0 && (
                            <div className="flex-box">
                                <Warning color={'warning'} /> You have applied some filters. Reset filters to make more
                                campaigns node available
                            </div>
                        )}

                        <MaterialsTable
                            rows={blockedMaterials}
                            updateMaterialQuantity={saveInventoryUpdateChanges}
                            onGridReady={() => setGrid2Loaded(true)}
                        />
                    </AccordionDetails>
                </Accordion>
            )}

            <Accordion defaultExpanded={true} TransitionProps={{ unmountOnExit: !pagination.completed }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <FlexBox style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                        <div className="flex-box gap5" style={{ fontSize: 20 }}>
                            <span>
                                Raids (<b>{estimatedRanks.raids.length}</b> Days |
                            </span>
                            <span>
                                <b>{estimatedRanks.totalEnergy}</b> <MiscIcon icon={'energy'} height={15} width={15} />{' '}
                                |
                            </span>
                            <span>
                                <b>{estimatedRanks.totalUnusedEnergy}</b> Unused{' '}
                                <MiscIcon icon={'energy'} height={15} width={15} /> |
                            </span>
                            <span>
                                <b>{estimatedRanks.totalRaids}</b> Raids)
                            </span>
                        </div>
                        <span className="italic">{formattedDate}</span>
                    </FlexBox>
                </AccordionSummary>
                <AccordionDetails style={{ maxHeight: '63vh', overflow: 'auto' }}>
                    <div style={{ display: 'flex', gap: 10, overflow: 'auto' }}>
                        {estimatedRanks.raids.slice(pagination.start, pagination.end).map((day, index) => {
                            const isFirstDay = index === 0;

                            return isFirstDay ? (
                                <RaidsDayInput
                                    key={index}
                                    day={day}
                                    completedLocations={completedLocations}
                                    inventory={inventory.upgrades}
                                    handleAdd={handleAdd}
                                />
                            ) : (
                                <RaidsDayView key={index} day={day} title={'Day ' + (index + 1)} />
                            );
                        })}
                        {!pagination.completed && (
                            <Button
                                variant={'outlined'}
                                style={{ minWidth: 300, alignItems: 'flex-start', paddingTop: 20 }}
                                onClick={() =>
                                    setPagination({
                                        start: 0,
                                        end: estimatedRanks.raids.length,
                                        completed: true,
                                    })
                                }>
                                Show All
                            </Button>
                        )}
                    </div>
                </AccordionDetails>
            </Accordion>
        </div>
    );
};
