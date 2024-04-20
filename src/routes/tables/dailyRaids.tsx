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
import { PersonalGoalType, Rarity } from 'src/models/enums';
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';
import { isMobile } from 'react-device-detect';
import Button from '@mui/material/Button';
import SettingsIcon from '@mui/icons-material/Settings';
import DailyRaidsSettings from '../../shared-components/daily-raids-settings';
import { fullCampaignsProgress } from 'src/models/constants';
import { CellEditingStoppedEvent } from 'ag-grid-community/dist/lib/events';
import { UpgradeImage } from 'src/shared-components/upgrade-image';
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
    const [gridLoaded, setGridLoaded] = React.useState<boolean>(false);

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
        setUpgrades({ ...inventory.upgrades });
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

                <Accordion TransitionProps={{ unmountOnExit: true }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <span style={{ fontSize: 20 }}>
                            Selected Characters ({selectedGoals.length} of {allGoals.length})
                        </span>
                    </AccordionSummary>
                    <AccordionDetails>
                        <CharactersRaidsSelect
                            goalsSelect={allGoals}
                            onGoalsSelectChange={handleGoalsSelectionChange}
                        />
                    </AccordionDetails>
                </Accordion>

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

                {!!blockedMaterials.length && (
                    <Accordion TransitionProps={{ unmountOnExit: !gridLoaded }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Tooltip title={`You don't any have location for ${blockedMaterials.length} materials`}>
                                <span style={{ fontSize: 20 }}>
                                    <Warning color={'warning'} /> Blocked Materials ({blockedMaterials.length})
                                </span>
                            </Tooltip>
                        </AccordionSummary>
                        <AccordionDetails>
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
                                    rowData={blockedMaterials}
                                    onGridReady={() => setGridLoaded(true)}
                                />
                            </div>
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
                                        setHasChanges(false);
                                        setTimeout(() => {
                                            setUpgrades({ ...inventory.upgrades });
                                        }, 100);
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
                                                        enqueueSnackbar(
                                                            `Added ${value} items for ${raid.materialLabel}`,
                                                            { variant: 'success' }
                                                        );
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
        </div>
    );
};
