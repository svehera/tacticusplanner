import React, { useState } from 'react';
import InputLabel from '@mui/material/InputLabel';
import { FormControl, Input } from '@mui/material';

interface Props {
    label: string;
    value: number;
    valueChange: (v: number) => void;
}

export const AbilityLevelInput: React.FC<Props> = ({ label, value, valueChange }) => {
    const [inputValue, setInputValue] = useState(value.toString());

    return (
        <FormControl>
            <InputLabel>{label}</InputLabel>
            <Input
                value={inputValue}
                onChange={event => {
                    setInputValue(event.target.value);
                    const newValue = Number(event.target.value);
                    valueChange(Math.min(Math.max(newValue, 1), 50));
                }}
                inputProps={{
                    step: 1,
                    min: 1,
                    max: 50,
                    type: 'number',
                }}
            />
        </FormControl>
    );
};
