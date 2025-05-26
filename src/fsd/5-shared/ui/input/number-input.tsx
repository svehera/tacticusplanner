import { FormControl, Input } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import React, { useState } from 'react';

interface Props {
    label: string;
    value: number;
    valueChange: (v: number) => void;
    fullWidth?: boolean;
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
    max = 50,
    min = 1,
    step = 1,
    style = {},
}) => {
    const [inputValue, setInputValue] = useState(value.toString());

    return (
        <FormControl fullWidth={fullWidth} style={style}>
            <InputLabel>{label}</InputLabel>
            <Input
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
