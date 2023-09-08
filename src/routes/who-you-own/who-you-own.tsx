import React, { ChangeEvent, useCallback, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ColGroupDef, RowStyle } from 'ag-grid-community';
import { RowClassParams } from 'ag-grid-community/dist/lib/entities/gridOptions';

import { TextField } from '@mui/material';

import { ICharacter } from '../../models/interfaces';
import { GlobalService, PersonalDataService } from '../../services';

import SelectorCell from '../../shared-components/selector-cell';
import CheckboxCell from '../../shared-components/checkbox-cell';
import { Rank, Rarity } from '../../models/enums';
import { fitGridOnWindowResize } from '../../shared-logic/functions';

export const WhoYouOwn = () => {
    const gridRef = useRef<AgGridReact<ICharacter>>(null);
    
    const defaultColDef: ColDef<ICharacter> = {
        sortable: true
    };

    const onFilterTextBoxChanged = useCallback((change: ChangeEvent<HTMLInputElement>) => {
        gridRef.current?.api.setQuickFilter(
            change.target.value
        );
    }, []);
    
    const [columnDefs] = useState<Array<ColDef | ColGroupDef>>([
        {
            headerName: 'Faction Details',
            children: [
                { 
                    field: 'name', 
                    headerName: 'Name',
                    pinned: true,
                    minWidth: 200,
                },
                { 
                    field: 'alliance', 
                    headerName: 'Alliance', 
                    columnGroupShow: 'open',
                    minWidth: 100,
                },
                { 
                    field: 'faction',
                    headerName: 'Faction',
                    columnGroupShow: 'open',
                    minWidth: 170,
                }
            ],
        },
        {
            headerName: 'Owner data',
            openByDefault: true,
            children: [
                {
                    headerName: 'Unlocked',
                    editable: true,
                    cellRenderer: CheckboxCell,
                    cellRendererParams: {
                        editProperty: 'unlocked',
                    },
                    field: 'unlocked',
                    minWidth: 100,
                },
                // {
                //     headerName: 'Progression',
                //     editable: true,
                //     cellRenderer: CheckboxCell,
                //     cellRendererParams: {
                //         editProperty: 'progress',
                //     },
                //     tooltipValueGetter: () => 'When checked character will be displayed on Progression view',
                //     field: 'progress',
                //     width: 100,
                //     minWidth: 100,
                //     minWidth: 100,
                // },
                {
                    headerName: 'Rank',
                    editable: true,
                    cellRenderer: SelectorCell,
                    cellRendererParams: {
                        editProperty: 'rank',
                        enumObject: Rank
                    },
                    field: 'rank',
                    minWidth: 150,
                    cellStyle: { padding: 0 },
                },
                {
                    headerName: 'Rarity',
                    editable: true,
                    cellRenderer: SelectorCell,
                    cellRendererParams: {
                        editProperty: 'rarity',
                        enumObject: Rarity
                    },
                    field: 'rarity',
                    minWidth: 150,
                    cellStyle: { padding: 0 },
                },
                // {
                //     headerName: 'Stars',
                //     editable: true,
                //     cellRenderer: SelectorCell,
                //     cellRendererParams: {
                //         editProperty: 'rarityStars',
                //         enumObject: RarityStars
                //     },
                //     field: 'rarityStars',
                //     width: 150,
                //     minWidth: 150,
                //     minWidth: 150,
                //     cellStyle: { padding: 0 },
                // },
                {
                    headerName: 'Recommend First',
                    editable: true,
                    cellRenderer: CheckboxCell,
                    cellRendererParams: {
                        editProperty: 'alwaysRecommend',
                        disableProperty: 'neverRecommend',
                    },
                    field: 'alwaysRecommend',
                    minWidth: 180,
                    cellStyle: { display: 'flex', justifyContent: 'center' },
                },
                {
                    headerName: 'Recommend Last',
                    editable: true,
                    cellRenderer: CheckboxCell,
                    cellRendererParams: {
                        editProperty: 'neverRecommend',
                        disableProperty: 'alwaysRecommend',
                    },
                    field: 'neverRecommend',
                    minWidth: 180,
                    cellStyle: { display: 'flex', justifyContent: 'center' },
                },
            ]
        },
    ]);

    const [rowsData] = useState(GlobalService.characters);

    const getRowStyle = (params: RowClassParams<ICharacter>): RowStyle => {
        return { background: (params.node.rowIndex ?? 0) % 2 === 0 ? 'lightsteelblue' : 'white' };
    };
    
    const saveChanges = () => {
        rowsData.forEach(row => {
            PersonalDataService.addOrUpdateCharacterData(row);
        });
        PersonalDataService.save();
    };
    
    
    return (
        <div>
            <TextField sx={{ margin: '10px', width: '300px' }} label="Quick Filter" variant="outlined" onChange={onFilterTextBoxChanged}/>
            <div className="ag-theme-material" style={{ height: 'calc(100vh - 170px)', width: '100%' }}>
                <AgGridReact
                    ref={gridRef}
                    suppressCellFocus={true}
                    defaultColDef={defaultColDef}
                    columnDefs={columnDefs}
                    rowData={rowsData}
                    rowHeight={40}
                    getRowStyle={getRowStyle}
                    onCellEditingStopped={saveChanges}
                    onGridReady={fitGridOnWindowResize(gridRef)}
                >
                </AgGridReact>
            </div>
        </div>
    );
};
