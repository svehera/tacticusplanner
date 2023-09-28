import React, { useMemo, useState } from 'react';

import { DialogActions, DialogContent, DialogTitle, TextField, } from '@mui/material';
import { Tooltip } from '@fluentui/react-components';

import { ICharacter } from '../../models/interfaces';
import { PersonalDataService, useCharacters, usePersonalData } from '../../services';

import { CharacterBias, Rank, Rarity } from '../../models/enums';
import { groupBy } from 'lodash';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import { CharacterDetails } from '../../mobile-routes/characters/character-details';
import Button from '@mui/material/Button';
import { pooEmoji, starEmoji } from '../../models/constants';

export const WhoYouOwn = () => {
    const { characters } = useCharacters();
    const [filter, setFilter] = useState('');

    const charactersByAlliance = useMemo(() => {
        const filteredCharacters = filter ? characters.filter(x => x.name.toLowerCase().includes(filter.toLowerCase())) : characters;

        const charactersByAlliance = groupBy(filteredCharacters, 'alliance');

        return Object.entries(charactersByAlliance).map(([alliance, characters]) => (
            <Alliance key={alliance} alliance={alliance} characters={characters}/>));
    }, [filter, characters]);

    return (
        <Box sx={{ padding: 2 }}>
            <TextField sx={{ margin: '10px', width: '300px' }} label="Quick Filter" variant="outlined"
                onChange={event => setFilter(event.target.value)}/>
            {charactersByAlliance}
        </Box>
    );
};

const Alliance = ({ alliance, characters }: { alliance: string, characters: ICharacter[] }) => {
    const tt = groupBy(characters, 'faction');
    const itemList = [];

    for (const testKey in tt) {
        const chars = tt[testKey];
        itemList.push(<div key={testKey}>
            <h4>{testKey}</h4>

            {chars.map((item) => {
                return <CharacterItem key={item.name} character={item} />;
            })}
        </div>);
    }
    return (<div>
        <h3>{alliance}</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', columnGap: 50 }}>{itemList}</div>
    </div>);
};

const CharacterItem = (props: { character: ICharacter }) => {
    const [open, setOpen] = useState(false);
    const [character, setCharacter] = useState(() => ({ ...props.character }));
    const { addOrUpdateCharacterData } = usePersonalData();
    const { updateCharacterData } = useCharacters();
    const saveChanges = () => {
        updateCharacterData(character);
        addOrUpdateCharacterData(character);
        PersonalDataService.save();
    };

    const handleClickOpen = () => {
        setCharacter({ ...props.character });
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };
    
    return (
        <div style={{ opacity: props.character.unlocked ? 1 : 0.5, cursor: 'pointer' }}>
            <div onClick={handleClickOpen}>
                <CharacterTitle character={props.character}/>
            </div>
            
            <Dialog open={open} onClose={handleClose} fullWidth>
                <DialogTitle>
                    <CharacterTitle character={character}/>
                </DialogTitle>
                <DialogContent>
                    <CharacterDetails character={character} characterChanges={setCharacter}/>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={() => {
                        saveChanges();
                        handleClose();
                    }}>Save</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

const CharacterTitle =  ({ character }: { character: ICharacter }) => {
    const emoji = character.bias === CharacterBias.AlwaysRecommend ? starEmoji : character.bias === CharacterBias.NeverRecommend ? pooEmoji : '';
    
    return (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }} >
            {/*<img src={images} height={50} alt={character.name}/>*/}
            <CharacterImage key={character.name} character={character}/>
            <span>{character.name} </span>
            <Tooltip content={Rarity[character.rarity]} relationship="description"><span>({Rarity[character.rarity][0]})</span></Tooltip>
            {character.unlocked ?  (<RankImage key={character.rank} rank={character.rank}/>) : undefined}
            <Tooltip content={character.bias === CharacterBias.AlwaysRecommend ? 'Always recommend first' : character.bias === CharacterBias.NeverRecommend ? 'Always recommend last' : ''} relationship={'description'}><span>{emoji}</span></Tooltip> 
        </div>
    );
};


const CharacterImage = ({ character }: { character: ICharacter}) => {
    try {
        // Import image on demand
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const image = require(`../../assets/images/characters/${character.icon}`);

        // If the image doesn't exist. return null
        if (!image) return null;
        return <img src={image} height={50} alt={character.name}/>;
    } catch (error) {
        console.log(`Image with name "${character.icon}" does not exist`);
        return null;
    }
};

const RankImage = ({ rank }: { rank: Rank}) => {
    try {
        // Import image on demand
        const rankTextValue = Rank[rank];
        
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const image = require(`../../assets/images/ranks/${rankTextValue.toLowerCase()}.png`);

        // If the image doesn't exist. return null
        if (!image) return <span>{Rank[rank]}</span>;
        return <Tooltip content={rankTextValue} relationship="label"><img src={image} height={30} alt={rankTextValue}/></Tooltip>;
    } catch (error) {
        console.log(`Image with name "${Rank[rank]}" does not exist`);
        return <span>{Rank[rank]}</span>;
    }
};
