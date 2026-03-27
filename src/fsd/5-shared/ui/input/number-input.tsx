import { FormControl, Input } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import React, { useState } from 'react';

interface Props {
    label: string;
    value: number;
    valueChange: (v: number) => void;
    fullWidth?: boolean;
    disabled?: boolean;
    max?: number;
    min?: number;
    step?: number;
    style?: React.CSSProperties;
}

export const NumberInput: React.FC<Props> = ({
    label,
    value,
    valueChange,
    fullWidth = false,
    disabled = false,
    max = 60,
    min = 1,
    step = 1,
    style = {},
}) => {
    const [inputValue, setInputValue] = useState((value ?? '').toString());

    return (
        <FormControl fullWidth={fullWidth} style={style}>
            <InputLabel>{label}</InputLabel>
            <Input
                disabled={disabled}
                value={inputValue}
                onChange={event => {
                    setInputValue(event.target.value);
                    const newValue = Number(event.target.value);
                    valueChange(Math.min(Math.max(newValue, min), max));
                }}
                inputProps={{
                    step,
                    min,
                    max,
                    type: 'number',
                }}
            />
        </FormControl>
    );
};
