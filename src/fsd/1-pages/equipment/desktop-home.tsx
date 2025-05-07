import { Tooltip } from '@mui/material';
import React from 'react';

// eslint-disable-next-line import-x/no-internal-modules
import { StaticDataService } from 'src/services';
// eslint-disable-next-line import-x/no-internal-modules
import { FactionImage } from 'src/v2/components/images/faction-image';
// eslint-disable-next-line import-x/no-internal-modules
import { RarityImage } from 'src/v2/components/images/rarity-image';

import { Rarity } from '@/fsd/5-shared/model';

import { CharacterShardIcon } from '@/fsd/4-entities/character';

function parseSlotType(slotType) {
    return slotType === 'Defense' ? 'Defensive' : slotType;
}

function indexUnits(unitsData) {
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

function indexEquipment(equipmentData) {
    console.debug(`indexEquipment`, equipmentData);
    const ed = StaticDataService.equipmentData.reduce(
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

const unitIndex = indexUnits(StaticDataService.unitsData);
const equipmentIndex = indexEquipment(StaticDataService.equipmentData);

function unitsForSlot(factions, slot) {
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
                                        <CharacterShardIcon icon={v.icon} name={k} height={30} />
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
                                            <CharacterShardIcon icon={icon} name={unit} height={30} />
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
