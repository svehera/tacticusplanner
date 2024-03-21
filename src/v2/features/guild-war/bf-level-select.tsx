import React from 'react';
import { FormControl, MenuItem, Select } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import { GuildWarService } from 'src/v2/features/guild-war/guild-war.service';

type Props = {
    value: number;
    valueChange: (value: number) => void;
};

export const BfLevelSelect: React.FC<Props> = ({ value, valueChange }) => {
    return (
        <FormControl style={{ width: 100 }}>
            <InputLabel>BF Level</InputLabel>
            <Select<number> label="BF Level" value={value} onChange={event => valueChange(+event.target.value)}>
                {GuildWarService.gwData.bfLevels.map(level => (
                    <MenuItem key={level} value={level}>
                        {level}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};
