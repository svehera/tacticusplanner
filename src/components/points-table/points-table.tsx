import React, { useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ICharacter, ILegendaryEvent } from '../../store/static-data/interfaces';
import { CellClassParams, ColDef, ITooltipParams, ValueGetterParams } from 'ag-grid-community';
import { LegendaryEvents, Rank } from '../../store/personal-data/personal-data.interfaces';

const PointsTable = (props: { legendaryEvent: ILegendaryEvent, }) => {
    const { legendaryEvent } = props;
    
    const gridRef = useRef<AgGridReact>(null);

    const characters: ICharacter[] = legendaryEvent.getAllowedUnits();
    
    const columnsDef: Array<ColDef> = [
        {
            field: 'name',
            sortable: true,
            cellClass: (params: CellClassParams) => Rank[params.data?.rank]?.toLowerCase(),
            tooltipValueGetter: (params: ITooltipParams) => params.data?.name + ' - ' + Rank[params.data?.rank ?? 0]
        },
        {
            valueGetter: (params: ValueGetterParams) => (params.data as ICharacter).legendaryEventPoints[legendaryEvent.id], 
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
                    overlayNoRowsTemplate={'Select characters on Event Details'}
                    rowData={characters.filter(x => (x.leSelection & legendaryEvent.id) === legendaryEvent.id)}
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