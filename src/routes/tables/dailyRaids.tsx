import React, { useContext, useMemo } from 'react';

import { ICharacterRankRange, IEstimatedRanks, IMaterialEstimated2 } from '../../models/interfaces';
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

export const DailyRaids = () => {
    const dispatch = useContext(DispatchContext);
    const { characters, goals, campaignsProgress, dailyRaidsPreferences, inventory } = useContext(StoreContext);

    const [anchorEl2, setAnchorEl2] = React.useState<HTMLButtonElement | null>(null);
    const [hasChanges, setHasChanges] = React.useState<boolean>(false);
    const [upgrades, setUpgrades] = React.useState<Record<string, number>>(inventory.upgrades);

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
                upgrade: event.data.material,
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
                        return <UpgradeImage material={data.material} iconPath={data.iconPath} />;
                    }
                },
                sortable: false,
                width: 80,
            },
            {
                field: 'material',
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
                    max: 100,
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
                field: 'rarity',
                maxWidth: 120,
                valueFormatter: (params: ValueFormatterParams<IMaterialEstimated2>) => Rarity[params.data?.rarity ?? 0],
                cellClass: params => Rarity[params.data?.rarity ?? 0].toLowerCase(),
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

    const charactersList = useMemo<ICharacterRankRange[]>(() => {
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
    }, [goals]);

    const estimatedRanks: IEstimatedRanks = useMemo(() => {
        return StaticDataService.getRankUpgradeEstimatedDays(
            {
                dailyEnergy: dailyRaidsPreferences.dailyEnergy,
                campaignsProgress: dailyRaidsPreferences.useCampaignsProgress
                    ? campaignsProgress
                    : defaultCampaignsProgress,
                preferences: dailyRaidsPreferences,
                upgrades: dailyRaidsPreferences.useInventory ? upgrades : {},
            },
            ...charactersList
        );
    }, [charactersList, dailyRaidsPreferences, upgrades]);

    return (
        <div>
            <div>
                <Button variant="outlined" onClick={handleClick2}>
                    Daily Raids <SettingsIcon />
                </Button>
                <Popover
                    open={open2}
                    anchorEl={anchorEl2}
                    onClose={handleClose2}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left',
                    }}>
                    <div style={{ margin: 20, width: 300 }}>
                        <DailyRaidsSettings />
                    </div>
                </Popover>

                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <span style={{ fontSize: 20 }}>
                            Selected Characters ({charactersList.length} of{' '}
                            {goals.filter(x => x.type === PersonalGoalType.UpgradeRank).length})
                        </span>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Button variant={'contained'} component={Link} to={isMobile ? '/mobile/goals' : '/goals'}>
                            Go to Goals
                        </Button>
                        <CharactersList />
                    </AccordionDetails>
                </Accordion>

                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <span style={{ fontSize: 20 }}>Materials ({estimatedRanks.totalEnergy} Energy Needed)</span>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Button
                            variant={'contained'}
                            component={Link}
                            to={isMobile ? '/mobile/inventory' : '/inventory'}>
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
                                        autoHeight: true,
                                        wrapText: true,
                                    }}
                                    columnDefs={columnDefs}
                                    rowData={estimatedRanks.materials}
                                />
                            </div>
                        ) : undefined}
                    </AccordionDetails>
                </Accordion>

                <Accordion defaultExpanded={true}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <span style={{ fontSize: 20 }}>Raids ({estimatedRanks.raids.length} Days)</span>
                    </AccordionSummary>
                    <AccordionDetails>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                            {estimatedRanks.raids.map((day, index) => (
                                <Card
                                    key={index}
                                    sx={{
                                        width: 300,
                                        minHeight: 200,
                                    }}>
                                    <CardHeader
                                        title={'Day ' + (index + 1)}
                                        subheader={'Energy left ' + day.energyLeft}
                                    />
                                    <CardContent>
                                        <ul style={{ listStyleType: 'none' }}>
                                            {day.raids.map(raid => (
                                                <li key={raid.material}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <UpgradeImage
                                                            material={raid.material}
                                                            iconPath={raid.materialIconPath}
                                                        />
                                                        <Tooltip title={raid.characters.join(', ')}>
                                                            <span>
                                                                (
                                                                {raid.characters.length <= 3
                                                                    ? raid.characters.join(', ')
                                                                    : raid.characters.slice(0, 3).join(', ') +
                                                                      `and ${raid.characters.slice(3).length} more...`}
                                                                )
                                                            </span>
                                                        </Tooltip>
                                                    </div>
                                                    <ul>
                                                        {raid.locations.map(x => (
                                                            <li key={x.location}>
                                                                {x.location} - {x.raidsCount}x
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </AccordionDetails>
                </Accordion>
            </div>
        </div>
    );
};

const CharactersList = () => {
    const dispatch = useContext(DispatchContext);
    const { goals } = useContext(StoreContext);

    const upgradeRankGoals = useMemo(() => goals.filter(g => g.type === PersonalGoalType.UpgradeRank), []);
    const [checked, setChecked] = React.useState<boolean[]>(() => upgradeRankGoals.map(x => x.dailyRaids ?? false));

    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        setChecked(upgradeRankGoals.map(() => event.target.checked));
        upgradeRankGoals.forEach(goal => {
            dispatch.goals({ type: 'UpdateDailyRaids', goalId: goal.id, value: event.target.checked });
        });
    };

    const handleChildChange = (index: number, goalId: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
        setChecked(result => {
            result[index] = event.target.checked;

            return [...result];
        });
        dispatch.goals({ type: 'UpdateDailyRaids', goalId, value: event.target.checked });
    };

    const children = (
        <Box sx={{ display: 'flex', flexDirection: 'column', ml: 3 }}>
            {upgradeRankGoals.map((goal, index) => (
                <FormControlLabel
                    key={goal.id}
                    label={
                        <span>
                            {goal.character} <RankImage rank={goal.currentRank ?? 1} /> -{' '}
                            <RankImage rank={goal.targetRank ?? 1} />{' '}
                        </span>
                    }
                    control={<Checkbox checked={checked[index]} onChange={handleChildChange(index, goal.id)} />}
                />
            ))}
        </Box>
    );

    return (
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
        </div>
    );
};
