import React, { useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { CellClassParams, ColDef, ITooltipParams, ValueGetterParams } from 'ag-grid-community';

import { ICharacter, ILegendaryEvent } from '../../models/interfaces';
import { Rank } from '../../models/enums';

const PointsTable = (props: { legendaryEvent: ILegendaryEvent }) => {
    const { legendaryEvent } = props;
    
    const gridRef = useRef<AgGridReact>(null);
    
    const columnsDef: Array<ColDef> = [
        {
            field: 'name',
            sortable: true,
            cellClass: (params: CellClassParams) => Rank[params.data?.rank]?.toLowerCase(),
            tooltipValueGetter: (params: ITooltipParams) => params.data?.name + ' - ' + Rank[params.data?.rank ?? 0]
        },
        {
            valueGetter: (params: ValueGetterParams) => (params.data as ICharacter).legendaryEvents[legendaryEvent.id].points, 
            headerName: 'Points',
            width: 100,
            sortable: true,
            sort: 'desc'
        },
        {
            valueGetter: (params: ValueGetterParams) => (params.data as ICharacter).legendaryEvents[legendaryEvent.id].slots,
            headerName: 'Slots',
            sortable: true,
        }
    ];


    const selectedCharsColumnsDef: Array<ColDef> = [
        {
            field: 'name',
            sortable: true,
            cellClass: (params: CellClassParams) => Rank[params.data?.rank]?.toLowerCase(),
            tooltipValueGetter: (params: ITooltipParams) => params.data?.name + ' - ' + Rank[params.data?.rank ?? 0]
        },
        {
            field: 'points',
            headerName: 'Points',
            sortable: true,
            width: 100,
            sort: 'desc'
        },
        {
            field: 'timesSelected',
            headerName: 'Times Selected',
            sortable: true,
        }
    ];
    
    const selectedChars = legendaryEvent.getSelectedCharactersPoints();


    return (
        <div style={{ display: 'flex', flexDirection: 'row' }}>
            <div className="ag-theme-material" style={{ height: 'calc(100vh - 100px)', width: '100%' }}>
                <AgGridReact
                    ref={gridRef}
                    tooltipShowDelay={100}
                    rowData={legendaryEvent.allowedUnits}
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
                    rowData={legendaryEvent.allowedUnits.filter(x => x.unlocked)}
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
                    rowData={selectedChars }
                    columnDefs={[
                        {
                            headerName: 'Selected Best characters',
                            children: selectedCharsColumnsDef,
                        },
                    ]}>
                </AgGridReact>
            </div>
        </div>
    );
};

export default PointsTable;