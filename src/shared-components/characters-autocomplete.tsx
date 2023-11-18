import { ICharacter2 } from '../models/interfaces';
import React, { CSSProperties } from 'react';
import { Autocomplete, TextField } from '@mui/material';
import { CharacterTitle } from './character-title';

export const CharactersAutocomplete = ({
    onCharacterChange,
    characters,
    character,
    shortChar,
    style,
}: {
    character: ICharacter2 | null;
    characters: ICharacter2[];
    onCharacterChange: (value: ICharacter2 | null) => void;
    shortChar?: boolean;
    style?: CSSProperties | undefined;
}) => {
    const [openAutocomplete, setOpenAutocomplete] = React.useState(false);

    const updateValue = (value: ICharacter2 | null): void => {
        if (character?.name !== value?.name) {
            setOpenAutocomplete(false);
            onCharacterChange(value);
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
        const key = event.key;
        if (key === 'Enter') {
            const value = (event.target as HTMLInputElement).value ?? '';
            const char = characters.find(x => x.name.toLowerCase().includes(value.toLowerCase()));
            if (char) {
                updateValue(char);
            }
        }
    };

    const handleAutocompleteChange = (open: boolean) => {
        setOpenAutocomplete(open);
    };

    return (
        <div style={style}>
            <Autocomplete
                id="combo-box-demo"
                style={{ minWidth: 300 }}
                options={characters}
                value={character}
                open={openAutocomplete}
                onFocus={() => handleAutocompleteChange(true)}
                onBlur={() => handleAutocompleteChange(false)}
                getOptionLabel={option => option.name}
                isOptionEqualToValue={(option, value) => option.name === value.name}
                renderOption={(props, option) => (
                    <CharacterTitle
                        {...props}
                        key={option.name}
                        character={option}
                        short={shortChar}
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
        </div>
    );
};
