import { Autocomplete, TextField } from '@mui/material';
import { get } from 'lodash';
import React, { useMemo, useState } from 'react';

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
    const [openAutocomplete, setOpenAutocomplete] = useState(false);

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
                    ('shortName' in x ? (x as any).shortName.toLowerCase().includes(value.toLowerCase()) : false) ||
                    ('fullName' in x ? x.fullName.toLowerCase().includes(value.toLowerCase()) : false)
            );
            if (char) {
                updateValue(char);
            }
        }
    };

    const handleAutocompleteChange = (open: boolean) => {
        setOpenAutocomplete(open);
    };

    const getOptionText = (option: IUnit) => ('fullName' in option ? option.fullName : option.name);

    console.log('options: ', options);

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
            filterOptions={(opts, state) => {
                const q = state.inputValue?.toLowerCase?.().trim() ?? '';
                if (!q) return opts;
                return opts.filter(x => {
                    const short = 'shortName' in x ? ((x as any).shortName?.toLowerCase?.() ?? '') : '';
                    const normal = x.name?.toLowerCase?.() ?? '';
                    const full = 'fullName' in x ? (x.fullName?.toLowerCase?.() ?? '') : '';
                    return full.includes(q) || normal.includes(q) || short.includes(q);
                });
            }}
            getOptionLabel={option => getOptionText(option)}
            isOptionEqualToValue={(option, value) => option.snowprintId === value.snowprintId}
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
