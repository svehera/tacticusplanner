import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import React from 'react';

import { StarsIcon } from '@/fsd/5-shared/ui/icons';

// eslint-disable-next-line boundaries/element-types
import { RankIcon } from '../character';

import { INpcData } from './model';

interface Props {
    label: string;
    npc: INpcData;
    index: number;
    indexChanges: (value: number) => void;
}

/** Exposes a select (list box) with the given NPCs. */
export const ProgressionIndexSelect: React.FC<Props> = ({ label, npc, index, indexChanges }) => {
    return (
        <FormControl fullWidth>
            <InputLabel>{label}</InputLabel>
            <Select<number>
                label={label}
                value={index}
                onChange={event => {
                    indexChanges(event.target.value as number);
                }}>
                {npc.stats.map((stats, index) => (
                    <MenuItem key={index} value={index}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                            <StarsIcon stars={stats.rarityStars} />
                            <RankIcon rank={stats.rank} size={32} />
                        </div>
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};
