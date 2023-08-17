import React, { useCallback, useRef, useState } from 'react';
import './App.css';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-material.css';
import { AgGridReact } from 'ag-grid-react';
import { CellClassParams, ColDef, ColGroupDef, ITooltipParams, RowStyle, ValueFormatterParams } from 'ag-grid-community';
import ButtonAppBar from './AppBar/AppBar';
import { StaticDataUtils } from './static-data/static-data.utils';
import { UnitData } from './static-data/interfaces';
import { RowClassParams } from 'ag-grid-community/dist/lib/entities/gridOptions';
import { Alliance, DamageTypes, Traits } from './static-data/enums';
import { JainZarLegendaryEvent } from './static-data/legendary-events/jain-zar.le';
import { uniq } from 'lodash';
import { DropdownCell } from './dropdown-cell/dropdown-cell';
import { PersonalDataService } from './personal-data/personal-data.service';
import Button from '@mui/material/Button';
import { PersonalCharacterData, Rank } from './personal-data/personal-data.interfaces';


const App = () => {
    PersonalDataService.init();

    const [staticUnitData] = useState(StaticDataUtils.unitsData);
    const [personalUnitData] = useState(PersonalDataService.data);
    const rowsData: Array<UnitData & Partial<PersonalCharacterData>> = staticUnitData.map(staticData => {
        const personalData = personalUnitData.characters.find(c => c.name === staticData.name);
        return personalData ? { ...staticData, ...personalData } : staticData;
    });

    const columnDef: ColDef<UnitData> = {
        sortable: true,
        resizable: true,
        filter: 'agTextColumnFilter',
        menuTabs: ['filterMenuTab'],
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
            headerName: 'Owner data',
            children: [
                {
                    field: 'unlocked',
                    headerName: 'Unlocked',
                    editable: true,
                    cellRenderer: 'agCheckboxCellRenderer',
                    cellEditor: 'agCheckboxCellEditor',
                },
                {
                    field: 'rarity',
                    headerName: 'Rarity',
                    cellRenderer: DropdownCell,
                    cellRendererParams: {
                        options: ['1', '2']
                    },
                    columnGroupShow: 'open',
                }
            ]
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

    const onCellEditRequest = useCallback((event: any) => {
        console.log(staticUnitData);
        console.log('onCellEditRequest, new value = ' + event);
    }, []);

    const le = new JainZarLegendaryEvent(rowsData);

    const row2: Array<Record<string, UnitData | string>> = [];
    const allUniqSorted = le.getAllowedUnits();

    for (let i = 0; i < allUniqSorted.length; i++) {
        const row: Record<string, UnitData | string> = {};
        le.alphaTrack.unitsRestrictions.forEach(re => {
            row[re.name + '(Alpha)'] = re.units.some(u => u.name === allUniqSorted[i].name) ? allUniqSorted[i] : '';
        });
        le.betaTrack.unitsRestrictions.forEach(re => {
            row[re.name + '(Beta)'] = re.units.some(u => u.name === allUniqSorted[i].name) ? allUniqSorted[i] : '';
        });
        le.gammaTrack.unitsRestrictions.forEach(re => {
            row[re.name + '(Gamma)'] = re.units.some(u => u.name === allUniqSorted[i].name) ? allUniqSorted[i] : '';
        });
        row2.push(row);
    }

    const alphaCols: Array<ColDef> = le.alphaTrack.unitsRestrictions.map((u, index) => ({
        field: u.name + '(Alpha)',
        valueFormatter: (params: ValueFormatterParams) => typeof params.value === 'string' ? params.value : params.value?.name,
        cellClass: (params: CellClassParams) => typeof params.value === 'string' ? params.value : Rank[params.value?.rank]?.toLowerCase(),
        columnGroupShow: index === 0 ? undefined : 'open',
        tooltipValueGetter: (params: ITooltipParams) =>  typeof params.value === 'string' ? params.value : Rank[params.value?.rank],
    }));

    const betaCols: Array<ColDef> = le.betaTrack.unitsRestrictions.map((u, index) => ({
        field: u.name + '(Beta)',
        valueFormatter: (params: ValueFormatterParams) => typeof params.value === 'string' ? params.value : params.value?.name,
        cellClass: (params: CellClassParams) => typeof params.value === 'string' ? params.value : Rank[params.value?.rank]?.toLowerCase(),
        columnGroupShow: index === 0 ? undefined : 'open',
        tooltipValueGetter: (params: ITooltipParams) =>  typeof params.value === 'string' ? params.value : Rank[params.value?.rank]
    }));

    const gammaCols: Array<ColDef> = le.gammaTrack.unitsRestrictions.map((u, index) => ({
        field: u.name + '(Gamma)',
        valueFormatter: (params: ValueFormatterParams) => typeof params.value === 'string' ? params.value : params.value?.name,
        cellClass: (params: CellClassParams) => typeof params.value === 'string' ? params.value : Rank[params.value?.rank]?.toLowerCase(),
        columnGroupShow: index === 0 ? undefined : 'open',
        tooltipValueGetter: (params: ITooltipParams) =>  typeof params.value === 'string' ? params.value : Rank[params.value?.rank]
    }));

    const coldd: Array<ColGroupDef> = [{
        headerName: 'Alpha',
        headerClass: 'alpha',
        children: alphaCols,
        
    }, {
        headerName: 'Beta',
        headerClass: 'beta',
        children: betaCols
    }, {
        headerName: 'Gamma',
        headerClass: 'gamma',
        children: gammaCols
    }];

    const saveChanges = () => {
        PersonalDataService.data.characters = rowsData.map(row => ({ name: row.name, unlocked: row.unlocked, rank: row.rank! }));
        PersonalDataService.save();
    };

    return (
        <div>
            <ButtonAppBar></ButtonAppBar>
            <Button onClick={saveChanges}>Save</Button>
            <div className="ag-theme-material" style={{ height: 600, width: '100%' }}>
                <AgGridReact
                    suppressCellFocus={true}
                    defaultColDef={columnDef}
                    onCellClicked={onCellEditRequest}
                    getRowStyle={getRowStyle}
                    rowData={rowsData}
                    columnDefs={columnDefs}>
                </AgGridReact>
            </div>
            <h3>Jain Zair alpha</h3>
            <div className="ag-theme-material" style={{ height: 600, width: '100%' }}>
                <AgGridReact
                    tooltipShowDelay={100}
                    rowData={row2}
                    columnDefs={coldd}>
                </AgGridReact>
            </div>
        </div>

    );

};

export default App;
