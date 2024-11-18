import React, { useMemo, useRef, useState } from 'react';

import { AgGridReact } from 'ag-grid-react';
import { ColDef, RowStyle, RowClassParams, ICellRendererParams } from 'ag-grid-community';

import { ICampaignBattleComposed } from 'src/models/interfaces';
import { Campaign } from 'src/models/enums';
import { ValueGetterParams } from 'ag-grid-community/dist/lib/entities/colDef';
import { StaticDataService } from 'src/services';
import { fitGridOnWindowResize } from 'src/shared-logic/functions';
import { FormControl, MenuItem, Select } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import { uniq } from 'lodash';

export const Campaigns = () => {
    const gridRef = useRef<AgGridReact<ICampaignBattleComposed>>(null);

    const [columnDefs] = useState<Array<ColDef>>([
        {
            headerName: '#',
            colId: 'rowNumber',
            valueGetter: params => (params.node?.rowIndex ?? 0) + 1,
            maxWidth: 50,
            width: 50,
            minWidth: 50,
            pinned: true,
        },
        {
            headerName: 'Battle',
            pinned: true,
            minWidth: 200,
            valueGetter: (params: ValueGetterParams<ICampaignBattleComposed>) => {
                const battle = params.data;
                if (battle) {
                    return battle.campaign + ' ' + battle.nodeNumber;
                }
            },
        },
        {
            field: 'energyCost',
            headerName: 'Energy Cost',
        },
        {
            field: 'dailyBattleCount',
            headerName: 'Battles Count',
        },
        {
            field: 'dropRate',
            headerName: 'Drop Rate',
        },
        {
            field: 'rarity',
            headerName: 'Rarity',
        },
        {
            field: 'reward',
            headerName: 'Reward',
            minWidth: 170,
        },
        {
            field: 'slots',
            headerName: 'Slots',
        },
        {
            field: 'expectedGold',
            headerName: 'Expected Gold',
        },
        {
            headerName: 'Enemies Factions',
            valueGetter: (params: ValueGetterParams<ICampaignBattleComposed>) => {
                const battle = params.data;
                if (battle) {
                    return battle.enemiesFactions;
                }
            },
            cellRenderer: (params: ICellRendererParams<ICampaignBattleComposed>) => {
                return (
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {(params.value as string[]).map(x => (
                            <li key={x}>{x}</li>
                        ))}
                    </ul>
                );
            },
        },
        {
            field: 'enemiesTotal',
            headerName: 'Enemies total',
        },
        {
            headerName: 'Enemies Types',
            valueGetter: (params: ValueGetterParams<ICampaignBattleComposed>) => {
                const battle = params.data;
                if (battle) {
                    return battle.enemiesTypes;
                }
            },
            cellRenderer: (params: ICellRendererParams<ICampaignBattleComposed>) => {
                return (
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {(params.value as string[]).map(x => (
                            <li key={x}>{x}</li>
                        ))}
                    </ul>
                );
            },
        },
    ]);

    const [campaign, setCampaign] = useState(Campaign.I);

    const campaignsOptions = useMemo(() => Object.keys(StaticDataService.campaignsGrouped).sort(), []);

    const rows = useMemo(() => StaticDataService.campaignsGrouped[campaign], [campaign]);

    const getRowStyle = (params: RowClassParams<ICampaignBattleComposed>): RowStyle => {
        return { background: (params.node.rowIndex ?? 0) % 2 === 0 ? 'lightsteelblue' : 'white' };
    };

    const uniqEnemiesFactions = uniq(rows.flatMap(x => x.enemiesFactions));
    const uniqEnemiesTypes = uniq(rows.flatMap(x => x.enemiesTypes));

    return (
        <div>
            <div className="flex-box gap10 wrap">
                <FormControl style={{ width: 250, margin: 20 }}>
                    <InputLabel>Campaign</InputLabel>
                    <Select
                        label={'Campaign'}
                        value={campaign}
                        onChange={event => setCampaign(event.target.value as Campaign)}>
                        {campaignsOptions.map(value => (
                            <MenuItem key={value} value={value}>
                                {value} ({StaticDataService.campaignsGrouped[value].length})
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <div>
                    <span className="bold"> Enemies factions:</span> {uniqEnemiesFactions.join(', ')}
                </div>

                <div>
                    <span className="bold"> Enemies types:</span> {uniqEnemiesTypes.join(', ')}
                </div>
            </div>

            <div className="ag-theme-material" style={{ height: 'calc(100vh - 220px)', width: '100%' }}>
                <AgGridReact
                    ref={gridRef}
                    suppressCellFocus={true}
                    defaultColDef={{ resizable: true, sortable: true, autoHeight: true }}
                    columnDefs={columnDefs}
                    rowData={rows}
                    getRowStyle={getRowStyle}
                    onGridReady={fitGridOnWindowResize(gridRef)}></AgGridReact>
            </div>
        </div>
    );
};
