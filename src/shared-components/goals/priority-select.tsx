import React from 'react';
import { FormControl, MenuItem, Select } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';

interface Props {
    maxValue: number;
    defaultValue: number;
    valueChange: (value: number) => void;
}

export const PrioritySelect: React.FC<Props> = ({ maxValue, defaultValue, valueChange }) => {
    return (
        <FormControl fullWidth>
            <InputLabel id="priority-label">Priority</InputLabel>
            <Select<number>
                id="priority"
                labelId="priority-label"
                label="Priority"
                defaultValue={defaultValue}
                onChange={event => valueChange(+event.target.value)}>
                {Array.from({ length: maxValue }, (_, index) => index + 1).map(priority => (
                    <MenuItem key={priority} value={priority}>
                        {priority}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};
