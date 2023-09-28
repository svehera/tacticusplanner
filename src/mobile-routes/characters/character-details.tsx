import React, { useState } from 'react';
import { ICharacter } from '../../models/interfaces';
import { Checkbox, FormControl, FormControlLabel, FormGroup, MenuItem, Select } from '@mui/material';
import { CharacterBias, Rank, Rarity } from '../../models/enums';
import InputLabel from '@mui/material/InputLabel';

export const CharacterDetails = ({ character, characterChanges }: { character: ICharacter, characterChanges: (character: ICharacter) => void}) => {
    const [formData, setFormData] = useState({
        unlocked: character.unlocked,
        rank: character.rank,
        rarity: character.rarity,
        alwaysRecommend: character.alwaysRecommend,
        neverRecommend: character.neverRecommend,
        bias: character.bias
    });

    const handleInputChange = (name: keyof ICharacter, value: boolean | number) => {
        setFormData({
            ...formData,
            [name]: value,
        });
        characterChanges({ ...character, [name]: value });
    };

    const rankEntries: Array<[string, string | number]> = Object.entries(Rank);
    const rarityEntries: Array<[string, string | number]> = Object.entries(Rarity);
    const biasyEntries: Array<[string, string | number]> = Object.entries(CharacterBias);
    
    const getNativeSelectControl = (value: number, name: keyof ICharacter, entries: Array<[string, string | number]>) => (
        <FormControl fullWidth>
            <InputLabel>{name}</InputLabel>
            <Select
                label={name}
                value={value}
                onChange={event => handleInputChange(name,+event.target.value)}
            >
                {entries.map(([name, value]) => (
                    typeof value === 'number' && (
                        <MenuItem key={value} value={value} >{name}
                        </MenuItem>
                    )
                ))}
            </Select>
        </FormControl>
    );
    
    return (
        <FormGroup style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem' }}>
            <FormControlLabel control={<Checkbox
                checked={formData.unlocked}
                onChange={(event) => handleInputChange('unlocked', event.target.checked)}
                inputProps={{ 'aria-label': 'controlled' }}
            />} label="Unlocked"/>

            {getNativeSelectControl(formData.rarity, 'rarity', rarityEntries)}
            {getNativeSelectControl(formData.rank, 'rank', rankEntries)}
            {getNativeSelectControl(formData.bias, 'bias', biasyEntries)}
        </FormGroup>
    );
};
