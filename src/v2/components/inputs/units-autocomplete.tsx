import React, { ReactNode } from 'react';
import { Autocomplete, TextField } from '@mui/material';
import { IUnit } from 'src/v2/features/characters/characters.models';
import { CharacterTitle } from 'src/shared-components/character-title';

interface Props<T extends IUnit> {
    unit: T | null;
    options: T[];
    onUnitChange: (value: T | null) => void;
    style?: React.CSSProperties;
}

export const UnitsAutocomplete = <T extends IUnit>({ onUnitChange, options, unit, style = {} }: Props<T>) => {
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
            fullWidth
            style={{ minWidth: 200, ...style }}
            options={options}
            value={unit}
            open={openAutocomplete}
            onFocus={() => handleAutocompleteChange(true)}
            onBlur={() => handleAutocompleteChange(false)}
            getOptionLabel={option => option.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderOption={(props, option) => (
                <CharacterTitle
                    {...props}
                    key={option.name}
                    character={option}
                    short={true}
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
                    label="Character"
                    onKeyDown={handleKeyDown}
                />
            )}
        />
    );
};
