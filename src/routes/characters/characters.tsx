import React, { ChangeEvent, useCallback, useContext, useMemo, useRef, useState } from 'react';

import { AgGridReact } from 'ag-grid-react';
import { ColDef, RowStyle, RowClassParams, IRowNode, ICellRendererParams, ColGroupDef } from 'ag-grid-community';

import { TextField } from '@mui/material';

import MultipleSelectCheckmarks from './multiple-select';
import { ICharacter2 } from '../../models/interfaces';
import { Alliance, DamageType, Trait } from '../../models/enums';
import { isMobile } from 'react-device-detect';
import { CharacterTitle } from '../../shared-components/character-title';
import { StoreContext } from '../../reducers/store.provider';
import { ValueGetterParams } from 'ag-grid-community/dist/lib/entities/colDef';
import { RarityImage } from 'src/shared-components/rarity-image';
import { RankImage } from 'src/shared-components/rank-image';

export const Characters = () => {
    const gridRef = useRef<AgGridReact<ICharacter2>>(null);

    const [nameFilter, setNameFilter] = useState<string>('');
    const [damageTypesFilter, setDamageTypesFilter] = useState<DamageType[]>([]);
    const [traitsFilter, setTraitsFilter] = useState<Trait[]>([]);
    const [allianceFilter, setAllianceFilter] = useState<Alliance[]>([]);

    const defaultColDef: ColDef<ICharacter2> = {
        sortable: true,
        resizable: true,
        autoHeight: true,
        wrapText: true,
    };

    const [columnDefs] = useState<Array<ColDef | ColGroupDef>>([
        {
            headerName: 'Character',
            pinned: !isMobile,
            openByDefault: !isMobile,
            children: [
                {
                    headerName: '#',
                    colId: 'rowNumber',
                    valueGetter: params => (params.node?.rowIndex ?? 0) + 1,
                    maxWidth: 50,
                    width: 50,
                    pinned: !isMobile,
                },
                {
                    headerName: 'Name',
                    width: isMobile ? 75 : 200,
                    pinned: !isMobile,
                    cellRenderer: (props: ICellRendererParams<ICharacter2>) => {
                        const character = props.data;
                        if (character) {
                            return (
                                <CharacterTitle character={character} hideName={isMobile} short={true} imageSize={30} />
                            );
                        }
                    },
                },
                {
                    headerName: 'Rarity',
                    width: 80,
                    columnGroupShow: 'open',
                    pinned: !isMobile,
                    valueGetter: (props: ValueGetterParams<ICharacter2>) => {
                        return props.data?.rarity;
                    },
                    cellRenderer: (props: ICellRendererParams<ICharacter2>) => {
                        const rarity = props.value ?? 0;
                        return <RarityImage rarity={rarity} />;
                    },
                },
                {
                    headerName: 'Rank',
                    width: 80,
                    columnGroupShow: 'open',
                    pinned: !isMobile,
                    valueGetter: (props: ValueGetterParams<ICharacter2>) => {
                        return props.data?.rank;
                    },
                    cellRenderer: (props: ICellRendererParams<ICharacter2>) => {
                        const rank = props.value ?? 0;
                        return <RankImage rank={rank} />;
                    },
                },
                {
                    field: 'faction',
                    headerName: 'Faction',
                    width: 170,
                    columnGroupShow: 'open',
                    pinned: !isMobile,
                },
            ],
        },

        {
            field: 'health',
            headerName: 'Health D3',
            width: 100,
        },
        {
            field: 'damage',
            headerName: 'Damage D3',
            width: 100,
        },
        {
            field: 'armour',
            headerName: 'Armour D3',
            width: 100,
        },
        {
            field: 'damageTypes.all',
            headerName: 'Damage Types',
            width: 120,
            cellRenderer: (props: ICellRendererParams<ICharacter2>) => {
                const damageTypes: DamageType[] = props.value ?? [];
                return (
                    <ul style={{ margin: 0, paddingInlineStart: 20 }}>
                        {damageTypes.map(x => (
                            <li key={x}>{x}</li>
                        ))}
                    </ul>
                );
            },
        },
        {
            field: 'traits',
            headerName: 'Traits',
            width: 180,
            cellRenderer: (props: ICellRendererParams<ICharacter2>) => {
                const traits: Trait[] = props.value ?? [];
                return (
                    <ul style={{ margin: 0, paddingInlineStart: 20 }}>
                        {traits.map(x => (
                            <li key={x}>{x}</li>
                        ))}
                    </ul>
                );
            },
        },
        {
            headerName: 'Stats',
            headerTooltip: 'Movement-Melee-Range-Distance',
            children: [
                {
                    headerName: 'All',
                    width: 150,
                    columnGroupShow: 'closed',
                    cellRenderer: (props: ICellRendererParams<ICharacter2>) => {
                        const data = props.data;
                        return (
                            data && (
                                <ul style={{ margin: 0, paddingInlineStart: 20 }}>
                                    <li>Movement - {data.movement}</li>
                                    <li>Melee - {data.meleeHits}</li>
                                    {data.rangeHits && <li>Range - {data.rangeHits}</li>}
                                    {data.rangeDistance && <li>Distance - {data.rangeDistance}</li>}
                                </ul>
                            )
                        );
                    },
                },
                {
                    field: 'movement',
                    headerName: 'Movement',
                    width: 100,
                    columnGroupShow: 'open',
                },
                {
                    field: 'meleeHits',
                    headerName: 'Melee',
                    width: 100,
                    columnGroupShow: 'open',
                },
                {
                    field: 'rangeHits',
                    headerName: 'Range',
                    width: 100,
                    columnGroupShow: 'open',
                },
                {
                    field: 'rangeDistance',
                    headerName: 'Distance',
                    width: 100,
                    columnGroupShow: 'open',
                },
            ],
        },
        {
            headerName: 'Equipment',
            children: [
                {
                    headerName: 'All',
                    width: 180,
                    columnGroupShow: 'closed',
                    cellRenderer: (props: ICellRendererParams<ICharacter2>) => {
                        const data = props.data;
                        return (
                            data && (
                                <ul style={{ margin: 0, paddingInlineStart: 20 }}>
                                    <li>Slot 1 - {data.equipment1}</li>
                                    <li>Slot 2 - {data.equipment2}</li>
                                    <li>Slot 3 - {data.equipment3}</li>
                                </ul>
                            )
                        );
                    },
                },
                {
                    field: 'equipment1',
                    headerName: 'Slot 1',
                    width: 100,
                    columnGroupShow: 'open',
                },
                {
                    field: 'equipment2',
                    headerName: 'Slot 2',
                    width: 100,
                    columnGroupShow: 'open',
                },
                {
                    field: 'equipment3',
                    headerName: 'Slot 3',
                    width: 100,
                    columnGroupShow: 'open',
                },
            ],
        },
        {
            headerName: 'Misc',
            children: [
                {
                    headerName: 'All',
                    width: 180,
                    columnGroupShow: 'closed',
                    cellRenderer: (props: ICellRendererParams<ICharacter2>) => {
                        const data = props.data;
                        return (
                            data && (
                                <ul style={{ margin: 0, paddingInlineStart: 20 }}>
                                    {data.requiredInCampaign && <li>Required for Campaigns</li>}
                                    {data.forcedSummons && <li>Forced summons</li>}
                                </ul>
                            )
                        );
                    },
                },
                {
                    field: 'requiredInCampaign',
                    headerName: 'Campaign',
                    cellRenderer: 'agCheckboxCellRenderer',
                    width: 100,
                    columnGroupShow: 'open',
                },
                {
                    field: 'forcedSummons',
                    headerName: 'Forced Summons',
                    cellRenderer: 'agCheckboxCellRenderer',
                    width: 100,
                    columnGroupShow: 'open',
                },
            ],
        },
    ]);

    const { characters } = useContext(StoreContext);

    const rows = useMemo(
        () => characters.filter(c => c.name.toLowerCase().includes(nameFilter.toLowerCase())),
        [nameFilter]
    );

    const getRowStyle = (params: RowClassParams<ICharacter2>): RowStyle => {
        return { background: (params.node.rowIndex ?? 0) % 2 === 0 ? 'lightsteelblue' : 'white' };
    };

    const onFilterTextBoxChanged = useCallback((change: ChangeEvent<HTMLInputElement>) => {
        setNameFilter(change.target.value);
    }, []);

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

    const allianceFilterChanged = useCallback((newValue: string[]) => {
        setAllianceFilter(newValue as Alliance[]);
        requestAnimationFrame(() => {
            gridRef.current?.api.onFilterChanged();
        });
    }, []);

    const isExternalFilterPresent = useCallback(() => {
        const hasDamageTypeFilter = damageTypesFilter.length > 0;
        const hasTraitsFilter = traitsFilter.length > 0;
        const hasAllianceFilter = allianceFilter.length > 0;
        return hasDamageTypeFilter || hasTraitsFilter || hasAllianceFilter;
    }, [damageTypesFilter, traitsFilter, allianceFilter]);

    const doesExternalFilterPass = useCallback(
        (node: IRowNode<ICharacter2>) => {
            const doesDamageTypeFilterPass = () => {
                if (!damageTypesFilter.length) {
                    return true;
                }
                return damageTypesFilter.every(type => node.data?.damageTypes.all.includes(type));
            };

            const doesTraitsFilterPass = () => {
                if (!traitsFilter.length) {
                    return true;
                }
                return traitsFilter.every(type => {
                    if (type !== Trait.Mechanical) {
                        return node.data?.traits.includes(type);
                    } else {
                        return (
                            node.data?.traits.includes(Trait.Mechanical) ||
                            node.data?.traits.includes(Trait.LivingMetal)
                        );
                    }
                });
            };

            const doesAllianceFilterPass = () => {
                if (!allianceFilter.length) {
                    return true;
                }
                return allianceFilter.some(alliance => node.data?.alliance.includes(alliance));
            };

            if (node.data) {
                return doesDamageTypeFilterPass() && doesTraitsFilterPass() && doesAllianceFilterPass();
            }
            return true;
        },
        [damageTypesFilter, traitsFilter, allianceFilter]
    );

    const refreshRowNumberColumn = useCallback(() => {
        const columns = [gridRef.current?.columnApi.getColumn('rowNumber') ?? ''];
        gridRef.current?.api.refreshCells({ columns });
    }, []);

    return (
        <div>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    margin: '0 20px',
                    flexDirection: isMobile ? 'column' : 'row',
                }}>
                <TextField
                    style={{ minWidth: 200 }}
                    label="Quick Filter"
                    variant="outlined"
                    onChange={onFilterTextBoxChanged}
                />
                <MultipleSelectCheckmarks
                    placeholder="Damage Types"
                    selectedValues={damageTypesFilter}
                    values={Object.values(DamageType)}
                    selectionChanges={damageTypeFilterChanged}
                />
                <MultipleSelectCheckmarks
                    placeholder="Traits"
                    selectedValues={traitsFilter}
                    values={Object.values(Trait)}
                    selectionChanges={traitsFilterChanged}
                />
                <MultipleSelectCheckmarks
                    placeholder="Alliance"
                    selectedValues={allianceFilter}
                    values={Object.values(Alliance)}
                    selectionChanges={allianceFilterChanged}
                />
            </div>
            <div className="ag-theme-material" style={{ height: 'calc(100vh - 180px)', width: '100%' }}>
                <AgGridReact
                    ref={gridRef}
                    suppressCellFocus={true}
                    defaultColDef={defaultColDef}
                    columnDefs={columnDefs}
                    rowData={rows}
                    getRowStyle={getRowStyle}
                    onSortChanged={refreshRowNumberColumn}
                    onFilterChanged={refreshRowNumberColumn}
                    isExternalFilterPresent={isExternalFilterPresent}
                    doesExternalFilterPass={doesExternalFilterPass}></AgGridReact>
            </div>
        </div>
    );
};
