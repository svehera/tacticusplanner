import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import React from 'react';

import { FactionImage } from 'src/v2/components/images/faction-image';

import { Faction } from '@/fsd/5-shared/model';

interface Props {
    label: string;
    factions: Faction[];
    faction: Faction;
    factionChanges: (value: Faction) => void;
}

/** Exposes a select (list box) with the given factions. */
export const FactionSelect: React.FC<Props> = ({ label, factions, faction, factionChanges }) => {
    return (
        <FormControl fullWidth>
            <InputLabel>{label}</InputLabel>
            <Select<Faction>
                label={label}
                value={faction}
                onChange={event => factionChanges(event.target.value as Faction)}>
                {factions.map(faction => (
                    <MenuItem key={faction} value={faction}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                            <span>{faction}</span>
                            <FactionImage faction={faction} />
                        </div>
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};
