import { Tooltip } from '@mui/material';
import React from 'react';

import { Faction } from '@/fsd/5-shared/model';
import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService } from '@/fsd/4-entities/character';
import { EquipmentService, IEquipment } from '@/fsd/4-entities/equipment';
import { FactionImage } from '@/fsd/4-entities/faction';

function parseSlotType(slotType: string): string {
    return slotType === 'Defense' ? 'Defensive' : slotType;
}

function indexUnits(unitsData) {
    console.debug({ unitsData });
    const ud = Object.values(unitsData).reduce<{ [key: string]: string | object }>(
        (acc, unitData) => {
            // console.debug('unitData', unitData);
            acc.byFaction[unitData.faction] = acc.byFaction[unitData.faction] || {};
            const slot1Type = parseSlotType(unitData.equipment1);
            const slot2Type = parseSlotType(unitData.equipment2);
            const slot3Type = parseSlotType(unitData.equipment3);

            acc.byUnit[unitData.id] = {
                icon: unitData.icon,
                faction: unitData.faction,
                slot1Type,
                slot2Type,
                slot3Type,
            };

            for (const equipment of [slot1Type, slot2Type, slot3Type]) {
                acc.byFaction[unitData.faction][equipment] = acc.byFaction[unitData.faction][equipment] || {};
                acc.byFaction[unitData.faction][equipment][unitData.id] = { icon: unitData.icon };
            }
            return acc;
        },
        { byFaction: {}, byUnit: {} }
    );
    console.debug('indexUnits', ud);

    return ud;
}

function indexEquipment(equipmentData: IEquipment[]) {
    console.debug(`indexEquipment`, equipmentData);
    const ed = equipmentData.reduce(
        (acc, item) => {
            const slotType = parseSlotType(item.slot);

            item.factions.forEach(faction => {
                acc.byFaction[faction] = acc.byFaction[faction] || {};
                acc.byFaction[faction][slotType] = acc.byFaction[faction][slotType] || {};
                acc.byFaction[faction][slotType][item.clazz] = acc.byFaction[faction][slotType][item.clazz] || {};

                acc.byFaction[faction][slotType][item.clazz][item.rarity] = item;
            });

            acc.byEquipmentClazz[item.clazz] = acc.byEquipmentClazz[item.clazz] || {};
            acc.byEquipmentClazz[item.clazz] = {
                slotType: parseSlotType(item.slot),
                clazz: item.clazz,
                factions: item.factions,
            };
            return acc;
        },
        { byFaction: {}, byEquipmentClazz: {} }
    );
    console.debug('indexEquipment', ed);
    return ed;
}

const unitIndex = indexUnits(CharactersService.charactersData);
const equipmentIndex = indexEquipment(EquipmentService.equipmentData);

function unitsForSlot(factions: Faction[], slot) {
    const xx = factions.reduce((acc, faction) => {
        const units = unitIndex.byFaction[faction][slot];

        if (typeof units !== 'undefined' && Object.keys(units).length > 0) {
            acc = { ...acc, ...units };
        }
        return acc;
    }, {});

    return xx;
}

function equipmentForSlot(faction, slot) {
    const items = equipmentIndex.byFaction[faction]?.[slot];
    return items ? Object.keys(items) : [];
}

export const DesktopHome = () => {
    return (
        <>
            <h2>By Character</h2>
            <table>
                <thead>
                    <tr>
                        <th>Character</th>
                        <th>Faction</th>
                        <th>Slot 1</th>
                        <th>Slot 2</th>
                        <th>Slot 3</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(unitIndex.byUnit).map(([k, v]) => (
                        <tr key={k}>
                            <td>
                                <Tooltip title={k} key={k}>
                                    <span>
                                        <UnitShardIcon icon={v.icon} name={k} height={30} />
                                    </span>
                                </Tooltip>
                            </td>
                            <td>
                                {' '}
                                <Tooltip title={v.faction} key={v.faction}>
                                    <span>
                                        <FactionImage faction={v.faction} />
                                    </span>
                                </Tooltip>
                            </td>
                            <td>
                                {v.slot1Type}: {equipmentForSlot(v.faction, v.slot1Type).join(', ')}
                            </td>
                            <td>
                                {v.slot2Type}: {equipmentForSlot(v.faction, v.slot2Type).join(', ')}
                            </td>
                            <td>
                                {v.slot3Type}: {equipmentForSlot(v.faction, v.slot3Type).join(', ')}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <h2>By Equipment</h2>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Slot</th>
                        <th>Factions</th>
                        <th>No. Characters</th>
                        <th>Characters</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(equipmentIndex.byEquipmentClazz).map(([k, v]) => (
                        <tr key={k}>
                            <td>{k}</td>
                            <td>{v.slotType}</td>

                            <td>
                                {/* {v.factions.join(', ')} */}
                                {v.factions.map(faction => (
                                    <Tooltip title={faction} key={faction}>
                                        <span>
                                            <FactionImage faction={faction} />
                                        </span>
                                    </Tooltip>
                                ))}
                            </td>

                            <td>{Object.keys(unitsForSlot(v.factions, v.slotType)).length}</td>

                            <td>
                                {Object.entries(unitsForSlot(v.factions, v.slotType)).map(([unit, { icon }]) => (
                                    <Tooltip title={unit} key={unit}>
                                        <span>
                                            <UnitShardIcon icon={icon} name={unit} height={30} />
                                        </span>
                                    </Tooltip>
                                ))}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    );
};
