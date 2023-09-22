import React, { useState } from 'react';
import { ICharacter } from '../../models/interfaces';
import { Checkbox, FormControl, FormControlLabel, FormGroup, MenuItem, Select, Tooltip } from '@mui/material';
import { Rank, Rarity } from '../../models/enums';
import { pooEmoji, starEmoji } from '../../models/constants';

export const CharacterDetails = ({ character, characterChanges }: { character: ICharacter, characterChanges: (character: ICharacter) => void}) => {
    const [formData, setFormData] = useState({
        unlocked: character.unlocked,
        rank: character.rank,
        rarity: character.rarity,
        alwaysRecommend: character.alwaysRecommend,
        neverRecommend: character.neverRecommend,
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
    
    const getNativeSelectControl = (value: number, name: keyof ICharacter, entries: Array<[string, string | number]>) => (
        <FormControl variant={'standard'}>
            <Select
                native={true}
                value={value}
                onChange={event => handleInputChange(name,+event.target.value)}
                disableUnderline={true}
            >
                {entries.map(([name, value]) => (
                    typeof value === 'number' && (
                        <option key={value} value={value} >{name}
                        </option>
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

            <Tooltip disableHoverListener  enterTouchDelay={0} leaveTouchDelay={3000} title={'Character will be included in auto-teams whenever possible'}>
                <FormControlLabel control={<Checkbox
                    checked={formData.alwaysRecommend}
                    disabled={formData.neverRecommend}
                    onChange={(event) => handleInputChange('alwaysRecommend', event.target.checked)}
                    inputProps={{ 'aria-label': 'controlled' }}
                />} label={starEmoji}/>
            </Tooltip>

            <Tooltip disableHoverListener  enterTouchDelay={0} leaveTouchDelay={3000} title={'Character will be excluded from auto-teams whenever possible'}>
                <FormControlLabel control={<Checkbox
                    checked={formData.neverRecommend}
                    disabled={formData.alwaysRecommend}
                    onChange={(event) =>  handleInputChange('neverRecommend', event.target.checked)}
                    inputProps={{ 'aria-label': 'controlled' }}
                />}  label={pooEmoji}/>
            </Tooltip>
            
        </FormGroup>
    );
};
