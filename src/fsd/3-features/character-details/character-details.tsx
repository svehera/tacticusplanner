import { FormControl, FormGroup, Grid, Input, MenuItem, Select } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import React, { useMemo, useState } from 'react';

import { getEnumValues } from '@/fsd/5-shared/lib';
import { RarityStars, Rarity, RarityMapper, Rank, rankToString } from '@/fsd/5-shared/model';
import { RarityIcon, StarsIcon } from '@/fsd/5-shared/ui/icons';

import { ICharacter2, RankIcon } from '@/fsd/4-entities/character';
import { IUpgradeRecipe } from '@/fsd/4-entities/upgrade';

import { CharacterUpgrades } from './character-upgrades';

export const CharacterDetails = ({
    character,
    characterChanges,
    updateInventoryChanges,
}: {
    character: ICharacter2;
    characterChanges: (character: ICharacter2) => void;
    updateInventoryChanges: (updateInventory: IUpgradeRecipe[]) => void;
}) => {
    const [formData, setFormData] = useState({
        rank: character.rank,
        rarity: character.rarity,
        stars: character.stars,
        bias: character.bias,
        level: character.level,
        shards: character.shards,
        mythicShards: character.mythicShards,
        xp: character.xp,
        activeAbilityLevel: character.activeAbilityLevel,
        passiveAbilityLevel: character.passiveAbilityLevel,
    });

    const rarityStarsToString = (rarity: RarityStars): string => {
        switch (rarity) {
            case RarityStars.None:
                return 'None';
            default:
                return '';
        }
    };

    const handleInputChange = (name: keyof ICharacter2, value: boolean | number, saveValue?: boolean | number) => {
        setFormData({
            ...formData,
            [name]: value,
        });
        characterChanges({ ...character, [name]: saveValue ?? value });
    };

    const maxRank = useMemo(() => {
        return RarityMapper.toMaxRank[formData.rarity];
    }, [formData.rarity]);

    const minStars = useMemo(() => {
        return RarityMapper.toStars[formData.rarity];
    }, [formData.rarity]);

    const maxStars = useMemo(() => {
        return RarityMapper.toMaxStars[formData.rarity];
    }, [formData.rarity]);

    const starsEntries = useMemo(() => {
        return getEnumValues(RarityStars).filter(x => x >= minStars && x <= maxStars);
    }, [minStars, maxStars]);

    const rarityEntries: number[] = getEnumValues(Rarity);
    const rankEntries: number[] = getEnumValues(Rank).filter(x => x === formData.rank || x <= maxRank);

    const getNativeSelectControl = (
        value: number,
        label: string,
        name: keyof ICharacter2,
        entries: Array<number>,
        getName: (value: number) => string,
        icon?: (value: number) => React.JSX.Element
    ) => (
        <FormControl fullWidth>
            <InputLabel>{label}</InputLabel>
            <Select label={label} value={value} onChange={event => handleInputChange(name, +event.target.value)}>
                {entries.map(value => (
                    <MenuItem key={value} value={value}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span>{getName(value)}</span>
                            {icon ? icon(value) : undefined}
                        </div>
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );

    return (
        <FormGroup style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem' }}>
            <Grid container spacing={2} alignItems="center">
                <Grid item xs={6}>
                    {getNativeSelectControl(
                        formData.rarity,
                        'Rarity',
                        'rarity',
                        rarityEntries,
                        value => Rarity[value],
                        value => (
                            <RarityIcon rarity={value} />
                        )
                    )}
                </Grid>
                <Grid item xs={6}>
                    {getNativeSelectControl(
                        formData.stars,
                        'Stars',
                        'stars',
                        starsEntries,
                        rarityStarsToString,
                        value => (
                            <StarsIcon stars={value} />
                        )
                    )}
                </Grid>
            </Grid>

            <Grid container spacing={2} alignItems="center">
                <Grid item xs={12}>
                    {getNativeSelectControl(formData.rank, 'Rank', 'rank', rankEntries, rankToString, value => (
                        <RankIcon rank={value} />
                    ))}
                </Grid>
            </Grid>
            <Grid container spacing={2} alignItems="center">
                <Grid item xs={6}>
                    <FormControl variant={'outlined'} fullWidth>
                        <InputLabel>Shards</InputLabel>
                        <Input
                            value={formData.shards}
                            onChange={event =>
                                handleInputChange(
                                    'shards',
                                    event.target.value === '' ? '' : (Number(event.target.value) as any),
                                    Number(event.target.value)
                                )
                            }
                            inputProps={{
                                step: 1,
                                min: 0,
                                max: 10000,
                                type: 'number',
                                'aria-labelledby': 'input-slider',
                            }}
                        />
                    </FormControl>
                </Grid>
                <Grid item xs={6}>
                    <FormControl variant={'outlined'} fullWidth>
                        <InputLabel>Mythic Shards</InputLabel>
                        <Input
                            value={formData.mythicShards}
                            onChange={event =>
                                handleInputChange(
                                    'mythicShards',
                                    event.target.value === '' ? '' : (Number(event.target.value) as any),
                                    Number(event.target.value)
                                )
                            }
                            inputProps={{
                                step: 1,
                                min: 0,
                                max: 10000,
                                type: 'number',
                                'aria-labelledby': 'input-slider',
                            }}
                        />
                    </FormControl>
                </Grid>
            </Grid>

            {formData.rank > Rank.Locked ? (
                <React.Fragment>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel>Character Level</InputLabel>
                                <Input
                                    value={formData.level}
                                    onChange={event =>
                                        handleInputChange(
                                            'level',
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
                                <InputLabel>XP</InputLabel>
                                <Input
                                    value={formData.xp}
                                    onChange={event =>
                                        handleInputChange(
                                            'xp',
                                            event.target.value === '' ? '' : (Number(event.target.value) as any),
                                            Number(event.target.value)
                                        )
                                    }
                                    inputProps={{
                                        step: 100,
                                        min: 0,
                                        max: 283000,
                                        type: 'number',
                                        'aria-labelledby': 'input-slider',
                                    }}
                                />
                            </FormControl>
                        </Grid>
                    </Grid>

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
                        upgrades={character.upgrades}
                        rank={character.rank}
                        upgradesChanges={(upgrades, updateInventory) => {
                            characterChanges({ ...character, upgrades: upgrades });
                            updateInventoryChanges(updateInventory);
                        }}
                    />
                </React.Fragment>
            ) : undefined}
        </FormGroup>
    );
};
