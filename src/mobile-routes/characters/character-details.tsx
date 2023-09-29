import React, { useState } from 'react';
import { ICharacter } from '../../models/interfaces';
import { Checkbox, FormControl, FormControlLabel, FormGroup, MenuItem, Select } from '@mui/material';
import { CharacterBias, Rank, Rarity } from '../../models/enums';
import InputLabel from '@mui/material/InputLabel';
import { getEnumValues, rankToString } from '../../shared-logic/functions';
import { RankImage } from '../../shared-components/rank-image';

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

    const rankEntries: number[] = getEnumValues(Rank).slice(1);
    const rarityEntries: number[] = getEnumValues(Rarity);
    const biasEntries: number[] = getEnumValues(CharacterBias);
    
    const getNativeSelectControl = (value: number, name: keyof ICharacter, entries: Array<number>, getName: (value: number) => string, icon?: boolean) => (
        <FormControl fullWidth>
            <InputLabel>{name}</InputLabel>
            <Select
                label={name}
                value={value}
                onChange={event => handleInputChange(name,+event.target.value)}
                
            >
                {entries.map(value => ((
                    <MenuItem key={value} value={value}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span>{getName(value)}</span>  
                            {icon ? (<RankImage rank={value}/>) : undefined}
                        </div>
                    </MenuItem>
                )))}
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

            {getNativeSelectControl(formData.rarity, 'rarity', rarityEntries, (value) => Rarity[value])}
            {getNativeSelectControl(formData.rank, 'rank', rankEntries, rankToString, true)}
            {getNativeSelectControl(formData.bias, 'bias', biasEntries, (value) => CharacterBias[value])}
        </FormGroup>
    );
};
