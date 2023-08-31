import React, { ChangeEvent, useCallback, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ColGroupDef, RowStyle } from 'ag-grid-community';
import { RowClassParams } from 'ag-grid-community/dist/lib/entities/gridOptions';

import { TextField } from '@mui/material';
import Typography from '@mui/material/Typography';

import { ICharacter } from '../../models/interfaces';
import { GlobalService, PersonalDataService } from '../../services';

import RankSelectorCell from './rank-selector-cell';
import CheckboxCell from './checkbox-cell';
import { Rank, Rarity } from '../../models/enums';
import { isMobile } from 'react-device-detect';

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
                    width: 200,
                    minWidth: 200,
                    maxWidth: 200,
                },
                { 
                    field: 'alliance', 
                    headerName: 'Alliance', 
                    columnGroupShow: 'open',
                    width: 100,
                    minWidth: 100,
                    maxWidth: 100,
                },
                { 
                    field: 'faction',
                    headerName: 'Faction',
                    columnGroupShow: 'open',
                    width: 170,
                    minWidth: 170,
                    maxWidth: 170,
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
                    width: 100,
                    minWidth: 100,
                    maxWidth: 100,
                },
                {
                    headerName: 'Rank',
                    editable: true,
                    cellRenderer: RankSelectorCell,
                    cellRendererParams: {
                        editProperty: 'rank',
                        enumObject: Rank
                    },
                    field: 'rank',
                    width: 150,
                    minWidth: 150,
                    maxWidth: 150,
                    cellStyle: { padding: 0 },
                },

                {
                    headerName: 'Rarity',
                    editable: true,
                    cellRenderer: RankSelectorCell,
                    cellRendererParams: {
                        editProperty: 'rarity',
                        enumObject: Rarity
                    },
                    field: 'rarity',
                    width: 150,
                    minWidth: 150,
                    maxWidth: 150,
                    cellStyle: { padding: 0 },
                },
                {
                    headerName: 'Recommend First',
                    editable: true,
                    cellRenderer: CheckboxCell,
                    cellRendererParams: {
                        editProperty: 'alwaysRecommend',
                        disableProperty: 'neverRecommend',
                    },
                    field: 'alwaysRecommend',
                    maxWidth: 180,
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
                    maxWidth: 180,
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
        PersonalDataService.data.characters = rowsData.map(row => ({ 
            name: row.name, 
            unlocked: row.unlocked, 
            rank: row.rank,
            rarity: row.rarity,
            leSelection: row.leSelection,
            alwaysRecommend: row.alwaysRecommend,
            neverRecommend: row.neverRecommend,
        }));
        PersonalDataService.save();
    };

    React.useEffect(() => {
        function handleResize() {
            if (window.innerWidth >= 768) {
                gridRef.current?.api.sizeColumnsToFit();
            }
        }

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);

        };
    });

    return (
        <div>
            <Typography variant="h5" component="div" sx={{ flexGrow: 1 }}>
                Who You Own
            </Typography>
            <TextField label="Quick Filter" variant="outlined" onChange={onFilterTextBoxChanged}/>
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
                    onGridReady={() => !isMobile ? gridRef.current?.api.sizeColumnsToFit() : undefined}
                >
                </AgGridReact>
            </div>
        </div>
    );
};