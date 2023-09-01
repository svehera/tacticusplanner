import React, { useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ColGroupDef, RowStyle } from 'ag-grid-community';
import { RowClassParams } from 'ag-grid-community/dist/lib/entities/gridOptions';
import Typography from '@mui/material/Typography';
import { Link } from 'react-router-dom';
import { ICharacter } from '../../models/interfaces';
import { StaticDataService } from '../../services';
import { isMobile } from 'react-device-detect';

export const DirtyDozen = () => {
    const gridRef = useRef<AgGridReact<ICharacter>>(null);
    
    const defaultColDef: ColDef<ICharacter> = {
        sortable: true,
    };
    
    const [columnDefs] = useState<Array<ColDef | ColGroupDef>>([
        {
            field: 'Rank',
            headerName: 'Rank',
            width: 100,
            maxWidth: 100
        },       
        {
            field: 'Name',
            headerName: 'Name',
            width: 150,
        },
        {
            field: 'Pvp',
            headerName: 'PvP',
            width: 100,
        },
        {
            field: 'GRTyranid',
            headerName: 'GR Tyranid',
            width: 100,
        },
        {
            field: 'GRNecron',
            headerName: 'GR Necron',
            width: 100,
        },
        {
            field: 'GROrk',
            headerName: 'GR Ork',
            width: 100,
        },  
        {
            field: 'GRMortarion',
            headerName: 'GR Mortarion',
            width: 100,
        },
    ]);

    const [rowsData] = useState(StaticDataService.dirtyDozenData);

    const getRowStyle = (params: RowClassParams): RowStyle => {
        return { background: (params.node.rowIndex ?? 0) % 2 === 0 ? 'lightsteelblue' : 'white' };
    };

    React.useEffect(() => {
        function handleResize() {
            if (window.innerWidth >= 768) {
                gridRef.current?.api.sizeColumnsToFit();
            }
        }

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);

        };
    });

    return (
        <div>
            <Typography variant="h5" component="div" sx={{ flexGrow: 1 }}>
                Dirty Dozen - Based on <Link to={'https://tacticus.fandom.com/wiki/Infographics#Dirty_Dozen_Series'} target={'_blank'}>Nandi&apos;s infographics </Link> (July 2023) 
            </Typography>

            <div className="ag-theme-material" style={{ height: 'calc(100vh - 130px)', width: '100%' }}>
                <AgGridReact
                    ref={gridRef}
                    suppressCellFocus={true}
                    defaultColDef={defaultColDef}
                    columnDefs={columnDefs}
                    rowData={rowsData}
                    getRowStyle={getRowStyle}
                    onGridReady={() => !isMobile ? gridRef.current?.api.sizeColumnsToFit() : undefined}
                >
                </AgGridReact>
            </div>
        </div>
    );
};
