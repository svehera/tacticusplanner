import React from 'react';
import InputLabel from '@mui/material/InputLabel';
import { FormControl, MenuItem, Select } from '@mui/material';
import { Rarity } from '../models/enums';
import { FlexBox } from 'src/v2/components/flex-box';
import { StarsImage } from 'src/v2/components/images/stars-image';

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
                            <StarsImage stars={star} />
                        </FlexBox>
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};
