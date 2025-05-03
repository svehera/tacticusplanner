import { FormControl, MenuItem, Select } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import React from 'react';

import { RarityImage } from 'src/v2/components/images/rarity-image';

import { Rarity } from '@/fsd/5-shared/model';
import { FlexBox } from '@/fsd/5-shared/ui';

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
                            <RarityImage rarity={rarity} /> {Rarity[rarity]}
                        </FlexBox>
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};
