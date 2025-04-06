import InputLabel from '@mui/material/InputLabel';
import { FormControl, MenuItem, Select } from '@mui/material';
import { Faction, Rank, Rarity, RarityStars } from 'src/models/enums';
import React, { useMemo } from 'react';
import { EquipmentType } from 'src/models/interfaces';

interface Props {
    faction: Faction;
    type: EquipmentType | undefined;
    rarity: Rarity;
}

interface Equipment {
    type: string;
    rarity: Rarity;
    level: number;
}

export const EquipmentSelect: React.FC<Props> = ({ faction, type, rarity }) => {
    const getEquipmentLabel = (type: EquipmentType): string => {
        if (type == undefined) return '';
        if (type == EquipmentType.Defensive) return 'Armor';
        return EquipmentType[type as keyof typeof EquipmentType];
    };

    const formatLabel = (equipment: Equipment): string => {
        return Rarity[equipment.rarity] + ' - Level ' + equipment.level;
    };

    const availableEquipment = useMemo(() => {
        const equipment: Equipment[] = [];
        const rarityIndex = Rarity.Common;
        if (type == undefined) return equipment;
        while (rarityIndex <= rarity) {
            const maxLevel = rarityIndex * 2 + 1;
            for (let i = 1; i <= maxLevel; i++) {
                equipment.push({
                    type: type == EquipmentType.Defensive ? 'Armor' : getEquipmentLabel(type),
                    rarity: rarityIndex,
                    level: i,
                });
                if (type === EquipmentType.Defensive) {
                    equipment.push({
                        type: 'Armor+Health',
                        rarity: rarityIndex,
                        level: i,
                    });
                }
            }
        }
        return equipment;
    }, [type, rarity]);

    return (
        <FormControl fullWidth>
            <InputLabel>{EquipmentType[type as keyof typeof EquipmentType]}</InputLabel>
            <Select<Equipment>
                label={formatLabel(availableEquipment[0])}
                value={availableEquipment[0]}
                onChange={event => console.log(event.target.value)}>
                {availableEquipment.map(equipment => (
                    <MenuItem key={formatLabel(equipment)} value={equipment}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                            <span>{formatLabel(equipment)}</span>
                        </div>
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};
