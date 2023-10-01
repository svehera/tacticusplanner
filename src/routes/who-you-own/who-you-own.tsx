import React, { useMemo, useState } from 'react';

import { DialogActions, DialogContent, DialogTitle, TextField, } from '@mui/material';

import { ICharacter } from '../../models/interfaces';
import { PersonalDataService, useCharacters, usePersonalData } from '../../services';

import { groupBy } from 'lodash';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import { CharacterDetails } from '../../mobile-routes/characters/character-details';
import Button from '@mui/material/Button';
import { CharacterTitle } from '../../shared-components/character-title';

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
    const charactersByFaction = groupBy(characters, 'faction');
    const itemList = [];

    for (const faction in charactersByFaction) {
        const chars = charactersByFaction[faction];
        itemList.push(<div key={faction}>
            <h4 style={{ background: chars[0].factionColor }}>{faction}</h4>

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
        <div>
            <div onClick={handleClickOpen} style={{ cursor: 'pointer' }}>
                <CharacterTitle character={props.character} showLockedWithOpacity={true}/>
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







