import React, { useCallback, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ColGroupDef, RowStyle, ValueFormatterParams } from 'ag-grid-community';
import { RowClassParams } from 'ag-grid-community/dist/lib/entities/gridOptions';
import { ICharacter } from '../../store/static-data/interfaces';
import GlobalStoreService from '../../store/global-store.service';
import { PersonalDataService } from '../../store/personal-data/personal-data.service';
import RankSelectorCell from '../rank-selector-cell/rank-selector-cell';
import UnlockedCheckboxCell from '../unlocked-checkbox-cell/unlocked-checkbox-cell';
import Typography from '@mui/material/Typography';

const WhoYouOwn = () => {
    const gridRef = useRef<AgGridReact<ICharacter>>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    
    const defaultColDef: ColDef<ICharacter> = {
        sortable: true
    };

    const onFilterTextBoxChanged = useCallback(() => {
        gridRef.current?.api.setQuickFilter(
            inputRef.current?.value ?? ''
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
                    cellRenderer: UnlockedCheckboxCell,
                    width: 100,
                    minWidth: 100,
                    maxWidth: 100,
                },
                {
                    headerName: 'Rank',
                    editable: true,
                    cellRenderer: RankSelectorCell,
                    columnGroupShow: 'open',
                    width: 150,
                    minWidth: 150,
                    maxWidth: 150,
                    cellStyle: { padding: 0 }
                }
            ]
        },
    ]);

    const [rowsData] = useState(GlobalStoreService.characters);

    const getRowStyle = (params: RowClassParams<ICharacter>): RowStyle => {
        return { background: (params.node.rowIndex ?? 0) % 2 === 0 ? 'silver' : 'white' };
    };
    
    const saveChanges = () => {
        PersonalDataService.data.characters = rowsData.map(row => ({ 
            name: row.name, 
            unlocked: row.unlocked, 
            rank: row.rank,
            leSelection: row.leSelection
        }));
        PersonalDataService.save();
    };

    return (
        <div>
            <Typography variant="h5" component="div" sx={{ flexGrow: 1 }}>
                Who You Own
            </Typography>
            <div>
                <input
                    ref={inputRef}
                    type="text"
                    id="filter-text-box"
                    placeholder="Quick Filter..."
                    onInput={onFilterTextBoxChanged}
                />
            </div>
            <div className="ag-theme-material" style={{ height: 'calc(100vh - 100px)', width: '100%' }}>
                <AgGridReact
                    ref={gridRef}
                    suppressCellFocus={true}
                    defaultColDef={defaultColDef}
                    columnDefs={columnDefs}
                    rowData={rowsData}
                    rowHeight={40}
                    getRowStyle={getRowStyle}
                    onCellEditingStopped={saveChanges}
                    onGridReady={() => gridRef.current?.api.sizeColumnsToFit()}
                >
                </AgGridReact>
            </div>
        </div>
    );
};
export default WhoYouOwn;