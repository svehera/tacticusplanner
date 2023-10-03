import { ICharacter } from '../models/interfaces';
import React, { useState } from 'react';
import { PersonalDataService, useCharacters, usePersonalData } from '../services';
import { CharacterTitle } from './character-title';
import Dialog from '@mui/material/Dialog';
import { DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { CharacterDetails } from '../mobile-routes/characters/character-details';
import Button from '@mui/material/Button';

export const CharacterItem = (props: { character: ICharacter }) => {
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