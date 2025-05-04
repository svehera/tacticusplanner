import { FormControl, MenuItem, Select } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import React from 'react';

import { RankImage } from 'src/v2/components/images/rank-image';

import { Rank } from '@/fsd/4-entities/character';

import { rankToString } from '../shared-logic/functions';

export const RankSelect = ({
    rankValues,
    valueChanges,
    value,
    label,
}: {
    label: string;
    rankValues: number[];
    value: number;
    valueChanges: (value: number) => void;
}) => {
    return (
        <FormControl fullWidth>
            <InputLabel>{label}</InputLabel>
            <Select<Rank> label={label} value={value} onChange={event => valueChanges(+event.target.value)}>
                {rankValues.map(rank => (
                    <MenuItem key={rank} value={rank}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                            <span>{rankToString(rank)}</span>
                            <RankImage rank={rank} />
                        </div>
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};
