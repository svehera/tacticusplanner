import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import React from 'react';

import { FactionId } from '@/fsd/5-shared/model';

import { FactionImage } from './faction.icon';

interface Props {
    label: string;
    factions: FactionId[];
    faction: FactionId;
    factionChanges: (value: FactionId) => void;
}

/** Exposes a select (list box) with the given factions. */
export const FactionSelect: React.FC<Props> = ({ label, factions, faction, factionChanges }) => {
    return (
        <FormControl fullWidth>
            <InputLabel>{label}</InputLabel>
            <Select<FactionId>
                label={label}
                value={faction}
                onChange={event => factionChanges(event.target.value as FactionId)}>
                {factions.map(faction => (
                    <MenuItem key={faction} value={faction}>
                        <div className="flex items-center gap-[15px]">
                            <span>{faction}</span>
                            <FactionImage faction={faction} />
                        </div>
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};
