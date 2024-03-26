import React from 'react';
import { FormControl, MenuItem, Select } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import { GuildWarService } from 'src/v2/features/guild-war/guild-war.service';

type Props = {
    value: string;
    valueChange: (value: string) => void;
    bfLevel: number;
};

export const BfSectionSelect: React.FC<Props> = ({ value, valueChange, bfLevel }) => {
    return (
        <FormControl style={{ width: 240 }}>
            <InputLabel>Section</InputLabel>
            <Select<string> label="Section" value={value} onChange={event => valueChange(event.target.value)}>
                {GuildWarService.gwData.sections.map(section => (
                    <MenuItem key={section.id} value={section.id}>
                        {section.rarityCaps[bfLevel].complexity} - {section.name}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};
