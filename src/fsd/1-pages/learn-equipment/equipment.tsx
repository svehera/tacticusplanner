import { FormControlLabel, Switch, TextField, Tooltip } from '@mui/material';
import { ColDef, ICellRendererParams, AllCommunityModule, themeBalham } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import React, { useMemo, useRef, useState } from 'react';

import { Rarity } from '@/fsd/5-shared/model';
import { RarityIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService } from '@/fsd/4-entities/character';
import { EquipmentService } from '@/fsd/4-entities/equipment';
import { FactionImage } from '@/fsd/4-entities/faction';

export interface IEquipmentTableRow {
    displayName: string;
    slot: string;
    clazz: string;
    rarity: Rarity;
    factions: string[];
    chance: number;
    boost1: number[];
    boost2: number[];
}

export const Equipment = () => {
    const gridRef = useRef<AgGridReact<IEquipmentTableRow>>(null);
    const [nameFilter, setNameFilter] = useState<string>('');
    const [showCharacters, setshowCharacters] = useState<boolean>(false);

    const rows = useMemo((): IEquipmentTableRow[] => {
        return EquipmentService.equipmentData.map(equip => ({
            displayName: equip.displayName,
            slot: equip.slot,
            clazz: equip.clazz,
            rarity: equip.rarity,
            factions: equip.factions,
            chance: equip.chance ?? 0,
            boost1: equip.boost1,
            boost2: equip.boost2,
        }));
    }, []);

    const columnDefs = useMemo<Array<ColDef<IEquipmentTableRow>>>(() => {
        return [
            {
                headerName: 'Name',
                field: 'displayName',
                minWidth: 120,
                flex: 1,
            },
            {
                headerName: 'Class',
                field: 'clazz',
                minWidth: 120,
                flex: 1,
            },
            {
                headerName: 'Rarity',
                field: 'rarity',
                width: 60,
                cellRenderer: (params: ICellRendererParams<IEquipmentTableRow>) => {
                    return typeof params.data?.rarity !== 'undefined' && <RarityIcon rarity={params.data?.rarity} />;
                },
            },
            {
                headerName: 'Slot',
                field: 'slot',
                minWidth: 100,
            },
            {
                headerName: 'Boost by Level',
                minWidth: 100,
                flex: 1,
                cellRenderer: (params: ICellRendererParams<IEquipmentTableRow>) => {
                    const { chance, slot, boost1, boost2 } = params.data || {};
                    switch (slot) {
                        case 'Block':
                        case 'Block Booster':
                        case 'Crit':
                        case 'Crit Booster': {
                            const isBooster = slot.includes('Booster');
                            const boostType = isBooster ? slot.replace(' Booster', '') : slot;
                            return boost1?.map((boost, i) => (
                                <div key={i}>
                                    <span>
                                        {i + 1}: {isBooster && '+'}
                                        {chance}% {boostType} Chance +{boost} Damage
                                    </span>
                                    <br />
                                </div>
                            ));
                        }
                        case 'Defensive': {
                            // Defensive items may boost health, which is assumed to be in boost1,
                            // or armour, which is assumed to be in boost2. These assumptions are
                            // explained in the IEquipmentRaw and IEquipment interfaces.
                            const hasHealthBoost = Array.isArray(boost1) && boost1.length > 0;
                            const hasArmourBoost = Array.isArray(boost2) && boost2.length > 0;
                            // Attempt to infer the number of levels from the boost values, accounting
                            // for the fact either boost1 or boost2 may be empty.
                            const numLevels = boost1?.length || boost2?.length || 0;
                            const levels = [];
                            for (let i = 0; i < numLevels; i++) {
                                levels.push(i);
                            }
                            return levels.map((levelIndex: number) => (
                                <div key={levelIndex}>
                                    <span>
                                        {levelIndex + 1}: {hasHealthBoost && `+${boost1[levelIndex]} Health`}{' '}
                                        {hasArmourBoost && `+${boost2[levelIndex]} Armour`}
                                    </span>
                                    <br />
                                </div>
                            ));
                        }
                        default:
                            return '';
                    }
                },
            },
            {
                headerName: 'Factions',
                field: 'factions',
                minWidth: 100,
                cellRenderer: (params: ICellRendererParams<IEquipmentTableRow>) => (
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {params.data?.factions.map(faction => (
                            <Tooltip title={faction} key={faction}>
                                <span>
                                    <FactionImage faction={faction} />
                                </span>
                            </Tooltip>
                        ))}
                    </div>
                ),
            },
            {
                headerName: 'Characters',
                minWidth: 100,
                flex: 1,
                hide: !showCharacters,
                cellRenderer: (params: ICellRendererParams<IEquipmentTableRow>) => {
                    const { slot, factions } = params.data || {};
                    const characters = CharactersService.charactersData.filter(char => {
                        return (
                            slot &&
                            factions?.includes(char.faction) &&
                            [char.equipment1, char.equipment2, char.equipment3].includes(
                                CharactersService.parseEquipmentType(slot)
                            )
                        );
                    });

                    return (
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                            {characters.map(char => (
                                <Tooltip title={char.id} key={char.id}>
                                    <span>
                                        <UnitShardIcon icon={char.icon} name={char.id} height={30} />
                                    </span>
                                </Tooltip>
                            ))}
                        </div>
                    );
                },
            },
        ];
    }, [showCharacters]);

    const filteredRows = useMemo(() => {
        return rows.filter(row => row.displayName.toLowerCase().includes(nameFilter.toLowerCase()));
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
                            value={showCharacters}
                            onChange={event => setshowCharacters(event.target.checked)}
                            slotProps={{ input: { 'aria-label': 'controlled' } }}
                        />
                    }
                    label="Show Characters"
                />
            </div>
            <div className="ag-theme-material" style={{ height: 'calc(100vh - 220px)', width: '100%' }}>
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
