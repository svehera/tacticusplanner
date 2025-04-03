import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import React from 'react';
import { StaticDataService } from 'src/services';
import { getImageUrl } from 'src/shared-logic/functions';

interface Props {
    label: string;
    npcs: string[];
    npc: string;
    npcChanges: (value: string) => void;
}

/** Exposes a select (list box) with the given NPCs. */
export const NpcSelect: React.FC<Props> = ({ label, npcs, npc, npcChanges }) => {
    const getNpcIconUrl = (npc: string) => {
        return getImageUrl(StaticDataService.getNpcIconPath(npc));
    };

    return (
        <FormControl fullWidth>
            <InputLabel>{label}</InputLabel>
            <Select<string> label={label} value={npc} onChange={event => npcChanges(event.target.value)}>
                {npcs.map(npc => (
                    <MenuItem key={npc} value={npc}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                            <img src={getNpcIconUrl(npc)} height={30} />
                            {npc}
                        </div>
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};
