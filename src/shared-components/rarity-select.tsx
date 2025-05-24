import { FormControl, MenuItem, Select } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import React from 'react';

import { Rarity } from '@/fsd/5-shared/model';
import { FlexBox } from '@/fsd/5-shared/ui';
import { RarityIcon } from '@/fsd/5-shared/ui/icons/rarity.icon';

export const RaritySelect = ({
    rarityValues,
    valueChanges,
    value,
    label,
}: {
    label: string;
    rarityValues: number[];
    value: number;
    valueChanges: (value: number) => void;
}) => {
    return (
        <FormControl fullWidth>
            <InputLabel>{label}</InputLabel>
            <Select<Rarity> label={label} value={value} onChange={event => valueChanges(+event.target.value)}>
                {rarityValues.map(rarity => (
                    <MenuItem key={rarity} value={rarity}>
                        <FlexBox gap={5}>
                            <RarityIcon rarity={rarity} /> {Rarity[rarity]}
                        </FlexBox>
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};
