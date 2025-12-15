import { FormControl, MenuItem, Select } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import React from 'react';
import { isMobile } from 'react-device-detect';

import { GuildWarService } from 'src/v2/features/guild-war/guild-war.service';

type Props = {
    value: number;
    valueChange: (value: number) => void;
};

export const BfLevelSelect: React.FC<Props> = ({ value, valueChange }) => {
    return (
        <FormControl className="w-25" size={isMobile ? 'small' : 'medium'}>
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
