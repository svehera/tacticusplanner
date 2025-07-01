import { FormControlLabel, Switch, TextField, Tooltip } from '@mui/material';
import { ColDef, ICellRendererParams, AllCommunityModule, themeBalham } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import React, { useMemo, useRef, useState } from 'react';

import { RarityIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService } from '@/fsd/4-entities/character';
import { EquipmentIcon, EquipmentService, EquipmentTypeIcon, IEquipment } from '@/fsd/4-entities/equipment';
import { FactionImage } from '@/fsd/4-entities/faction';

export const Equipment = () => {
    const gridRef = useRef<AgGridReact<IEquipment>>(null);
    const [nameFilter, setNameFilter] = useState<string>('');
    const [showCharacters, setshowCharacters] = useState<boolean>(false);

    const rows = useMemo((): IEquipment[] => EquipmentService.equipmentData, []);

    // const { slot, factions } = params.data || {};
    // const characters = CharactersService.charactersData.filter(char => {
    //     return (
    //         slot &&
    //         factions?.includes(char.faction) &&
    //         [char.equipment1, char.equipment2, char.equipment3].includes(CharactersService.parseEquipmentType(slot))
    //     );
    // });

    const charactersForEquipment = useMemo(() => {
        const charactersByEquipment = new Map<string, typeof CharactersService.charactersData>();

        rows.forEach(row => {
            const { displayName, slot, factions } = row;
            if (!charactersByEquipment.has(displayName)) {
                const characters = CharactersService.charactersData.filter(char => {
                    return (
                        slot &&
                        factions?.includes(char.faction) &&
                        [char.equipment1, char.equipment2, char.equipment3].includes(
                            CharactersService.parseEquipmentType(slot)
                        )
                    );
                });
                charactersByEquipment.set(displayName, characters);
            }
        });

        return charactersByEquipment;
    }, [rows]);

    const columnDefs = useMemo<Array<ColDef<IEquipment>>>(() => {
        return [
            {
                headerName: 'Equipment',
                minWidth: 120,
                flex: 1,
                cellRenderer: (params: ICellRendererParams<IEquipment>) => {
                    const equipment = params.data;
                    return equipment ? (
                        <span style={{ display: 'flex', alignItems: 'center' }}>
                            <EquipmentIcon equipment={equipment} width={30} height={30} />
                            {equipment?.displayName}
                        </span>
                    ) : (
                        ''
                    );
                },
            },
            {
                headerName: 'Class',
                field: 'clazz',
                minWidth: 120,
                flex: 1,
            },
            {
                headerName: 'Rarity',
                width: 60,
                cellRenderer: (params: ICellRendererParams<IEquipment>) => {
                    return typeof params.data?.rarity !== 'undefined' && <RarityIcon rarity={params.data?.rarity} />;
                },
            },
            {
                headerName: 'Slot',
                minWidth: 50,
                cellRenderer: (params: ICellRendererParams<IEquipment>) => {
                    const equipment = params.data;
                    return equipment ? (
                        <span style={{ display: 'flex', alignItems: 'center' }}>
                            <EquipmentTypeIcon equipmentType={equipment.slot} width={25} height={25} />
                            {equipment?.slot}
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
                minWidth: 100,
                cellRenderer: (params: ICellRendererParams<IEquipment>) => (
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
                cellRenderer: (params: ICellRendererParams<IEquipment>) => {
                    const { displayName } = params.data || {};
                    if (!displayName) return '';
                    const characters = charactersForEquipment.get(displayName) || [];

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
