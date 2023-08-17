import React from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ILegendaryEvent, IUnitData } from '../../store/static-data/interfaces';
import { CellClassParams, ColDef, ColGroupDef, ITooltipParams, ValueFormatterParams } from 'ag-grid-community';
import { Rank } from '../../store/personal-data/personal-data.interfaces';

const LegendaryEvent = (props: { input: ILegendaryEvent}) => {
    const legendaryEvent: ILegendaryEvent = props.input;
    
    const row2: Array<Record<string, IUnitData | string>> = [];
    const allUniqSorted = legendaryEvent.getAllowedUnits();

    for (let i = 0; i < allUniqSorted.length; i++) {
        const row: Record<string, IUnitData | string> = {};
        legendaryEvent.alphaTrack.unitsRestrictions.forEach(re => {
            row[re.name + '(Alpha)'] = re.units.some(u => u.name === allUniqSorted[i].name) ? allUniqSorted[i] : '';
        });
        legendaryEvent.betaTrack.unitsRestrictions.forEach(re => {
            row[re.name + '(Beta)'] = re.units.some(u => u.name === allUniqSorted[i].name) ? allUniqSorted[i] : '';
        });
        legendaryEvent.gammaTrack.unitsRestrictions.forEach(re => {
            row[re.name + '(Gamma)'] = re.units.some(u => u.name === allUniqSorted[i].name) ? allUniqSorted[i] : '';
        });
        row2.push(row);
    }

    const alphaCols: Array<ColDef> = legendaryEvent.alphaTrack.unitsRestrictions.map((u, index) => ({
        field: u.name + '(Alpha)',
        valueFormatter: (params: ValueFormatterParams) => typeof params.value === 'string' ? params.value : params.value?.name,
        cellClass: (params: CellClassParams) => typeof params.value === 'string' ? params.value : Rank[params.value?.rank]?.toLowerCase(),
        columnGroupShow: index === 0 ? undefined : 'open',
        tooltipValueGetter: (params: ITooltipParams) =>  typeof params.value === 'string' ? params.value : Rank[params.value?.rank],
    }));

    const betaCols: Array<ColDef> = legendaryEvent.betaTrack.unitsRestrictions.map((u, index) => ({
        field: u.name + '(Beta)',
        valueFormatter: (params: ValueFormatterParams) => typeof params.value === 'string' ? params.value : params.value?.name,
        cellClass: (params: CellClassParams) => typeof params.value === 'string' ? params.value : Rank[params.value?.rank]?.toLowerCase(),
        columnGroupShow: index === 0 ? undefined : 'open',
        tooltipValueGetter: (params: ITooltipParams) =>  typeof params.value === 'string' ? params.value : Rank[params.value?.rank]
    }));

    const gammaCols: Array<ColDef> = legendaryEvent.gammaTrack.unitsRestrictions.map((u, index) => ({
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
    
    return (
        <div className="ag-theme-material" style={{ height: 600, width: '100%' }}>
            <AgGridReact
                tooltipShowDelay={100}
                rowData={row2}
                columnDefs={coldd}>
            </AgGridReact>
        </div>
    );
};

export default LegendaryEvent;