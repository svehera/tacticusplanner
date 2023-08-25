import React from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ICharacter } from '../../store/static-data/interfaces';
import { CellClassParams, ColDef, ITooltipParams, ValueGetterParams } from 'ag-grid-community';
import { LegendaryEvents, Rank } from '../../store/personal-data/personal-data.interfaces';
import { sum } from 'lodash';

const OverallPointsTable = (props: { characters: ICharacter[], selectedChars: Array<any> }) => {
    const { characters } = props;
    
    const columnsDef: Array<ColDef> = [
        {
            field: 'name',
            sortable: true,
            cellClass: (params: CellClassParams) => Rank[params.data?.rank]?.toLowerCase(),
            tooltipValueGetter: (params: ITooltipParams) => params.data?.name + ' - ' + Rank[params.data?.rank ?? 0]
        },
        {
            valueGetter: (params: ValueGetterParams) => sum(Object.values((params.data as ICharacter).legendaryEvents).map(x => x.points)), 
            headerName: 'Points',
            width: 100,
            sortable: true,
            sort: 'desc'
        },
        {
            valueGetter: (params: ValueGetterParams) => sum(Object.values((params.data as ICharacter).legendaryEvents).map(x => x.slots)),
            headerName: 'Slots',
            sortable: true,
        }
    ];
    const columnsDef2: Array<ColDef> = [
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

    return (
        <div style={{ display: 'flex', flexDirection: 'row' }}>
            <div className="ag-theme-material" style={{ height: 'calc(100vh - 100px)', width: '100%' }}>
                <AgGridReact
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
                    tooltipShowDelay={100}
                    overlayNoRowsTemplate={'Select characters on Event Details'}
                    rowData={props.selectedChars}
                    columnDefs={[
                        {
                            headerName: 'Selected Best characters',
                            children: columnsDef2,
                        },
                    ]}>
                </AgGridReact>
            </div>
        </div>
    );
};

export default OverallPointsTable;