import React, { useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
    ICharacter,
    ILegendaryEvent
} from '../../store/static-data/interfaces';
import { CellClassParams, ColDef, ITooltipParams } from 'ag-grid-community';
import { Rank } from '../../store/personal-data/personal-data.interfaces';

const PointsTable = (props: { legendaryEvent: ILegendaryEvent, }) => {
    const { legendaryEvent } = props;
    
    const gridRef = useRef<AgGridReact>(null);

    const characters: ICharacter[] = legendaryEvent.getAllowedUnits();
    
    const charactersPoints = legendaryEvent.getCharactersPoints();
    characters.forEach(char => {
        char.lePoints = charactersPoints[char.name] ?? 0;
    });
    
    const columnsDef: Array<ColDef> = [
        {
            field: 'name',
            sortable: true,
            cellClass: (params: CellClassParams) => Rank[params.data?.rank]?.toLowerCase(),
            tooltipValueGetter: (params: ITooltipParams) => params.data?.name + ' - ' + Rank[params.data?.rank ?? 0]
        },
        {
            field: 'lePoints',
            headerName: 'Points',
            sortable: true,
            sort: 'desc'
        }
    ];

    return (
        <div>
            <div className="ag-theme-material" style={{ height: 'calc(100vh - 100px)', width: '100%' }}>
                <AgGridReact
                    ref={gridRef}
                    tooltipShowDelay={100}
                    rowData={characters}
                    columnDefs={columnsDef}>
                </AgGridReact>
            </div>
        </div>
    );
};

export default PointsTable;