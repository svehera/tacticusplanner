/* eslint-disable boundaries/element-types */
import { FormControl, MenuItem, Select } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';

import { EquipmentIcon, EquipmentTypeIcon, IEquipment } from '@/fsd/4-entities/equipment';

export const EquipmentSelect = ({
    equipmentType,
    availableValues,
    valueChanges,
    value,
    label,
}: {
    equipmentType: string;
    availableValues: IEquipment[];
    label: string;
    value: IEquipment | null;
    valueChanges: (value: IEquipment | null) => void;
}) => {
    return (
        <FormControl fullWidth>
            <InputLabel>{label}</InputLabel>
            <Select<string>
                label={label}
                value={value?.id ?? equipmentType}
                onChange={event =>
                    valueChanges(availableValues.find(equipment => equipment.id === event.target.value) ?? null)
                }>
                <MenuItem value={equipmentType}>
                    <EquipmentTypeIcon equipmentType={equipmentType} height={30} width={30} />
                </MenuItem>
                {availableValues.map(equipment => (
                    <MenuItem key={equipment.id} value={equipment.id}>
                        <div className="flex items-center gap-[15px]">
                            <EquipmentIcon equipment={equipment} width={45} height={45} />
                        </div>
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};
