import { FormControl, MenuItem, Select } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import React from 'react';

import { Rarity } from '@/fsd/5-shared/model';

import { FlexBox } from './flex-box';
import { StarsIcon } from './icons';

interface Props {
    label: string;
    starsValues: number[];
    value: number;
    valueChanges: (value: number) => void;
}

export const StarsSelect: React.FC<Props> = ({ starsValues, valueChanges, value, label }) => {
    return (
        <FormControl fullWidth>
            <InputLabel>{label}</InputLabel>
            <Select<Rarity> label={label} value={value} onChange={event => valueChanges(+event.target.value)}>
                {starsValues.map(star => (
                    <MenuItem key={star} value={star}>
                        <FlexBox gap={5}>
                            <StarsIcon stars={star} />
                        </FlexBox>
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};
