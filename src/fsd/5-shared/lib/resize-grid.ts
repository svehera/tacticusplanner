import { AgGridReact } from 'ag-grid-react';
import React from 'react';
import { isMobile } from 'react-device-detect';

export const useFitGridOnWindowResize = (gridReference: React.RefObject<AgGridReact | null>) => {
    function handleResize() {
        gridReference.current?.api.sizeColumnsToFit();
    }

    React.useEffect(() => {
        if (isMobile) {
            return;
        }
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    });

    return handleResize;
};
