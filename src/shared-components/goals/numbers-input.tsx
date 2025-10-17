﻿import { FormControl, FormHelperText, Input } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import React from 'react';

interface Props {
    title: string;
    helperText?: string;
    value?: number;
    valueChange: (value: number) => void;
}

export const NumbersInput: React.FC<Props> = ({ value, valueChange, title, helperText }) => {
    function handleChange(event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) {
        const value = event.target.value === '' ? '' : (Number(event.target.value) as any);
        valueChange(Math.min(value, 10000));
    }

    return (
        <FormControl variant={'outlined'} fullWidth>
            <InputLabel>{title}</InputLabel>
            <Input
                value={value ?? ''}
                onChange={handleChange}
                inputProps={{
                    step: 1,
                    min: 0,
                    max: 10000,
                    type: 'number',
                    'aria-labelledby': 'input-slider',
                }}
            />
            {helperText && <FormHelperText>{helperText}</FormHelperText>}
        </FormControl>
    );
};
