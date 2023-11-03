import React, { useMemo, useState } from 'react';
import { ICharacter, ICharacter2 } from '../../models/interfaces';
import { Checkbox, FormControl, FormControlLabel, FormGroup, MenuItem, Select } from '@mui/material';
import { CharacterBias, Rank, Rarity } from '../../models/enums';
import InputLabel from '@mui/material/InputLabel';
import { getEnumValues, rankToString } from '../../shared-logic/functions';
import { RankImage } from '../../shared-components/rank-image';
import { StaticDataService } from '../../services';

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
        upgrades: character.upgrades,
    });

    const upgrades = useMemo(() => {
        return StaticDataService.getUpgrades({
            id: character.name,
            rankStart: formData.rank,
            rankEnd: formData.rank + 1,
            appliedUpgrades: [],
        });
    }, [formData.rank]);

    const handleInputChange = (name: keyof ICharacter, value: boolean | number) => {
        setFormData({
            ...formData,
            [name]: value,
            upgrades: name === 'rank' ? [] : formData.upgrades,
        });
        characterChanges({ ...character, [name]: value, upgrades: name === 'rank' ? [] : character.upgrades });
    };

    const handleUpgradeChange = (event: React.ChangeEvent<HTMLInputElement>, value: string) => {
        let result: string[];

        if (event.target.checked) {
            result = [...formData.upgrades, value];
        } else {
            result = formData.upgrades.filter(x => x !== value);
        }

        setFormData({
            ...formData,
            upgrades: result,
        });
        characterChanges({ ...character, upgrades: result });
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
            {formData.rank > Rank.Locked ? (
                <div>
                    <h4>Applied upgrades</h4>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {upgrades.map(x => (
                            <FormControlLabel
                                key={x.material}
                                control={
                                    <Checkbox
                                        checked={formData.upgrades.includes(x.material)}
                                        onChange={event => handleUpgradeChange(event, x.material)}
                                        inputProps={{ 'aria-label': 'controlled' }}
                                    />
                                }
                                label={`(${x.stat}) ${x.material}`}
                            />
                        ))}
                    </div>
                </div>
            ) : undefined}
        </FormGroup>
    );
};
