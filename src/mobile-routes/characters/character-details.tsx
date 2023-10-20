import React, { useState } from 'react';
import { ICharacter, ICharacter2 } from '../../models/interfaces';
import { FormControl, FormGroup, MenuItem, Select } from '@mui/material';
import { CharacterBias, Rank, Rarity } from '../../models/enums';
import InputLabel from '@mui/material/InputLabel';
import { getEnumValues, rankToString } from '../../shared-logic/functions';
import { RankImage } from '../../shared-components/rank-image';

export const CharacterDetails = ({
    character,
    characterChanges,
}: {
    character: ICharacter2;
    characterChanges: (character: ICharacter2) => void;
}) => {
    const [formData, setFormData] = useState({
        rank: character.rank,
        rarity: character.rarity,
        bias: character.bias,
    });

    const handleInputChange = (name: keyof ICharacter, value: boolean | number) => {
        setFormData({
            ...formData,
            [name]: value,
        });
        characterChanges({ ...character, [name]: value });
    };

    const rankEntries: number[] = getEnumValues(Rank);
    const rarityEntries: number[] = getEnumValues(Rarity);
    const biasEntries: number[] = getEnumValues(CharacterBias);

    const getNativeSelectControl = (
        value: number,
        name: keyof ICharacter,
        entries: Array<number>,
        getName: (value: number) => string,
        icon?: boolean
    ) => (
        <FormControl fullWidth>
            <InputLabel>{name}</InputLabel>
            <Select label={name} value={value} onChange={event => handleInputChange(name, +event.target.value)}>
                {entries.map(value => (
                    <MenuItem key={value} value={value}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span>{getName(value)}</span>
                            {icon ? <RankImage rank={value} /> : undefined}
                        </div>
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );

    return (
        <FormGroup style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem' }}>
            {getNativeSelectControl(formData.rank, 'rank', rankEntries, rankToString, true)}
            {getNativeSelectControl(formData.rarity, 'rarity', rarityEntries, value => Rarity[value])}
            {getNativeSelectControl(formData.bias, 'bias', biasEntries, value => CharacterBias[value])}
        </FormGroup>
    );
};
