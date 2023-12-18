import React, { useMemo, useState } from 'react';
import { ICharacter, ICharacter2, IMaterialRecipeIngredientFull } from '../../models/interfaces';
import { Checkbox, FormControl, FormControlLabel, FormGroup, Grid, Input, MenuItem, Select } from '@mui/material';
import { CharacterBias, Rank, Rarity } from '../../models/enums';
import InputLabel from '@mui/material/InputLabel';
import { getEnumValues, rankToString } from '../../shared-logic/functions';
import { RankImage } from '../../shared-components/rank-image';
import { CharacterUpgrades } from '../../shared-components/character-upgrades';

export const CharacterDetails = ({
    character,
    characterChanges,
}: {
    character: ICharacter2;
    characterChanges: (character: ICharacter2, updateInventory: IMaterialRecipeIngredientFull[]) => void;
}) => {
    const [formData, setFormData] = useState({
        rank: character.rank,
        rarity: character.rarity,
        bias: character.bias,
        activeAbilityLevel: character.activeAbilityLevel,
        passiveAbilityLevel: character.passiveAbilityLevel,
    });

    const handleInputChange = (name: keyof ICharacter2, value: boolean | number, saveValue?: boolean | number) => {
        setFormData({
            ...formData,
            [name]: value,
        });
        characterChanges({ ...character, [name]: saveValue ?? value }, []);
    };

    const rankEntries: number[] = getEnumValues(Rank);
    const rarityEntries: number[] = getEnumValues(Rarity);
    const biasEntries: number[] = getEnumValues(CharacterBias);

    const getNativeSelectControl = (
        value: number,
        name: keyof ICharacter2,
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

            {formData.rank > Rank.Locked ? (
                <React.Fragment>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel>Active Ability</InputLabel>
                                <Input
                                    value={formData.activeAbilityLevel}
                                    onChange={event =>
                                        handleInputChange(
                                            'activeAbilityLevel',
                                            event.target.value === '' ? '' : (Number(event.target.value) as any),
                                            Number(event.target.value)
                                        )
                                    }
                                    inputProps={{
                                        step: 1,
                                        min: 0,
                                        max: 50,
                                        type: 'number',
                                        'aria-labelledby': 'input-slider',
                                    }}
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel>Passive Ability</InputLabel>
                                <Input
                                    value={formData.passiveAbilityLevel}
                                    onChange={event =>
                                        handleInputChange(
                                            'passiveAbilityLevel',
                                            event.target.value === '' ? '' : (Number(event.target.value) as any),
                                            Number(event.target.value)
                                        )
                                    }
                                    inputProps={{
                                        step: 1,
                                        min: 0,
                                        max: 50,
                                        type: 'number',
                                        'aria-labelledby': 'input-slider',
                                    }}
                                />
                            </FormControl>
                        </Grid>
                    </Grid>

                    <CharacterUpgrades
                        character={character}
                        upgradesChanges={(upgrades, updateInventory) => {
                            characterChanges({ ...character, upgrades: upgrades }, updateInventory);
                        }}
                    />
                </React.Fragment>
            ) : undefined}
        </FormGroup>
    );
};
