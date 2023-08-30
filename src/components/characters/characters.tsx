import React, { ChangeEvent, useCallback, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, RowStyle, ValueFormatterParams } from 'ag-grid-community';
import { RowClassParams } from 'ag-grid-community/dist/lib/entities/gridOptions';
import { ICharacter } from '../../store/static-data/interfaces';
import GlobalStoreService from '../../store/global-store.service';
import { DamageTypes, Traits, Traits2 } from '../../store/static-data/enums';
import Typography from '@mui/material/Typography';
import MultipleSelectCheckmarks from '../multiple-select/multiple-select';
import { damageTypeToEnum, rawTraitToEnum, rawTraitToEnum2 } from '../../store/static-data/static-data.utils';
import { IRowNode } from 'ag-grid-community/dist/lib/interfaces/iRowNode';
import { TextField } from '@mui/material';
import { intersection, pick, union } from 'lodash';
import Button from '@mui/material/Button';

type EnumLike<T> = Record<string, T>

const Characters = () => {
    const gridRef = useRef<AgGridReact<ICharacter>>(null);

    const [damageTypesFilter, setDamageTypesFilter] = useState<Record<string, DamageTypes>>({});
    const [traitsFilter, setTraitsFilter] = useState<Record<string, Traits>>({});
    const [traits2Filter, setTraits2Filter] = useState<Record<string, Traits2>>({});

    const defaultColDef: ColDef<ICharacter> = {
        sortable: true,
        resizable: true,
        autoHeight: true,
        wrapText: true,
    };

    const [columnDefs] = useState<Array<ColDef>>([
        {
            headerName: '#',
            colId: 'rowNumber',
            valueGetter: (params) => (params.node?.rowIndex ?? 0) + 1,
            maxWidth: 50,
            width: 50,
            minWidth: 50,
            pinned: true,
        },
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

    const onFilterTextBoxChanged = useCallback((change: ChangeEvent<HTMLInputElement>) => {
        gridRef.current?.api.setQuickFilter(
            change.target.value
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

    const damageTypeFilterChanged = useCallback((newValue: Record<string, number>) => {
        setDamageTypesFilter(newValue);
        requestAnimationFrame(() => {
            gridRef.current?.api.onFilterChanged();
        });
    }, []);

    const traitsFilterChanged = useCallback((newValue: Record<string, number>) => {
        const traitsSharedKeys = intersection(Object.keys(rawTraitToEnum), Object.keys(newValue));
        setTraitsFilter(pick(rawTraitToEnum, traitsSharedKeys));
        const traits2SharedKeys = intersection(Object.keys(rawTraitToEnum2), Object.keys(newValue));
        setTraits2Filter(pick(rawTraitToEnum2, traits2SharedKeys));
        requestAnimationFrame(() => {
            gridRef.current?.api.onFilterChanged();
        });
    }, []);

    const isExternalFilterPresent = useCallback(() => {
        const hasDamageTypeFilter =  Object.keys(damageTypesFilter).length > 0;
        const hasTraitsFilter =  Object.keys(traitsFilter).length > 0;
        const hasTraits2Filter =  Object.keys(traits2Filter).length > 0;
        return hasDamageTypeFilter || hasTraitsFilter || hasTraits2Filter;
    }, [damageTypesFilter, traitsFilter, traits2Filter]);

    const doesExternalFilterPass = useCallback(
        (node: IRowNode<ICharacter>) => {
            const doesDamageTypeFilterPass = () => {
                const values = Object.values(damageTypesFilter);
                if(!values.length) {
                    return true;
                }
                const value = values.reduce((prev, curr) => prev | curr, DamageTypes.None);
                return ((node.data?.damageTypes ?? 0) & value) === value;
            };

            const doesTraitsFilterPass = () => {
                const values = Object.values(traitsFilter);
                if(!values.length) {
                    return true;
                }
                const value = values.reduce((prev, curr) => prev | curr, Traits.None);
                return ((node.data?.traits ?? 0) & value) === value;
            };

            const doesTraits2FilterPass = () => {
                const values = Object.values(traits2Filter);
                if(!values.length) {
                    return true;
                }
                const value = values.reduce((prev, curr) => prev | curr, Traits2.None);
                return ((node.data?.traits2 ?? 0) & value) === value;
            };

            if (node.data) {
                return doesDamageTypeFilterPass() && doesTraitsFilterPass() && doesTraits2FilterPass();
            }
            return true;
        },
        [damageTypesFilter, traitsFilter, traits2Filter]
    );

    const refreshRowNumberColumn = useCallback(() => {
        const columns = [gridRef.current?.columnApi.getColumn('rowNumber') ?? ''];
        gridRef.current?.api.refreshCells({ columns });
    }, []);

    return (
        <div>
            <Typography variant="h5" component="div" sx={{ flexGrow: 1 }}>
                Characters details
            </Typography>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', margin: '0 20px' }}>
                <TextField label="Quick Filter" variant="outlined" onChange={onFilterTextBoxChanged}/>
                <MultipleSelectCheckmarks placeholder="Damage Types" values={damageTypeToEnum}
                    selectionChanges={damageTypeFilterChanged}/>
                <MultipleSelectCheckmarks placeholder="Traits" values={{ ...rawTraitToEnum, ...rawTraitToEnum2 }}
                    selectionChanges={traitsFilterChanged}/>
            </div>
            <div className="ag-theme-material" style={{ height: 'calc(100vh - 180px)', width: '100%' }}>
                <AgGridReact
                    ref={gridRef}
                    suppressCellFocus={true}
                    defaultColDef={defaultColDef}
                    columnDefs={columnDefs}
                    rowData={rowsData}
                    getRowStyle={getRowStyle}
                    onGridReady={() => gridRef.current?.api.sizeColumnsToFit()}
                    onSortChanged={refreshRowNumberColumn}
                    onFilterChanged={refreshRowNumberColumn}
                    isExternalFilterPresent={isExternalFilterPresent}
                    doesExternalFilterPass={doesExternalFilterPass}
                >
                </AgGridReact>
            </div>
        </div>
    );
};

function convertDamageTypesToString(
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

function convertTraitsEnumToString(
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