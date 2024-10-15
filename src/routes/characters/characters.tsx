import React, { ChangeEvent, useCallback, useContext, useMemo, useRef, useState } from 'react';

import { AgGridReact } from 'ag-grid-react';
import { ColDef, RowStyle, RowClassParams, IRowNode, ICellRendererParams, ColGroupDef } from 'ag-grid-community';

import { FormControl, FormControlLabel, MenuItem, Select, SelectChangeEvent, Switch, TextField } from '@mui/material';

import { MultipleSelectCheckmarks } from './multiple-select';
import { ICharacter2 } from 'src/models/interfaces';
import { Alliance, DamageType, Rank, Trait } from 'src/models/enums';
import { isMobile } from 'react-device-detect';
import { CharacterTitle } from 'src/shared-components/character-title';
import { StoreContext } from 'src/reducers/store.provider';
import { ValueGetterParams } from 'ag-grid-community/dist/lib/entities/colDef';
import { RarityImage } from 'src/shared-components/rarity-image';
import { RankImage } from 'src/shared-components/rank-image';
import { useQueryState } from 'src/v2/hooks/query-state';
import { uniq } from 'lodash';
import InputLabel from '@mui/material/InputLabel';
import Button from '@mui/material/Button';

export const Characters = () => {
    const gridRef = useRef<AgGridReact<ICharacter2>>(null);

    const [nameFilter, setNameFilter] = useState<string>('');
    const [onlyUnlocked, setOnlyUnlocked] = useState<boolean>(false);
    const [rowCount, setRowCount] = useState(0);
    const [damageTypesFilter, setDamageTypesFilter] = useQueryState<DamageType[]>(
        'damage',
        filterParam => (filterParam?.split(',') as DamageType[]) ?? [],
        queryParam => queryParam?.join(',')
    );
    const [traitsFilter, setTraitsFilter] = useQueryState<Trait[]>(
        'trait',
        filterParam => (filterParam?.split(',') as Trait[]) ?? [],
        queryParam => queryParam?.join(',')
    );
    const [allianceFilter, setAllianceFilter] = useQueryState<Alliance[]>(
        'alliance',
        filterParam => (filterParam?.split(',') as Alliance[]) ?? [],
        queryParam => queryParam?.join(',')
    );
    const [minHitsFilter, setMinHitsFilter] = useQueryState<number | ''>(
        'minHits',
        filterParam => (filterParam ? Number.parseInt(filterParam) : ''),
        queryParam => (queryParam > 0 ? queryParam?.toString() : '')
    );
    const [maxHitsFilter, setMaxHitsFilter] = useQueryState<number | ''>(
        'maxHits',
        filterParam => (filterParam ? Number.parseInt(filterParam) : ''),
        queryParam => (queryParam > 0 ? queryParam?.toString() : '')
    );

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

    const hitsOptions = uniq(characters.flatMap(x => [x.meleeHits, x.rangeHits ?? 1]))
        .sort((a, b) => a - b)
        .map(x => x.toString());

    const rows = useMemo(
        () =>
            characters.filter(
                c => c.name.toLowerCase().includes(nameFilter.toLowerCase()) && (!onlyUnlocked || c.rank > Rank.Locked)
            ),
        [nameFilter, onlyUnlocked]
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

    const minHitsFilterChange = useCallback((event: SelectChangeEvent<number>) => {
        setMinHitsFilter(+event.target.value);
        requestAnimationFrame(() => {
            gridRef.current?.api.onFilterChanged();
        });
    }, []);

    const maxHitsFilterChange = useCallback((event: SelectChangeEvent<number>) => {
        setMaxHitsFilter(+event.target.value);
        requestAnimationFrame(() => {
            gridRef.current?.api.onFilterChanged();
        });
    }, []);

    const isExternalFilterPresent = useCallback(() => {
        const hasDamageTypeFilter = damageTypesFilter.length > 0;
        const hasTraitsFilter = traitsFilter.length > 0;
        const hasAllianceFilter = allianceFilter.length > 0;
        const hasMinHitsFilter = minHitsFilter > 0;
        const hasMaxHitsFilter = maxHitsFilter > 0;
        return hasDamageTypeFilter || hasTraitsFilter || hasAllianceFilter || hasMinHitsFilter || hasMaxHitsFilter;
    }, [damageTypesFilter, traitsFilter, allianceFilter, minHitsFilter, maxHitsFilter]);

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

            const doesMinHitsFilterPass = () => {
                if (!minHitsFilter) {
                    return true;
                }
                const hits = node.data?.rangeHits ?? node.data?.meleeHits ?? 0;

                return hits >= minHitsFilter;
            };

            const doesMaxHitsFilterPass = () => {
                if (!maxHitsFilter) {
                    return true;
                }
                const hits = node.data?.rangeHits ?? node.data?.meleeHits ?? 0;

                return hits <= maxHitsFilter;
            };

            if (node.data) {
                return (
                    doesDamageTypeFilterPass() &&
                    doesTraitsFilterPass() &&
                    doesAllianceFilterPass() &&
                    doesMinHitsFilterPass() &&
                    doesMaxHitsFilterPass()
                );
            }
            return true;
        },
        [damageTypesFilter, traitsFilter, allianceFilter, minHitsFilter, maxHitsFilter]
    );

    const refreshRowNumberColumn = useCallback(() => {
        const columns = [gridRef.current?.api.getColumn('rowNumber') ?? ''];
        gridRef.current?.api.refreshCells({ columns });

        const displayedRowCount = gridRef.current?.api.getDisplayedRowCount();
        setRowCount(displayedRowCount ?? 0);
    }, []);

    const resetFilters = () => {
        setNameFilter('');
        allianceFilterChanged([]);
        damageTypeFilterChanged([]);
        traitsFilterChanged([]);
        minHitsFilterChange({ target: { value: '' } } as any);
        maxHitsFilterChange({ target: { value: '' } } as any);
        requestAnimationFrame(() => {
            gridRef.current?.api.onFilterChanged();
        });
    };

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
                <FormControlLabel
                    label="Only unlocked"
                    control={
                        <Switch
                            checked={onlyUnlocked}
                            onChange={event => setOnlyUnlocked(event.target.checked)}
                            inputProps={{ 'aria-label': 'controlled' }}
                        />
                    }
                />
                <TextField
                    style={{ minWidth: 140 }}
                    label="Quick Filter"
                    variant="outlined"
                    onChange={onFilterTextBoxChanged}
                />
                <FormControl style={{ minWidth: '110px' }}>
                    <InputLabel>Min Hits</InputLabel>
                    <Select<number> label="Min Hits" value={minHitsFilter} onChange={minHitsFilterChange}>
                        <MenuItem value="">
                            <span>None</span>
                        </MenuItem>
                        {hitsOptions.map(hit => (
                            <MenuItem key={hit} value={hit}>
                                <span>{hit}</span>
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl style={{ minWidth: '110px' }}>
                    <InputLabel>Max Hits</InputLabel>
                    <Select<number> label="Min Hits" value={maxHitsFilter} onChange={maxHitsFilterChange}>
                        <MenuItem value="">
                            <span>None</span>
                        </MenuItem>
                        {hitsOptions.map(hit => (
                            <MenuItem key={hit} value={hit}>
                                <span>{hit}</span>
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <MultipleSelectCheckmarks
                    groupByFirstLetter
                    placeholder="Damage Types"
                    selectedValues={damageTypesFilter}
                    values={Object.values(DamageType)}
                    selectionChanges={damageTypeFilterChanged}
                />
                <MultipleSelectCheckmarks
                    groupByFirstLetter
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
            {isExternalFilterPresent() && (
                <div className="flex-box">
                    <span>{rowCount} results</span>
                    <Button onClick={resetFilters}>Reset</Button>
                </div>
            )}
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
