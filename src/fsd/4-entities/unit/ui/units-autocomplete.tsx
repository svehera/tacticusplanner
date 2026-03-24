import { Autocomplete, TextField } from '@mui/material';
import React, { useState } from 'react';
import { twMerge } from 'tailwind-merge';

import { IUnit } from '../model';

import { UnitTitle } from './unit-title';

interface Props<T extends IUnit> {
    unit: T | T[] | null;
    options: T[];
    onUnitChange?: (value: T | null) => void;
    onUnitsChange?: (value: T[]) => void;
    multiple?: boolean;
    label?: string;
    className?: string;
}

const normalizeSearchText = (text: string | undefined | null): string =>
    (text ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

const hasShortName = (unit: IUnit): unit is IUnit & { shortName: string } => 'shortName' in unit;

const hasFullName = (unit: IUnit): unit is IUnit & { fullName: string } => 'fullName' in unit;

export const UnitsAutocomplete = <T extends IUnit>({
    options,
    unit,
    multiple = false,
    onUnitChange = () => {},
    onUnitsChange = () => {},
    label = 'Unit',
    className = '',
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
            const value = normalizeSearchText((event.target as HTMLInputElement).value);
            const char = options.find(
                x =>
                    normalizeSearchText(x.name).includes(value) ||
                    (hasShortName(x) ? normalizeSearchText(x.shortName).includes(value) : false) ||
                    (hasFullName(x) ? normalizeSearchText(x.fullName).includes(value) : false)
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

    return (
        <Autocomplete
            fullWidth
            multiple={multiple}
            className={twMerge('min-w-[200px]', className)}
            options={options}
            value={unit}
            open={openAutocomplete}
            onFocus={() => handleAutocompleteChange(true)}
            onBlur={() => handleAutocompleteChange(false)}
            filterOptions={(filterOptions, state) => {
                const q = normalizeSearchText(state.inputValue);
                if (!q) return filterOptions;
                return filterOptions.filter(x => {
                    const short = hasShortName(x) ? normalizeSearchText(x.shortName) : '';
                    const normal = normalizeSearchText(x.name);
                    const full = hasFullName(x) ? normalizeSearchText(x.fullName) : '';
                    return full.includes(q) || normal.includes(q) || short.includes(q);
                });
            }}
            getOptionLabel={option => getOptionText(option)}
            isOptionEqualToValue={(option, value) => option.snowprintId === value.snowprintId}
            renderOption={(props, option) => (
                <UnitTitle {...props} key={option.name} character={option} short onClick={() => updateValue(option)} />
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
