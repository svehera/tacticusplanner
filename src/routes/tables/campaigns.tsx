import React, { useMemo, useRef, useState } from 'react';

import { AgGridReact } from 'ag-grid-react';
import { ColDef, RowStyle, RowClassParams } from 'ag-grid-community';

import { ICampaignBattleComposed } from '../../models/interfaces';
import { Campaign } from '../../models/enums';
import { ValueGetterParams } from 'ag-grid-community/dist/lib/entities/colDef';
import { StaticDataService } from '../../services';
import { fitGridOnWindowResize } from '../../shared-logic/functions';
import { FormControl, MenuItem, Select } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';

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
            maxWidth: 150,
            width: 150,
            minWidth: 150,
        },
        {
            field: 'dailyBattleCount',
            headerName: 'Battles Count',
            maxWidth: 150,
            width: 150,
            minWidth: 150,
        },
        {
            field: 'dropRate',
            headerName: 'Drop Rate',
            maxWidth: 150,
            width: 150,
            minWidth: 150,
        },
        {
            field: 'rarity',
            headerName: 'Rarity',
            maxWidth: 150,
            width: 150,
            minWidth: 150,
        },
        {
            field: 'reward',
            headerName: 'Reward',
            minWidth: 170,
        },
        {
            field: 'expectedGold',
            headerName: 'Expected Gold',
            maxWidth: 150,
            width: 150,
            minWidth: 150,
        },
    ]);

    const [campaign, setCampaign] = useState(Campaign.Indomitus);

    const campaignsOptions = useMemo(() => Object.keys(StaticDataService.campaignsGrouped).sort(), []);

    const rows = useMemo(() => StaticDataService.campaignsGrouped[campaign], [campaign]);

    const getRowStyle = (params: RowClassParams<ICampaignBattleComposed>): RowStyle => {
        return { background: (params.node.rowIndex ?? 0) % 2 === 0 ? 'lightsteelblue' : 'white' };
    };

    return (
        <div>
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

            <div className="ag-theme-material" style={{ height: 'calc(100vh - 220px)', width: '100%' }}>
                <AgGridReact
                    ref={gridRef}
                    suppressCellFocus={true}
                    defaultColDef={{ resizable: true, sortable: true }}
                    columnDefs={columnDefs}
                    rowData={rows}
                    getRowStyle={getRowStyle}
                    onGridReady={fitGridOnWindowResize(gridRef)}></AgGridReact>
            </div>
        </div>
    );
};
