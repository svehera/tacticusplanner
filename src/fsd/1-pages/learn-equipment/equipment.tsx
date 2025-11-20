import { FormControlLabel, Switch, TextField, Tooltip } from '@mui/material';
import { ColDef, ICellRendererParams, AllCommunityModule, themeBalham } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { useMemo, useRef, useState } from 'react';

import { RarityIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService } from '@/fsd/4-entities/character';
import { EquipmentIcon, EquipmentService, EquipmentTypeIcon, IEquipment } from '@/fsd/4-entities/equipment';
// eslint-disable-next-line import-x/no-internal-modules
import { EquipmentBoost } from '@/fsd/4-entities/equipment/ui/equipment-boost';

export const Equipment = () => {
    const gridRef = useRef<AgGridReact<IEquipment>>(null);
    const [nameFilter, setNameFilter] = useState<string>('');
    const [showCharacters, setShowCharacters] = useState<boolean>(false);
    const rows = useMemo(
        (): IEquipment[] =>
            EquipmentService.equipmentData.filter(
                item =>
                    item.id.search('I_Block_[CURELM]005') == -1 &&
                    item.id.search('I_Booster_Block_[CURELM]001') == -1 &&
                    item.id.search('I_Defensive_[CURELM]001') == -1
            ) || [],
        []
    );

    const columnDefs = useMemo<Array<ColDef<IEquipment>>>(() => {
        return [
            {
                field: 'icon',
                headerName: 'Equipment',
                minWidth: 120,
                flex: 1,
                cellRenderer: (params: ICellRendererParams<IEquipment>) => {
                    const equipment = params.data;
                    return equipment ? (
                        <span className="flex items-center">
                            <EquipmentIcon equipment={equipment} width={60} height={60} />
                            {equipment.name}
                        </span>
                    ) : (
                        ''
                    );
                },
            },
            {
                field: 'name',
                headerName: 'Equipment',
                minWidth: 120,
                flex: 1,
                cellRenderer: (params: ICellRendererParams<IEquipment>) => {
                    const equipment = params.data;
                    return equipment ? (
                        <span style={{ display: 'flex', alignItems: 'center' }}>{equipment?.name}</span>
                    ) : (
                        ''
                    );
                },
            },
            {
                field: 'rarity',
                headerName: 'Rarity',
                width: 60,
                cellRenderer: (params: ICellRendererParams<IEquipment>) => {
                    return typeof params.data?.rarity !== 'undefined' && <RarityIcon rarity={params.data?.rarity} />;
                },
            },
            {
                comparator: (a, b) => {
                    return EquipmentService.getEquipmentSlotDisplayName(a.type).localeCompare(
                        EquipmentService.getEquipmentSlotDisplayName(b.type)
                    );
                },
                headerName: 'Slot',
                minWidth: 50,
                cellRenderer: (params: ICellRendererParams<IEquipment>) => {
                    const equipment = params.data;
                    return equipment ? (
                        <span className="flex items-center">
                            <EquipmentTypeIcon equipmentType={equipment.type} width={25} height={25} />
                            <span> </span>
                            <span>{EquipmentService.getEquipmentSlotDisplayName(equipment.type)}</span>
                        </span>
                    ) : (
                        ''
                    );
                },
            },
            {
                headerName: 'Boost by Level',
                minWidth: 100,
                flex: 1,
                cellRenderer: (params: ICellRendererParams<IEquipment>) => {
                    const ret = [];
                    const equipment: IEquipment = params.data!;
                    for (let index = 0; index < equipment.levels.length; ++index) {
                        ret.push(
                            <div key={`${params.data?.id}-${index}`}>
                                <table>
                                    <tbody>
                                        <tr>
                                            <td>Level: {index + 1}</td>
                                            <td>
                                                <EquipmentBoost
                                                    type={equipment.type}
                                                    stats={equipment.levels[index].stats}
                                                    width={30}
                                                    height={30}
                                                />
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        );
                    }
                    return <div>{ret}</div>;
                },
            },
            {
                field: 'isRelic',
                headerName: 'Is Relic',
                minWidth: 100,
                flex: 1,
                cellRenderer: (params: ICellRendererParams<IEquipment>) => {
                    const { isRelic, isUniqueRelic } = params.data || {};
                    return <span>{isRelic ? (isUniqueRelic ? 'Yes (Unique)' : 'Yes (Shared)') : 'No'}</span>;
                },
            },
            {
                headerName: 'Characters',
                minWidth: 100,
                flex: 1,
                hide: !showCharacters,
                cellRenderer: (params: ICellRendererParams<IEquipment>) => {
                    const characterIds = params.data!.allowedUnits;

                    return (
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                            {characterIds.map(charId => {
                                const character = CharactersService.resolveCharacter(charId);
                                return character ? (
                                    <Tooltip title={character.name} key={charId}>
                                        <span>
                                            <UnitShardIcon icon={character.roundIcon} name={charId} height={30} />
                                        </span>
                                    </Tooltip>
                                ) : (
                                    <></>
                                );
                            })}
                        </div>
                    );
                },
            },
        ];
    }, [showCharacters]);

    const filteredRows = useMemo(() => {
        return rows.filter(row => row.name.toLowerCase().includes(nameFilter.toLowerCase()));
    }, [rows, nameFilter]);

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, margin: '0 20px' }}>
                <TextField
                    label="Quick Filter"
                    variant="outlined"
                    onChange={change => setNameFilter(change.target.value)}
                />
                <FormControlLabel
                    control={
                        <Switch
                            checked={showCharacters}
                            onChange={event => setShowCharacters(event.target.checked)}
                            slotProps={{ input: { 'aria-label': 'controlled' } }}
                        />
                    }
                    label="Show Characters"
                />
            </div>
            <div
                className="ag-theme-material"
                style={{ height: 'calc(100vh - 12rem)', minHeight: '400px', width: '100%' }}>
                <AgGridReact
                    ref={gridRef}
                    modules={[AllCommunityModule]}
                    theme={themeBalham}
                    suppressCellFocus={true}
                    defaultColDef={{ resizable: true, sortable: true, autoHeight: true, wrapText: true }}
                    columnDefs={columnDefs}
                    rowData={filteredRows}
                />
            </div>
        </div>
    );
};
