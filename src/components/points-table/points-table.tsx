import React, { useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ICharacter, ILegendaryEvent } from '../../store/static-data/interfaces';
import { CellClassParams, ColDef, ITooltipParams } from 'ag-grid-community';
import { LegendaryEvents, Rank } from '../../store/personal-data/personal-data.interfaces';

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
        <div style={{ display: 'flex', flexDirection: 'row' }}>
            <div className="ag-theme-material" style={{ height: 'calc(100vh - 100px)', width: '100%' }}>
                <AgGridReact
                    ref={gridRef}
                    tooltipShowDelay={100}
                    rowData={characters}
                    columnDefs={ [
                        {
                            headerName: 'Best characters overall',
                            children: columnsDef,
                        }
                       
                    ]}>
                </AgGridReact>
            </div>
            <div className="ag-theme-material" style={{ height: 'calc(100vh - 100px)', width: '100%' }}>
                <AgGridReact
                    ref={gridRef}
                    tooltipShowDelay={100}
                    rowData={characters.filter(x => x.unlocked)}
                    columnDefs={[

                        {
                            headerName: 'Your Best characters',
                            children: columnsDef,
                        }
                   
                    ]}>
                </AgGridReact>
            </div>
            <div className="ag-theme-material" style={{ height: 'calc(100vh - 100px)', width: '100%' }}>
                <AgGridReact
                    ref={gridRef}
                    tooltipShowDelay={100}
                    rowData={characters.filter(x => (x.leSelection & LegendaryEvents.JainZar) === LegendaryEvents.JainZar)}
                    columnDefs={[
                        {
                            headerName: 'Selected Best characters',
                            children: columnsDef,
                        },
                    ]}>
                </AgGridReact>
            </div>
        </div>
    );
};

export default PointsTable;