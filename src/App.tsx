import React, { useState } from 'react';
import './App.css';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-material.css';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ColGroupDef, RowStyle, ValueFormatterParams } from 'ag-grid-community';
import ButtonAppBar from './AppBar/AppBar';
import { StaticDataUtils } from './static-data/static-data.utils';
import { UnitData } from './static-data/interfaces';
import { RowClassParams } from 'ag-grid-community/dist/lib/entities/gridOptions';
import { Alliance, DamageTypes, Traits } from './static-data/enums';
import { JainZarLegendaryEvent } from './static-data/legendary-events/jain-zar.le';
import { uniq } from 'lodash';


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


    const [columnDefs] = useState<Array<ColDef | ColGroupDef>>([
        { field: 'numberAdded', headerName: 'Number Added' },
        {
            headerName: 'Faction Details',
            children: [
                { field: 'name', headerName: 'Name' },
                { field: 'alliance', headerName: 'Alliance', columnGroupShow: 'open' },
                { field: 'faction', headerName: 'Faction', columnGroupShow: 'open' }
            ],
        },
        {
            headerName: 'Stats details',
            children: [
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
                    field: 'traits',
                    headerName: 'Traits',
                    valueFormatter: (params: ValueFormatterParams<UnitData, number>) => {
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
                { field: 'meleeHits', headerName: 'Melee Hits', columnGroupShow: 'open' },
                { field: 'rangeHits', headerName: 'Range Hits', columnGroupShow: 'open' },
                { field: 'rangeDistance', headerName: 'Range Distance', columnGroupShow: 'open' },
                { field: 'movement', headerName: 'Movement', columnGroupShow: 'open' }
            ]
        }

    ]);

    const le = new JainZarLegendaryEvent();
    const units = StaticDataUtils.unitsData.filter(le.alphaTrack.factionRestriction);
    const result = le.alphaTrack.unitsRestrictions.map(restriction => ({
        name: restriction.name,
        units: units.filter(restriction.restriction).map(u => u.name).sort()
    }));


    const row2 = [];
    const allUniqSorted = uniq(result.flatMap(r => r.units).sort());
    for (let i = 0; i < allUniqSorted.length; i++) {
        const row: Record<string, string> = {};
        result.forEach(rest => {
            row[rest.name] = rest.units.includes(allUniqSorted[i]) ? allUniqSorted[i] : '';
        });
        row2.push(row);
    }

    const colDef2 = result.map(u => ({
        field: u.name
    }));

    console.log(result);

    //
    //
    // const xenos = StaticDataUtils.unitsData.filter(u => u.alliance === Alliance.Xenos);
    // const physical = xenos.filter(u => (u.damageTypes & DamageTypes.Physical) === DamageTypes.Physical);
    // console.log(physical.map(x => x.name).sort());

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
            <h3>Jain Zair alpha</h3>
            <div className="ag-theme-material" style={{ height: 600, width: '100%' }}>
                <AgGridReact
                    rowData={row2}
                    columnDefs={colDef2}>
                </AgGridReact>
            </div>
        </div>

    );

};

export default App;
