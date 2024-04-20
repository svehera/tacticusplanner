import React, { useContext, useMemo } from 'react';

import {
    ICharacterRankRange,
    IEstimatedRanks,
    IMaterialEstimated2,
    IMaterialRaid,
    IRaidLocation,
} from 'src/models/interfaces';
import { StaticDataService } from 'src/services';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Card,
    CardContent,
    CardHeader,
    Popover,
    Tooltip,
} from '@mui/material';
import { PersonalGoalType } from 'src/models/enums';
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';
import { isMobile } from 'react-device-detect';
import Button from '@mui/material/Button';
import SettingsIcon from '@mui/icons-material/Settings';
import DailyRaidsSettings from '../../shared-components/daily-raids-settings';
import { fullCampaignsProgress } from 'src/models/constants';
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
import { MaterialItemView } from 'src/v2/features/goals/material-item-view';
import { MaterialItemInput } from 'src/v2/features/goals/material-item-input';
import { CharactersRaidsSelect } from 'src/v2/features/goals/characters-raids-select';
import {
    CharacterRaidGoalSelect,
    ICharacterAscendGoal,
    ICharacterRaidGoalSelectBase,
    ICharacterUpgradeRankGoal,
} from 'src/v2/features/goals/goals.models';
import { MaterialsTable } from 'src/v2/features/goals/materials-table';
import InfoIcon from '@mui/icons-material/Info';

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

    const allGoals = useMemo<CharacterRaidGoalSelect[]>(() => {
        return goals
            .map(g => {
                const relatedCharacter = characters.find(x => x.name === g.character);
                if (!relatedCharacter || ![PersonalGoalType.UpgradeRank, PersonalGoalType.Ascend].includes(g.type)) {
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
                campaignsProgress: dailyRaidsPreferences.useCampaignsProgress
                    ? campaignsProgress
                    : fullCampaignsProgress,
                preferences: dailyRaidsPreferences,
                upgrades: dailyRaidsPreferences.useInventory ? upgrades : {},
                completedLocations: dailyRaids.completedLocations ?? [],
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
        if (result.raids.length > 3) {
            setPagination(() => ({
                start: 0,
                end: 3,
                completed: false,
            }));
        } else {
            setPagination(() => ({
                start: 0,
                end: result.raids.length,
                completed: true,
            }));
        }
        return result;
    }, [upgradeRankGoals, dailyRaidsPreferences, upgrades]);

    const blockedMaterials: IMaterialEstimated2[] = useMemo(() => {
        return estimatedRanks.materials.filter(x => x.locationsString === x.missingLocationsString);
    }, [estimatedRanks.materials]);

    const formattedDate: string = useMemo(() => {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + estimatedRanks.raids.length - 1);

        return formatDateWithOrdinal(nextDate);
    }, [estimatedRanks.raids.length]);

    return (
        <div>
            <div className="flex-box gap10 p10">
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
            </div>

            <Accordion TransitionProps={{ unmountOnExit: true }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <span style={{ fontSize: 20 }}>
                        Selected Characters ({selectedGoals.length} of {allGoals.length})
                    </span>
                </AccordionSummary>
                <AccordionDetails>
                    <CharactersRaidsSelect goalsSelect={allGoals} onGoalsSelectChange={handleGoalsSelectionChange} />
                </AccordionDetails>
            </Accordion>

            <Accordion TransitionProps={{ unmountOnExit: !grid1Loaded }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <span style={{ fontSize: 20 }}>Materials ({estimatedRanks.totalEnergy} Energy Needed)</span>
                </AccordionSummary>
                <AccordionDetails>
                    <div className="flex-box gap10 wrap">
                        <Button
                            variant={'contained'}
                            component={Link}
                            to={isMobile ? '/mobile/input/inventory' : '/input/inventory'}>
                            Go to Inventory
                        </Button>
                        <div className="flex-box gap5">
                            <InfoIcon color="primary" />
                            <span>Click on the Inventory column cell to edit its value</span>
                        </div>
                    </div>
                    <MaterialsTable
                        rows={estimatedRanks.materials}
                        updateMaterialQuantity={saveInventoryUpdateChanges}
                        onGridReady={() => setGrid1Loaded(true)}
                    />
                </AccordionDetails>
            </Accordion>

            {!!blockedMaterials.length && (
                <Accordion TransitionProps={{ unmountOnExit: !grid2Loaded }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Tooltip title={`You don't any have location for ${blockedMaterials.length} materials`}>
                            <span style={{ fontSize: 20 }}>
                                <Warning color={'warning'} /> Blocked Materials ({blockedMaterials.length})
                            </span>
                        </Tooltip>
                    </AccordionSummary>
                    <AccordionDetails>
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
                        <span style={{ fontSize: 20 }}>Raids ({estimatedRanks.raids.length} Days)</span>
                        <span className="italic">{formattedDate}</span>
                    </FlexBox>
                </AccordionSummary>
                <AccordionDetails style={{ maxHeight: '63vh', overflow: 'auto' }}>
                    <div style={{ display: 'flex', gap: 10, overflow: 'auto' }}>
                        {estimatedRanks.raids.slice(pagination.start, pagination.end).map((day, index) => (
                            <Card
                                key={index}
                                sx={{
                                    minWidth: 300,
                                }}>
                                <CardHeader
                                    title={index === 0 ? 'Today' : 'Day ' + (index + 1)}
                                    subheader={'Energy left ' + day.energyLeft}
                                />
                                <CardContent>
                                    <ul style={{ listStyleType: 'none', padding: 0 }}>
                                        {day.raids.map(raid => {
                                            const isFirstDay = index === 0;
                                            const acquiredCount = inventory.upgrades[raid.materialId] ?? 0;
                                            const completedLocations =
                                                dailyRaids.completedLocations?.flatMap(x => x.locations) ?? [];

                                            const handleAdd = (value: number, location: IRaidLocation) => {
                                                setHasChanges(true);

                                                if (value > 0) {
                                                    dispatch.inventory({
                                                        type: 'IncrementUpgradeQuantity',
                                                        upgrade: raid.materialId,
                                                        value,
                                                    });
                                                    enqueueSnackbar(`Added ${value} items for ${raid.materialLabel}`, {
                                                        variant: 'success',
                                                    });
                                                }

                                                dispatch.dailyRaids({
                                                    type: 'AddCompletedBattle',
                                                    location,
                                                    material: {
                                                        ...raid,
                                                        locations: [],
                                                    },
                                                });
                                            };

                                            return (
                                                <li key={raid.materialId + index}>
                                                    {!isFirstDay && (
                                                        <>
                                                            <MaterialItemView materialRaid={raid} />
                                                        </>
                                                    )}
                                                    {isFirstDay && (
                                                        <>
                                                            <MaterialItemInput
                                                                acquiredCount={acquiredCount}
                                                                materialRaid={raid}
                                                                completedLocations={completedLocations}
                                                                addCount={handleAdd}
                                                            />
                                                        </>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </CardContent>
                            </Card>
                        ))}
                        {pagination.completed ? undefined : (
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
