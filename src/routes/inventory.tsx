import React, { useContext, useMemo, useState } from 'react';

import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';

import { FormControl, MenuItem, Select, TextField } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import { StaticDataService } from '../services';
import { Rarity } from '../models/enums';
import { DispatchContext, StoreContext } from '../reducers/store.provider';
import { orderBy } from 'lodash';
import { CellEditingStoppedEvent } from 'ag-grid-community/dist/lib/events';

type Selection = 'Craftable' | 'Non Craftable';

interface ITableRow {
    material: string;
    rarity: Rarity;
    craftable: boolean;
    stat: string | 'Health' | 'Damage' | 'Armour' | 'Shard';
    quantity: number;
}

export const Inventory = () => {
    const dispatch = useContext(DispatchContext);
    const { inventory } = useContext(StoreContext);

    const selectionOptions: Selection[] = ['Craftable', 'Non Craftable'];

    const [nameFilter, setNameFilter] = useState<string>('');
    const [selection, setSelection] = useState<Selection>('Non Craftable');

    const columnDefs = useMemo<Array<ColDef<ITableRow>>>(() => {
        return [
            {
                headerName: '#',
                colId: 'rowNumber',
                valueGetter: params => (params.node?.rowIndex ?? 0) + 1,
                maxWidth: 60,
                width: 60,
                minWidth: 60,
                sortable: false,
            },
            {
                field: 'material',
                headerName: 'Upgrade',
                minWidth: 200,
            },
            {
                field: 'rarity',
                headerName: 'Rarity',
                maxWidth: 150,
                width: 150,
                minWidth: 150,
                valueFormatter: params => Rarity[params.data?.rarity ?? 1],
            },
            {
                field: 'quantity',
                headerName: 'Quantity',
                editable: true,
                cellEditorPopup: false,
                cellDataType: 'number',
                cellEditor: 'agNumberCellEditor',
                cellEditorParams: {
                    min: 0,
                    max: 100,
                    precision: 0,
                },
                maxWidth: 150,
                width: 150,
                minWidth: 150,
            },
        ];
    }, [selection]);

    const allRows = useMemo<ITableRow[]>(() => {
        return orderBy(
            Object.values(StaticDataService.recipeData).map(x => ({
                material: x.material,
                rarity: Rarity[x.rarity as unknown as number] as unknown as Rarity,
                craftable: x.craftable,
                stat: x.stat,
                quantity: inventory.upgrades[x.material] ?? 0,
            })),
            ['quantity', 'rarity', 'material'],
            ['desc', 'desc', 'asc']
        );
    }, []);

    const rows = useMemo(() => {
        return allRows
            .filter(upgrade => upgrade.material.toLowerCase().includes(nameFilter.toLowerCase()))
            .filter(upgrade => {
                switch (selection) {
                    case 'Craftable': {
                        return upgrade.craftable && upgrade.stat !== 'Shard';
                    }
                    case 'Non Craftable': {
                        return !upgrade.craftable && upgrade.stat !== 'Shard';
                    }
                }
            });
    }, [selection, nameFilter]);

    const saveChanges = (event: CellEditingStoppedEvent<ITableRow>): void => {
        if (event.data && event.newValue !== event.oldValue) {
            dispatch.inventory({
                type: 'UpdateUpgradeQuantity',
                upgrade: event.data.material,
                value: event.data.quantity,
            });
        }
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
                    singleClickEdit={true}
                    defaultColDef={{ sortable: true, autoHeight: true, wrapText: true }}
                    columnDefs={columnDefs}
                    onCellEditingStopped={saveChanges}
                    rowData={rows}></AgGridReact>
            </div>
        </div>
    );
};
