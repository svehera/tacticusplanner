import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';

import {
    ICharacter2,
    ICharacterRankRange,
    IEstimatedRanks,
    IMaterialEstimated2,
    IMaterialRaid,
    IPersonalGoal,
    IRaidLocation,
} from '../../models/interfaces';
import { StaticDataService } from '../../services';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Card,
    CardContent,
    CardHeader,
    Checkbox,
    FormControlLabel,
    Input,
    Popover,
    Tooltip,
} from '@mui/material';
import { PersonalGoalType, Rarity } from '../../models/enums';
import { RankImage } from '../../shared-components/rank-image';
import { DispatchContext, StoreContext } from '../../reducers/store.provider';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';
import { isMobile } from 'react-device-detect';
import Button from '@mui/material/Button';
import SettingsIcon from '@mui/icons-material/Settings';
import DailyRaidsSettings from '../../shared-components/daily-raids-settings';
import { defaultCampaignsProgress } from '../../models/constants';
import { CellEditingStoppedEvent } from 'ag-grid-community/dist/lib/events';
import { UpgradeImage } from '../../shared-components/upgrade-image';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { CampaignImage } from '../../shared-components/campaign-image';
import IconButton from '@mui/material/IconButton';
import { Edit } from '@mui/icons-material';
import { EditGoalDialog } from '../../shared-components/goals/set-goal-dialog';
import { enqueueSnackbar } from 'notistack';
import ClearIcon from '@mui/icons-material/Clear';
import { sum } from 'lodash';
import { MiscIcon } from '../../shared-components/misc-icon';

export const DailyRaids = () => {
    const dispatch = useContext(DispatchContext);
    const { dailyRaids, characters, goals, campaignsProgress, dailyRaidsPreferences, inventory } =
        useContext(StoreContext);

    const getSelectedCharacters = () => {
        return goals
            .filter(x => x.dailyRaids && x.type === PersonalGoalType.UpgradeRank)
            .map(g => {
                const char = characters.find(c => c.name === g.character);
                if (char) {
                    return {
                        id: g.character,
                        rankStart: char.rank,
                        rankEnd: g.targetRank!,
                        appliedUpgrades: char.upgrades,
                    } as ICharacterRankRange;
                }
                return null;
            })
            .filter(x => !!x) as ICharacterRankRange[];
    };

    const [anchorEl2, setAnchorEl2] = React.useState<HTMLButtonElement | null>(null);
    const [hasChanges, setHasChanges] = React.useState<boolean>(false);
    const [upgrades, setUpgrades] = React.useState<Record<string, number>>(inventory.upgrades);
    const [selectedCharacters, setSelectedCharacters] = React.useState<ICharacterRankRange[]>(() =>
        getSelectedCharacters()
    );
    const [pagination, setPagination] = React.useState<{
        start: number;
        end: number;
        completed: boolean;
    }>({ start: 0, end: 3, completed: true });
    const [gridLoaded, setGridLoaded] = React.useState<boolean>(false);

    const handleClick2 = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl2(event.currentTarget);
    };

    const handleClose2 = () => {
        setAnchorEl2(null);
    };

    const open2 = Boolean(anchorEl2);

    const saveChanges = (event: CellEditingStoppedEvent<IMaterialEstimated2>): void => {
        if (event.data && event.newValue !== event.oldValue) {
            dispatch.inventory({
                type: 'UpdateUpgradeQuantity',
                upgrade: event.data.id,
                value: event.data.quantity,
            });
            setHasChanges(true);
        }
    };

    const refresh = () => {
        setUpgrades(inventory.upgrades);
        setHasChanges(false);
    };

    const columnDefs = useMemo<Array<ColDef<IMaterialEstimated2>>>(() => {
        return [
            {
                headerName: '#',
                colId: 'rowNumber',
                valueGetter: params => (params.node?.rowIndex ?? 0) + 1,
                maxWidth: 50,
            },
            {
                headerName: 'Icon',
                cellRenderer: (params: ICellRendererParams<IMaterialEstimated2>) => {
                    const { data } = params;
                    if (data) {
                        return <UpgradeImage material={data.label} rarity={data.rarity} iconPath={data.iconPath} />;
                    }
                },
                equals: () => true,
                sortable: false,
                width: 80,
            },
            {
                field: 'label',
                headerName: 'Upgrade',
                maxWidth: isMobile ? 125 : 300,
            },
            {
                hide: !dailyRaidsPreferences.useInventory,
                field: 'quantity',
                headerName: 'Inventory',
                editable: true,
                cellEditorPopup: false,
                cellDataType: 'number',
                cellEditor: 'agNumberCellEditor',
                cellEditorParams: {
                    min: 0,
                    max: 1000,
                    precision: 0,
                },
                maxWidth: 90,
            },
            {
                hide: !dailyRaidsPreferences.useInventory,
                field: 'countLeft',
                headerName: 'Left',
                maxWidth: 90,
                cellStyle: cellClassParams => {
                    const { data } = cellClassParams;
                    if (data) {
                        return {
                            backgroundColor: data.quantity >= data.count ? 'lightgreen' : 'white',
                        };
                    }
                },
            },
            {
                field: 'count',
                maxWidth: 75,
            },
            {
                field: 'craftedCount',
                headerName: 'Crafted',
                maxWidth: 75,
            },
            {
                field: 'rarity',
                maxWidth: 120,
                valueFormatter: (params: ValueFormatterParams<IMaterialEstimated2>) => Rarity[params.data?.rarity ?? 0],
                cellClass: params => Rarity[params.data?.rarity ?? 0].toLowerCase(),
            },
            {
                field: 'characters',
                tooltipField: 'characters',
                maxWidth: 120,
            },
            {
                field: 'expectedEnergy',
                headerName: 'Energy',
                maxWidth: 90,
            },
            {
                headerName: 'Battles',
                field: 'numberOfBattles',
                maxWidth: 90,
            },
            {
                headerName: 'Days',
                field: 'daysOfBattles',
                maxWidth: 90,
            },
            {
                headerName: 'Locations',
                field: 'locationsString',
                minWidth: 300,
                flex: 1,
            },
            {
                headerName: 'Locked Locations',
                field: 'missingLocationsString',
                minWidth: 300,
                flex: 1,
                cellStyle: () => ({
                    color: 'red',
                }),
            },
        ];
    }, [dailyRaidsPreferences.useInventory]);

    const actualEnergy = useMemo(() => {
        const goalsEnergy = sum(goals.map(x => x.energyPerDay ?? 0));
        return dailyRaidsPreferences.dailyEnergy - dailyRaidsPreferences.shardsEnergy - goalsEnergy;
    }, [dailyRaidsPreferences.dailyEnergy, dailyRaidsPreferences.shardsEnergy]);

    const actualEnergyDescription = useMemo(() => {
        const goalsEnergy = goals.map(x => x.energyPerDay ?? 0).filter(x => x > 0);
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
                    : defaultCampaignsProgress,
                preferences: dailyRaidsPreferences,
                upgrades: dailyRaidsPreferences.useInventory ? upgrades : {},
                completedLocations: dailyRaids.completedLocations ?? [],
            },
            ...selectedCharacters
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
    }, [selectedCharacters, dailyRaidsPreferences, upgrades]);

    return (
        <div>
            <div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                    <Button variant="outlined" onClick={handleClick2}>
                        Daily Raids <SettingsIcon />
                    </Button>
                    <span>
                        Daily <MiscIcon icon={'energy'} height={15} width={15} /> {actualEnergy}{' '}
                        {actualEnergyDescription}
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

                <CharactersList refresh={selected => setSelectedCharacters(selected)} />

                <Accordion TransitionProps={{ unmountOnExit: !gridLoaded }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <span style={{ fontSize: 20 }}>Materials ({estimatedRanks.totalEnergy} Energy Needed)</span>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Button
                            variant={'contained'}
                            component={Link}
                            to={isMobile ? '/mobile/input/inventory' : '/input/inventory'}>
                            Go to Inventory
                        </Button>
                        {hasChanges ? (
                            <Button disabled={!hasChanges} onClick={() => refresh()}>
                                <RefreshIcon /> Refresh Estimate
                            </Button>
                        ) : undefined}
                        {estimatedRanks.materials.length ? (
                            <div
                                className="ag-theme-material"
                                style={{
                                    height: 50 + estimatedRanks.materials.length * 30,
                                    maxHeight: '40vh',
                                    width: '100%',
                                }}>
                                <AgGridReact
                                    onCellEditingStopped={saveChanges}
                                    suppressChangeDetection={true}
                                    singleClickEdit={true}
                                    defaultColDef={{
                                        suppressMovable: true,
                                        sortable: true,
                                        wrapText: true,
                                    }}
                                    rowHeight={60}
                                    rowBuffer={3}
                                    columnDefs={columnDefs}
                                    rowData={estimatedRanks.materials}
                                    onGridReady={() => setGridLoaded(true)}
                                />
                            </div>
                        ) : undefined}
                    </AccordionDetails>
                </Accordion>

                <Accordion defaultExpanded={true} TransitionProps={{ unmountOnExit: !pagination.completed }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <span style={{ fontSize: 20 }}>Raids ({estimatedRanks.raids.length} Days)</span>
                    </AccordionSummary>
                    <AccordionDetails style={{ maxHeight: '63vh', overflow: 'auto' }}>
                        {hasChanges ? (
                            <Button disabled={!hasChanges} onClick={() => refresh()}>
                                <RefreshIcon /> Refresh Estimate
                            </Button>
                        ) : undefined}
                        {dailyRaids.completedLocations?.length ? (
                            <Tooltip
                                title={dailyRaids.completedLocations
                                    .flatMap(x => x.locations)
                                    .map(x => x.campaign + ' ' + x.battleNumber)
                                    .join(', ')}>
                                <Button
                                    onClick={() => {
                                        dispatch.dailyRaids({ type: 'ResetCompletedBattles' });
                                        refresh();
                                    }}>
                                    <ClearIcon /> Clear Completed Raids
                                </Button>
                            </Tooltip>
                        ) : undefined}
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
                                            {day.raids.map(raid => (
                                                <MaterialItem
                                                    raid={raid}
                                                    key={raid.materialId}
                                                    isFirstDay={index === 0}
                                                    changed={() => setHasChanges(true)}
                                                />
                                            ))}
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
        </div>
    );
};

const CharactersList = ({ refresh }: { refresh: (chars: ICharacterRankRange[]) => void }) => {
    const dispatch = useContext(DispatchContext);
    const { goals, characters } = useContext(StoreContext);

    const upgradeRankGoals = useMemo(
        () =>
            goals
                .filter(g => g.type === PersonalGoalType.UpgradeRank)
                .map(g => {
                    const relatedCharacter = characters.find(x => x.name === g.character);

                    return { ...g, currentRank: relatedCharacter?.rank };
                }),
        []
    );
    const [checked, setChecked] = React.useState<boolean[]>(() => upgradeRankGoals.map(x => x.dailyRaids ?? false));

    const [editGoal, setEditGoal] = useState<IPersonalGoal | null>(null);
    const [editCharacter, setEditCharacter] = useState<ICharacter2>(characters[0]);
    const [hasChanges, setHasChanges] = React.useState<boolean>(false);

    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        setChecked(upgradeRankGoals.map(() => event.target.checked));
        upgradeRankGoals.forEach(goal => {
            dispatch.goals({ type: 'UpdateDailyRaids', goalId: goal.id, value: event.target.checked });
        });
        setHasChanges(true);
    };

    const handleChildChange = (index: number, goalId: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
        setChecked(result => {
            result[index] = event.target.checked;

            return [...result];
        });
        dispatch.goals({ type: 'UpdateDailyRaids', goalId, value: event.target.checked });
        setHasChanges(true);
    };

    const handleEdit = (goal: IPersonalGoal) => {
        const relatedCharacter = characters.find(x => x.name === goal.character);
        if (relatedCharacter) {
            setEditCharacter(relatedCharacter);
            setEditGoal({
                ...goal,
                currentRank: relatedCharacter.rank,
                currentRarity: relatedCharacter.rarity,
                upgrades: relatedCharacter.upgrades,
            });
        }
    };

    const getSelectedCharacters = () => {
        return goals
            .filter(x => x.dailyRaids && x.type === PersonalGoalType.UpgradeRank)
            .map(g => {
                const char = characters.find(c => c.name === g.character);
                if (char) {
                    return {
                        id: g.character,
                        rankStart: char.rank,
                        rankEnd: g.targetRank!,
                        appliedUpgrades: char.upgrades,
                    } as ICharacterRankRange;
                }
                return null;
            })
            .filter(x => !!x) as ICharacterRankRange[];
    };

    const children = (
        <Box sx={{ display: 'flex', flexDirection: 'column', ml: 3 }}>
            {upgradeRankGoals.map((goal, index) => (
                <FormControlLabel
                    key={goal.id}
                    label={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <IconButton onClick={() => handleEdit(goal)}>
                                <Edit fontSize="small" />
                            </IconButton>
                            {goal.character} <RankImage rank={goal.currentRank ?? 1} /> -{' '}
                            <RankImage rank={goal.targetRank ?? 1} />{' '}
                        </div>
                    }
                    control={<Checkbox checked={checked[index]} onChange={handleChildChange(index, goal.id)} />}
                />
            ))}
        </Box>
    );

    return (
        <Accordion TransitionProps={{ unmountOnExit: true }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <span style={{ fontSize: 20 }}>
                    Selected Characters ({checked.filter(x => x).length} of {upgradeRankGoals.length})
                </span>
            </AccordionSummary>
            <AccordionDetails>
                <Button variant={'contained'} component={Link} to={isMobile ? '/mobile/plan/goals' : '/plan/goals'}>
                    Go to Goals
                </Button>
                {hasChanges ? (
                    <Button
                        disabled={!hasChanges}
                        onClick={() => {
                            refresh(getSelectedCharacters());
                            setHasChanges(false);
                        }}>
                        <RefreshIcon /> Refresh Estimate
                    </Button>
                ) : undefined}
                <div>
                    <FormControlLabel
                        label="Select all"
                        control={
                            <Checkbox
                                checked={checked.every(x => x)}
                                indeterminate={checked.some(x => x) && !checked.every(x => x)}
                                onChange={handleSelectAll}
                            />
                        }
                    />
                    {children}
                    {editGoal ? (
                        <EditGoalDialog
                            isOpen={true}
                            goal={editGoal}
                            character={editCharacter}
                            onClose={() => {
                                setEditGoal(null);
                            }}
                        />
                    ) : undefined}
                </div>
            </AccordionDetails>
        </Accordion>
    );
};

const MaterialItem = ({
    raid,
    changed,
    isFirstDay,
}: {
    isFirstDay: boolean;
    raid: IMaterialRaid;
    changed: () => void;
}) => {
    const { dailyRaids } = useContext(StoreContext);
    const completedLocations = dailyRaids.completedLocations?.flatMap(x => x.locations) ?? [];

    const isAllRaidsCompleted = useMemo(
        () =>
            isFirstDay &&
            raid.locations.every(
                location =>
                    dailyRaids.completedLocations
                        ?.flatMap(x => x.locations)
                        .some(completedLocation => completedLocation.id === location.id)
            ),
        [completedLocations]
    );

    return (
        <li style={{ opacity: isAllRaidsCompleted ? 0.5 : 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <UpgradeImage
                    material={raid.materialLabel}
                    rarity={raid.materialRarity}
                    iconPath={raid.materialIconPath}
                />
                <Tooltip title={raid.characters.join(', ')}>
                    <span>
                        (
                        {raid.characters.length <= 3
                            ? raid.characters.join(', ')
                            : raid.characters.slice(0, 3).join(', ') +
                              ` and ${raid.characters.slice(3).length} more...`}
                        )
                    </span>
                </Tooltip>
            </div>
            <ul style={{ paddingInlineStart: 15 }}>
                {raid.locations.map(x => (
                    <RaidItem
                        location={x}
                        key={x.campaign + x.battleNumber}
                        material={raid}
                        materialTotalCount={raid.totalCount}
                        changed={changed}
                        isFirstDay={isFirstDay}
                    />
                ))}
            </ul>
        </li>
    );
};

const RaidItem = ({
    material,
    location,
    changed,
    isFirstDay,
    materialTotalCount,
}: {
    isFirstDay: boolean;
    material: IMaterialRaid;
    materialTotalCount: number;
    location: IRaidLocation;
    changed: () => void;
}) => {
    const { dailyRaids, inventory } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);
    const [itemsObtained, setItemsObtained] = useState<string | number>(Math.round(location.farmedItems));

    const completedLocations = dailyRaids.completedLocations?.flatMap(x => x.locations) ?? [];

    const isLocationCompleted = useMemo(
        () => isFirstDay && completedLocations.some(completedLocation => completedLocation.id === location.id),
        [completedLocations]
    );
    const handleItemsObtainedChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setItemsObtained(event.target.value);
    };

    const collectedItems = useMemo(() => inventory.upgrades[material.materialId] ?? 0, [inventory.upgrades]);

    const handleAdd = () => {
        const value = itemsObtained === '' ? 0 : Number(itemsObtained);
        if (value > 0) {
            dispatch.inventory({
                type: 'IncrementUpgradeQuantity',
                upgrade: material.materialId,
                value,
            });
            enqueueSnackbar(`Added ${value} items for ${material.materialLabel}`, { variant: 'success' });
            changed();
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

    return (
        <li
            style={{
                display: 'flex',
                gap: 5,
                alignItems: 'center',
                justifyContent: 'space-between',
                opacity: isLocationCompleted ? 0.5 : 1,
            }}>
            <div
                style={{
                    display: 'flex',
                    gap: 5,
                    alignItems: 'center',
                }}>
                <CampaignImage campaign={location.campaign} size={30} />
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                    }}>
                    <span>
                        <span style={{ fontStyle: 'italic' }}>({location.raidsCount}x)</span> Battle{' '}
                        <span style={{ fontWeight: 'bold' }}>{location.battleNumber}</span>
                    </span>
                    <span style={{ fontSize: 12 }}>{location.campaign}</span>
                </div>
            </div>
            <div
                style={{
                    minWidth: 60,
                    maxWidth: 70,
                    display: isFirstDay ? 'flex' : 'none',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}>
                <FormControlLabel
                    control={
                        <Input
                            disabled={isLocationCompleted}
                            value={itemsObtained}
                            size="small"
                            onChange={handleItemsObtainedChange}
                            inputProps={{
                                step: 1,
                                min: 0,
                                type: 'number',
                            }}
                        />
                    }
                    sx={{ margin: 0 }}
                    labelPlacement={'top'}
                    label={
                        <Tooltip title={`${collectedItems}/${materialTotalCount} Items`}>
                            <span style={{ fontSize: 12, fontStyle: 'italic' }}>
                                {collectedItems}/{materialTotalCount} Items
                            </span>
                        </Tooltip>
                    }
                />
                <Tooltip title={isLocationCompleted ? '' : 'Add to inventory'}>
                    <span>
                        <Button size={'small'} onClick={handleAdd} disabled={isLocationCompleted}>
                            Add
                        </Button>
                    </span>
                </Tooltip>
            </div>
        </li>
    );
};
