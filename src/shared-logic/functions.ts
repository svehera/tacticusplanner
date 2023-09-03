import React from 'react';
import { AgGridReact } from 'ag-grid-react';

export const fitGridOnWindowResize = (gridRef: React.RefObject<AgGridReact>) => {
    function handleResize() {
        gridRef.current?.api.sizeColumnsToFit();
    }

    React.useEffect(() => {


        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);

        };
    });

    return handleResize;
};