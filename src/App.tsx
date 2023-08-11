import React, { useState } from 'react';
import './App.css';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-material.css';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, RowStyle, ValueFormatterParams } from 'ag-grid-community';
import ButtonAppBar from './AppBar/AppBar';
import { StaticDataUtils } from './static-data/static-data.utils';
import { UnitData } from './static-data/interfaces';
import { RowClassParams } from 'ag-grid-community/dist/lib/entities/gridOptions';
import { DamageTypes, Traits } from './static-data/enums';


const App = () => {

    const [rowData] = useState(StaticDataUtils.unitsData);

    const columnDef: ColDef<UnitData> = {
        sortable: true,
        resizable: true
    };

    const getRowStyle = (params: RowClassParams<UnitData>): RowStyle => {
        const unitData = params.data;

        return { background: unitData?.factionColor ?? '#fff' };
    };


    const [columnDefs] = useState<Array<ColDef>>([
        { field: 'alliance', headerName: 'Alliance' },
        { field: 'faction', headerName: 'Faction' },
        { field: 'name', headerName: 'Name', pinned: true },
        { field: 'numberAdded', headerName: 'Number Added' },
        {
            field: 'damageTypes',
            headerName: 'Damage Types',
            valueFormatter: (params: ValueFormatterParams<UnitData, number>) => {
                const typeNames: string[] = [];
                const value = params.value ?? 0;

                for (const key in DamageTypes) {
                    if (typeof DamageTypes[key] === 'number' && value & DamageTypes[key] as any) {
                        typeNames.push(key);
                    }
                }

                return typeNames.join(', ');
            }
        },
        {
            field: 'traits', headerName: 'Traits', valueFormatter: (params: ValueFormatterParams<UnitData, number>) => {
                const typeNames: string[] = [];
                const value = params.value ?? 0;
                for (const key in Traits) {
                    if (typeof Traits[key] === 'number' && value & Traits[key] as any) {
                        typeNames.push(key);
                    }
                }

                return typeNames.join(', ');
            }
        },
        { field: 'meleeHits', headerName: 'Melee Hits' },
        { field: 'rangeHits', headerName: 'Range Hits' },
        { field: 'rangeDistance', headerName: 'Range Distance' },
        { field: 'movement', headerName: 'Movement' }
    ]);

    return (
        <div>
            <ButtonAppBar></ButtonAppBar>
            <div className="ag-theme-material" style={{ height: 600, width: '100%' }}>
                <AgGridReact
                    defaultColDef={columnDef}
                    getRowStyle={getRowStyle}
                    rowData={rowData}
                    columnDefs={columnDefs}>
                </AgGridReact>
            </div>
        </div>

    );
};

export default App;
