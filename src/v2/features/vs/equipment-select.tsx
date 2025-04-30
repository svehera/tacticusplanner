import InputLabel from '@mui/material/InputLabel';
import { FormControl, MenuItem, Select } from '@mui/material';
import { Equipment, Faction, Rarity, RarityString } from 'src/models/enums';
import React, { useMemo } from 'react';
import { EquipmentType, IEquipment } from 'src/models/interfaces';
import { StaticDataService } from 'src/services';
import { getImageUrl } from 'src/shared-logic/functions';
import { IEquipmentSpec } from './versus-interfaces';

interface Props {
    faction: Faction;
    equipment: IEquipmentSpec;
    maxRarity: Rarity;
    onEquipmentChange: (equipment: IEquipmentSpec) => void;
}

/**
 * Presents an equipment selector, allowing the user to select a relevant piece
 * of equipment and the level of the equipment. Understands which factions can
 * use which equipment, and which types of equipment are relevant for this slot.
 */
export const EquipmentSelect: React.FC<Props> = ({ faction, equipment, maxRarity, onEquipmentChange }) => {
    const availableEquipment = useMemo((): IEquipmentSpec[] => {
        const newEquipment: IEquipmentSpec[] = [];
        newEquipment.push({ type: equipment.type } as IEquipmentSpec);
        StaticDataService.equipmentData.forEach(equip => {
            if (equip.factions.find(otherFaction => faction == otherFaction) == undefined) return;
            if (equip.slot != equipment.type) return;
            if (equip.rarity > maxRarity) return;
            for (let i = 0; i < Math.max(equip.boost1.length, equip.boost2.length); i++) {
                newEquipment.push({
                    type: equipment.type,
                    equipment: equip,
                    level: i + 1,
                });
            }
        });
        return newEquipment;
    }, [equipment, faction, maxRarity]);

    const equipmentIndex = useMemo(() => {
        if (equipment.equipment == undefined) return 0;
        return availableEquipment.findIndex(
            equip => equip.equipment?.displayName == equipment.equipment?.displayName && equip.level == equipment.level
        );
    }, [availableEquipment, equipment]);

    const getIcon = (equipment: IEquipmentSpec) => {
        if (equipment.equipment == undefined) {
            return getImageUrl(StaticDataService.getEquipmentTypeIconPath(equipment.type));
        }
        return getImageUrl(StaticDataService.getEquipmentIconPath(equipment.equipment));
    };

    const getDisplay = (equipment: IEquipmentSpec) => {
        return (
            <span>
                <img src={getIcon(equipment)} width={30} height={30} /> {equipment.level ? 'L' : ''}
                {equipment.level}
            </span>
        );
    };

    const getMenuItemKey = (equipment: IEquipmentSpec) => {
        if (equipment.equipment == undefined) {
            return equipment.type;
        }
        return equipment.equipment.displayName + '_level_' + equipment.level;
    };

    return (
        <FormControl fullWidth>
            <InputLabel>{Equipment[equipment.type as keyof typeof EquipmentType]}</InputLabel>
            <Select<IEquipmentSpec>
                label={''}
                value={availableEquipment[equipmentIndex]}
                onChange={event => onEquipmentChange(event.target.value as IEquipmentSpec)}>
                {availableEquipment.map(equipment => (
                    <MenuItem key={getMenuItemKey(equipment)} onClick={() => onEquipmentChange(equipment)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>{getDisplay(equipment)}</div>
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};
