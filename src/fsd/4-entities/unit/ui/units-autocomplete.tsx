import { Autocomplete, TextField } from '@mui/material';
import React from 'react';

import { IUnit } from '../model';

import { UnitTitle } from './unit-title';

interface Props<T extends IUnit> {
    unit: T | T[] | null;
    options: T[];
    onUnitChange?: (value: T | null) => void;
    onUnitsChange?: (value: T[]) => void;
    style?: React.CSSProperties;
    multiple?: boolean;
    label?: string;
}

export const UnitsAutocomplete = <T extends IUnit>({
    options,
    unit,
    style = {},
    multiple = false,
    onUnitChange = () => {},
    onUnitsChange = () => {},
    label = 'Unit',
}: Props<T>) => {
    const [openAutocomplete, setOpenAutocomplete] = React.useState(false);

    const updateValue = (value: T | T[] | null): void => {
        if (Array.isArray(value)) {
            onUnitsChange(value);
        } else {
            if (multiple && Array.isArray(unit) && value) {
                if (!unit.some(x => x.id === value.id)) {
                    onUnitsChange([...unit, value]);
                }
            } else {
                if (!Array.isArray(unit) && unit?.id !== value?.id) {
                    setOpenAutocomplete(false);
                    onUnitChange(value);
                }
            }
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
        const key = event.key;
        if (key === 'Enter') {
            const value = (event.target as HTMLInputElement).value ?? '';
            const char = options.find(
                x =>
                    x.name.toLowerCase().includes(value.toLowerCase()) ||
                    x.fullName.toLowerCase().includes(value.toLowerCase())
            );
            if (char) {
                updateValue(char);
            }
        }
    };

    const handleAutocompleteChange = (open: boolean) => {
        setOpenAutocomplete(open);
    };

    return (
        <Autocomplete
            fullWidth
            multiple={multiple}
            style={{ minWidth: 200, ...style }}
            options={options}
            value={unit}
            open={openAutocomplete}
            onFocus={() => handleAutocompleteChange(true)}
            onBlur={() => handleAutocompleteChange(false)}
            getOptionLabel={option => option.fullName}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderOption={(props, option) => (
                <UnitTitle
                    {...props}
                    key={option.name}
                    character={option}
                    short
                    fullName
                    onClick={() => updateValue(option)}
                />
            )}
            onChange={(_, value) => updateValue(value)}
            renderInput={params => (
                <TextField
                    {...params}
                    fullWidth
                    onClick={() => handleAutocompleteChange(!openAutocomplete)}
                    onChange={() => handleAutocompleteChange(true)}
                    label={label}
                    onKeyDown={handleKeyDown}
                />
            )}
        />
    );
};
