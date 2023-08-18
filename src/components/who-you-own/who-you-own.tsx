import React, { useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ColGroupDef, RowStyle, ValueFormatterParams } from 'ag-grid-community';
import { RowClassParams } from 'ag-grid-community/dist/lib/entities/gridOptions';
import { ICharacter } from '../../store/static-data/interfaces';
import GlobalStoreService from '../../store/global-store.service';
import { DamageTypes, Traits } from '../../store/static-data/enums';
import { PersonalDataService } from '../../store/personal-data/personal-data.service';
import RankSelectorCell from '../rank-selector-cell/rank-selector-cell';
import UnlockedCheckboxCell from '../unlocked-checkbox-cell/unlocked-checkbox-cell';
import Typography from '@mui/material/Typography';

type EnumLike<T> = Record<string, T>

const WhoYouOwn = () => {
    const gridRef = useRef<AgGridReact<ICharacter>>(null);
    
    const defaultColDef: ColDef<ICharacter> = {
        sortable: true
    };
    
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
        {
            headerName: 'Stats details',
            openByDefault: true,
            children: [
                {
                    field: 'damageTypes',
                    headerName: 'Damage Types',
                    valueFormatter: convertEnumValuesToString(DamageTypes as unknown as EnumLike<number>)
                },
                {
                    field: 'traits',
                    headerName: 'Traits',
                    valueFormatter: convertEnumValuesToString(Traits as unknown as EnumLike<number>)
                },
                { 
                    field: 'meleeHits',
                    headerName: 'Melee Hits', 
                    columnGroupShow: 'open', 
                    width: 120, 
                    minWidth: 120, 
                    maxWidth: 120, 
                },
                { 
                    field: 'rangeHits', 
                    headerName: 'Range Hits', 
                    columnGroupShow: 'open', 
                    width: 120,
                    minWidth: 120,
                    maxWidth: 120,
                },
                { 
                    field: 'rangeDistance', 
                    headerName: 'Range', 
                    columnGroupShow: 'open',
                    width: 120,
                    minWidth: 120,
                    maxWidth: 120,
                },
                { 
                    field: 'movement', 
                    headerName: 'Movement', 
                    columnGroupShow: 'open',
                    width: 120,
                    minWidth: 120,
                    maxWidth: 120,
                }
            ],
        }

    ]);

    const [rowsData] = useState(GlobalStoreService.characters);

    const getRowStyle = (params: RowClassParams<ICharacter>): RowStyle => {
        return { background: (params.node.rowIndex ?? 0) % 2 === 0 ? 'silver' : 'white' };
    };
    
    const saveChanges = () => {
        PersonalDataService.data.characters = rowsData.map(row => ({ name: row.name, unlocked: row.unlocked, rank: row.rank! }));
        PersonalDataService.save();
    };

    return (
        <div>
            <Typography variant="h5" component="div" sx={{ flexGrow: 1 }}>
                Who You Own
            </Typography>
            <div className="ag-theme-material" style={{ height: 'calc(100vh - 100px)', width: '100%' }}>
                <AgGridReact
                    ref={gridRef}
                    suppressCellFocus={true}
                    defaultColDef={defaultColDef}
                    columnDefs={columnDefs}
                    rowData={rowsData}
                    getRowStyle={getRowStyle}
                    onCellEditingStopped={saveChanges}
                    onGridReady={() => gridRef.current?.api.sizeColumnsToFit()}
                >
                </AgGridReact>
            </div>
        </div>
    );
};

function convertEnumValuesToString (
    damageTypesEnum: EnumLike<number>
) {
    return  (
        params: ValueFormatterParams<ICharacter, number>
    ): string => {
        const typeNames: string[] = [];
        const value = params.value ?? 0;

        for (const key in damageTypesEnum) {
            if (typeof damageTypesEnum[key] === 'number' && value & damageTypesEnum[key]) {
                typeNames.push(key);
            }
        }

        return typeNames.join(', ');
    };
}

export default WhoYouOwn;