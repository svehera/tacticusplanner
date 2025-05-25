import { FormControl, MenuItem, Select } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import React from 'react';

import { Rank, rankToString } from '@/fsd/5-shared/model';

import { RankIcon } from '@/fsd/4-entities/character/ui/rank.icon';

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
                            <RankIcon rank={rank} />
                        </div>
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};
