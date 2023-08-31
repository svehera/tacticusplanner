import React, { ChangeEvent, useCallback, useRef, useState } from 'react';

import { AgGridReact } from 'ag-grid-react';
import { ColDef, RowStyle, RowClassParams, IRowNode } from 'ag-grid-community';

import { TextField } from '@mui/material';
import Typography from '@mui/material/Typography';

import MultipleSelectCheckmarks from './multiple-select';
import { ICharacter } from '../../models/interfaces';
import { DamageType, Trait } from '../../models/enums';
import { GlobalService } from '../../services';

export const Characters = () => {
    const gridRef = useRef<AgGridReact<ICharacter>>(null);

    const [damageTypesFilter, setDamageTypesFilter] = useState<DamageType[]>([]);
    const [traitsFilter, setTraitsFilter] = useState<Trait[]>([]);

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
            field: 'damageTypes.melee',
            headerName: 'Melee Damage Type',
            minWidth: 170,
        },
        {
            field: 'damageTypes.range',
            headerName: 'Range Damage Type',
            minWidth: 170,
        },
        {
            field: 'damageTypes.activeAbility',
            headerName: 'Active Ability Damage Type',
            minWidth: 170,
        },
        {
            field: 'damageTypes.passiveAbility',
            headerName: 'Passive Ability Damage Type',
            minWidth: 170,
        },
        {
            field: 'traits',
            headerName: 'Traits',
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

    const [rowsData] = useState(GlobalService.characters);

    const getRowStyle = (params: RowClassParams<ICharacter>): RowStyle => {
        return { background: (params.node.rowIndex ?? 0) % 2 === 0 ? 'lightsteelblue' : 'white' };
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

    const damageTypeFilterChanged = useCallback((newValue: string[]) => {
        setDamageTypesFilter(newValue as DamageType[]);
        requestAnimationFrame(() => {
            gridRef.current?.api.onFilterChanged();
        });
    }, []);

    const traitsFilterChanged = useCallback((newValue: string[]) => {
        setTraitsFilter(newValue as Trait[]);
        requestAnimationFrame(() => {
            gridRef.current?.api.onFilterChanged();
        });
    }, []);

    const isExternalFilterPresent = useCallback(() => {
        const hasDamageTypeFilter =  damageTypesFilter.length > 0;
        const hasTraitsFilter = traitsFilter.length > 0;
        return hasDamageTypeFilter || hasTraitsFilter;
    }, [damageTypesFilter, traitsFilter]);

    const doesExternalFilterPass = useCallback(
        (node: IRowNode<ICharacter>) => {
            const doesDamageTypeFilterPass = () => {
                if(!damageTypesFilter.length) {
                    return true;
                }
                return damageTypesFilter.every(type => node.data?.damageTypes.all.includes(type));
            };

            const doesTraitsFilterPass = () => {
                if(!traitsFilter.length) {
                    return true;
                }
                return traitsFilter.every(type => node.data?.traits.includes(type));
            };
            

            if (node.data) {
                return doesDamageTypeFilterPass() && doesTraitsFilterPass();
            }
            return true;
        },
        [damageTypesFilter, traitsFilter]
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
                <MultipleSelectCheckmarks placeholder="Damage Types" selectedValues={damageTypesFilter} values={Object.values(DamageType)}
                    selectionChanges={damageTypeFilterChanged}/>
                <MultipleSelectCheckmarks placeholder="Traits" selectedValues={traitsFilter} values={ Object.values(Trait)}
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
