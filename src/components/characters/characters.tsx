import React, { useCallback, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ColGroupDef, RowStyle, ValueFormatterParams } from 'ag-grid-community';
import { RowClassParams } from 'ag-grid-community/dist/lib/entities/gridOptions';
import { ICharacter } from '../../store/static-data/interfaces';
import GlobalStoreService from '../../store/global-store.service';
import { DamageTypes, Traits, Traits2 } from '../../store/static-data/enums';
import Typography from '@mui/material/Typography';

type EnumLike<T> = Record<string, T>

const Characters = () => {
    const gridRef = useRef<AgGridReact<ICharacter>>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    
    const defaultColDef: ColDef<ICharacter> = {
        sortable: true,
        resizable: true,
        autoHeight: true,
        wrapText: true,
    };
    
    const [columnDefs] = useState<Array<ColDef | ColGroupDef>>([
        {
            field: 'name',
            headerName: 'Name',
            pinned: true,
            minWidth: 200,
        },
        {
            field: 'alliance',
            headerName: 'Alliance',
            minWidth: 100,
        },
        {
            field: 'faction',
            headerName: 'Faction',
            minWidth: 170,
        },
        {
            field: 'meleeDamage',
            headerName: 'Melee Damage Type',
            valueFormatter: convertDamageTypesToString,
            getQuickFilterText: convertDamageTypesToString,
            minWidth: 170,
        },
        {
            field: 'rangeDamage',
            headerName: 'Range Damage Type',
            valueFormatter: convertDamageTypesToString,
            getQuickFilterText: convertDamageTypesToString,
            minWidth: 170,
        },
        {
            field: 'abilitiesDamage',
            headerName: 'Abilities Damage Types',
            valueFormatter: convertDamageTypesToString,
            getQuickFilterText: convertDamageTypesToString,
            minWidth: 170,
        },
        {
            field: 'traits',
            headerName: 'Traits',
            valueFormatter: convertTraitsEnumToString,
            getQuickFilterText: convertTraitsEnumToString,
            minWidth: 200
        },
        {
            field: 'meleeHits',
            headerName: 'Melee Hits',
            minWidth: 100,
        },
        {
            field: 'rangeHits',
            headerName: 'Range Hits',
            minWidth: 100,
        },
        {
            field: 'rangeDistance',
            headerName: 'Range',
            minWidth: 100,
        },
        {
            field: 'movement',
            headerName: 'Movement',
            minWidth: 100,
        },
        {
            field: 'health',
            headerName: 'Base Health',
            minWidth: 100,
        },
        {
            field: 'damage',
            headerName: 'Base Damage',
            minWidth: 100,
        },
        {
            field: 'armour',
            headerName: 'Base Armour',
            minWidth: 100,
        },
        {
            field: 'equipment1',
            headerName: 'Equipment Slot 1',
            minWidth: 100,
        },
        {
            field: 'equipment2',
            headerName: 'Equipment Slot 2',
            minWidth: 100,
        },
        {
            field: 'equipment3',
            headerName: 'Equipment Slot 3',
            minWidth: 100,
        },
        {
            field: 'requiredInCampaign',
            headerName: 'Campaign',
            cellRenderer: 'agCheckboxCellRenderer',
            minWidth: 100,
        },
        {
            field: 'forcedSummons',
            headerName: 'Forced Summons',
            cellRenderer: 'agCheckboxCellRenderer',
            minWidth: 100,
        }
    ]);

    const [rowsData] = useState(GlobalStoreService.characters);

    const getRowStyle = (params: RowClassParams<ICharacter>): RowStyle => {
        return { background: (params.node.rowIndex ?? 0) % 2 === 0 ? 'silver' : 'white' };
    };

    const onFilterTextBoxChanged = useCallback(() => {
        gridRef.current?.api.setQuickFilter(
            inputRef.current?.value ?? ''
        );
    }, []);

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
                Characters details
            </Typography>
            <div>
                <input
                    ref={inputRef}
                    type="text"
                    id="filter-text-box"
                    placeholder="Quick Filter..."
                    onInput={onFilterTextBoxChanged}
                />
            </div>
            <div className="ag-theme-material" style={{ height: 'calc(100vh - 130px)', width: '100%' }}>
                <AgGridReact
                    ref={gridRef}
                    suppressCellFocus={true}
                    defaultColDef={defaultColDef}
                    columnDefs={columnDefs}
                    rowData={rowsData}
                    getRowStyle={getRowStyle}
                    onGridReady={() => gridRef.current?.api.sizeColumnsToFit()}
                >
                </AgGridReact>
            </div>
        </div>
    );
};

function convertDamageTypesToString  (
    params: ValueFormatterParams<ICharacter, number>
): string {
    const typeNames: string[] = [];
    const value = params.value ?? 0;
    const damageTypes: EnumLike<number | string> = DamageTypes;

    for (const key in damageTypes) {
        const enumValue = damageTypes[key];
        if (typeof enumValue === 'number' && value & enumValue) {
            typeNames.push(key);
        }
    }

    return typeNames.join(', ');
}

function convertTraitsEnumToString (
    params: ValueFormatterParams<ICharacter, number>
): string {
    const typeNames: string[] = [];
    const traitsValue1: number = params.data?.traits ?? 0;
    const traitsValue2: number = params.data?.traits2 ?? 0;
    const traits1: EnumLike<number | string> = Traits;
    const traits2: EnumLike<number | string> = Traits2;

    for (const key in traits1) {
        const enumValue = traits1[key];
        if (typeof enumValue === 'number' && traitsValue1 & enumValue) {
            typeNames.push(key);
        }
    }
    
    for (const key in traits2) {
        const enumValue = traits2[key];
        if (typeof enumValue === 'number' && traitsValue2 & enumValue) {
            typeNames.push(key);
        }
    }

    return typeNames.join(', ');
}

export default Characters;