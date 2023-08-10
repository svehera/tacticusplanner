import React, { useState } from 'react';
import './App.css';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-material.css';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import ButtonAppBar from './AppBar/AppBar';


const App = () => {
    
    const [rowData] = useState([
        { make: 'Toyota', model: 'Celica', price: 35000 },
        { make: 'Ford', model: 'Mondeo', price: 32000 },
        { make: 'Ford', model: 'Mondeo', price: 32000 },
        { make: 'Porsche', model: 'Boxster', price: 72000 }
    ]);

    const [columnDefs] = useState<Array<ColDef>>([
        { field: 'make' },
        { field: 'model' },
        { field: 'price' }
    ]);

    return (
        <div>
            <ButtonAppBar></ButtonAppBar>
            <div className="ag-theme-material" style={{ height: 400, width: 600 }}>
                <AgGridReact
                    rowData={rowData}
                    columnDefs={columnDefs}>
                </AgGridReact>
            </div>
        </div>
    );
};

export default App;
