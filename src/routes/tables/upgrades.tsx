import React, { useMemo, useRef, useState } from 'react';

import { AgGridReact } from 'ag-grid-react';
import { ColDef, RowStyle, RowClassParams, ValueFormatterParams } from 'ag-grid-community';

import { IMaterial } from '../../models/interfaces';
import { StaticDataService } from '../../services';
import { fitGridOnWindowResize } from '../../shared-logic/functions';
import { FormControl, MenuItem, Select, TextField } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';

type Selection = 'Craftable' | 'Non Craftable' | 'Shards';

export const Upgrades = () => {
    const selectionOptions: Selection[] = ['Craftable', 'Non Craftable', 'Shards'];
    const gridRef = useRef<AgGridReact<IMaterial>>(null);

    const [nameFilter, setNameFilter] = useState<string>('');
    const [selection, setSelection] = useState<Selection>('Non Craftable');

    const columnDefs = useMemo<Array<ColDef>>(() => {
        const base: Array<ColDef> = [
            {
                headerName: '#',
                colId: 'rowNumber',
                valueGetter: params => (params.node?.rowIndex ?? 0) + 1,
                maxWidth: 70,
                width: 70,
                minWidth: 70,
                pinned: true,
            },
            {
                field: 'material',
                headerName: 'Upgrade',
                minWidth: 200,
            },
        ];

        switch (selection) {
            case 'Non Craftable': {
                return [
                    ...base,
                    {
                        field: 'rarity',
                        headerName: 'Rarity',
                        maxWidth: 150,
                        width: 150,
                        minWidth: 150,
                    },
                    {
                        field: 'stat',
                        headerName: 'Type',
                        maxWidth: 150,
                        width: 150,
                        minWidth: 150,
                    },
                    {
                        field: 'faction',
                        headerName: 'Faction',
                        maxWidth: 150,
                        width: 150,
                        minWidth: 150,
                    },
                    {
                        field: 'locations',
                        headerName: 'Locations',
                        minWidth: 150,
                    },
                ];
            }
            case 'Craftable': {
                return [
                    ...base,
                    {
                        field: 'rarity',
                        headerName: 'Rarity',
                        maxWidth: 150,
                        width: 150,
                        minWidth: 150,
                    },
                    {
                        field: 'stat',
                        headerName: 'Type',
                        maxWidth: 150,
                        width: 150,
                        minWidth: 150,
                    },
                    {
                        field: 'faction',
                        headerName: 'Faction',
                        maxWidth: 150,
                        width: 150,
                        minWidth: 150,
                    },
                    {
                        field: 'recipe',
                        headerName: 'Recipe',
                        minWidth: 150,
                        valueFormatter: (params: ValueFormatterParams<IMaterial>) => {
                            const value = params.data;
                            if (value && value.recipe) {
                                return value.recipe.map(x => x.material + ' - ' + x.count).join('\r\n');
                            }

                            return '';
                        },
                    },
                ];
            }

            case 'Shards': {
                return [
                    ...base,
                    {
                        field: 'stat',
                        headerName: 'Type',
                        maxWidth: 150,
                        width: 150,
                        minWidth: 150,
                    },
                    {
                        field: 'faction',
                        headerName: 'Faction',
                        maxWidth: 150,
                        width: 150,
                        minWidth: 150,
                    },
                    {
                        field: 'locations',
                        headerName: 'Locations',
                        minWidth: 150,
                    },
                ];
            }
        }
    }, [selection]);

    const rows = useMemo(() => {
        return Object.values(StaticDataService.recipeData)
            .filter(upgrade => upgrade.material.toLowerCase().includes(nameFilter.toLowerCase()))
            .filter(upgrade => {
                switch (selection) {
                    case 'Craftable': {
                        return upgrade.craftable && upgrade.stat !== 'Shard';
                    }
                    case 'Non Craftable': {
                        return !upgrade.craftable && upgrade.stat !== 'Shard';
                    }
                    case 'Shards': {
                        return upgrade.stat === 'Shard';
                    }
                }
            });
    }, [selection, nameFilter]);

    const getRowStyle = (params: RowClassParams<IMaterial>): RowStyle => {
        return { background: (params.node.rowIndex ?? 0) % 2 === 0 ? 'lightsteelblue' : 'white' };
    };

    return (
        <div>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    margin: '0 20px',
                }}>
                <TextField
                    label="Quick Filter"
                    variant="outlined"
                    onChange={change => setNameFilter(change.target.value)}
                />
                <FormControl style={{ width: 250, margin: 20 }}>
                    <InputLabel>Selection</InputLabel>
                    <Select
                        label={'Selection'}
                        value={selection}
                        onChange={event => setSelection(event.target.value as Selection)}>
                        {selectionOptions.map(value => (
                            <MenuItem key={value} value={value}>
                                {value}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </div>

            <div className="ag-theme-material" style={{ height: 'calc(100vh - 220px)', width: '100%' }}>
                <AgGridReact
                    key={selection}
                    ref={gridRef}
                    suppressCellFocus={true}
                    defaultColDef={{ resizable: true, sortable: true, autoHeight: true, wrapText: true }}
                    columnDefs={columnDefs}
                    rowData={rows}
                    getRowStyle={getRowStyle}
                    onGridReady={fitGridOnWindowResize(gridRef)}></AgGridReact>
            </div>
        </div>
    );
};
