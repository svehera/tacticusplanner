import React, { ReactNode } from 'react';
import { Autocomplete, TextField } from '@mui/material';
import { IUnit } from 'src/v2/features/characters/characters.models';

interface Props<T extends IUnit> {
    unit: T | null;
    options: T[];
    onUnitChange: (value: T | null) => void;
    renderOption: (props: React.HTMLAttributes<any>, unit: T) => ReactNode;
}

export const UnitsAutocomplete = <T extends IUnit>({ onUnitChange, options, unit, renderOption }: Props<T>) => {
    const [openAutocomplete, setOpenAutocomplete] = React.useState(false);

    const updateValue = (value: T | null): void => {
        if (unit?.id !== value?.id) {
            setOpenAutocomplete(false);
            onUnitChange(value);
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
        const key = event.key;
        if (key === 'Enter') {
            const value = (event.target as HTMLInputElement).value ?? '';
            const char = options.find(x => x.name.toLowerCase().includes(value.toLowerCase()));
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
            style={{ minWidth: 200 }}
            options={options}
            value={unit}
            open={openAutocomplete}
            onFocus={() => handleAutocompleteChange(true)}
            onBlur={() => handleAutocompleteChange(false)}
            getOptionLabel={option => option.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderOption={renderOption}
            onChange={(_, value) => updateValue(value)}
            renderInput={params => (
                <TextField
                    {...params}
                    fullWidth
                    onClick={() => handleAutocompleteChange(!openAutocomplete)}
                    onChange={() => handleAutocompleteChange(true)}
                    label="Character"
                    onKeyDown={handleKeyDown}
                />
            )}
        />
    );
};
