import React, { useEffect, useState } from 'react';
import { ICharacter } from '../../models/interfaces';
import { Checkbox, FormControl, FormControlLabel, FormGroup, MenuItem, Select, Tooltip } from '@mui/material';
import { Rank, Rarity } from '../../models/enums';
import { pooEmoji, starEmoji } from '../../models/constants';

export const CharacterDetails = (props: { character: ICharacter, characterChanges: (character: ICharacter) => void}) => {
    const [unlocked, setUnlocked] = useState(props.character.unlocked);
    const [rank, setRank] = useState(props.character.rank);
    const [rarity, setRarity] = useState(props.character.rarity);

    const [alwaysRecommend, setAlwaysRecommend] = useState(props.character.alwaysRecommend);
    const [neverRecommend, setNeverRecommend] = useState(props.character.neverRecommend);

    const rankEntries: Array<[string, string | number]> = Object.entries(Rank);
    const rarityEntries: Array<[string, string | number]> = Object.entries(Rarity);
    

    useEffect(() => {
        props.character.unlocked = unlocked;
        props.character.rank = rank;
        props.character.rarity = rarity;
        props.character.alwaysRecommend = alwaysRecommend;
        props.character.neverRecommend = neverRecommend;
        props.characterChanges(props.character);
    }, [unlocked, rank, rarity, alwaysRecommend, neverRecommend]);
    
    const getNativeSelectControl = (value: number, setValue: (value:number) => void, entries: Array<[string, string | number]>) => (
        <FormControl variant={'standard'}>
            <Select
                native={true}
                value={value}
                onChange={event => setValue(+event.target.value)}
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
                checked={unlocked}
                onChange={(event) => setUnlocked(event.target.checked)}
                inputProps={{ 'aria-label': 'controlled' }}
            />} label="Unlocked"/>

            {getNativeSelectControl(rarity, setRarity, rarityEntries)}
            {getNativeSelectControl(rank, setRank, rankEntries)}

            <Tooltip disableHoverListener  enterTouchDelay={0} leaveTouchDelay={3000} title={'Character will be included in auto-teams whenever possible'}>
                <FormControlLabel control={<Checkbox
                    checked={alwaysRecommend}
                    disabled={neverRecommend}
                    onChange={(event) => setAlwaysRecommend(event.target.checked)}
                    inputProps={{ 'aria-label': 'controlled' }}
                />} label={starEmoji}/>
            </Tooltip>

            <Tooltip disableHoverListener  enterTouchDelay={0} leaveTouchDelay={3000} title={'Character will be excluded from auto-teams whenever possible'}>
                <FormControlLabel control={<Checkbox
                    checked={neverRecommend}
                    disabled={alwaysRecommend}
                    onChange={(event) => setNeverRecommend(event.target.checked)}
                    inputProps={{ 'aria-label': 'controlled' }}
                />}  label={pooEmoji}/>
            </Tooltip>
            
        </FormGroup>
    );
};
