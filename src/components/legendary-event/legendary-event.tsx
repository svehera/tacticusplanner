import React, { useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
    ICharacter,
    ILegendaryEvent, ILegendaryEventTrack,
    ILegendaryEventTrackRestriction,
    IUnitData
} from '../../store/static-data/interfaces';
import { CellClassParams, ColDef, ColGroupDef, ITooltipParams, ValueFormatterParams } from 'ag-grid-community';
import { Rank } from '../../store/personal-data/personal-data.interfaces';
import Button from '@mui/material/Button';

type IRow = Record<string, ICharacter | string>;
type LegendaryEventSection = '(Alpha)' | '(Beta)' | '(Gamma)';

const LegendaryEvent = (props: { input: ILegendaryEvent }) => {
    const gridRef = useRef<AgGridReact>(null);

    const legendaryEvent: ILegendaryEvent = props.input;

    const columnsDefs: Array<ColGroupDef<ICharacter | string>> = [
        {
            headerName: 'Alpha',
            headerClass: 'alpha',
            children: getSectionColumns(legendaryEvent.alphaTrack.unitsRestrictions, '(Alpha)'),
            openByDefault: true
        }, 
        {
            headerName: 'Beta',
            headerClass: 'beta',
            children: getSectionColumns(legendaryEvent.betaTrack.unitsRestrictions, '(Beta)'),
            openByDefault: true
        }, 
        {
            headerName: 'Gamma',
            headerClass: 'gamma',
            children: getSectionColumns(legendaryEvent.gammaTrack.unitsRestrictions, '(Gamma)'),
            openByDefault: true
        }
    ];
    
    const rows: Array<IRow> = getRows(legendaryEvent);

    return (
        <div>
            <Button onClick={() => gridRef.current?.api.sizeColumnsToFit()}>Fit To screen</Button>
            <div className="ag-theme-material" style={{ height: 'calc(100vh - 100px)', width: '100%' }}>
                <AgGridReact
                    ref={gridRef}
                    tooltipShowDelay={100}
                    rowData={rows}
                    columnDefs={columnsDefs}>
                </AgGridReact>
            </div>
        </div>
    );
};

function getSectionColumns(unitsRestrictions: ILegendaryEventTrackRestriction[], suffix: LegendaryEventSection): Array<ColDef> {
    return unitsRestrictions.map((u, index) => ({
        field: u.name + suffix,
        headerTooltip: u.name,
        columnGroupShow: index === 0 ? undefined : 'open',
        valueFormatter: (params: ValueFormatterParams) => typeof params.value === 'string' ? params.value : params.value?.name,
        cellClass: (params: CellClassParams) => typeof params.value === 'string' ? params.value : Rank[params.value?.rank]?.toLowerCase(),
        tooltipValueGetter: (params: ITooltipParams) => typeof params.value === 'string' ? params.value : params.value?.name + ' - ' + Rank[params.value?.rank ?? 0]
    }));
}

function getRows(legendaryEvent: ILegendaryEvent): Array<IRow> {
    const rows: Array<IRow> = [];
    const allowedUnits = legendaryEvent.getAllowedUnits();

    allowedUnits.forEach(unit => {
        const row: IRow = {};
        
        populateCells('(Alpha)', legendaryEvent.alphaTrack, unit, row);
        populateCells('(Beta)', legendaryEvent.betaTrack, unit, row);
        populateCells('(Gamma)', legendaryEvent.gammaTrack, unit, row);
        
        rows.push(row);
    });
    
    return rows;
}

function populateCells(suffix: LegendaryEventSection, section: ILegendaryEventTrack, character: ICharacter, row: IRow): void {
    section.unitsRestrictions.forEach(re => {
        row[re.name + suffix] = re.units.some(u => u.name === character.name) ? character : '';
    });
}

export default LegendaryEvent;