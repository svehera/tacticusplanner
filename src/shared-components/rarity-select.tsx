import InputLabel from '@mui/material/InputLabel';
import { FormControl, MenuItem, Select } from '@mui/material';
import { Rank, Rarity } from '../models/enums';
import { rankToString } from '../shared-logic/functions';
import { RankImage } from './rank-image';
import React from 'react';
import { RarityImage } from './rarity-image';
import { FlexBox } from 'src/v2/components/flex-box';

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
        <FormControl style={{ width: '50%' }}>
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
