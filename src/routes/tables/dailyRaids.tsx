import React, { useContext, useMemo, useState } from 'react';

import { ICharacterRankRange, IEstimatedRanks, IMaterialEstimated2 } from '../../models/interfaces';
import { StaticDataService } from '../../services';
import { Card, CardContent, CardHeader, Popover } from '@mui/material';
import { PersonalGoalType, Rarity } from '../../models/enums';
import { RankImage } from '../../shared-components/rank-image';
import { DispatchContext, StoreContext } from '../../reducers/store.provider';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ValueFormatterParams } from 'ag-grid-community';
import { isMobile } from 'react-device-detect';
import Button from '@mui/material/Button';
import SettingsIcon from '@mui/icons-material/Settings';
import DailyRaidsSettings from '../../shared-components/daily-raids-settings';
import { defaultCampaignsProgress } from '../../models/constants';
import { CellEditingStoppedEvent } from 'ag-grid-community/dist/lib/events';

export const DailyRaids = () => {
    const dispatch = useContext(DispatchContext);
    const { characters, goals, campaignsProgress, dailyRaidsPreferences, inventory } = useContext(StoreContext);

    const [anchorEl2, setAnchorEl2] = React.useState<HTMLButtonElement | null>(null);

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
        }
    };

    const [columnDefs] = useState<Array<ColDef<IMaterialEstimated2>>>([
        {
            headerName: '#',
            colId: 'rowNumber',
            valueGetter: params => (params.node?.rowIndex ?? 0) + 1,
            maxWidth: 50,
            pinned: true,
        },
        {
            field: 'material',
            maxWidth: isMobile ? 125 : 300,
            pinned: true,
        },
        {
            field: 'count',
            maxWidth: 75,
        },
        {
            field: 'quantity',
            editable: true,
            cellEditorPopup: false,
            cellDataType: 'number',
            cellEditor: 'agNumberCellEditor',
            cellEditorParams: {
                min: 0,
                max: 100,
                precision: 0,
            },
            maxWidth: 150,
            width: 150,
            minWidth: 150,
        },
        {
            field: 'countLeft',
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
            maxWidth: 120,
        },
        {
            headerName: '# Of Battles',
            field: 'numberOfBattles',
            maxWidth: 100,
        },
        {
            headerName: 'Days Of Battles',
            field: 'daysOfBattles',
            maxWidth: 100,
        },
        {
            headerName: 'Locations',
            field: 'locationsString',
            minWidth: 300,
            flex: 1,
        },
    ]);

    const charactersList = useMemo<ICharacterRankRange[]>(() => {
        return goals
            .filter(x => x.type === PersonalGoalType.UpgradeRank)
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
                upgrades: dailyRaidsPreferences.useInventory ? inventory.upgrades : {},
            },
            ...charactersList
        );
    }, [dailyRaidsPreferences, inventory.upgrades]);

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

                <div style={{ display: 'flex', gap: 40 }}>
                    <h3>Total</h3>
                    <h4>Days - {estimatedRanks.raids.length}</h4>
                    <h4>Energy - {estimatedRanks.totalEnergy}</h4>
                </div>

                <ul>
                    {charactersList.map(x => (
                        <li key={x.id}>
                            {x.id} <RankImage rank={x.rankStart} /> - <RankImage rank={x.rankEnd} />
                        </li>
                    ))}
                </ul>

                <div
                    className="ag-theme-material"
                    style={{ height: 50 + estimatedRanks.materials.length * 30, maxHeight: '40vh', width: '100%' }}>
                    <AgGridReact
                        onCellEditingStopped={saveChanges}
                        singleClickEdit={true}
                        defaultColDef={{ suppressMovable: true, sortable: true, autoHeight: true, wrapText: true }}
                        columnDefs={columnDefs}
                        rowData={estimatedRanks.materials}
                    />
                </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {estimatedRanks.raids.map((day, index) => (
                    <Card
                        key={index}
                        sx={{
                            width: 350,
                            minHeight: 200,
                        }}>
                        <CardHeader title={'Day ' + (index + 1)} subheader={'Energy left ' + day.energyLeft} />
                        <CardContent>
                            <ul>
                                {day.raids.map(raid => (
                                    <li key={raid.material}>
                                        {raid.material}{' '}
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
        </div>
    );
};

interface IMaterialEstimated {
    material: string;
    count: number;
    rarity: Rarity;
    locations: string[];
    expectedEnergy: number;
    numberOfBattles: number;
}
