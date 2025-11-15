import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import React from 'react';

// eslint-disable-next-line import-x/no-internal-modules
import { CharacterPortraitImage } from '@/v2/components/images/character-portrait.image';

import { INpcData } from './model';

interface Props {
    label: string;
    npcs: INpcData[];
    npc: INpcData;
    npcChanges: (value: INpcData) => void;
}

/** Exposes a select (list box) with the given NPCs. */
export const NpcSelect: React.FC<Props> = ({ label, npcs, npc, npcChanges }) => {
    return (
        <FormControl fullWidth>
            <InputLabel>{label}</InputLabel>
            <Select<string>
                label={label}
                value={npc.snowprintId}
                onChange={event => {
                    npcChanges(npcs.find(n => n.snowprintId === event.target.value)!);
                }}>
                {npcs.map(npc => (
                    <MenuItem key={npc.snowprintId} value={npc.snowprintId}>
                        <div className="flex items-center gap-[15px]">
                            <CharacterPortraitImage icon={npc.icon} />
                            <span>
                                {npc.name} ({npc.snowprintId})
                            </span>
                        </div>
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};
