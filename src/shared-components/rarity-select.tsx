import InputLabel from '@mui/material/InputLabel';
import { FormControl, MenuItem, Select } from '@mui/material';
import { Rank, Rarity } from '../models/enums';
import { rankToString } from '../shared-logic/functions';
import { RankImage } from './rank-image';
import React from 'react';
import { RarityImage } from './rarity-image';

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
        <FormControl style={{ marginTop: 20 }} fullWidth>
            <InputLabel>{label}</InputLabel>
            <Select<Rarity> label={label} value={value} onChange={event => valueChanges(+event.target.value)}>
                {rarityValues.map(rarity => (
                    <MenuItem key={rarity} value={rarity}>
                        <RarityImage rarity={rarity} /> {Rarity[rarity]}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};
